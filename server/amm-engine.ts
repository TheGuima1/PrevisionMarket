/**
 * AMM (Automated Market Maker) Engine
 * Implements Constant Product Market Maker (CPMM): x * y = k
 * 
 * This engine handles:
 * - Dynamic pricing based on liquidity reserves
 * - Trade execution with automatic price adjustment
 * - Zero-liquidity initialization (first trade sets reserves)
 */

export interface AMMState {
  yesReserve: number;
  noReserve: number;
  k: number;
}

export interface TradeResult {
  sharesBought: number;
  avgPrice: number;
  newYesReserve: number;
  newNoReserve: number;
  newK: number;
  spreadFee?: number; // 2% spread fee (optional for backward compatibility)
}

const EPSILON = 0.01; // Minimum reserve to avoid division by zero

/**
 * Calculate current price for YES or NO outcome
 * Price = opposite_reserve / (yes_reserve + no_reserve)
 * 
 * @returns Price between 0 and 1 (probability), or null if no liquidity
 */
export function getPrice(outcome: 'yes' | 'no', state: AMMState): number | null {
  const { yesReserve, noReserve } = state;
  
  // No liquidity yet - price undefined
  if (yesReserve === 0 && noReserve === 0) {
    return null;
  }
  
  const total = yesReserve + noReserve;
  if (total === 0) return null;
  
  if (outcome === 'yes') {
    return yesReserve / total;
  } else {
    return noReserve / total;
  }
}

/**
 * Execute a buy trade in the AMM with 2% spread
 * Requires admin-seeded liquidity (no zero-liquidity bootstrap)
 * 
 * @param usdcIn Amount of USDC to spend (user pays full amount)
 * @param outcome 'yes' or 'no'
 * @param currentState Current AMM reserves
 * @param spreadBps Spread in basis points (default: 200 = 2%)
 * @returns Trade result with shares bought and new state
 */
export function buyShares(
  usdcIn: number,
  outcome: 'yes' | 'no',
  currentState: AMMState,
  spreadBps: number = 200
): TradeResult {
  let { yesReserve, noReserve, k } = currentState;
  
  // Validate market has liquidity (admin must seed first)
  // Use threshold to avoid precision issues (0.01 = 1 cent minimum)
  if (yesReserve < 0.01 || noReserve < 0.01 || k < 0.0001) {
    throw new Error("Market not initialized. Admin must seed liquidity first.");
  }
  
  // Calculate 2% spread fee separately (NOT deducted from pricing)
  // User pays full usdcIn, gets shares based on FULL amount (Polymarket parity)
  // Fee is charged separately for transparency
  const spreadFee = (usdcIn * spreadBps) / 10000;
  
  // Execute trade with FULL amount (no spread discount)
  // This ensures odds/payout match Polymarket exactly
  const result = executeTradeWithCPMM(usdcIn, outcome, yesReserve, noReserve, k);
  
  return {
    ...result,
    spreadFee,
  };
}

/**
 * Seed market with initial admin liquidity
 * Creates symmetric pool for fair price discovery
 * 
 * @param seedAmount Total liquidity to seed (split 50/50)
 * @returns Initial AMM state with reserves and k
 */
export function seedMarket(seedAmount: number): AMMState {
  if (seedAmount <= 0) {
    throw new Error("Seed amount must be positive");
  }
  
  // Split seed symmetrically: 50% YES, 50% NO
  const halfSeed = seedAmount / 2;
  
  return {
    yesReserve: halfSeed,
    noReserve: halfSeed,
    k: halfSeed * halfSeed,
  };
}

/**
 * Execute trade using Simple Odds-Based Model (Polymarket Mirror + 2% Spread)
 * 
 * MVP ARCHITECTURE:
 * 1. Get current price from AMM reserves (price discovery)
 * 2. Add 2% spread (our revenue)
 * 3. Calculate shares = stake / (price + spread)
 * 4. Reserves DO NOT change (static price discovery)
 * 
 * BUSINESS MODEL:
 * - BRL3 = internal credit (1 BRL3 = 1 BRL on withdrawal)
 * - Mirror Polymarket odds + 2% spread margin
 * - Payout: 1 share = 1 BRL3 if outcome wins
 * - Platform is "the house" (no counterparties needed)
 * 
 * EXAMPLE:
 * Polymarket: 4.3% YES odds
 * Our platform: 4.3% + 2% = 4.39% (odds ~22.7)
 * 100 BRL3 stake → 100 / 0.0439 = 2,277 shares
 * If YES wins: payout = 2,277 BRL3, profit = +2,177 BRL3
 */
function executeTradeWithCPMM(
  usdcIn: number,
  outcome: 'yes' | 'no',
  yesReserve: number,
  noReserve: number,
  k: number
): TradeResult {
  // Step 1: Get current price from reserves (price discovery)
  const currentPrice = outcome === 'yes'
    ? yesReserve / (yesReserve + noReserve) // YES price
    : noReserve / (yesReserve + noReserve); // NO price
  
  // Prevent division by zero at extreme prices
  if (currentPrice < 0.001) {
    throw new Error("Price too low (< 0.1%). Market may need rebalancing.");
  }
  
  // Step 2: Calculate shares using simple formula (Polymarket-style)
  // shares = stake / price (no CPMM slippage)
  const sharesBought = usdcIn / currentPrice;
  
  // Step 3: Reserves stay constant (price discovery only, no trades affect reserves)
  const newYesReserve = yesReserve;
  const newNoReserve = noReserve;
  const newK = k;
  
  const avgPrice = currentPrice;
  
  return {
    sharesBought,
    avgPrice,
    newYesReserve,
    newNoReserve,
    newK,
  };
}

/**
 * Calculate how much USDC you'd get back for selling shares
 * (Optional - for early exit before market resolution)
 */
export function sellShares(
  sharesToSell: number,
  outcome: 'yes' | 'no',
  currentState: AMMState
): TradeResult {
  const { yesReserve, noReserve, k } = currentState;
  
  // Reverse trade: add shares back, remove USDC
  let usdcOut = 0;
  let sharesRemaining = sharesToSell;
  const step = 0.01;
  
  let currentYesReserve = yesReserve;
  let currentNoReserve = noReserve;
  
  while (sharesRemaining > 0) {
    const price = outcome === 'yes'
      ? currentNoReserve / (currentYesReserve + currentNoReserve)
      : currentYesReserve / (currentYesReserve + currentNoReserve);
    
    const sharesToSellThisStep = Math.min(step, sharesRemaining);
    const usdcFromThisStep = sharesToSellThisStep * price;
    
    usdcOut += usdcFromThisStep;
    sharesRemaining -= sharesToSellThisStep;
    
    // Update reserves (add shares back, remove USDC)
    if (outcome === 'yes') {
      currentYesReserve += sharesToSellThisStep;
      currentNoReserve -= usdcFromThisStep;
    } else {
      currentNoReserve += sharesToSellThisStep;
      currentYesReserve -= usdcFromThisStep;
    }
  }
  
  const newK = currentYesReserve * currentNoReserve;
  
  return {
    sharesBought: -sharesToSell, // Negative = sold
    avgPrice: usdcOut / sharesToSell,
    newYesReserve: currentYesReserve,
    newNoReserve: currentNoReserve,
    newK,
  };
}
