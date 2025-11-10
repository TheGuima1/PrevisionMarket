/**
 * Mirror State Manager
 * Manages freeze/unfreeze logic for volatile market odds
 * 
 * FREEZE LOGIC:
 * - If odds change ≥5% (0.05) from lastStableYes → FREEZE display at lastStable
 * - UNFREEZE when:
 *   1. 2 consecutive readings are within 5% threshold, OR
 *   2. 120 seconds elapsed (fail-safe timeout)
 */

export interface MirrorMarket {
  slug: string;
  title: string;
  volumeUsd?: number;
  
  // Raw probabilities from source (always updated)
  probYes_raw: number;
  probNo_raw: number;
  
  // Display probabilities (frozen when volatile)
  probYes_display: number;
  probNo_display: number;
  
  // Freeze state
  frozen: boolean;
  freezeReason?: 'SPIKE' | 'MANUAL';
  lastStableYes: number;
  lastUpdate: number;
  
  // Internal counters (not exposed via API)
  __stableCount?: number;
  __frozenAt?: number;
  __previousRaw?: number;      // Track previous raw reading for consecutive comparison
  __plateauAnchor?: number;     // Candidate new plateau price
  __plateauConfirmed?: boolean; // Whether plateau anchor has been seeded
}

export interface MirrorSnapshot {
  markets: Record<string, MirrorMarket>;
  updatedAt: number;
}

// Freeze configuration from env
const SPIKE_THRESHOLD = Number(process.env.MIRROR_SPIKE_THRESHOLD || 0.05); // 5%
const STABILIZE_NEED = Number(process.env.MIRROR_STABILIZE_NEED || 2); // 2 consecutive stable readings
const FAILSAFE_SEC = Number(process.env.MIRROR_FAILSAFE_SEC || 120); // 120s timeout

// In-memory state (could be Redis in production)
const state: MirrorSnapshot = {
  markets: {},
  updatedAt: Date.now(),
};

/**
 * Check if price change exceeds spike threshold
 */
function shouldFreeze(prevStableYes: number, newYes: number): boolean {
  const delta = Math.abs(newYes - prevStableYes);
  return delta >= SPIKE_THRESHOLD;
}

/**
 * Get current snapshot (read-only)
 */
export function getSnapshot(): MirrorSnapshot {
  return state;
}

/**
 * Upsert market with freeze/unfreeze logic
 */
