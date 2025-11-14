/**
 * Coffee Recipes and Brewing Rules Configuration
 *
 * This file contains all drink-specific rules and recipes.
 * Modify this file to add new drinks or adjust scoring parameters.
 */

import type {
  DrinkType,
  DrinkRecipe,
  Rule,
  BrewParameters,
  RuleContext,
  GrindSize,
} from "./types";

// Import scoring functions
import { calculateToleranceScore, scoreGrindSize } from "./scoring";

// ============================================================================
// ESPRESSO RULES - Pure espresso shot
// ============================================================================

const ESPRESSO_RULES: Rule[] = [
  {
    id: "espresso_grind",
    name: "Grind Size",
    conditions: [{ parameter: "drinkCategory", operator: "equals", value: "espresso-based" }],
    weight: 0.4,
    score: (params, context) => scoreGrindSize(params.grindSize, context.recipe.idealGrind),
    feedback: (score) => {
      if (score >= 90) return "Perfect grind size!";
      if (score >= 70) return "Grind size acceptable";
      return "Grind needs adjustment";
    }
  },
  {
    id: "espresso_temp",
    name: "Temperature",
    conditions: [{ parameter: "drinkCategory", operator: "equals", value: "espresso-based" }],
    weight: 0.3,
    score: (params, context) =>
      calculateToleranceScore(params.temperature, context.recipe.idealTemp, context.recipe.tolerances.temp)
  },
  {
    id: "espresso_time",
    name: "Brew Time",
    conditions: [{ parameter: "drinkCategory", operator: "equals", value: "espresso-based" }],
    weight: 0.3,
    score: (params, context) =>
      calculateToleranceScore(params.brewTime, context.recipe.idealBrewTime, context.recipe.tolerances.time)
  }
];

// ============================================================================
// LATTE RULES - Espresso with steamed milk, light foam
// ============================================================================

const LATTE_RULES: Rule[] = [
  {
    id: "latte_grind",
    name: "Grind Size",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "latte" }],
    weight: 0.25,
    score: (params, context) => scoreGrindSize(params.grindSize, context.recipe.idealGrind)
  },
  {
    id: "latte_espresso_temp",
    name: "Espresso Temperature",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "latte" }],
    weight: 0.2,
    score: (params, context) =>
      calculateToleranceScore(params.temperature, context.recipe.idealTemp, context.recipe.tolerances.temp)
  },
  {
    id: "latte_espresso_time",
    name: "Espresso Time",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "latte" }],
    weight: 0.15,
    score: (params, context) =>
      calculateToleranceScore(params.brewTime, context.recipe.idealBrewTime, context.recipe.tolerances.time)
  },
  {
    id: "latte_milk_temp",
    name: "Milk Temperature",
    conditions: [
      { parameter: "drinkType", operator: "equals", value: "latte" },
      { parameter: "milkType", operator: "not_equals", value: "none" }
    ],
    weight: 0.25,
    score: (params, context) => {
      if (!params.milkTemp || !context.recipe.idealMilkTemp) return 0;
      return calculateToleranceScore(
        params.milkTemp,
        context.recipe.idealMilkTemp,
        context.recipe.tolerances.milkTemp || 10
      );
    },
    feedback: (score) => score >= 90 ? "Perfect microfoam!" : "Milk temp off"
  },
  {
    id: "latte_foam",
    name: "Foam Amount",
    conditions: [
      { parameter: "drinkType", operator: "equals", value: "latte" },
      { parameter: "milkType", operator: "not_equals", value: "none" }
    ],
    weight: 0.15,
    score: (params, context) => {
      if (params.foamAmount === undefined || !context.recipe.idealFoamAmount) return 0;
      return calculateToleranceScore(
        params.foamAmount,
        context.recipe.idealFoamAmount,
        context.recipe.tolerances.foam || 15
      );
    }
  }
];

// ============================================================================
// CAPPUCCINO RULES - Equal parts espresso, milk, and foam
// ============================================================================

