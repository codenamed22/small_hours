/**
 * Tests for Scoring Functions
 */

import { describe, it, expect } from 'vitest'
import { calculateToleranceScore, scoreGrindSize, SCORING, GRIND_VALUES } from './scoring'

describe('calculateToleranceScore', () => {
  it('returns perfect score for exact match', () => {
    const score = calculateToleranceScore(200, 200, 5)
    expect(score).toBe(SCORING.PERFECT)
  })

  it('returns score within tolerance range (75-100)', () => {
    // 3°C away from ideal with 5°C tolerance
    const score = calculateToleranceScore(203, 200, 5)

    // Should be between MIN_TOLERANCE_SCORE and PERFECT
    expect(score).toBeGreaterThanOrEqual(SCORING.MIN_TOLERANCE_SCORE)
    expect(score).toBeLessThan(SCORING.PERFECT)
  })

  it('returns exactly MIN_TOLERANCE_SCORE at tolerance boundary', () => {
    // Exactly at tolerance boundary
    const score = calculateToleranceScore(205, 200, 5)
    expect(score).toBe(SCORING.MIN_TOLERANCE_SCORE)
  })

  it('penalizes values outside tolerance', () => {
    // 10°C away from ideal with 5°C tolerance (5°C excess)
    const score = calculateToleranceScore(210, 200, 5)

    // Should be less than MIN_TOLERANCE_SCORE
    expect(score).toBeLessThan(SCORING.MIN_TOLERANCE_SCORE)
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('returns 0 for extreme deviations', () => {
    // 100°C away with 5°C tolerance = 95°C excess
    // Penalty: 95 * 15 = 1425 (capped at 75)
    // Score: 75 - 75 = 0
    const score = calculateToleranceScore(300, 200, 5)
    expect(score).toBe(0)
  })

  it('handles negative differences (below ideal)', () => {
    const score1 = calculateToleranceScore(197, 200, 5)
    const score2 = calculateToleranceScore(203, 200, 5)

    // Scores should be symmetric
    expect(score1).toBe(score2)
  })

  it('linear interpolation within tolerance', () => {
    const ideal = 200
    const tolerance = 10

    // Halfway to tolerance
    const score1 = calculateToleranceScore(205, ideal, tolerance)
    // At tolerance boundary
    const score2 = calculateToleranceScore(210, ideal, tolerance)

    expect(score1).toBeGreaterThan(score2)
    expect(score2).toBe(SCORING.MIN_TOLERANCE_SCORE)
  })
})

describe('scoreGrindSize', () => {
  it('returns perfect score for exact match', () => {
    const score = scoreGrindSize('medium', 'medium')
    expect(score).toBe(SCORING.GRIND_PERFECT)
  })

  it('returns GRIND_ONE_OFF for one step away', () => {
    const score1 = scoreGrindSize('medium', 'medium-fine')
    const score2 = scoreGrindSize('medium', 'medium-coarse')

    expect(score1).toBe(SCORING.GRIND_ONE_OFF)
    expect(score2).toBe(SCORING.GRIND_ONE_OFF)
  })

  it('returns GRIND_TWO_OFF for two steps away', () => {
    const score1 = scoreGrindSize('medium', 'fine')
    const score2 = scoreGrindSize('medium', 'coarse')

    expect(score1).toBe(SCORING.GRIND_TWO_OFF)
    expect(score2).toBe(SCORING.GRIND_TWO_OFF)
  })

  it('returns GRIND_WAY_OFF for three+ steps away', () => {
    const score1 = scoreGrindSize('fine', 'coarse')
    const score2 = scoreGrindSize('coarse', 'fine')

    expect(score1).toBe(SCORING.GRIND_WAY_OFF)
    expect(score2).toBe(SCORING.GRIND_WAY_OFF)
  })

  it('handles all grind size combinations correctly', () => {
    const grinds: Array<'coarse' | 'medium-coarse' | 'medium' | 'medium-fine' | 'fine'> = [
      'coarse',
      'medium-coarse',
      'medium',
      'medium-fine',
      'fine'
    ]

    grinds.forEach((ideal) => {
      grinds.forEach((actual) => {
        const score = scoreGrindSize(actual, ideal)

        // Score should always be valid
        expect(score).toBeGreaterThanOrEqual(SCORING.GRIND_WAY_OFF)
        expect(score).toBeLessThanOrEqual(SCORING.GRIND_PERFECT)

        // Exact match should always be perfect
        if (actual === ideal) {
          expect(score).toBe(SCORING.GRIND_PERFECT)
        }
      })
    })
  })
})

describe('GRIND_VALUES mapping', () => {
  it('has correct ordering (coarse to fine)', () => {
    expect(GRIND_VALUES.coarse).toBe(1)
    expect(GRIND_VALUES['medium-coarse']).toBe(2)
    expect(GRIND_VALUES.medium).toBe(3)
    expect(GRIND_VALUES['medium-fine']).toBe(4)
    expect(GRIND_VALUES.fine).toBe(5)
  })

  it('values are sequential', () => {
    const values = Object.values(GRIND_VALUES)
    expect(values).toEqual([1, 2, 3, 4, 5])
  })
})

describe('SCORING constants', () => {
  it('has consistent thresholds', () => {
    expect(SCORING.EXCELLENT_THRESHOLD).toBeGreaterThan(SCORING.GOOD_THRESHOLD)
    expect(SCORING.GOOD_THRESHOLD).toBeGreaterThan(SCORING.ACCEPTABLE_THRESHOLD)
    expect(SCORING.ACCEPTABLE_THRESHOLD).toBeGreaterThan(SCORING.DECENT_THRESHOLD)
    expect(SCORING.DECENT_THRESHOLD).toBeGreaterThan(SCORING.POOR_THRESHOLD)
  })

  it('tolerance scoring adds up correctly', () => {
    const total = SCORING.MIN_TOLERANCE_SCORE + SCORING.MAX_TOLERANCE_BONUS
    expect(total).toBe(SCORING.PERFECT)
  })

  it('grind scores are descending', () => {
    expect(SCORING.GRIND_PERFECT).toBeGreaterThan(SCORING.GRIND_ONE_OFF)
    expect(SCORING.GRIND_ONE_OFF).toBeGreaterThan(SCORING.GRIND_TWO_OFF)
    expect(SCORING.GRIND_TWO_OFF).toBeGreaterThan(SCORING.GRIND_WAY_OFF)
  })
})
