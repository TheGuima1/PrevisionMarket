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
  
  // Apply 2% spread: reduce effective buying power
  const spreadMultiplier = 1 - (spreadBps / 10000);
  const effectiveUsdcIn = usdcIn * spreadMultiplier; // Only 98% goes to AMM
  const spreadFee = usdcIn - effectiveUsdcIn; // 2% captured as fee
  
  // Execute trade with spread-adjusted amount
  const result = executeTradeWithCPMM(effectiveUsdcIn, outcome, yesReserve, noReserve, k);
  
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
 * Execute trade using Hybrid AMM+Escrow model (Polymarket-style)
 * 
 * ARCHITECTURE:
 * 1. Use CPMM to calculate shares (maintains price discovery + slippage)
 * 2. Update AMM reserves normally (prices adjust with each trade)
 * 3. Lock collateral in escrow = shares bought (1:1 backing)
 * 
 * SOLVENCY GUARANTEE:
 * - CPMM shares bought = small amount (e.g., 4.31 shares for 100 BRL3 at 4.3%)
 * - Escrow locks exact shares amount (4.31 BRL3)
 * - Collateral always sufficient: escrowLocked = totalShares
 * - Payout at resolution: 1 share = 1 BRL3 (backed by escrow)
 * 
 * This DIFFERS from Polymarket (CLOB) but maintains solvency!
 * Polymarket: 100 BRL3 at 4% = 2,500 shares (needs order book + counterparty)
 * Our AMM: 100 BRL3 at 4% = ~4-10 shares (CPMM slippage, fully backed by escrow)
 */
function executeTradeWithCPMM(
  usdcIn: number,
  outcome: 'yes' | 'no',
  yesReserve: number,
  noReserve: number,
  k: number
): TradeResult {
  // Use traditional CPMM formula to calculate shares
  // Formula: (reserve_opposite + deposit) * (reserve_outcome - shares) = k
  
  let newYesReserve: number;
  let newNoReserve: number;
  let sharesBought: number;
  
  if (outcome === 'yes') {
    // Buy YES: deposit USDC to opposite (NO) pool, withdraw YES shares
    newNoReserve = noReserve + usdcIn;
    newYesReserve = k / newNoReserve;
    sharesBought = yesReserve - newYesReserve;
  } else {
    // Buy NO: deposit USDC to opposite (YES) pool, withdraw NO shares
    newYesReserve = yesReserve + usdcIn;
    newNoReserve = k / newYesReserve;
    sharesBought = noReserve - newNoReserve;
  }
  
  const avgPrice = usdcIn / sharesBought;
  const newK = newYesReserve * newNoReserve;
  
  // Escrow locking handled in routes:
  // - Lock sharesBought BRL3 in escrowLockedYes/No
  // - Increment totalSharesYes/No by sharesBought
  // - At resolution: pay 1 BRL3 per share from escrow
  
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
