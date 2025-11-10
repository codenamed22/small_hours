/**
 * Scoring Functions for Coffee Brewing Quality
 *
 * Pure, composable, testable scoring logic used by recipes
 */

import type { GrindSize } from "./types";

// ============================================================================
// SCORING CONSTANTS
// ============================================================================

export const SCORING = {
  PERFECT: 100,
  EXCELLENT_THRESHOLD: 95,
  GOOD_THRESHOLD: 85,
  ACCEPTABLE_THRESHOLD: 75,
  DECENT_THRESHOLD: 60,
  POOR_THRESHOLD: 40,

  // Tolerance scoring
  MIN_TOLERANCE_SCORE: 75,
  MAX_TOLERANCE_BONUS: 25,
  PENALTY_MULTIPLIER: 15,
  MAX_PENALTY: 75,

  // Grind scoring (categorical)
  GRIND_PERFECT: 100,
  GRIND_ONE_OFF: 70,
  GRIND_TWO_OFF: 40,
  GRIND_WAY_OFF: 10,
} as const;

export const GRIND_VALUES: Record<GrindSize, number> = {
  coarse: 1,
  "medium-coarse": 2,
  medium: 3,
  "medium-fine": 4,
  fine: 5,
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate score based on how close actual value is to ideal within tolerance
 *
 * Returns:
 * - 100 if exact match
 * - 75-100 if within tolerance (linear interpolation)
 * - 0-75 if outside tolerance (exponential decay)
 */
export function calculateToleranceScore(
  actual: number,
  ideal: number,
  tolerance: number
): number {
  const diff = Math.abs(actual - ideal);

  if (diff === 0) return SCORING.PERFECT;

  if (diff <= tolerance) {
    // Linear interpolation: 75-100 within tolerance
    const ratio = (tolerance - diff) / tolerance;
    return SCORING.MIN_TOLERANCE_SCORE + (SCORING.MAX_TOLERANCE_BONUS * ratio);
  }

  // Exponential decay outside tolerance
  const excessDiff = diff - tolerance;
  const penalty = Math.min(SCORING.MAX_PENALTY, excessDiff * SCORING.PENALTY_MULTIPLIER);
  return Math.max(0, SCORING.MIN_TOLERANCE_SCORE - penalty);
}

/**
 * Score grind size based on categorical distance from ideal
 *
 * Returns:
 * - 100 if exact match
 * - 70 if one step away (e.g., medium vs medium-fine)
 * - 40 if two steps away
 * - 10 if three+ steps away
 */
export function scoreGrindSize(actual: GrindSize, ideal: GrindSize): number {
  const actualValue = GRIND_VALUES[actual];
  const idealValue = GRIND_VALUES[ideal];
  const diff = Math.abs(actualValue - idealValue);

  if (diff === 0) return SCORING.GRIND_PERFECT;
  if (diff === 1) return SCORING.GRIND_ONE_OFF;
  if (diff === 2) return SCORING.GRIND_TWO_OFF;
  return SCORING.GRIND_WAY_OFF;
}
