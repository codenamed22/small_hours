/**
 * Shared Type Definitions
 */

// ============================================================================
// BREW TYPES
// ============================================================================

export type GrindSize = "coarse" | "medium-coarse" | "medium" | "medium-fine" | "fine";
export type DrinkCategory = "espresso-based" | "pour-over" | "immersion";
export type DrinkType = "espresso" | "latte" | "cappuccino" | "pourover" | "aeropress";
export type MilkType = "none" | "whole" | "skim" | "oat" | "almond";

// Validation constants
export const VALID_DRINKS: DrinkType[] = ["espresso", "latte", "cappuccino", "pourover", "aeropress"];
export const VALID_MILK_TYPES: Exclude<MilkType, "none">[] = ["whole", "skim", "oat", "almond"];

export interface BrewParameters {
  grindSize: GrindSize;
  temperature: number;
  brewTime: number;
  bloomTime?: number;
  milkType?: MilkType;
  milkTemp?: number;
  foamAmount?: number;
}

// ============================================================================
// RULE ENGINE TYPES
// ============================================================================

export type ComparisonOperator = "equals" | "not_equals" | "less_than" | "greater_than";
export type ConditionValue = string | number | boolean;

export interface Condition {
  parameter: keyof BrewParameters | "drinkCategory" | "drinkType";
  operator: ComparisonOperator | "range";
  value: ConditionValue;
  tolerance?: number;
}

export interface RuleContext {
  drinkType: DrinkType;
  drinkCategory: DrinkCategory;
  recipe: DrinkRecipe;
}

export interface ScoringFunction {
  (params: BrewParameters, context: RuleContext): number;
}

export interface Rule {
  id: string;
  name: string;
  conditions: Condition[];
  score: ScoringFunction;
  weight: number;
  feedback?: (score: number) => string;
}

export interface DrinkRecipe {
  name: string;
  category: DrinkCategory;
  description: string;

  // Ideal parameters
  idealGrind: GrindSize;
  idealTemp: number;
  idealBrewTime: number;
  idealBloomTime?: number;
  idealMilkTemp?: number;
  idealFoamAmount?: number;

  // Tolerances
  tolerances: {
    temp: number;
    time: number;
    bloom?: number;
    milkTemp?: number;
    foam?: number;
  };

  // Rules - weights MUST sum to 1.0
  rules: Rule[];
}

export interface BrewResult {
  quality: number;
  breakdown: Record<string, number>;
  feedback: string;
  appliedRules: string[];
}

// ============================================================================
// GAME TYPES
// ============================================================================

export interface Customer {
  name: string;
  order: string;
  drinkType: DrinkType;
  payment: number;
  personality?: string;
  mood?: "happy" | "neutral" | "stressed" | "tired";
  budget?: number;
  allergens?: string[];
}

export interface GameState {
  customer: Customer | null;
  brewParams: BrewParameters;
  result: BrewResult | null;
  money: number;
  drinksServed: number;
  inventory: Inventory;
  queue?: QueueState;
  customerMemory?: CustomerMemoryState;
}

// Customer Memory types (re-exported from customer-memory.ts)
export interface CustomerMemoryState {
  customers: Map<string, CustomerProfile>;
  totalCustomersServed: number;
  returningCustomerRate: number;
}

export interface CustomerProfile {
  name: string;
  firstVisit: number;
  lastVisit: number;
  visitCount: number;
  relationshipLevel: "stranger" | "newcomer" | "familiar" | "regular" | "favorite";
  visits: CustomerVisit[];
  preferences: CustomerPreferences;
  totalSpent: number;
  averageSatisfaction: number;
  notes: string[];
}

export interface CustomerVisit {
  date: number;
  drinkOrdered: DrinkType;
  milkType?: MilkType;
  quality: number;
  satisfaction: number;
  payment: number;
  tip?: number;
}

export interface CustomerPreferences {
  favoriteDrinks: Map<DrinkType, number>;
  preferredMilk?: MilkType;
  averageQualityExpectation: number;
  allergens: string[];
}

// Queue types (re-exported from ticketing.ts for convenience)
export interface QueueState {
  tickets: OrderTicket[];
  activeTicketId: string | null;
  completedToday: number;
  totalRevenue: number;
}

export interface OrderTicket {
  id: string;
  customerName: string;
  drinkType: DrinkType;
  milkType?: MilkType;
  notes?: string;
  priority: "normal" | "high";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  createdAt: number;
  completedAt?: number;
}

// Inventory types (re-exported from inventory.ts for convenience)
export interface BeanStock {
  name: string;
  grams: number;
  roastDate: string;
}

export interface Inventory {
  beans: BeanStock[];
  milks: Record<MilkType, number>;
  syrups: Record<string, number>;
  food: Record<string, number>;
}
