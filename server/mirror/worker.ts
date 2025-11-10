/**
 * Mirror Worker
 * Polls Polymarket markets every 60s and updates mirror state with freeze logic
 */

import { fetchPolyBySlug } from './adapter';
import { upsertMarket } from './state';

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
 */
export async function pollOnce(): Promise<void> {
  for (const slug of validatedSlugs) {
    try {
      const { probYes, title, volumeUsd } = await fetchPolyBySlug(slug);
      upsertMarket(slug, { title, probYes_raw: probYes, volumeUsd });
    } catch (error) {
      console.error(`[Mirror Worker] ✗ ${slug}:`, error instanceof Error ? error.message : 'Unknown error');
    }
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
