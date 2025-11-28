/**
 * Customer Generation System
 *
 * Uses seeded RNG to create diverse, consistent customers with:
 * - Archetypes (personality templates)
 * - Preferences (caffeine, sweetness, temperature)
 * - Constraints (budget, allergens, time pressure)
 * - Moods (affects dialogue and patience)
 */

import type { DrinkType, MilkType } from "./types";
import { RECIPES } from "./recipes";

// ============================================================================
// SEEDED RNG - For deterministic replay and testing
// ============================================================================

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator (LCG)
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  // Random integer between min (inclusive) and max (exclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  // Pick random element from array
  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  // Weighted random choice
  weightedChoice<T>(items: { item: T; weight: number }[]): T {
    const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
    let random = this.next() * totalWeight;

    for (const { item, weight } of items) {
      random -= weight;
      if (random <= 0) return item;
    }

    return items[items.length - 1].item;
  }
}

// ============================================================================
// CUSTOMER ARCHETYPES
// ============================================================================

export interface CustomerArchetype {
  name: string;
  description: string;
  drinkPreferences: DrinkType[];
  caffeineLevel: "low" | "medium" | "high" | "any";
  sweetnessLevel: "none" | "light" | "medium" | "sweet";
  temperaturePreference: "hot" | "iced" | "any";
  budgetRange: [number, number];
  timeConstraint: "relaxed" | "normal" | "rushed";
  personalityTraits: string[];
}

const ARCHETYPES: CustomerArchetype[] = [
  {
    name: "The Regular",
    description: "loyal customer who knows what they want",
    drinkPreferences: ["espresso", "latte"],
    caffeineLevel: "high",
    sweetnessLevel: "none",
    temperaturePreference: "hot",
    budgetRange: [3, 6],
    timeConstraint: "normal",
    personalityTraits: ["friendly", "consistent", "appreciative"],
  },
  {
    name: "The Coffee Enthusiast",
    description: "passionate about coffee quality and technique",
    drinkPreferences: ["pourover", "aeropress", "espresso"],
    caffeineLevel: "medium",
    sweetnessLevel: "none",
    temperaturePreference: "hot",
    budgetRange: [4, 8],
    timeConstraint: "relaxed",
    personalityTraits: ["curious", "knowledgeable", "particular"],
  },
  {
    name: "The Morning Rusher",
    description: "needs caffeine quickly to start their day",
    drinkPreferences: ["espresso", "latte"],
    caffeineLevel: "high",
    sweetnessLevel: "light",
    temperaturePreference: "any",
    budgetRange: [3, 5],
    timeConstraint: "rushed",
    personalityTraits: ["stressed", "direct", "grateful"],
  },
  {
    name: "The Student",
    description: "budget-conscious but needs the energy",
    drinkPreferences: ["latte", "cappuccino"],
    caffeineLevel: "high",
    sweetnessLevel: "medium",
    temperaturePreference: "hot",
    budgetRange: [3, 5],
    timeConstraint: "normal",
    personalityTraits: ["tired", "friendly", "budget-conscious"],
  },
  {
    name: "The Remote Worker",
    description: "settling in for a long work session",
    drinkPreferences: ["latte", "cappuccino", "pourover"],
    caffeineLevel: "medium",
    sweetnessLevel: "light",
    temperaturePreference: "hot",
    budgetRange: [4, 6],
    timeConstraint: "relaxed",
    personalityTraits: ["focused", "polite", "routine-oriented"],
  },
  {
    name: "The Experimenter",
    description: "loves trying new things and recommendations",
    drinkPreferences: ["aeropress", "pourover", "cappuccino"],
    caffeineLevel: "any",
    sweetnessLevel: "light",
    temperaturePreference: "any",
    budgetRange: [4, 7],
    timeConstraint: "relaxed",
    personalityTraits: ["adventurous", "chatty", "open-minded"],
  },
  {
    name: "The Decaf Devotee",
    description: "enjoys coffee for flavor, not caffeine",
    drinkPreferences: ["latte", "cappuccino"],
    caffeineLevel: "low",
    sweetnessLevel: "medium",
    temperaturePreference: "hot",
    budgetRange: [3, 6],
    timeConstraint: "relaxed",
    personalityTraits: ["health-conscious", "calm", "appreciative"],
  },
  {
    name: "The Social Butterfly",
    description: "here for the vibe and conversation",
    drinkPreferences: ["latte", "cappuccino"],
    caffeineLevel: "low",
    sweetnessLevel: "sweet",
    temperaturePreference: "hot",
    budgetRange: [4, 7],
    timeConstraint: "relaxed",
    personalityTraits: ["chatty", "friendly", "social"],
  },
];

// ============================================================================
// NAMES POOL
// ============================================================================

