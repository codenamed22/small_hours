/**
 * Game Engine for Small Hours - Production-Grade Rule-Based Brewing System
 *
 * Architecture:
 * - Facts: Immutable brew parameters and context
 * - Rules: Pure functions with explicit dependencies (defined in recipes.ts)
 * - Scoring: Compositional with validation (defined in scoring.ts)
 * - No side effects, fully testable
 */

import type {
  DrinkType,
  BrewParameters,
  Condition,
  ConditionValue,
  RuleContext,
  Rule,
  DrinkRecipe,
  BrewResult,
  Customer,
  GameState,
} from "./types";

import { RECIPES } from "./recipes";
import { SCORING } from "./scoring";
import { createInventory } from "./inventory";
import { createQueueState } from "./ticketing";
import { createMemoryState } from "./customer-memory";
import { createDayState } from "./day-structure";

// ============================================================================
// CONSTANTS - Configuration constants for the game
// ============================================================================

export const TEMP_RANGE = {
  MIN: 77,
  MAX: 100,
} as const;

export const BREW_TIME_RANGE = {
  ESPRESSO_MIN: 15,
  ESPRESSO_MAX: 35,
  BREW_MIN: 30,
  BREW_MAX: 240,
} as const;

export const MILK_RANGE = {
  TEMP_MIN: 49,
  TEMP_MAX: 82,
  FOAM_MIN: 0,
  FOAM_MAX: 100,
} as const;

export const BLOOM_RANGE = {
  MIN: 15,
  MAX: 60,
} as const;

// ============================================================================
// RE-EXPORT TYPES AND CONSTANTS FOR BACKWARDS COMPATIBILITY
// ============================================================================

// Re-export scoring constants
export { SCORING, GRIND_VALUES, calculateToleranceScore, scoreGrindSize } from "./scoring";

export type {
  GrindSize,
  DrinkType,
  DrinkCategory,
  MilkType,
  BrewParameters,
  ComparisonOperator,
  ConditionValue,
  Condition,
  RuleContext,
  ScoringFunction,
  Rule,
  DrinkRecipe,
  BrewResult,
  Customer,
  GameState,
} from "./types";

// Re-export RECIPES for UI consumption
export { RECIPES } from "./recipes";

// Re-export inventory functions for UI consumption
export {
  checkStock,
  depleteStock,
  getTotalBeans,
  getAvailableMilkTypes,
  getLowStockWarnings,
  addStock,
} from "./inventory";
export type { StockCheckResult } from "./inventory";

// Re-export LLM functions for UI consumption
export {
  generateCustomer,
  generateDrinkReaction,
  generateCustomerGreeting,
} from "./llm";

// Re-export function calling system
export {
  TOOLS,
  executeFunctionCall,
  parseOrder,
  createTicket,
  checkAllergens,
  completeOrder,
} from "./function-calling";
export type {
  ParsedOrder,
  OrderTicket,
  AllergenCheckResult,
  OrderCompletion,
} from "./function-calling";

// Re-export ticketing system
export {
  createQueueState,
  addTicket,
  getNextTicket,
  startTicket,
  completeTicket,
  cancelTicket,
  getTicket,
  getActiveTicket,
  getPendingTickets,
  getCompletedTickets,
  getEstimatedWaitTime,
  clearCompleted,
  resetQueue,
  getQueueStats,
} from "./ticketing";
export type { QueueStats } from "./ticketing";

// Re-export customer memory system
export {
  createMemoryState,
  getCustomer,
  isReturningCustomer,
  recordVisit,
  addNote,
  getFavoriteDrink,
  getRegularCustomers,
  getCustomerInsights,
  calculateReturningRate,
  getMemoryStats,
} from "./customer-memory";
export type {
  RelationshipLevel,
  MemoryStats,
} from "./customer-memory";

// Re-export day structure system
export {
  createDayState,
  startService,
  endService,
  startNewDay,
  recordCustomer,
  restockInventory,
  getRestockCost,
  getDaySummary,
  getPerformanceEmoji,
  getPerformanceDescription,
} from "./day-structure";
export type {
  DayPhase,
  DayStats,
  DayState,
  DaySummary,
} from "./day-structure";

