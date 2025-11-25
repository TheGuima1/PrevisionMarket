/**
 * Polymarket API Adapter
 * Fetches market data and ensures YES/NO outcomes are identified by NAME, not position
 * CRITICAL: Never assume outcome order - always search by name (case-insensitive)
 */

const GAMMA_API = process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com';

export interface PolymarketRawMarket {
  slug: string;
  question: string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  volume?: number;
  volumeNum?: number;
  endDateIso?: string;
  endDate?: string;
  oneDayPriceChange?: number;
  oneWeekPriceChange?: number;
}

export interface AdapterMarketData {
  slug: string;
  title: string;
  probYes: number; // 0-1, extracted from YES outcome by name
  volumeUsd?: number;
  oneDayPriceChange?: number;
  oneWeekPriceChange?: number;
}

/**
 * Clamp probability to [0, 1] range
 */
function clamp01(p: number): number {
  return Math.max(0, Math.min(1, p));
}

/**
 * Extract YES probability from market outcomes
 * CRITICAL: Find outcome by NAME (case-insensitive), never by array position
 */
function extractProbYes(raw: PolymarketRawMarket): number {
  try {
    // Parse outcomes and prices (can be JSON strings or arrays)
    let outcomeNames: string[] = [];
    let outcomePricesStr: string[] = [];
    
    if (typeof raw.outcomes === 'string') {
      try {
        outcomeNames = JSON.parse(raw.outcomes);
      } catch {
        outcomeNames = raw.outcomes.split(',').map(s => s.trim());
      }
    } else if (Array.isArray(raw.outcomes)) {
      outcomeNames = raw.outcomes;
    }
    
    if (typeof raw.outcomePrices === 'string') {
      try {
        outcomePricesStr = JSON.parse(raw.outcomePrices);
      } catch {
        outcomePricesStr = raw.outcomePrices.split(',').map(s => s.trim());
      }
    } else if (Array.isArray(raw.outcomePrices)) {
      outcomePricesStr = raw.outcomePrices;
    }
    
    // Find YES and NO outcomes by name (case-insensitive)
    const yesIndex = outcomeNames.findIndex(name => /^yes$/i.test(name.trim()));
    const noIndex = outcomeNames.findIndex(name => /^no$/i.test(name.trim()));
    
    // Priority: Use YES price if available
    if (yesIndex >= 0 && yesIndex < outcomePricesStr.length) {
      const yesPrice = Number(outcomePricesStr[yesIndex]);
      if (!isNaN(yesPrice)) {
        return clamp01(yesPrice);
      }
    }
    
    // Fallback: Calculate from NO price (probYes = 1 - probNo)
    if (noIndex >= 0 && noIndex < outcomePricesStr.length) {
      const noPrice = Number(outcomePricesStr[noIndex]);
      if (!isNaN(noPrice)) {
        return clamp01(1 - noPrice);
      }
    }
    
    // Last resort: 50/50 (prevents crashes)
    console.warn(`[Adapter] Could not extract YES/NO from ${raw.slug}, using 0.5 fallback`);
    return 0.5;
  } catch (error) {
    console.error(`[Adapter] Error extracting probYes from ${raw.slug}:`, error);
    return 0.5;
  }
}

/**
 * Fetch market data by slug from Polymarket Gamma API
 * Returns pure probabilities (no spread applied - spread happens at execution time)
 * 
 * NOTE: Gamma API doesn't support ?slug= parameter, so we fetch active markets
 * and filter locally. This is cached to avoid repeated API calls.
 */
let marketsCache: PolymarketRawMarket[] = [];
let cacheExpiry = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (optimized for performance)

// Cache for events (multi-outcome markets)
let eventsCache: any[] = [];
let eventsCacheExpiry = 0;

/**
 * Fetch markets from an event (multi-outcome format) from Polymarket's Events API
 * Used for events like Brazil Presidential Election with multiple candidate markets
 */
export async function fetchEventMarkets(eventSlug: string): Promise<AdapterMarketData[]> {
  try {
    // Refresh events cache if expired
    if (Date.now() > eventsCacheExpiry || eventsCache.length === 0) {
      const url = `${GAMMA_API}/events?active=true&closed=false&limit=100`;
      console.log(`[Adapter] Refreshing events cache from Gamma API...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Gamma Events API error: ${response.status} ${response.statusText}`);
      }
      
      eventsCache = await response.json();
      eventsCacheExpiry = Date.now() + CACHE_TTL_MS;
      console.log(`[Adapter] Cached ${eventsCache.length} active events`);
    }
    
    // Find the event by slug (case-insensitive)
    const event = eventsCache.find((e: any) => 
      e.slug?.toLowerCase() === eventSlug.toLowerCase()
    );
    
    if (!event) {
      console.warn(`[Adapter] Event not found for slug: ${eventSlug}`);
      return [];
    }
    
    // Event contains "markets" array with individual candidate markets
    const markets = event.markets || [];
    console.log(`[Adapter] Found ${markets.length} markets in event ${eventSlug}`);
    
    // Transform each market into AdapterMarketData format
    return markets.map((market: PolymarketRawMarket) => {
      const probYes = extractProbYes(market);
      
      return {
        slug: market.slug || '',
        title: market.question || '',
        probYes,
        volumeUsd: market.volume || market.volumeNum,
        oneDayPriceChange: market.oneDayPriceChange,
        oneWeekPriceChange: market.oneWeekPriceChange,
      };
    });
  } catch (error) {
    console.error(`[Adapter] Failed to fetch event ${eventSlug}:`, error);
    return [];
  }
}

/**
 * Fetch all Brazil Presidential Election candidate markets
 * Maps the Polymarket event data to our configured market slugs
 */
export async function fetchBrazilElectionMarkets(): Promise<AdapterMarketData[]> {
  return fetchEventMarkets('brazil-presidential-election');
}

export async function fetchPolyBySlug(slug: string): Promise<AdapterMarketData> {
  try {
    // Refresh cache if expired
    if (Date.now() > cacheExpiry || marketsCache.length === 0) {
      const url = `${GAMMA_API}/markets?active=true&closed=false&limit=500`;
      console.log(`[Adapter] Refreshing markets cache from Gamma API...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Gamma API error: ${response.status} ${response.statusText}`);
      }
      
      marketsCache = await response.json() as PolymarketRawMarket[];
      cacheExpiry = Date.now() + CACHE_TTL_MS;
      console.log(`[Adapter] Cached ${marketsCache.length} active markets`);
    }
    
    // Find market by slug (case-insensitive)
    const market = marketsCache.find(m => 
      m.slug?.toLowerCase() === slug.toLowerCase()
    );
    
    if (!market) {
      throw new Error(`Market not found for slug: ${slug}`);
    }
    
    const probYes = extractProbYes(market);
    
    return {
      slug: market.slug || slug,
      title: market.question || slug,
      probYes,
      volumeUsd: market.volume || market.volumeNum,
      oneDayPriceChange: market.oneDayPriceChange,
      oneWeekPriceChange: market.oneWeekPriceChange,
    };
  } catch (error) {
    console.error(`[Adapter] Failed to fetch ${slug}:`, error);
    throw error;
  }
}
