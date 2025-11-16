/**
 * Mirror Worker
 * Polls Polymarket markets every 60s and updates mirror state with freeze logic
 * Also syncs AMM market reserves with Polymarket odds
 * 
 * Now uses database-driven approach: fetches markets with origin="polymarket"
 */

import { fetchPolyBySlug } from './adapter';
import { upsertMarket } from './state';
import { syncAMMMarketsWithPolymarket } from '../amm-sync';
import { db } from '../db';
import { markets } from '@shared/schema';
import { eq } from 'drizzle-orm';

const POLL_INTERVAL = Number(process.env.MIRROR_POLL_MS || 60000); // 60s default

let intervalId: NodeJS.Timeout | null = null;
let validatedSlugs: string[] = []; // Only contains slugs that passed validation

/**
 * Fetch active Polymarket-mirrored markets from database
 */
async function getActivePolymarketSlugs(): Promise<string[]> {
  try {
    const polymarketMarkets = await db.query.markets.findMany({
      where: eq(markets.origin, 'polymarket'),
      columns: {
        polymarketSlug: true,
      },
    });
    
    return polymarketMarkets
      .map(m => m.polymarketSlug)
      .filter((slug): slug is string => slug !== null && slug !== '');
  } catch (error) {
    console.error('[Mirror Worker] Failed to fetch Polymarket slugs from database:', error);
    return [];
  }
}

/**
 * Validate slugs at boot - ping each slug once and auto-exclude only definitively invalid ones
 * Only excludes on 404/410 responses (slug not found)
 * For other errors (network, rate limit, 5xx), logs warning but keeps slug for retry
 */
async function validateSlugs(slugs: string[]): Promise<string[]> {
  const valid: string[] = [];
  const excluded: string[] = [];
  const uncertain: string[] = [];
  
  console.log(`[Mirror Worker] 🔍 Validating ${slugs.length} slugs...`);
  
  for (const slug of slugs) {
    try {
      await fetchPolyBySlug(slug);
      valid.push(slug);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      
      // Only exclude on definitive 404/410 (market not found)
      if (errMsg.includes('not found') || errMsg.includes('404') || errMsg.includes('410')) {
        excluded.push(slug);
      } else {
        // Network/rate limit/5xx: keep slug, log warning, worker will retry
        uncertain.push(slug);
        valid.push(slug); // Include in polling list for retry
      }
    }
  }
  
  if (excluded.length > 0) {
    console.warn(`[Mirror Worker] ⚠️  Invalid slugs (excluded): ${excluded.join(', ')}`);
    console.warn(`[Mirror Worker] 💡 Update POLYMARKET_SLUGS secret to remove: ${excluded.join(',')}`);
  }
  
  if (uncertain.length > 0) {
    console.warn(`[Mirror Worker] ⚠️  Slugs with validation errors (will retry): ${uncertain.join(', ')}`);
  }
  
  if (valid.length > 0) {
    console.log(`[Mirror Worker] ✅ Validated ${valid.length} slugs: ${valid.join(', ')}`);
  }
  
  return valid;
}

/**
 * Poll all validated slugs once
 * Step 1: Fetch Polymarket data and cache results
 * Step 2: Update mirror state (in-memory)
 * Step 3: Sync AMM market reserves (database) using cached data
 */
export async function pollOnce(): Promise<void> {
  // Cache fetch results to avoid double-fetching for AMM sync
  const fetchCache = new Map<string, { probYes: number; title: string; volumeUsd?: number }>();
  
  // Step 1 & 2: Fetch and update mirror state
  for (const slug of validatedSlugs) {
    try {
      const data = await fetchPolyBySlug(slug);
      fetchCache.set(slug, data);
      
      // Update mirror state (in-memory)
      upsertMarket(slug, { title: data.title, probYes_raw: data.probYes, volumeUsd: data.volumeUsd });
    } catch (error) {
      console.error(`[Mirror Worker] ✗ ${slug}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  // Step 3: Sync AMM market reserves (non-blocking, won't affect mirror updates)
  try {
    await syncAMMMarketsWithPolymarket(fetchCache);
  } catch (error) {
    // Log error but don't throw - AMM sync failures shouldn't block mirror updates
    console.error('[Mirror Worker] AMM sync failed (non-critical):', error);
  }
}

/**
 * Refresh slugs from database and revalidate
 * Called at startup and can be called periodically to detect new markets
 */
async function refreshSlugsFromDatabase(): Promise<void> {
  const dbSlugs = await getActivePolymarketSlugs();
  
  if (dbSlugs.length === 0) {
    console.log('[Mirror Worker] No Polymarket markets found in database');
    validatedSlugs = [];
    return;
  }
  
  // Validate new slugs
  const newSlugs = dbSlugs.filter(slug => !validatedSlugs.includes(slug));
  
  if (newSlugs.length > 0) {
    console.log(`[Mirror Worker] 🔄 Found ${newSlugs.length} new markets to mirror`);
    const newValidated = await validateSlugs(newSlugs);
    validatedSlugs = [...validatedSlugs, ...newValidated];
  }
  
  // Remove slugs that no longer exist in database
  const removedSlugs = validatedSlugs.filter(slug => !dbSlugs.includes(slug));
  if (removedSlugs.length > 0) {
    console.log(`[Mirror Worker] 🗑️  Removing ${removedSlugs.length} markets no longer in database`);
    validatedSlugs = validatedSlugs.filter(slug => dbSlugs.includes(slug));
  }
}

/**
 * Start mirror worker (fetch slugs from database, validate, poll immediately, then every POLL_INTERVAL ms)
 * 
 * IMPORTANT: Initial validation runs in background to avoid blocking server startup and health checks
 */
export async function startMirror(): Promise<void> {
  console.log(`[Mirror Worker] 🚀 Starting database-driven worker (interval: ${POLL_INTERVAL}ms)`);
  
  // Schedule periodic polls + slug refresh FIRST (start immediately)
  intervalId = setInterval(async () => {
    // Refresh slugs from database every interval (detects new markets)
    await refreshSlugsFromDatabase();
    
    // Poll if we have valid slugs
    if (validatedSlugs.length > 0) {
      pollOnce().catch(err => {
        console.error('[Mirror Worker] Periodic poll failed:', err);
      });
    }
  }, POLL_INTERVAL);
  
  // Initial slug fetch and validation - run in background (non-blocking)
  // This prevents blocking server startup and health checks during deployment
  setImmediate(async () => {
    try {
      await refreshSlugsFromDatabase();
      
      if (validatedSlugs.length === 0) {
        console.log('[Mirror Worker] ⚠️  No Polymarket markets found. Worker will start but won\'t poll.');
        console.log('[Mirror Worker] 💡 Add markets via Admin Panel to enable mirroring');
      } else {
        console.log(`[Mirror Worker] ✅ Initial validation complete - monitoring ${validatedSlugs.length} markets`);
        // Poll immediately after initial validation
        pollOnce().catch(err => {
          console.error('[Mirror Worker] Initial poll failed:', err);
        });
      }
    } catch (error) {
      console.error('[Mirror Worker] Initial validation failed:', error);
      // Worker continues running, will retry on next interval
    }
  });
}

/**
 * Stop mirror worker
 */
export function stopMirror(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Mirror Worker] Stopped');
  }
}