// ============================================================================
// VALIDATION - Ensure data integrity
// ============================================================================

function validateBrewParameters(params: BrewParameters): void {
  if (params.temperature < TEMP_RANGE.MIN || params.temperature > TEMP_RANGE.MAX) {
    throw new Error(`Temperature ${params.temperature}°C out of range [${TEMP_RANGE.MIN}-${TEMP_RANGE.MAX}]`);
  }

  if (params.brewTime < 0) {
    throw new Error(`Brew time cannot be negative: ${params.brewTime}s`);
  }

  if (params.milkTemp !== undefined) {
    if (params.milkTemp < MILK_RANGE.TEMP_MIN || params.milkTemp > MILK_RANGE.TEMP_MAX) {
      throw new Error(`Milk temperature ${params.milkTemp}°C out of range [${MILK_RANGE.TEMP_MIN}-${MILK_RANGE.TEMP_MAX}]`);
    }
  }

  if (params.foamAmount !== undefined) {
    if (params.foamAmount < MILK_RANGE.FOAM_MIN || params.foamAmount > MILK_RANGE.FOAM_MAX) {
      throw new Error(`Foam amount ${params.foamAmount}% out of range [${MILK_RANGE.FOAM_MIN}-${MILK_RANGE.FOAM_MAX}]`);
    }
  }
}

function validateRuleWeights(recipe: DrinkRecipe): void {
  const totalWeight = recipe.rules.reduce((sum, rule) => sum + rule.weight, 0);
  const epsilon = 0.001; // Floating point tolerance

  if (Math.abs(totalWeight - 1.0) > epsilon) {
    throw new Error(
      `Recipe "${recipe.name}" rule weights sum to ${totalWeight.toFixed(3)}, must be 1.0. ` +
      `Rules: ${recipe.rules.map(r => `${r.id}=${r.weight}`).join(', ')}`
    );
  }
}

// ============================================================================
// RULE ENGINE - Pattern matching and evaluation
// ============================================================================

function evaluateCondition(
  condition: Condition,
  params: BrewParameters,
  context: RuleContext
): boolean {
  let actualValue: ConditionValue | undefined;

  // Extract value from params or context
  if (condition.parameter === "drinkType") {
    actualValue = context.drinkType;
  } else if (condition.parameter === "drinkCategory") {
    actualValue = context.drinkCategory;
  } else {
    actualValue = params[condition.parameter];
  }

  // Undefined optional parameters don't match
  if (actualValue === undefined) return false;

  // Evaluate based on operator
  switch (condition.operator) {
    case "equals":
      return actualValue === condition.value;
    case "not_equals":
      return actualValue !== condition.value;
    case "less_than":
      return typeof actualValue === "number" && actualValue < (condition.value as number);
    case "greater_than":
      return typeof actualValue === "number" && actualValue > (condition.value as number);
    case "range":
      if (typeof actualValue !== "number" || typeof condition.value !== "number") {
        return false;
      }
      const tolerance = condition.tolerance ?? 0;
      const diff = Math.abs(actualValue - condition.value);
      return diff <= tolerance;
    default:
      return false;
  }
}

function evaluateRule(
  rule: Rule,
  params: BrewParameters,
  context: RuleContext
): boolean {
  return rule.conditions.every(condition =>
    evaluateCondition(condition, params, context)
  );
}

// ============================================================================
// MODULE INITIALIZATION
// ============================================================================

// Validate all recipes at module load time
Object.values(RECIPES).forEach(validateRuleWeights);

// ============================================================================
// BREWING ENGINE - Main execution pipeline
// ============================================================================

