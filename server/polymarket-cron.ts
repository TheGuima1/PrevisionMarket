/**
 * Polymarket Snapshot Cron Job
 * Periodically fetches market data from Polymarket and stores snapshots
 */

import { db } from "./db";
import { polymarketMarkets, polymarketSnapshots } from "@shared/schema";
import { fetchMarketBySlug, getSlugs, isEnabled } from "./polymarket-client";
import { syncPolymarketMarket } from "./polymarket-sync";
import { eq } from "drizzle-orm";

const SNAPSHOT_INTERVAL = Number(process.env.POLYMARKET_SNAPSHOT_INTERVAL || 60) * 1000; // Convert to ms

let intervalId: NodeJS.Timeout | null = null;

/**
 * Take a snapshot of all configured Polymarket markets
 */
async function takeSnapshot() {
  if (!isEnabled()) {
    return;
  }
  
  const slugs = getSlugs();
  const timestamp = new Date();
  
  console.log(`[Polymarket Snapshot] Starting snapshot for ${slugs.length} markets...`);
  
  for (const slug of slugs) {
    try {
      const market = await fetchMarketBySlug(slug);
      const outcomesJson = JSON.stringify(market.outcomes);
      
      // Upsert market (update if exists, insert if not)
      await db
        .insert(polymarketMarkets)
        .values({
          slug: market.slug,
          title: market.title,
          outcomes: outcomesJson,
          volume: market.volume?.toString() || null,
          endsAt: market.endsAt ? new Date(market.endsAt) : null,
          lastUpdate: timestamp,
        })
        .onConflictDoUpdate({
          target: polymarketMarkets.slug,
          set: {
            title: market.title,
            outcomes: outcomesJson,
            volume: market.volume?.toString() || null,
            endsAt: market.endsAt ? new Date(market.endsAt) : null,
            lastUpdate: timestamp,
          },
        });
      
      // Insert snapshot for historical chart
      await db.insert(polymarketSnapshots).values({
        slug: market.slug,
        timestamp,
        outcomes: outcomesJson,
      });
      
      // Sync to local markets table for AMM trading
      await syncPolymarketMarket(market);
      
      console.log(`[Polymarket Snapshot] ✓ ${slug} - ${market.title}`);
    } catch (error) {
      console.error(`[Polymarket Snapshot] ✗ ${slug} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log(`[Polymarket Snapshot] Snapshot complete at ${timestamp.toISOString()}`);
}

/**
 * Start the snapshot cron job
 */
export function startPolymarketSnapshots() {
  if (!isEnabled()) {
    console.log('[Polymarket Snapshot] Integration disabled (ENABLE_POLYMARKET=false)');
    return;
  }
  
  const slugs = getSlugs();
  
  if (slugs.length === 0) {
    console.log('[Polymarket Snapshot] No slugs configured (POLYMARKET_SLUGS is empty)');
    return;
  }
  
  console.log(`[Polymarket Snapshot] Starting cron job (interval: ${SNAPSHOT_INTERVAL}ms)`);
  console.log(`[Polymarket Snapshot] Monitoring ${slugs.length} markets: ${slugs.join(', ')}`);
  
  // Take first snapshot immediately
  takeSnapshot().catch(err => {
    console.error('[Polymarket Snapshot] Initial snapshot failed:', err);
  });
  
  // Then schedule periodic snapshots
  intervalId = setInterval(() => {
    takeSnapshot().catch(err => {
      console.error('[Polymarket Snapshot] Periodic snapshot failed:', err);
    });
  }, SNAPSHOT_INTERVAL);
}

/**
 * Stop the snapshot cron job
 */
export function stopPolymarketSnapshots() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Polymarket Snapshot] Cron job stopped');
  }
}
