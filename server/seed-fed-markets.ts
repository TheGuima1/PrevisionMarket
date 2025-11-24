/**
 * Script to seed 3 Fed/Recession binary markets from Polymarket
 * These are standalone markets requested by user:
 * 1. Fed fará corte emergencial em 2025?
 * 2. Recessão nos EUA em 2025?
 * 3. Fed aumentará juros em 2025?
 */

import { db } from "./db";
import { markets } from "@shared/schema";
import { eq } from "drizzle-orm";

const GAMMA_API = 'https://gamma-api.polymarket.com';

// Markets to create with PT-BR titles
const FED_MARKETS = [
  {
    polymarketSlug: 'fed-emergency-rate-cut-in-2025',
    title: 'Fed fará corte emergencial em 2025?',
    category: 'politics' as const,
    tags: ['EUA', 'Economia', 'Fed'],
  },
  {
    polymarketSlug: 'us-recession-in-2025',
    title: 'Recessão nos EUA em 2025?',
    category: 'politics' as const,
    tags: ['EUA', 'Economia', 'Recessão'],
  },
  {
    polymarketSlug: 'fed-rate-hike-in-2025',
    title: 'Fed aumentará juros em 2025?',
    category: 'politics' as const,
    tags: ['EUA', 'Economia', 'Fed'],
  },
];

interface PolymarketData {
  slug: string;
  question: string;
  description: string;
  outcomePrices: string;
  volume: string;
  endDate: string;
  oneDayPriceChange?: number;
  oneWeekPriceChange?: number;
}

async function fetchPolymarketMarket(slug: string): Promise<PolymarketData | null> {
  try {
    const url = `${GAMMA_API}/markets?slug=${slug}`;
    console.log(`[Seed] Fetching ${slug}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Seed] Failed to fetch ${slug}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (!data || data.length === 0) {
      console.error(`[Seed] No data for ${slug}`);
      return null;
    }
    
    return data[0];
  } catch (error) {
    console.error(`[Seed] Error fetching ${slug}:`, error);
    return null;
  }
}

function extractProbYes(market: PolymarketData): number {
  try {
    let outcomePrices: string[] = [];
    if (typeof market.outcomePrices === 'string') {
      outcomePrices = JSON.parse(market.outcomePrices);
    } else {
      outcomePrices = market.outcomePrices as unknown as string[];
    }
    
    const yesPrice = parseFloat(outcomePrices[0] || '0.5');
    return Math.max(0.01, Math.min(0.99, yesPrice));
  } catch {
    return 0.5;
  }
}

async function seedFedMarkets() {
  try {
    console.log('[Seed] Starting Fed/Recession markets seeding...\n');
    
    for (const marketMeta of FED_MARKETS) {
      // Check if market already exists
      const existing = await db.select().from(markets).where(
        eq(markets.polymarketSlug, marketMeta.polymarketSlug)
      );
      
      if (existing.length > 0) {
        console.log(`[Seed] ⏭️  Market already exists: ${marketMeta.title}`);
        continue;
      }
      
      // Fetch from Polymarket
      const polyData = await fetchPolymarketMarket(marketMeta.polymarketSlug);
      
      if (!polyData) {
        console.warn(`[Seed] ⚠️  Skipping ${marketMeta.polymarketSlug} - no data`);
        continue;
      }
      
      const probYes = extractProbYes(polyData);
      
      // Calculate initial reserves (CPMM with k=10000)
      const yesReserve = 10000 * probYes;
      const noReserve = 10000 * (1 - probYes);
      
      const [newMarket] = await db.insert(markets).values({
        title: marketMeta.title,
        description: polyData.description || marketMeta.title,
        category: marketMeta.category,
        tags: marketMeta.tags,
        status: 'active' as const,
        resolutionSource: 'Polymarket',
        endDate: new Date(polyData.endDate),
        yesReserve: yesReserve.toFixed(2),
        noReserve: noReserve.toFixed(2),
        k: (yesReserve * noReserve).toFixed(2),
        seedLiquidity: '10000',
        totalVolume: polyData.volume || '0',
        escrowLockedYes: '0',
        escrowLockedNo: '0',
        totalSharesYes: '0',
        totalSharesNo: '0',
        maxCollateralLimit: '1000000',
        origin: 'polymarket',
        polymarketSlug: marketMeta.polymarketSlug,
        oneDayPriceChange: (polyData.oneDayPriceChange || 0).toString(),
        oneWeekPriceChange: (polyData.oneWeekPriceChange || 0).toString(),
      }).returning();
      
      console.log(`[Seed] ✓ Created market: ${newMarket.title} (${(probYes * 100).toFixed(1)}% SIM)`);
    }
    
    console.log('\n[Seed] ✅ Fed/Recession markets seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding markets:', error);
    process.exit(1);
  }
}

seedFedMarkets();