const FIRST_NAMES = [
  "Alex", "Sam", "Jordan", "Taylor", "Morgan",
  "Casey", "Riley", "Avery", "Quinn", "Sage",
  "River", "Skylar", "Rowan", "Phoenix", "Harper",
  "Blake", "Dakota", "Cameron", "Drew", "Reese",
  "Charlie", "Finley", "Emerson", "Hayden", "Kai",
  "Lennon", "Marlowe", "Nova", "Oakley", "Parker",
];

// ============================================================================
// ALLERGENS
// ============================================================================

const ALLERGEN_WEIGHTS = [
  { item: "none", weight: 85 },
  { item: "dairy", weight: 10 },
  { item: "nuts", weight: 5 },
];

// ============================================================================
// MOODS
// ============================================================================

type Mood = "happy" | "neutral" | "stressed" | "tired";

const MOOD_WEIGHTS = [
  { item: "happy" as Mood, weight: 25 },
  { item: "neutral" as Mood, weight: 45 },
  { item: "stressed" as Mood, weight: 20 },
  { item: "tired" as Mood, weight: 10 },
];

// ============================================================================
// CUSTOMER GENERATION
// ============================================================================

export interface GeneratedCustomerProfile {
  name: string;
  archetype: CustomerArchetype;
  mood: Mood;
  drinkType: DrinkType;
  budget: number;
  allergens: string[];
  milkPreference?: MilkType;
  personality: string; // For LLM context
}

/**
 * Generate a customer profile using seeded RNG
 * Seed can be based on timestamp, customer count, or name hash for consistency
 */
export function generateCustomerProfile(
  seed?: number,
  preferredDrink?: DrinkType
): GeneratedCustomerProfile {
  // Use timestamp if no seed provided
  const rng = new SeededRandom(seed ?? Date.now());

  // Select archetype
  const archetype = rng.choice(ARCHETYPES);

  // Generate name
  const name = rng.choice(FIRST_NAMES);

  // Determine mood (archetype affects this)
  let mood: Mood;
  if (archetype.timeConstraint === "rushed") {
    mood = rng.weightedChoice([
      { item: "stressed" as Mood, weight: 60 },
      { item: "neutral" as Mood, weight: 30 },
      { item: "tired" as Mood, weight: 10 },
    ]);
  } else if (archetype.timeConstraint === "relaxed") {
    mood = rng.weightedChoice([
      { item: "happy" as Mood, weight: 40 },
      { item: "neutral" as Mood, weight: 50 },
      { item: "tired" as Mood, weight: 10 },
    ]);
  } else {
    mood = rng.weightedChoice(MOOD_WEIGHTS);
  }

  // Select drink based on preferences or override
  const drinkType = preferredDrink || rng.choice(archetype.drinkPreferences);

  // Determine budget
  const [minBudget, maxBudget] = archetype.budgetRange;
  const budget = rng.nextInt(minBudget, maxBudget + 1);

  // Generate allergens
  const allergenType = rng.weightedChoice(ALLERGEN_WEIGHTS);
  const allergens = allergenType === "none" ? [] : [allergenType];

  // Determine milk preference (if drink needs it and no dairy allergy)
  let milkPreference: MilkType | undefined;
  const recipe = RECIPES[drinkType];
  if (recipe.category === "espresso-based" && drinkType !== "espresso") {
    if (allergens.includes("dairy")) {
      milkPreference = rng.choice(["oat", "almond"] as MilkType[]);
    } else if (allergens.includes("nuts")) {
      milkPreference = rng.choice(["whole", "skim", "oat"] as MilkType[]);
    } else {
      milkPreference = rng.choice(["whole", "skim", "oat", "almond"] as MilkType[]);
    }
  }

  // Build personality description for LLM
  const personality = `${archetype.description}. Traits: ${archetype.personalityTraits.join(", ")}. ${archetype.timeConstraint === "rushed" ? "In a hurry." :
      archetype.timeConstraint === "relaxed" ? "Taking their time." : ""
    }`;

  return {
    name,
    archetype,
    mood,
    drinkType,
    budget,
    allergens,
    milkPreference,
    personality,
  };
}

/**
 * Calculate payment based on drink and customer budget
 */
export function calculatePayment(
  drinkType: DrinkType,
  customerBudget: number
): number {
  const basePayments: Record<DrinkType, number> = {
    espresso: 3,
    latte: 4.5,
    cappuccino: 4.5,
    pourover: 5,
    aeropress: 4,
    mocha: 5.5,
    americano: 3.5,
    matcha: 5.0,
  };

  const basePrice = basePayments[drinkType];

  // Customer might tip if they have budget headroom
  const headroom = customerBudget - basePrice;
  if (headroom >= 2) {
    // Generous budget - add tip
    return basePrice + 0.5;
  } else if (headroom >= 1) {
    // Some headroom - small tip
    return basePrice + 0.25;
  }

  return basePrice;
}

/**
 * Export seeded random for deterministic customer generation
 */
export { SeededRandom };