const CAPPUCCINO_RULES: Rule[] = [
  {
    id: "capp_grind",
    name: "Grind Size",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "cappuccino" }],
    weight: 0.25,
    score: (params, context) => scoreGrindSize(params.grindSize, context.recipe.idealGrind)
  },
  {
    id: "capp_espresso_temp",
    name: "Espresso Temperature",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "cappuccino" }],
    weight: 0.2,
    score: (params, context) =>
      calculateToleranceScore(params.temperature, context.recipe.idealTemp, context.recipe.tolerances.temp)
  },
  {
    id: "capp_espresso_time",
    name: "Espresso Time",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "cappuccino" }],
    weight: 0.15,
    score: (params, context) =>
      calculateToleranceScore(params.brewTime, context.recipe.idealBrewTime, context.recipe.tolerances.time)
  },
  {
    id: "capp_milk_temp",
    name: "Milk Temperature",
    conditions: [
      { parameter: "drinkType", operator: "equals", value: "cappuccino" },
      { parameter: "milkType", operator: "not_equals", value: "none" }
    ],
    weight: 0.2,
    score: (params, context) => {
      if (!params.milkTemp || !context.recipe.idealMilkTemp) return 0;
      return calculateToleranceScore(
        params.milkTemp,
        context.recipe.idealMilkTemp,
        context.recipe.tolerances.milkTemp || 10
      );
    }
  },
  {
    id: "capp_foam",
    name: "Foam Amount",
    conditions: [
      { parameter: "drinkType", operator: "equals", value: "cappuccino" },
      { parameter: "milkType", operator: "not_equals", value: "none" }
    ],
    weight: 0.2,
    score: (params, context) => {
      if (params.foamAmount === undefined || !context.recipe.idealFoamAmount) return 0;
      return calculateToleranceScore(
        params.foamAmount,
        context.recipe.idealFoamAmount,
        context.recipe.tolerances.foam || 15
      );
    },
    feedback: (score) => score >= 90 ? "Perfect cappuccino foam!" : "Foam needs work"
  }
];

// ============================================================================
// POUR OVER RULES - Manual drip brewing
// ============================================================================

const POUROVER_RULES: Rule[] = [
  {
    id: "pourover_grind",
    name: "Grind Size",
    conditions: [{ parameter: "drinkCategory", operator: "equals", value: "pour-over" }],
    weight: 0.35,
    score: (params, context) => scoreGrindSize(params.grindSize, context.recipe.idealGrind)
  },
  {
    id: "pourover_temp",
    name: "Water Temperature",
    conditions: [{ parameter: "drinkCategory", operator: "equals", value: "pour-over" }],
    weight: 0.25,
    score: (params, context) =>
      calculateToleranceScore(params.temperature, context.recipe.idealTemp, context.recipe.tolerances.temp)
  },
  {
    id: "pourover_bloom",
    name: "Bloom Time",
    conditions: [
      { parameter: "drinkCategory", operator: "equals", value: "pour-over" },
      { parameter: "bloomTime", operator: "greater_than", value: 0 }
    ],
    weight: 0.2,
    score: (params, context) => {
      if (!params.bloomTime || !context.recipe.idealBloomTime) return 0;
      return calculateToleranceScore(
        params.bloomTime,
        context.recipe.idealBloomTime,
        context.recipe.tolerances.bloom || 10
      );
    }
  },
  {
    id: "pourover_time",
    name: "Total Brew Time",
    conditions: [{ parameter: "drinkCategory", operator: "equals", value: "pour-over" }],
    weight: 0.2,
    score: (params, context) =>
      calculateToleranceScore(params.brewTime, context.recipe.idealBrewTime, context.recipe.tolerances.time)
  }
];

// ============================================================================
// IMMERSION RULES - Aeropress-style brewing
// ============================================================================

const IMMERSION_RULES: Rule[] = [
  {
    id: "immersion_grind",
    name: "Grind Size",
    conditions: [{ parameter: "drinkCategory", operator: "equals", value: "immersion" }],
    weight: 0.4,
    score: (params, context) => scoreGrindSize(params.grindSize, context.recipe.idealGrind)
  },
  {
    id: "immersion_temp",
    name: "Water Temperature",
    conditions: [{ parameter: "drinkCategory", operator: "equals", value: "immersion" }],
    weight: 0.3,
    score: (params, context) =>
      calculateToleranceScore(params.temperature, context.recipe.idealTemp, context.recipe.tolerances.temp)
  },
  {
    id: "immersion_time",
    name: "Steep Time",
    conditions: [{ parameter: "drinkCategory", operator: "equals", value: "immersion" }],
    weight: 0.3,
    score: (params, context) =>
      calculateToleranceScore(params.brewTime, context.recipe.idealBrewTime, context.recipe.tolerances.time)
  }
];

