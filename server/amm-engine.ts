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
    return noReserve / total;
  } else {
    return yesReserve / total;
  }
}

/**
 * Execute a buy trade in the AMM
 * Handles both zero-liquidity initialization and normal trades
 * 
 * @param usdcIn Amount of USDC to spend
 * @param outcome 'yes' or 'no'
 * @param currentState Current AMM reserves
 * @returns Trade result with shares bought and new state
 */
export function buyShares(
  usdcIn: number,
  outcome: 'yes' | 'no',
  currentState: AMMState
): TradeResult {
  let { yesReserve, noReserve, k } = currentState;
  
  // CASE 1: Zero liquidity - first trade initializes the market
  if (yesReserve === 0 && noReserve === 0) {
    return initializeMarket(usdcIn, outcome);
  }
  
  // CASE 2: Normal trade with existing liquidity
  return executeTradeWithCPMM(usdcIn, outcome, yesReserve, noReserve, k);
}

/**
 * Initialize market with first trade
 * First trader gets shares at ~1:1 ratio and sets initial reserves
 */
function initializeMarket(usdcIn: number, outcome: 'yes' | 'no'): TradeResult {
  if (outcome === 'yes') {
    return {
      sharesBought: usdcIn,
      avgPrice: 1.0,
      newYesReserve: usdcIn,
      newNoReserve: EPSILON, // Small amount to avoid div/0
      newK: usdcIn * EPSILON,
    };
  } else {
    return {
      sharesBought: usdcIn,
      avgPrice: 1.0,
      newYesReserve: EPSILON,
      newNoReserve: usdcIn,
      newK: usdcIn * EPSILON,
    };
  }
}

/**
 * Execute trade using Constant Product Market Maker formula
 * Simulates buying along the bonding curve
 */
function executeTradeWithCPMM(
  usdcIn: number,
  outcome: 'yes' | 'no',
  yesReserve: number,
  noReserve: number,
  k: number
): TradeResult {
  let sharesBought = 0;
  let totalCost = 0;
  const step = 0.01; // Granularity for curve simulation
  
  let currentYesReserve = yesReserve;
  let currentNoReserve = noReserve;
  
  // Buy shares incrementally along the curve
  while (totalCost < usdcIn) {
    const price = outcome === 'yes'
      ? currentNoReserve / (currentYesReserve + currentNoReserve)
      : currentYesReserve / (currentYesReserve + currentNoReserve);
    
    const costForThisStep = price * step;
    
    // Check if we can afford this step
    if (totalCost + costForThisStep > usdcIn) {
      // Partial step - use remaining budget
      const remaining = usdcIn - totalCost;
      const partialShares = remaining / price;
      sharesBought += partialShares;
      totalCost = usdcIn;
      
      // Update reserves for partial step
      if (outcome === 'yes') {
        currentYesReserve -= partialShares;
        currentNoReserve += remaining;
      } else {
        currentNoReserve -= partialShares;
        currentYesReserve += remaining;
      }
      break;
    }
    
    // Full step
    sharesBought += step;
    totalCost += costForThisStep;
    
    // Update reserves (swap USDC for shares)
    if (outcome === 'yes') {
      currentYesReserve -= step;
      currentNoReserve += costForThisStep;
    } else {
      currentNoReserve -= step;
      currentYesReserve += costForThisStep;
    }
  }
  
  // Calculate new k (should be approximately maintained)
  const newK = currentYesReserve * currentNoReserve;
  const avgPrice = totalCost / sharesBought;
  
  return {
    sharesBought,
    avgPrice,
    newYesReserve: currentYesReserve,
    newNoReserve: currentNoReserve,
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
