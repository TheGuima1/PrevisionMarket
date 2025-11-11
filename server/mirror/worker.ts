/**
 * Mirror Worker
 * Polls Polymarket markets every 60s and updates mirror state with freeze logic
 * Also syncs AMM market reserves with Polymarket odds
 */

import { fetchPolyBySlug } from './adapter';
import { upsertMarket } from './state';
import { syncAMMMarketsWithPolymarket } from '../amm-sync';

const POLL_INTERVAL = Number(process.env.MIRROR_POLL_MS || 60000); // 60s default

let intervalId: NodeJS.Timeout | null = null;
let validatedSlugs: string[] = []; // Only contains slugs that passed validation

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
 * Start mirror worker (validate slugs, then poll immediately, then every POLL_INTERVAL ms)
 */
export async function startMirror(): Promise<void> {
  const configuredSlugs = (process.env.POLYMARKET_SLUGS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  if (configuredSlugs.length === 0) {
    console.log('[Mirror Worker] No slugs configured (POLYMARKET_SLUGS is empty)');
    return;
  }
  
  console.log(`[Mirror Worker] 🚀 Starting worker (interval: ${POLL_INTERVAL}ms)`);
  
  // Validate slugs at boot (auto-exclude invalid ones)
  validatedSlugs = await validateSlugs(configuredSlugs);
  
  if (validatedSlugs.length === 0) {
    console.error('[Mirror Worker] ❌ No valid slugs found. Worker will not start.');
    return;
  }
  
  // Poll immediately on startup
  pollOnce().catch(err => {
    console.error('[Mirror Worker] Initial poll failed:', err);
  });
  
  // Then schedule periodic polls
  intervalId = setInterval(() => {
    pollOnce().catch(err => {
      console.error('[Mirror Worker] Periodic poll failed:', err);
    });
  }, POLL_INTERVAL);
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
