/**
 * Script to seed new events from Polymarket
 * Replaces the 3 standalone markets with 4 new multi-alternative events
 */

import { db } from "./db";
import { markets, events, eventMarkets } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

const GAMMA_API = 'https://gamma-api.polymarket.com';

// Event slugs to fetch from Polymarket
const NEW_EVENTS = [
  '2026-fifa-world-cup-winner-595',
  'us-recession-by-end-of-2026',
  'when-will-bitcoin-hit-150k',
  'brazil-presidential-election',
];

// Old markets to delete
const OLD_MARKET_SLUGS = [
  'us-recession-in-2025',
  'fed-rate-hike-in-2025',
  'fed-emergency-rate-cut-in-2025',
];

interface PolymarketEventMarket {
  slug: string;
  question: string;
  outcomes: string;
  outcomePrices: string;
  volume: string | number;
  volumeNum?: number;
  endDate: string;
  groupItemTitle?: string;
  oneDayPriceChange?: number;
  oneWeekPriceChange?: number;
}

interface PolymarketEvent {
  slug: string;
  title: string;
  description: string;
  endDate: string;
  volume: number;
  markets: PolymarketEventMarket[];
}

function extractProbYes(market: PolymarketEventMarket): number {
  try {
    let outcomePrices: string[] = [];
    if (typeof market.outcomePrices === 'string') {
      outcomePrices = JSON.parse(market.outcomePrices);
    } else {
      outcomePrices = market.outcomePrices;
    }
    
    const yesPrice = parseFloat(outcomePrices[0] || '0.5');
    return Math.max(0, Math.min(1, yesPrice));
  } catch {
    return 0.5;
  }
}

function mapCategory(slug: string): 'politics' | 'sports' | 'crypto' | 'entertainment' | 'other' {
  if (slug.includes('brasileiro') || slug.includes('fifa') || slug.includes('world-cup')) {
    return 'sports';
  }
  if (slug.includes('bitcoin') || slug.includes('crypto')) {
    return 'crypto';
  }
  if (slug.includes('recession') || slug.includes('fed') || slug.includes('presidential-election')) {
    return 'politics';
  }
  if (slug.includes('spotify') || slug.includes('music') || slug.includes('artist')) {
    return 'entertainment';
  }
  return 'other';
}

async function fetchPolymarketEvent(slug: string): Promise<PolymarketEvent | null> {
  try {
    const url = `${GAMMA_API}/events?slug=${slug}`;
    console.log(`[Seed] Fetching ${slug}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Seed] Failed to fetch ${slug}: ${response.status}`);
      return null;
    }
    
    const events = await response.json() as PolymarketEvent[];
    
    if (!events || events.length === 0) {
      console.error(`[Seed] No event found for ${slug}`);
      return null;
    }
    
    return events[0];
  } catch (error) {
    console.error(`[Seed] Error fetching ${slug}:`, error);
    return null;
  }
}

async function seedNewEvents() {
  try {
    console.log('[Seed] Starting new events seeding...');
    
    // Step 1: Delete old markets
    console.log(`[Seed] Deleting ${OLD_MARKET_SLUGS.length} old markets...`);
    const oldMarkets = await db.select().from(markets).where(
      inArray(markets.polymarketSlug, OLD_MARKET_SLUGS)
    );
    
    if (oldMarkets.length > 0) {
      const oldMarketIds = oldMarkets.map(m => m.id);
      
      // Delete event_markets entries first (foreign key constraint)
      await db.delete(eventMarkets).where(
        inArray(eventMarkets.marketId, oldMarketIds)
      );
      
      // Delete markets
      await db.delete(markets).where(
        inArray(markets.id, oldMarketIds)
      );
      
      console.log(`[Seed] ✓ Deleted ${oldMarkets.length} old markets`);
    }
    
    // Step 2: Fetch and create new events
    for (const eventSlug of NEW_EVENTS) {
      const polyEvent = await fetchPolymarketEvent(eventSlug);
      
      if (!polyEvent || !polyEvent.markets || polyEvent.markets.length === 0) {
        console.warn(`[Seed] Skipping ${eventSlug} - no data`);
        continue;
      }
      
      console.log(`[Seed] Processing ${eventSlug} with ${polyEvent.markets.length} markets...`);
      
      // Create event
      const [newEvent] = await db.insert(events).values({
        slug: eventSlug,
        title: polyEvent.title,
        description: polyEvent.description || polyEvent.title,
        category: mapCategory(eventSlug),
        endDate: new Date(polyEvent.endDate),
        totalVolume: polyEvent.volume?.toString() || '0',
      }).returning();
      
      console.log(`[Seed] ✓ Created event: ${newEvent.title}`);
      
      // Create markets for this event
      for (let i = 0; i < polyEvent.markets.length; i++) {
        const polyMarket = polyEvent.markets[i];
        
        // Skip markets with invalid end dates (closed markets from Bitcoin event)
        const marketEndDate = new Date(polyMarket.endDate);
        if (isNaN(marketEndDate.getTime()) || marketEndDate < new Date()) {
          console.log(`[Seed]   ⏭️  Skipping closed/invalid market: ${polyMarket.groupItemTitle || polyMarket.question}`);
          continue;
        }
        
        const probYes = extractProbYes(polyMarket);
        
        // Calculate initial reserves (CPMM with k=10000)
        // Price YES = yesReserve / (yesReserve + noReserve)
        // Example: 35% YES probability -> yesReserve = 3500, noReserve = 6500
        // Verification: 3500 / 10000 = 35% YES ✓
        const yesReserve = 10000 * probYes;
        const noReserve = 10000 * (1 - probYes);
        
        const [newMarket] = await db.insert(markets).values({
          title: polyMarket.groupItemTitle || polyMarket.question,
          description: polyMarket.question,
          category: mapCategory(eventSlug),
          tags: [polyEvent.title],
          status: 'active' as const,
          resolutionSource: 'Polymarket',
          endDate: new Date(polyMarket.endDate),
          yesReserve: yesReserve.toFixed(2),
          noReserve: noReserve.toFixed(2),
          k: (yesReserve * noReserve).toFixed(2),
          seedLiquidity: '10000',
          totalVolume: (polyMarket.volumeNum || polyMarket.volume || 0).toString(),
          escrowLockedYes: '0',
          escrowLockedNo: '0',
          totalSharesYes: '0',
          totalSharesNo: '0',
          maxCollateralLimit: '1000000',
          origin: 'polymarket',
          polymarketSlug: polyMarket.slug,
          oneDayPriceChange: (polyMarket.oneDayPriceChange || 0).toString(),
          oneWeekPriceChange: (polyMarket.oneWeekPriceChange || 0).toString(),
        }).returning();
        
        // Link market to event
        await db.insert(eventMarkets).values({
          eventId: newEvent.id,
          marketId: newMarket.id,
          order: i,
        });
        
        console.log(`[Seed]   ✓ Created market: ${newMarket.title} (${(probYes * 100).toFixed(1)}% YES)`);
      }
      
      console.log(`[Seed] ✓ Completed ${eventSlug}`);
    }
    
    console.log('[Seed] ✅ All new events seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding events:', error);
    process.exit(1);
  }
}

seedNewEvents();