export function brewDrink(
  drinkType: DrinkType,
  params: BrewParameters
): BrewResult {
  // Validate inputs
  validateBrewParameters(params);

  const recipe = RECIPES[drinkType];
  const context: RuleContext = {
    drinkType,
    drinkCategory: recipe.category,
    recipe
  };

  // Filter applicable rules
  const applicableRules = recipe.rules.filter(rule =>
    evaluateRule(rule, params, context)
  );

  // Calculate weighted scores
  const breakdown: Record<string, number> = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;

  applicableRules.forEach(rule => {
    const score = rule.score(params, context);
    breakdown[rule.name] = Math.round(score);
    totalWeightedScore += score * rule.weight;
    totalWeight += rule.weight;
  });

  // Normalize quality score
  const quality = totalWeight > 0
    ? Math.round(totalWeightedScore / totalWeight)
    : 0;

  // Generate feedback
  const feedback = generateFeedback(quality, drinkType);

  return {
    quality,
    breakdown,
    feedback,
    appliedRules: applicableRules.map(r => r.id)
  };
}

function generateFeedback(quality: number, drinkType: DrinkType): string {
  const drinkName = RECIPES[drinkType].name;

  if (quality >= SCORING.EXCELLENT_THRESHOLD) {
    return `Perfect ${drinkName}. Your customer is delighted.`;
  } else if (quality >= SCORING.GOOD_THRESHOLD) {
    return `Well-crafted ${drinkName}. Very close to ideal.`;
  } else if (quality >= SCORING.ACCEPTABLE_THRESHOLD) {
    return `Good ${drinkName}. Solid technique with minor issues.`;
  } else if (quality >= SCORING.DECENT_THRESHOLD) {
    return `Acceptable ${drinkName}, but could use improvement.`;
  } else if (quality >= SCORING.POOR_THRESHOLD) {
    return `Below average ${drinkName}. Check your parameters.`;
  } else {
    return `Poor ${drinkName}. Way off the mark.`;
  }
}

// ============================================================================
// GAME STATE HELPERS
// ============================================================================

export function createInitialState(): GameState {
  return {
    customer: null,
    brewParams: getDefaultParameters("espresso"),
    result: null,
    money: 0,
    drinksServed: 0,
    inventory: createInventory(),
    queue: createQueueState(),
    customerMemory: createMemoryState(),
    dayState: createDayState(),
  };
}

/**
 * Get default parameters optimized for a specific drink type
 */
export function getDefaultParameters(drinkType: DrinkType): BrewParameters {
  const recipe = RECIPES[drinkType];

  const baseParams: BrewParameters = {
    grindSize: "medium",
    temperature: 91,
    brewTime: recipe.category === "espresso-based" ? 25 : 90,
  };

  // Add milk parameters if needed
  if (recipe.category === "espresso-based" && drinkType !== "espresso") {
    baseParams.milkType = "whole";
    baseParams.milkTemp = 66;
    baseParams.foamAmount = 30;
  }

  // Add pour-over parameters if needed
  if (recipe.category === "pour-over") {
    baseParams.bloomTime = 30;
  }

  return baseParams;
}

export function createStaticCustomer(drinkType: DrinkType = "espresso"): Customer {
  const drinks: Record<DrinkType, { order: string; payment: number }> = {
    espresso: { order: "One espresso, please", payment: 3 },
    latte: { order: "I'll have a latte, please", payment: 4.5 },
    cappuccino: { order: "Cappuccino, extra foam!", payment: 4.5 },
    pourover: { order: "Pour over, take your time", payment: 5 },
    aeropress: { order: "Aeropress, medium roast", payment: 4 }
  };

  const drink = drinks[drinkType];

  return {
    name: "Alex",
    order: drink.order,
    drinkType,
    payment: drink.payment,
  };
}

/**
 * Get required parameters for a drink type
 */
export function getRequiredParameters(drinkType: DrinkType): (keyof BrewParameters)[] {
  const recipe = RECIPES[drinkType];
  const base: (keyof BrewParameters)[] = ["grindSize", "temperature", "brewTime"];

  if (recipe.category === "espresso-based" && drinkType !== "espresso") {
    base.push("milkType", "milkTemp", "foamAmount");
  }

  if (recipe.category === "pour-over") {
    base.push("bloomTime");
  }

  return base;
}