// ============================================================================
// MOCHA RULES - Espresso with chocolate and milk
// ============================================================================

const MOCHA_RULES: Rule[] = [
  {
    id: "mocha_grind",
    name: "Grind Size",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "mocha" }],
    weight: 0.25,
    score: (params, context) => scoreGrindSize(params.grindSize, context.recipe.idealGrind)
  },
  {
    id: "mocha_espresso_temp",
    name: "Espresso Temperature",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "mocha" }],
    weight: 0.2,
    score: (params, context) =>
      calculateToleranceScore(params.temperature, context.recipe.idealTemp, context.recipe.tolerances.temp)
  },
  {
    id: "mocha_espresso_time",
    name: "Espresso Time",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "mocha" }],
    weight: 0.15,
    score: (params, context) =>
      calculateToleranceScore(params.brewTime, context.recipe.idealBrewTime, context.recipe.tolerances.time)
  },
  {
    id: "mocha_milk_temp",
    name: "Milk Temperature",
    conditions: [
      { parameter: "drinkType", operator: "equals", value: "mocha" },
      { parameter: "milkType", operator: "not_equals", value: "none" }
    ],
    weight: 0.25,
    score: (params, context) => {
      if (!params.milkTemp || !context.recipe.idealMilkTemp) return 0;
      return calculateToleranceScore(
        params.milkTemp,
        context.recipe.idealMilkTemp,
        context.recipe.tolerances.milkTemp || 10
      );
    }
  },
  {
    id: "mocha_foam",
    name: "Foam Amount",
    conditions: [
      { parameter: "drinkType", operator: "equals", value: "mocha" },
      { parameter: "milkType", operator: "not_equals", value: "none" }
    ],
    weight: 0.15,
    score: (params, context) => {
      if (params.foamAmount === undefined || !context.recipe.idealFoamAmount) return 0;
      return calculateToleranceScore(
        params.foamAmount,
        context.recipe.idealFoamAmount,
        context.recipe.tolerances.foam || 15
      );
    }
  }
];

// ============================================================================
// AMERICANO RULES - Espresso with hot water
// ============================================================================

const AMERICANO_RULES: Rule[] = [
  {
    id: "americano_grind",
    name: "Grind Size",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "americano" }],
    weight: 0.4,
    score: (params, context) => scoreGrindSize(params.grindSize, context.recipe.idealGrind)
  },
  {
    id: "americano_temp",
    name: "Espresso Temperature",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "americano" }],
    weight: 0.3,
    score: (params, context) =>
      calculateToleranceScore(params.temperature, context.recipe.idealTemp, context.recipe.tolerances.temp)
  },
  {
    id: "americano_time",
    name: "Brew Time",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "americano" }],
    weight: 0.3,
    score: (params, context) =>
      calculateToleranceScore(params.brewTime, context.recipe.idealBrewTime, context.recipe.tolerances.time)
  }
];

// ============================================================================
// MATCHA RULES - Whisked matcha powder with milk
// ============================================================================

const MATCHA_RULES: Rule[] = [
  {
    id: "matcha_temp",
    name: "Water Temperature",
    conditions: [{ parameter: "drinkType", operator: "equals", value: "matcha" }],
    weight: 0.4,
    score: (params, context) =>
      calculateToleranceScore(params.temperature, context.recipe.idealTemp, context.recipe.tolerances.temp),
    feedback: (score) => {
      if (score >= 90) return "Perfect matcha temperature!";
      if (score >= 70) return "Temperature acceptable";
      return "Too hot for matcha";
    }
  },
  {
    id: "matcha_milk_temp",
    name: "Milk Temperature",
    conditions: [
      { parameter: "drinkType", operator: "equals", value: "matcha" },
      { parameter: "milkType", operator: "not_equals", value: "none" }
    ],
    weight: 0.3,
    score: (params, context) => {
      if (!params.milkTemp || !context.recipe.idealMilkTemp) return 0;
      return calculateToleranceScore(
        params.milkTemp,
        context.recipe.idealMilkTemp,
        context.recipe.tolerances.milkTemp || 10
      );
    }
  },
  {
    id: "matcha_foam",
    name: "Foam Amount",
    conditions: [
      { parameter: "drinkType", operator: "equals", value: "matcha" },
      { parameter: "milkType", operator: "not_equals", value: "none" }
    ],
    weight: 0.3,
    score: (params, context) => {
      if (params.foamAmount === undefined || !context.recipe.idealFoamAmount) return 0;
      return calculateToleranceScore(
        params.foamAmount,
        context.recipe.idealFoamAmount,
        context.recipe.tolerances.foam || 15
      );
    }
  }
];

