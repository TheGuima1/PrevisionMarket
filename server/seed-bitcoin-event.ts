/**
 * Script to seed Bitcoin $150k event (only active markets)
 */

import { db } from "./db";
import { markets, events as eventsTable, eventMarkets } from "@shared/schema";

const GAMMA_API = 'https://gamma-api.polymarket.com';

interface PolymarketEventMarket {
  slug: string;
  question: string;
  outcomes: string;
  outcomePrices: string;
  volume: string | number;
  volumeNum?: number;
  endDate: string;
  groupItemTitle?: string;
  closed?: boolean;
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

async function seedBitcoinEvent() {
  try {
    console.log('[Seed] Fetching Bitcoin $150k event...');
    
    const url = `${GAMMA_API}/events?slug=when-will-bitcoin-hit-150k`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const events = await response.json() as PolymarketEvent[];
    const polyEvent = events[0];
    
    if (!polyEvent) {
      throw new Error('Bitcoin event not found');
    }
    
    console.log(`[Seed] Found event with ${polyEvent.markets.length} total markets`);
    
    // Filter only active markets (not closed, end date in future)
    const now = new Date();
    const activeMarkets = polyEvent.markets.filter(m => {
      const endDate = new Date(m.endDate);
      return !m.closed && endDate > now && !isNaN(endDate.getTime());
    });
    
    console.log(`[Seed] ${activeMarkets.length} active markets found`);
    
    if (activeMarkets.length === 0) {
      console.log('[Seed] No active markets to seed');
      process.exit(0);
    }
    
    // Create event
    const [newEvent] = await db.insert(eventsTable).values({
      slug: 'when-will-bitcoin-hit-150k',
      title: polyEvent.title,
      description: polyEvent.description || polyEvent.title,
      category: 'crypto' as const,
      endDate: new Date(activeMarkets[activeMarkets.length - 1].endDate), // Use last market's end date
      totalVolume: polyEvent.volume?.toString() || '0',
    }).returning();
    
    console.log(`[Seed] ✓ Created event: ${newEvent.title}`);
    
    // Create markets
    for (let i = 0; i < activeMarkets.length; i++) {
      const polyMarket = activeMarkets[i];
      const probYes = extractProbYes(polyMarket);
      
      // Calculate initial reserves (CPMM with k=10000)
      const yesReserve = 10000 * (1 - probYes);
      const noReserve = 10000 * probYes;
      
      const [newMarket] = await db.insert(markets).values({
        title: polyMarket.groupItemTitle || polyMarket.question,
        description: polyMarket.question,
        category: 'crypto' as const,
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
    
    console.log('[Seed] ✅ Bitcoin event seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error:', error);
    process.exit(1);
  }
}

seedBitcoinEvent();
