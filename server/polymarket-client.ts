/**
 * Polymarket API Client
 * Fetches market data from Polymarket's public Gamma API
 */

export interface PolymarketOutcome {
  name: string;
  percent: number; // 0-100
  raw: number;     // 0-1
}

export interface PolymarketMarket {
  slug: string;
  title: string;
  outcomes: PolymarketOutcome[];
  volume?: number;
  endsAt?: string;
}

const GAMMA_API = process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com';

/**
 * Fetch market data by slug from Polymarket Gamma API
 * @param slug - Polymarket market slug (e.g., "fed-rate-hike-in-2025")
 * @returns Market data with normalized outcomes
 */
export async function fetchMarketBySlug(slug: string): Promise<PolymarketMarket> {
  // Query by slug (returns array, take first match)
  const url = `${GAMMA_API}/markets?slug=${encodeURIComponent(slug)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }
    
    const markets = await response.json();
    
    // API returns array, get first match
    const market = markets[0];
    
    if (!market) {
      throw new Error(`Market with slug "${slug}" not found`);
    }
    
    // Parse outcomes and outcomePrices (JSON strings: "[\"Yes\", \"No\"]" and "[\"0.56\", \"0.44\"]")
    let outcomeNames: string[] = [];
    let outcomePricesStr: string[] = [];
    
    try {
      outcomeNames = market.outcomes ? JSON.parse(market.outcomes) : [];
      outcomePricesStr = market.outcomePrices ? JSON.parse(market.outcomePrices) : [];
    } catch (e) {
      // Fallback to CSV parsing if JSON parsing fails
      outcomeNames = market.outcomes ? market.outcomes.split(',').map((s: string) => s.trim()) : [];
      outcomePricesStr = market.outcomePrices ? market.outcomePrices.split(',').map((s: string) => s.trim()) : [];
    }
    
    // Store raw Polymarket probabilities (no spread applied)
    // Spread will be applied at order execution time in /api/orders
    const outcomes: PolymarketOutcome[] = outcomeNames.map((name: string, index: number) => {
      const rawPolymarketPrice = Number(outcomePricesStr[index] || 0);
      
      return {
        name: name.trim() || `Outcome ${index + 1}`,
        raw: rawPolymarketPrice,
        percent: Number((rawPolymarketPrice * 100).toFixed(2)),
      };
    });
    
    return {
      slug: market.slug || slug,
      title: market.question || market.title || slug,
      outcomes,
      volume: market.volume ? Number(market.volume) : market.volumeNum,
      endsAt: market.endDateIso || market.endDate,
    };
  } catch (error) {
    console.error(`Failed to fetch market ${slug}:`, error);
    throw error;
  }
}

/**
 * Apply spread to Polymarket price (legacy, kept for backward compat)
 * @param price - Base price (0-1)
 * @param side - 'BUY' or 'SELL'
 * @returns Price with spread applied
 */
export function applySpread(price: number, side: 'BUY' | 'SELL'): number {
  const SPREAD = Number(process.env.POLYMARKET_SPREAD || 0.02);
  const adjusted = side === 'BUY' 
    ? price * (1 - SPREAD)
    : price * (1 + SPREAD);
  
  return Math.min(0.99, Math.max(0.01, adjusted));
}

/**
 * Check if Polymarket integration is enabled
 */
export function isEnabled(): boolean {
  return process.env.ENABLE_POLYMARKET === 'true';
}

/**
 * Get list of configured Polymarket slugs
 */
export function getSlugs(): string[] {
  const slugs = process.env.POLYMARKET_SLUGS || '';
  return slugs.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10); // Max 10
}
