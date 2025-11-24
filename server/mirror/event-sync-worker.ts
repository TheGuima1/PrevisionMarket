/**
 * Event Sync Worker
 * Syncs Polymarket EVENTS (not individual markets) every 5 minutes
 * Fetches complete event data and updates all child markets
 */

import { db } from '../db';
import { events as eventsTable, markets, eventMarkets, polymarketSnapshots } from '@shared/schema';
import { isNotNull, sql } from 'drizzle-orm';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const POLL_INTERVAL = Number(process.env.MIRROR_POLL_MS || 300000); // 5min default

let intervalId: NodeJS.Timeout | null = null;

interface PolymarketEventMarket {
  slug: string;
  question: string;
  outcomes: string;
  outcomePrices: string;
  volume: string | number;
  volumeNum?: number;
  groupItemTitle?: string;
  oneDayPriceChange?: number;
  oneWeekPriceChange?: number;
}

interface PolymarketEvent {
  slug: string;
  title: string;
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

/**
 * Save historical snapshot for chart data
 */
async function saveSnapshot(slug: string, probYes: number): Promise<void> {
  try {
    if (!slug || slug.trim() === '') {
      console.error('[Event Sync] Invalid snapshot: empty slug');
      return;
    }
    
    if (typeof probYes !== 'number' || probYes < 0 || probYes > 1) {
      console.error(`[Event Sync] Invalid snapshot for ${slug}: probYes out of range (${probYes})`);
      return;
    }
    
    const probNo = 1 - probYes;
    const outcomes = JSON.stringify([
      {
        name: 'Yes',
        raw: probYes,
        percent: Number((probYes * 100).toFixed(2)),
      },
      {
        name: 'No',
        raw: probNo,
        percent: Number((probNo * 100).toFixed(2)),
      },
    ]);
    
    await db.insert(polymarketSnapshots).values({
      slug,
      outcomes,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error(`[Event Sync] Failed to save snapshot for ${slug}:`, error);
  }
}

/**
 * Fetch event from Polymarket Gamma API
 */
async function fetchPolyEventBySlug(slug: string): Promise<PolymarketEvent> {
  const url = `${GAMMA_API}/events?slug=${slug}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch event ${slug}: ${response.status}`);
  }
  
  const data = await response.json() as PolymarketEvent[];
  
  if (!data || data.length === 0) {
    throw new Error(`Event not found: ${slug}`);
  }
  
  return data[0];
}

/**
 * Sync a single event and all its markets
 */
async function syncEvent(eventSlug: string, eventId: string): Promise<void> {
  try {
    // Fetch event from Polymarket
    const polyEvent = await fetchPolyEventBySlug(eventSlug);
    
    console.log(`[Event Sync] Syncing ${eventSlug} (${polyEvent.markets.length} markets)...`);
    
    // Get all markets linked to this event
    const eventMarketLinks = await db.query.eventMarkets.findMany({
      where: (em, { eq }) => eq(em.eventId, eventId),
      with: {
        market: true,
      },
    });
    
    let updated = 0;
    let errors = 0;
    
    // Update each market with latest Polymarket data
    for (const link of eventMarketLinks) {
      const market = link.market;
      
      // Find corresponding Polymarket market by slug
      const polyMarket = polyEvent.markets.find(pm => pm.slug === market.polymarketSlug);
      
      if (!polyMarket) {
        // Market might have been removed from Polymarket event
        continue;
      }
      
      try {
        const probYes = extractProbYes(polyMarket);
        
        // Calculate new reserves maintaining k
        // Price YES = yesReserve / (yesReserve + noReserve)
        // Example: 35% YES probability -> yesReserve = 3500, noReserve = 6500
        // Verification: 3500 / 10000 = 35% YES ✓
        const yesReserve = 10000 * probYes;
        const noReserve = 10000 * (1 - probYes);
        
        // Update market
        await db.update(markets)
          .set({
            yesReserve: yesReserve.toFixed(2),
            noReserve: noReserve.toFixed(2),
            k: (yesReserve * noReserve).toFixed(2),
            totalVolume: (polyMarket.volumeNum || polyMarket.volume || 0).toString(),
            oneDayPriceChange: (polyMarket.oneDayPriceChange || 0).toString(),
            oneWeekPriceChange: (polyMarket.oneWeekPriceChange || 0).toString(),
          })
          .where(sql`${markets.id} = ${market.id}`);
        
        // Save snapshot for chart history
        await saveSnapshot(market.polymarketSlug!, probYes);
        
        updated++;
      } catch (error) {
        console.error(`[Event Sync] Failed to update market ${market.id}:`, error);
        errors++;
      }
    }
    
    console.log(`[Event Sync] ✓ ${eventSlug}: ${updated} updated, ${errors} errors`);
  } catch (error) {
    console.error(`[Event Sync] Failed to sync event ${eventSlug}:`, error);
  }
}

/**
 * Poll all events once
 */
async function pollOnce(): Promise<void> {
  try {
    // Get all events with Polymarket slugs
    const polyEvents = await db.query.events.findMany({
      where: isNotNull(eventsTable.polymarketSlug),
      columns: {
        id: true,
        polymarketSlug: true,
      },
    });
    
    if (polyEvents.length === 0) {
      console.log('[Event Sync] No Polymarket events to sync');
      return;
    }
    
    console.log(`[Event Sync] Syncing ${polyEvents.length} events...`);
    
    // Sync all events in parallel
    await Promise.allSettled(
      polyEvents.map(event => 
        syncEvent(event.polymarketSlug!, event.id)
      )
    );
    
    console.log('[Event Sync] ✅ Sync complete');
  } catch (error) {
    console.error('[Event Sync] Poll failed:', error);
  }
}

/**
 * Start event sync worker
 */
export async function startEventSync(): Promise<void> {
  console.log(`[Event Sync] 🚀 Starting event sync worker (interval: ${POLL_INTERVAL}ms)`);
  
  // Schedule periodic polls
  intervalId = setInterval(pollOnce, POLL_INTERVAL);
  
  // Initial poll (run in background to avoid blocking server startup)
  setImmediate(() => {
    pollOnce().catch(err => {
      console.error('[Event Sync] Initial poll failed:', err);
    });
  });
}

/**
 * Stop event sync worker
 */
export function stopEventSync(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Event Sync] Stopped');
  }
}
