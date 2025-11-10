/**
 * Polymarket Market Sync
 * Syncs Polymarket markets to local AMM markets for trading
 */

import { db } from "./db";
import { markets } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { PolymarketMarket } from "./polymarket-client";

/**
 * Bootstrap AMM reserves from Polymarket odds
 * Example: Yes=14%, No=86% → yesReserve=1400, noReserve=8600, k=12,040,000
 * 
 * This creates a synthetic AMM that mirrors Polymarket pricing with 2% spread already applied
 */
function bootstrapAMMFromOdds(outcomes: Array<{ name: string; raw: number; percent: number }>): {
  yesReserve: number;
  noReserve: number;
  k: number;
  seedLiquidity: number;
} {
  // Find Yes and No outcomes (case-insensitive)
  const yesOutcome = outcomes.find(o => o.name.toLowerCase() === 'yes');
  const noOutcome = outcomes.find(o => o.name.toLowerCase() === 'no');
  
  if (!yesOutcome || !noOutcome) {
    throw new Error(`Market must have exactly 2 outcomes (Yes/No), found: ${outcomes.map(o => o.name).join(', ')}`);
  }
  
  // Odds are already with 2% spread applied from polymarket-client.ts
  // Use raw (0-1) odds to create reserves
  // Scale by 10,000 for meaningful liquidity (e.g., 0.14 → 1400)
  const LIQUIDITY_SCALE = 10000;
  
  const yesReserve = yesOutcome.raw * LIQUIDITY_SCALE;
  const noReserve = noOutcome.raw * LIQUIDITY_SCALE;
  const k = yesReserve * noReserve;
  const seedLiquidity = yesReserve + noReserve; // Total initial liquidity
  
  return {
    yesReserve: Number(yesReserve.toFixed(2)),
    noReserve: Number(noReserve.toFixed(2)),
    k: Number(k.toFixed(4)),
    seedLiquidity: Number(seedLiquidity.toFixed(2)),
  };
}

/**
 * Sync a Polymarket market to local markets table
 * Creates or updates market with AMM reserves based on Polymarket odds
 */
export async function syncPolymarketMarket(polymarketData: PolymarketMarket): Promise<void> {
  try {
    // Check if market already exists
    const existing = await db
      .select()
      .from(markets)
      .where(eq(markets.polymarketSlug, polymarketData.slug))
      .limit(1);
    
    // Bootstrap AMM from Polymarket odds (with 2% spread already applied)
    const amm = bootstrapAMMFromOdds(polymarketData.outcomes);
    
    const marketData = {
      title: polymarketData.title,
      description: `Mercado espelhado da Polymarket: ${polymarketData.title}`,
      category: 'finance' as const, // Default category for Polymarket markets
      tags: ['polymarket', 'beta'],
      status: 'active' as const,
      resolutionSource: 'Polymarket',
      endDate: polymarketData.endsAt ? new Date(polymarketData.endsAt) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
      yesReserve: amm.yesReserve.toString(),
      noReserve: amm.noReserve.toString(),
      k: amm.k.toString(),
      seedLiquidity: amm.seedLiquidity.toString(),
      totalVolume: polymarketData.volume?.toString() || "0.00",
      origin: 'polymarket',
      polymarketSlug: polymarketData.slug,
    };
    
    if (existing.length > 0) {
      // Update existing market
      await db
        .update(markets)
        .set({
          ...marketData,
          // Preserve original createdAt
        })
        .where(eq(markets.id, existing[0].id));
      
      console.log(`[Polymarket Sync] ✓ Updated market: ${polymarketData.slug}`);
    } else {
      // Create new market
      await db.insert(markets).values(marketData);
      console.log(`[Polymarket Sync] ✓ Created market: ${polymarketData.slug}`);
    }
  } catch (error) {
    console.error(`[Polymarket Sync] ✗ Failed to sync ${polymarketData.slug}:`, error);
    throw error;
  }
}

/**
 * Get all Polymarket-origin markets from local markets table
 */
export async function getPolymarketMarkets() {
  return await db
    .select()
    .from(markets)
    .where(eq(markets.origin, 'polymarket'));
}
