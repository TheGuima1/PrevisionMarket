/**
 * AMM Reserve Sync
 * Synchronizes AMM market reserves with Polymarket odds in real-time
 */

import { db } from "./db";
import { markets, ammSnapshots } from "@shared/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { fetchPolyBySlug } from "./mirror/adapter";
import { createAMMSnapshot } from "./amm-pricing";

/**
 * Bootstrap AMM reserves from Polymarket odds
 * Converts probability to reserves (e.g., 4.3% YES → yesReserve=430, noReserve=9570)
 */
function bootstrapAMMFromOdds(probYes: number): {
  yesReserve: number;
  noReserve: number;
  k: number;
  seedLiquidity: number;
} {
  // Clamp probability to valid range
  const safeProb = Math.max(0.01, Math.min(0.99, probYes));
  const probNo = 1 - safeProb;
  
  // Scale by 10,000 for meaningful liquidity (e.g., 0.043 → 430)
  const LIQUIDITY_SCALE = 10000;
  
  const yesReserve = safeProb * LIQUIDITY_SCALE;
  const noReserve = probNo * LIQUIDITY_SCALE;
  const k = yesReserve * noReserve;
  const seedLiquidity = yesReserve + noReserve;
  
  return {
    yesReserve: Number(yesReserve.toFixed(2)),
    noReserve: Number(noReserve.toFixed(2)),
    k: Number(k.toFixed(4)),
    seedLiquidity: Number(seedLiquidity.toFixed(2)),
  };
}

/**
 * Sync AMM markets with Polymarket odds
 * Updates reserves for all markets that have a polymarketSlug defined
 * 
 * @param fetchCache - Optional cache of Polymarket fetch results to avoid double-fetching
 */
export async function syncAMMMarketsWithPolymarket(
  fetchCache?: Map<string, { probYes: number; title: string; volumeUsd?: number; oneDayPriceChange?: number; oneWeekPriceChange?: number }>
): Promise<void> {
  try {
    // Get all local AMM markets with Polymarket slugs
    const ammMarkets = await db
      .select()
      .from(markets)
      .where(
        and(
          eq(markets.origin, 'local'),
          isNotNull(markets.polymarketSlug)
        )
      );
    
    if (ammMarkets.length === 0) {
      // Silent return - no markets to sync
      return;
    }
    
    console.log(`[AMM Sync] Syncing ${ammMarkets.length} markets with Polymarket odds...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const market of ammMarkets) {
      if (!market.polymarketSlug) continue;
      
      try {
        // Try to get data from cache first, otherwise fetch
        let polyData;
        if (fetchCache && fetchCache.has(market.polymarketSlug)) {
          polyData = fetchCache.get(market.polymarketSlug)!;
        } else {
          polyData = await fetchPolyBySlug(market.polymarketSlug);
        }
        
        // Bootstrap reserves from Polymarket odds
        // Note: 2% spread is applied in amm-engine.ts buyShares(), not here
        const amm = bootstrapAMMFromOdds(polyData.probYes);
        
        // Update market reserves and price changes atomically
        await db
          .update(markets)
          .set({
            yesReserve: amm.yesReserve.toString(),
            noReserve: amm.noReserve.toString(),
            k: amm.k.toString(),
            seedLiquidity: amm.seedLiquidity.toString(),
            oneDayPriceChange: polyData.oneDayPriceChange?.toString(),
            oneWeekPriceChange: polyData.oneWeekPriceChange?.toString(),
          })
          .where(eq(markets.id, market.id));
        
        // Capture snapshot for historical chart
        const snapshot = createAMMSnapshot(market.id, amm.yesReserve, amm.noReserve);
        await db.insert(ammSnapshots).values({
          marketId: snapshot.marketId,
          yesReserve: snapshot.yesReserve.toString(),
          noReserve: snapshot.noReserve.toString(),
          probYes: snapshot.probYes.toString(),
          probNo: snapshot.probNo.toString(),
        });
        
        successCount++;
        console.log(`[AMM Sync] ✓ ${market.title} (${market.polymarketSlug}): ${(polyData.probYes * 100).toFixed(2)}% YES`);
      } catch (error) {
        errorCount++;
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[AMM Sync] ✗ ${market.title} (${market.polymarketSlug}): ${errMsg}`);
      }
    }
    
    console.log(`[AMM Sync] Complete: ${successCount} updated, ${errorCount} errors`);
  } catch (error) {
    // Non-critical error - log and continue (don't block mirror updates)
    console.error('[AMM Sync] Critical error (non-blocking):', error);
  }
}