export function upsertMarket(
  slug: string,
  payload: {
    title: string;
    probYes_raw: number;
    volumeUsd?: number;
  }
): void {
  const now = Date.now();
  const prev = state.markets[slug];
  
  // NEW MARKET: Initialize with raw values
  if (!prev) {
    state.markets[slug] = {
      slug,
      title: payload.title,
      volumeUsd: payload.volumeUsd,
      probYes_raw: payload.probYes_raw,
      probNo_raw: 1 - payload.probYes_raw,
      probYes_display: payload.probYes_raw,
      probNo_display: 1 - payload.probYes_raw,
      frozen: false,
      lastStableYes: payload.probYes_raw,
      lastUpdate: now,
    };
    state.updatedAt = now;
    console.log(`[Mirror State] ✓ Initialized ${slug} at ${(payload.probYes_raw * 100).toFixed(1)}% YES`);
    return;
  }
  
  // UPDATE EXISTING MARKET
  prev.probYes_raw = payload.probYes_raw;
  prev.probNo_raw = 1 - payload.probYes_raw;
  prev.volumeUsd = payload.volumeUsd;
  prev.title = payload.title; // Update title if changed
  prev.lastUpdate = now;
  
  // FREEZE LOGIC
  if (!prev.frozen) {
    // Currently UNFROZEN: Check if we should freeze
    if (shouldFreeze(prev.lastStableYes, payload.probYes_raw)) {
      // SPIKE DETECTED! Freeze display at last stable value
      prev.frozen = true;
      prev.freezeReason = 'SPIKE';
      prev.probYes_display = prev.lastStableYes;
      prev.probNo_display = 1 - prev.lastStableYes;
      prev.__stableCount = 0;
      prev.__frozenAt = now;
      
      const delta = Math.abs(payload.probYes_raw - prev.lastStableYes);
      console.log(`[Mirror State] ❄️ FREEZE ${slug}: ${(prev.lastStableYes * 100).toFixed(1)}% → ${(payload.probYes_raw * 100).toFixed(1)}% (Δ${(delta * 100).toFixed(1)}%)`);
    } else {
      // No spike: Update display and lastStable
      prev.probYes_display = payload.probYes_raw;
      prev.probNo_display = 1 - payload.probYes_raw;
      prev.lastStableYes = payload.probYes_raw;
    }
  } else {
    // Currently FROZEN: Dual-path stability check
    // Path A: Reversion to anchor (back to pre-spike price)
    // Path B: New plateau (sustained new price level)
    const prevRaw = prev.__previousRaw ?? prev.lastStableYes;
    const deltaFromPrevious = Math.abs(payload.probYes_raw - prevRaw);
    const deltaFromAnchor = Math.abs(payload.probYes_raw - prev.lastStableYes);
    
    // Seed plateau anchor on first stable reading far from anchor
    if (!prev.__plateauConfirmed && deltaFromPrevious < SPIKE_THRESHOLD && deltaFromAnchor >= SPIKE_THRESHOLD) {
      prev.__plateauAnchor = payload.probYes_raw;
      prev.__plateauConfirmed = true;
    }
    
    // Check stability via dual paths
    let isStable = false;
    
    if (deltaFromPrevious < SPIKE_THRESHOLD) {
      // Consecutive readings are stable, check which path qualifies
      if (deltaFromAnchor < SPIKE_THRESHOLD) {
        // Path A: Reverting to anchor
        isStable = true;
      } else if (prev.__plateauConfirmed && prev.__plateauAnchor !== undefined) {
        const deltaFromPlateau = Math.abs(payload.probYes_raw - prev.__plateauAnchor);
        if (deltaFromPlateau < SPIKE_THRESHOLD) {
          // Path B: Converging on new plateau
          isStable = true;
        }
      }
    }
    
    if (isStable) {
      prev.__stableCount = (prev.__stableCount || 0) + 1;
    } else {
      prev.__stableCount = 0; // Reset counter
      // Reset plateau if:
      // 1. Consecutive delta violated (oscillation), OR
      // 2. Drift beyond plateau threshold (gradual drift requires reseeding)
      const shouldResetPlateau = deltaFromPrevious >= SPIKE_THRESHOLD || 
        (prev.__plateauConfirmed && prev.__plateauAnchor !== undefined && 
         Math.abs(payload.probYes_raw - prev.__plateauAnchor) >= SPIKE_THRESHOLD);
      
      if (shouldResetPlateau) {
        prev.__plateauConfirmed = false;
        prev.__plateauAnchor = undefined;
      }
    }
    
    // Update previous raw for next comparison
    prev.__previousRaw = payload.probYes_raw;
    
    const elapsed = (now - (prev.__frozenAt || now)) / 1000;
    
    // UNFREEZE CONDITIONS:
    // 1. N consecutive stable readings (via either path), OR
    // 2. Fail-safe timeout
    if ((prev.__stableCount || 0) >= STABILIZE_NEED || elapsed >= FAILSAFE_SEC) {
      const reason = elapsed >= FAILSAFE_SEC ? 'TIMEOUT' : 'STABILIZED';
      prev.frozen = false;
      prev.freezeReason = undefined;
      prev.probYes_display = payload.probYes_raw;
      prev.probNo_display = 1 - payload.probYes_raw;
      prev.lastStableYes = payload.probYes_raw;
      delete prev.__stableCount;
      delete prev.__frozenAt;
      delete prev.__previousRaw;
      delete prev.__plateauAnchor;
      delete prev.__plateauConfirmed;
      
      console.log(`[Mirror State] 🔥 UNFREEZE ${slug}: ${reason} at ${(payload.probYes_raw * 100).toFixed(1)}% YES`);
    } else {
      // Still frozen: Display stays at lastStable
      prev.probYes_display = prev.lastStableYes;
      prev.probNo_display = 1 - prev.lastStableYes;
    }
  }
  
  state.updatedAt = now;
}

/**
 * Manually freeze a market (admin use)
 */
export function freezeMarket(slug: string): void {
  const market = state.markets[slug];
  if (market && !market.frozen) {
    market.frozen = true;
    market.freezeReason = 'MANUAL';
    market.probYes_display = market.lastStableYes;
    market.probNo_display = 1 - market.lastStableYes;
    console.log(`[Mirror State] ❄️ MANUAL FREEZE ${slug}`);
  }
}

/**
 * Manually unfreeze a market (admin use)
 */
export function unfreezeMarket(slug: string): void {
  const market = state.markets[slug];
  if (market && market.frozen) {
    market.frozen = false;
    market.freezeReason = undefined;
    market.probYes_display = market.probYes_raw;
    market.probNo_display = market.probNo_raw;
    market.lastStableYes = market.probYes_raw;
    delete market.__stableCount;
    delete market.__frozenAt;
    console.log(`[Mirror State] 🔥 MANUAL UNFREEZE ${slug}`);
  }
}
