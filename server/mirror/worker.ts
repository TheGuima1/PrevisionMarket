/**
 * Mirror Worker
 * Polls Polymarket markets every 60s and updates mirror state with freeze logic
 */

import { fetchPolyBySlug } from './adapter';
import { upsertMarket } from './state';

const POLY_SLUGS = (process.env.POLYMARKET_SLUGS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const POLL_INTERVAL = Number(process.env.MIRROR_POLL_MS || 60000); // 60s default

let intervalId: NodeJS.Timeout | null = null;

/**
 * Poll all configured slugs once
 */
export async function pollOnce(): Promise<void> {
  for (const slug of POLY_SLUGS) {
    try {
      const { probYes, title, volumeUsd } = await fetchPolyBySlug(slug);
      upsertMarket(slug, { title, probYes_raw: probYes, volumeUsd });
    } catch (error) {
      console.error(`[Mirror Worker] ✗ ${slug}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Start mirror worker (poll immediately, then every POLL_INTERVAL ms)
 */
export function startMirror(): void {
  if (POLY_SLUGS.length === 0) {
    console.log('[Mirror Worker] No slugs configured (POLYMARKET_SLUGS is empty)');
    return;
  }
  
  console.log(`[Mirror Worker] 🚀 Starting worker (interval: ${POLL_INTERVAL}ms)`);
  console.log(`[Mirror Worker] Monitoring ${POLY_SLUGS.length} markets: ${POLY_SLUGS.join(', ')}`);
  
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
