/**
 * Backfill historical price data from Polymarket CLOB API
 * This script fetches historical prices and populates our polymarket_snapshots table
 */

import { db } from "./db";
import { polymarketSnapshots, markets } from "@shared/schema";
import { eq, isNotNull } from "drizzle-orm";

interface PricePoint {
  t: number; // Unix timestamp
  p: number; // Price (0-1)
}

interface MarketInfo {
  slug: string;
  clobTokenId: string;
  title: string;
}

async function fetchClobTokenId(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`https://gamma-api.polymarket.com/markets?slug=${slug}`);
    if (!res.ok) {
      console.log(`  API returned ${res.status} for ${slug}`);
      return null;
    }
    const data = await res.json();
    if (!data || data.length === 0) {
      console.log(`  No market data for ${slug}`);
      return null;
    }
    // clobTokenIds is returned as a JSON string that needs parsing
    let clobTokenIds = data[0]?.clobTokenIds;
    if (!clobTokenIds) {
      console.log(`  No clobTokenIds for ${slug}`);
      return null;
    }
    // Parse if it's a string
    if (typeof clobTokenIds === 'string') {
      clobTokenIds = JSON.parse(clobTokenIds);
    }
    if (!Array.isArray(clobTokenIds) || clobTokenIds.length === 0) {
      console.log(`  Invalid clobTokenIds format for ${slug}`);
      return null;
    }
    const tokenId = clobTokenIds[0];
    console.log(`  Token: ...${tokenId.slice(-12)}`);
    return tokenId; // YES token
  } catch (error) {
    console.error(`Failed to fetch token ID for ${slug}:`, error);
    return null;
  }
}

async function fetchPriceHistory(clobTokenId: string): Promise<PricePoint[]> {
  try {
    const url = `https://clob.polymarket.com/prices-history?market=${clobTokenId}&interval=max`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  History API returned ${res.status}`);
      return [];
    }
    const data = await res.json();
    console.log(`  History response: ${data.history?.length || 0} points`);
    return data.history || [];
  } catch (error) {
    console.error(`  Failed to fetch history:`, error);
    return [];
  }
}

async function backfillMarket(market: MarketInfo): Promise<number> {
  const { slug, clobTokenId, title } = market;
  
  // Fetch historical prices
  const history = await fetchPriceHistory(clobTokenId);
  if (history.length === 0) {
    console.log(`  No history for ${slug}`);
    return 0;
  }
  
  console.log(`  Found ${history.length} price points for ${slug}`);
  
  // Build batch of records
  const records = history.map(point => {
    const timestamp = new Date(point.t * 1000);
    const yesPrice = point.p;
    const noPrice = 1 - yesPrice;
    
    return {
      id: `${slug}-${point.t}`,
      slug: slug,
      timestamp: timestamp,
      outcomes: JSON.stringify([
        { name: "Yes", raw: yesPrice, percent: yesPrice * 100 },
        { name: "No", raw: noPrice, percent: noPrice * 100 }
      ]),
    };
  });
  
  // Batch insert with onConflictDoNothing
  const BATCH_SIZE = 500;
  let inserted = 0;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    try {
      await db.insert(polymarketSnapshots)
        .values(batch)
        .onConflictDoNothing();
      inserted += batch.length;
    } catch (error) {
      console.log(`  Batch insert error, trying one by one...`);
      for (const record of batch) {
        try {
          await db.insert(polymarketSnapshots)
            .values(record)
            .onConflictDoNothing();
          inserted++;
        } catch {
          // Skip duplicates
        }
      }
    }
    process.stdout.write(`  Inserted ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}\r`);
  }
  console.log();
  
  return inserted;
}

export async function backfillHistoricalData(): Promise<void> {
  console.log("\n📊 Starting Polymarket historical data backfill...\n");
  
  // Get all markets with polymarket slugs
  const allMarkets = await db.query.markets.findMany({
    where: isNotNull(markets.polymarketSlug),
  });
  
  console.log(`Found ${allMarkets.length} markets with Polymarket slugs\n`);
  
  let totalInserted = 0;
  let processedCount = 0;
  
  for (const market of allMarkets) {
    if (!market.polymarketSlug) continue;
    
    processedCount++;
    console.log(`[${processedCount}/${allMarkets.length}] Processing: ${market.title?.substring(0, 50)}...`);
    
    // Get CLOB token ID
    const clobTokenId = await fetchClobTokenId(market.polymarketSlug);
    if (!clobTokenId) {
      console.log(`  ⚠️ No CLOB token ID found`);
      continue;
    }
    
    const inserted = await backfillMarket({
      slug: market.polymarketSlug,
      clobTokenId,
      title: market.title || "",
    });
    
    totalInserted += inserted;
    
    if (inserted > 0) {
      console.log(`  ✅ Inserted ${inserted} new snapshots`);
    }
    
    // Rate limiting - small delay between markets
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n✅ Backfill complete: ${totalInserted} total snapshots inserted\n`);
}

// Run the backfill
backfillHistoricalData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
