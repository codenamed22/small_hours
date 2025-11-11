/**
 * Day Structure System
 *
 * Manages the daily cycle of the cafe:
 * - Prep: Morning setup and inventory management
 * - Service: Active customer service
 * - Debrief: End of day review and earnings
 */

import type { Inventory } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export type DayPhase = "prep" | "service" | "debrief";

export interface DayStats {
  customersServed: number;
  totalEarnings: number;
  averageQuality: number;
  qualityScores: number[];
  returningCustomers: number;
  newCustomers: number;
  regularCustomers: number;
  drinksBrewedByType: Record<string, number>;
}

export interface DayState {
  dayNumber: number;
  phase: DayPhase;
  stats: DayStats;
  openTime: number | null;
  closeTime: number | null;
  targetCustomers: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TARGET_CUSTOMERS = 20;
const BASE_RESTOCK_AMOUNT = 500; // grams of beans
const BASE_MILK_RESTOCK = 2000; // ml per type

// ============================================================================
// DAY INITIALIZATION
// ============================================================================

/**
 * Create initial day state
 */
export function createDayState(): DayState {
  return {
    dayNumber: 1,
    phase: "prep",
    stats: createEmptyStats(),
    openTime: null,
    closeTime: null,
    targetCustomers: DEFAULT_TARGET_CUSTOMERS,
  };
}

/**
 * Create empty daily stats
 */
function createEmptyStats(): DayStats {
  return {
    customersServed: 0,
    totalEarnings: 0,
    averageQuality: 0,
    qualityScores: [],
    returningCustomers: 0,
    newCustomers: 0,
    regularCustomers: 0,
    drinksBrewedByType: {},
  };
}

// ============================================================================
// PHASE TRANSITIONS
// ============================================================================

/**
 * Start service phase (open cafe)
 */
export function startService(state: DayState): DayState {
  if (state.phase !== "prep") {
    throw new Error("Can only start service from prep phase");
  }

  return {
    ...state,
    phase: "service",
    openTime: Date.now(),
  };
}

/**
 * End service phase (close cafe)
 */
export function endService(state: DayState): DayState {
  if (state.phase !== "service") {
    throw new Error("Can only end service from service phase");
  }

  return {
    ...state,
    phase: "debrief",
    closeTime: Date.now(),
  };
}

/**
 * Start new day (from debrief)
 */
export function startNewDay(state: DayState): DayState {
  if (state.phase !== "debrief") {
    throw new Error("Can only start new day from debrief phase");
  }

  return {
    ...state,
    dayNumber: state.dayNumber + 1,
    phase: "prep",
    stats: createEmptyStats(),
    openTime: null,
    closeTime: null,
    targetCustomers: calculateTargetCustomers(state.dayNumber + 1),
  };
}

/**
 * Calculate target customers for a day (increases with progression)
 */
function calculateTargetCustomers(dayNumber: number): number {
  // Start at 20, increase by 2 every day, cap at 50
  const target = DEFAULT_TARGET_CUSTOMERS + (dayNumber - 1) * 2;
  return Math.min(target, 50);
}

// ============================================================================
// STATS TRACKING
// ============================================================================

/**
 * Record a customer order
 */
export function recordCustomer(
  state: DayState,
  data: {
    earnings: number;
    quality: number;
    isReturning: boolean;
    isRegular: boolean;
    drinkType: string;
  }
): DayState {
  if (state.phase !== "service") {
    console.warn("Can only record customers during service phase");
    return state;
  }

  const newQualityScores = [...state.stats.qualityScores, data.quality];
  const newAverageQuality =
    newQualityScores.reduce((sum, q) => sum + q, 0) / newQualityScores.length;

  const newDrinksBrewedByType = { ...state.stats.drinksBrewedByType };
  newDrinksBrewedByType[data.drinkType] = (newDrinksBrewedByType[data.drinkType] || 0) + 1;

  return {
    ...state,
    stats: {
      ...state.stats,
      customersServed: state.stats.customersServed + 1,
      totalEarnings: state.stats.totalEarnings + data.earnings,
      averageQuality: Math.round(newAverageQuality),
      qualityScores: newQualityScores,
      returningCustomers: data.isReturning
        ? state.stats.returningCustomers + 1
        : state.stats.returningCustomers,
      newCustomers: !data.isReturning
        ? state.stats.newCustomers + 1
        : state.stats.newCustomers,
      regularCustomers: data.isRegular
        ? state.stats.regularCustomers + 1
        : state.stats.regularCustomers,
      drinksBrewedByType: newDrinksBrewedByType,
    },
  };
}

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

/**
 * Calculate restock cost based on day number
 */
export function getRestockCost(dayNumber: number): number {
  // Base cost increases slightly each day
  const baseCost = 50;
  const dailyIncrease = 5;
  return baseCost + (dayNumber - 1) * dailyIncrease;
}

/**
 * Restock inventory for new day
 */
export function restockInventory(inventory: Inventory, dayNumber: number): Inventory {
  // Add beans to first bean stock
  const newBeans = [...inventory.beans];
  if (newBeans.length > 0) {
    newBeans[0] = {
      ...newBeans[0],
      grams: newBeans[0].grams + BASE_RESTOCK_AMOUNT,
    };
  }

  // Restock all milk types
  const newMilks = { ...inventory.milks };
  Object.keys(newMilks).forEach((milkType) => {
    if (milkType !== "none") {
      newMilks[milkType as keyof typeof newMilks] += BASE_MILK_RESTOCK;
    }
  });

  return {
    ...inventory,
    beans: newBeans,
    milks: newMilks,
  };
}

// ============================================================================
// DAY SUMMARY
// ============================================================================

export interface DaySummary {
  dayNumber: number;
  customersServed: number;
  targetCustomers: number;
  totalEarnings: number;
  averageQuality: number;
  returningRate: number;
  topDrink: string | null;
  performance: "excellent" | "good" | "fair" | "poor";
  hoursOpen: number;
}

/**
 * Generate end of day summary
 */
export function getDaySummary(state: DayState): DaySummary {
  const { stats, dayNumber, targetCustomers, openTime, closeTime } = state;

  // Calculate hours open
  let hoursOpen = 0;
  if (openTime && closeTime) {
    hoursOpen = (closeTime - openTime) / (1000 * 60 * 60);
  }

  // Calculate returning rate
  const totalCustomers = stats.customersServed;
  const returningRate =
    totalCustomers > 0 ? (stats.returningCustomers / totalCustomers) * 100 : 0;

  // Find top drink
  let topDrink: string | null = null;
  let maxCount = 0;
  Object.entries(stats.drinksBrewedByType).forEach(([drink, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topDrink = drink;
    }
  });

  // Calculate performance rating
  let performance: "excellent" | "good" | "fair" | "poor";
  const targetReached = stats.customersServed >= targetCustomers;
  const highQuality = stats.averageQuality >= 85;
  const goodReturningRate = returningRate >= 50;

  if (targetReached && highQuality && goodReturningRate) {
    performance = "excellent";
  } else if (targetReached && (highQuality || goodReturningRate)) {
    performance = "good";
  } else if (targetReached || highQuality) {
    performance = "fair";
  } else {
    performance = "poor";
  }

  return {
    dayNumber,
    customersServed: stats.customersServed,
    targetCustomers,
    totalEarnings: stats.totalEarnings,
    averageQuality: stats.averageQuality,
    returningRate: Math.round(returningRate),
    topDrink,
    performance,
    hoursOpen: Math.round(hoursOpen * 10) / 10,
  };
}

/**
 * Get performance emoji
 */
export function getPerformanceEmoji(performance: DaySummary["performance"]): string {
  switch (performance) {
    case "excellent":
      return "⭐";
    case "good":
      return "👍";
    case "fair":
      return "👌";
    case "poor":
      return "📉";
  }
}

/**
 * Get performance description
 */
export function getPerformanceDescription(performance: DaySummary["performance"]): string {
  switch (performance) {
    case "excellent":
      return "Outstanding day! Keep up the great work.";
    case "good":
      return "Solid performance. Room for improvement.";
    case "fair":
      return "Decent day, but could be better.";
    case "poor":
      return "Challenging day. Focus on quality and customer satisfaction.";
  }
}
