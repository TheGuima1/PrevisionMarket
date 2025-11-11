/**
 * AMM Pricing Service - Unified pricing logic for preview and execution
 * 
 * MODEL:
 * - Display EXACT Polymarket odds to users (no visible spread)
 * - Charge 2% platform fee silently on execution
 * - Formula: shares = (stake - 2% fee) / polymarket_probability
 * - Payout: if wins, user gets shares × 1 BRL3
 */

export interface AMMPricingInput {
  yesReserve: number;
  noReserve: number;
  stake: number;
  outcome: 'yes' | 'no';
  platformFeeBps?: number; // Default: 200 (2%)
}

export interface AMMPricingResult {
  // Display values (what user sees)
  displayProbYes: number;  // Raw Polymarket probability (e.g., 0.135 = 13.5%)
  displayProbNo: number;
  displayOddsYes: number;  // Decimal odds (e.g., 7.41)
  displayOddsNo: number;
  
  // Execution values (after 2% fee)
  platformFee: number;     // 2% of stake
  netStake: number;        // stake - platformFee
  netShares: number;       // netStake / displayProbability
  potentialPayout: number; // netShares × 1 BRL3
  potentialProfit: number; // potentialPayout - stake
}

/**
 * Calculate unified AMM pricing
 * Shows user EXACT Polymarket odds, charges 2% silently
 */
export function calculateAMMPricing(input: AMMPricingInput): AMMPricingResult {
  const { yesReserve, noReserve, stake, outcome, platformFeeBps = 200 } = input;
  
  // Validate reserves
  if (yesReserve <= 0 || noReserve <= 0) {
    throw new Error("Invalid reserves: must be positive");
  }
  
  if (stake <= 0) {
    throw new Error("Invalid stake: must be positive");
  }
  
  // Calculate RAW Polymarket probabilities (what user sees)
  const total = yesReserve + noReserve;
  const displayProbYes = yesReserve / total;
  const displayProbNo = noReserve / total;
  
  // Calculate decimal odds (1 / probability)
  const displayOddsYes = 1 / displayProbYes;
  const displayOddsNo = 1 / displayProbNo;
  
  // Apply 2% platform fee SILENTLY (user doesn't see this)
  const platformFee = stake * (platformFeeBps / 10000);
  const netStake = stake - platformFee;
  
  // Calculate shares using DISPLAYED probability (not adjusted)
  // User sees Polymarket odds, but gets fewer shares due to silent fee
  const selectedProbability = outcome === 'yes' ? displayProbYes : displayProbNo;
  
  if (selectedProbability < 0.001) {
    throw new Error("Probability too low (< 0.1%). Market may need rebalancing.");
  }
  
  const netShares = netStake / selectedProbability;
  
  // Payout = 1 BRL3 per share if outcome wins
  const potentialPayout = netShares;
  const potentialProfit = potentialPayout - stake;
  
  return {
    displayProbYes,
    displayProbNo,
    displayOddsYes,
    displayOddsNo,
    platformFee,
    netStake,
    netShares,
    potentialPayout,
    potentialProfit,
  };
}

/**
 * Helper: capture AMM snapshot for historical charts
 */
export function createAMMSnapshot(marketId: string, yesReserve: number, noReserve: number) {
  const total = yesReserve + noReserve;
  return {
    marketId,
    yesReserve,
    noReserve,
    probYes: yesReserve / total,
    probNo: noReserve / total,
  };
}
