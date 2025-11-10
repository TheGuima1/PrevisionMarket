/**
 * Polymarket API Client
 * Fetches market data from Polymarket's public Gamma API and CLOB
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
const CLOB_API = process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';
const SPREAD = Number(process.env.POLYMARKET_SPREAD || 0.02);

/**
 * Fetch market data by slug from Polymarket Gamma API
 * @param slug - Polymarket market slug (e.g., "presidential-election-2024")
 * @returns Market data with normalized outcomes
 */
export async function fetchMarketBySlug(slug: string): Promise<PolymarketMarket> {
  const url = `${GAMMA_API}/markets/slug/${encodeURIComponent(slug)}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract outcomes from response
    const rawOutcomes = data.outcomes || [];
    const outcomes: Array<{ name: string; raw: number }> = [];
    
    for (const outcome of rawOutcomes) {
      const name = outcome.name || outcome.ticker || outcome.id || 'Unknown';
      let prob = outcome.probability ?? outcome.price ?? null;
      
      // If probability not available, try fetching from book
      if (prob == null && outcome.token_id) {
        try {
          const bookResponse = await fetch(`${CLOB_API}/book?token_id=${outcome.token_id}`);
          if (bookResponse.ok) {
            const book = await bookResponse.json();
            const bestBid = Number(book.best_bid ?? 0) / 100;
            const bestAsk = Number(book.best_ask ?? 0) / 100;
            
            if (bestBid > 0 && bestAsk > 0) {
              const spread = bestAsk - bestBid;
              // Use mid-price if spread <= $0.10, otherwise use last trade
              prob = (spread <= 0.10) ? (bestBid + bestAsk) / 2 : (outcome.last_price ?? null);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch book for token ${outcome.token_id}:`, error);
        }
      }
      
      outcomes.push({
        name,
        raw: Number(prob ?? 0),
      });
    }
    
    // Normalize outcomes to sum to 1 (100%)
    const sum = outcomes.reduce((acc, o) => acc + o.raw, 0) || 1;
    const normalized = outcomes.map(o => ({
      name: o.name,
      percent: Number(((o.raw / sum) * 100).toFixed(1)),
      raw: o.raw / sum,
    }));
    
    return {
      slug,
      title: data.question || data.title || slug,
      outcomes: normalized,
      volume: data.volume,
      endsAt: data.end_date_iso || data.endDate,
    };
  } catch (error) {
    console.error(`Failed to fetch market ${slug}:`, error);
    throw error;
  }
}

/**
 * Apply spread to Polymarket price
 * @param price - Base price (0-1)
 * @param side - 'BUY' or 'SELL'
 * @returns Price with spread applied
 */
export function applySpread(price: number, side: 'BUY' | 'SELL'): number {
  const adjusted = side === 'BUY' 
    ? price * (1 - SPREAD)  // Buy cheaper
    : price * (1 + SPREAD);  // Sell more expensive
  
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