// ============================================================================
// RECIPE DEFINITIONS
// ============================================================================

export const RECIPES: Record<DrinkType, DrinkRecipe> = {
  espresso: {
    name: "Espresso",
    category: "espresso-based",
    description: "A concentrated shot of pure coffee perfection",
    idealGrind: "fine",
    idealTemp: 93,
    idealBrewTime: 25,
    tolerances: { temp: 3, time: 3 },
    rules: ESPRESSO_RULES
  },

  latte: {
    name: "Latte",
    category: "espresso-based",
    description: "Espresso with steamed milk and light foam",
    idealGrind: "fine",
    idealTemp: 93,
    idealBrewTime: 25,
    idealMilkTemp: 66,
    idealFoamAmount: 20,
    tolerances: { temp: 3, time: 3, milkTemp: 6, foam: 15 },
    rules: LATTE_RULES
  },

  cappuccino: {
    name: "Cappuccino",
    category: "espresso-based",
    description: "Equal parts espresso, steamed milk, and foam",
    idealGrind: "fine",
    idealTemp: 93,
    idealBrewTime: 25,
    idealMilkTemp: 66,
    idealFoamAmount: 60,
    tolerances: { temp: 3, time: 3, milkTemp: 6, foam: 15 },
    rules: CAPPUCCINO_RULES
  },

  pourover: {
    name: "Pour Over",
    category: "pour-over",
    description: "Clean, bright coffee with manual pouring technique",
    idealGrind: "medium",
    idealTemp: 96,
    idealBrewTime: 180,
    idealBloomTime: 30,
    tolerances: { temp: 3, time: 20, bloom: 10 },
    rules: POUROVER_RULES
  },

  aeropress: {
    name: "Aeropress",
    category: "immersion",
    description: "Smooth, full-bodied coffee with pressure brewing",
    idealGrind: "medium-fine",
    idealTemp: 85,
    idealBrewTime: 90,
    tolerances: { temp: 4, time: 15 },
    rules: IMMERSION_RULES
  },

  mocha: {
    name: "Mocha",
    category: "espresso-based",
    description: "Espresso with chocolate and steamed milk",
    idealGrind: "fine",
    idealTemp: 93,
    idealBrewTime: 25,
    idealMilkTemp: 66,
    idealFoamAmount: 30,
    tolerances: { temp: 3, time: 3, milkTemp: 6, foam: 15 },
    rules: MOCHA_RULES
  },

  americano: {
    name: "Americano",
    category: "espresso-based",
    description: "Espresso with hot water",
    idealGrind: "fine",
    idealTemp: 93,
    idealBrewTime: 25,
    tolerances: { temp: 3, time: 3 },
    rules: AMERICANO_RULES
  },

  matcha: {
    name: "Matcha Latte",
    category: "immersion",
    description: "Whisked matcha powder with steamed milk",
    idealGrind: "medium",
    idealTemp: 79,
    idealBrewTime: 30,
    idealMilkTemp: 66,
    idealFoamAmount: 25,
    tolerances: { temp: 4, time: 10, milkTemp: 6, foam: 15 },
    rules: MATCHA_RULES
  }
};

// ============================================================================
// CUSTOMER DATA - Order templates and pricing
// ============================================================================

export const CUSTOMER_ORDERS: Record<DrinkType, { order: string; payment: number }> = {
  espresso: { order: "One espresso, please", payment: 3 },
  latte: { order: "I'll have a latte, please", payment: 4.5 },
  cappuccino: { order: "Cappuccino, extra foam!", payment: 4.5 },
  pourover: { order: "Pour over, take your time", payment: 5 },
  aeropress: { order: "Aeropress, medium roast", payment: 4 },
  mocha: { order: "Mocha with whipped cream, please", payment: 5 },
  americano: { order: "Americano, black", payment: 3.5 },
  matcha: { order: "Matcha latte, please", payment: 5.5 }
};
