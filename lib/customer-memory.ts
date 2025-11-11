/**
 * Customer Memory System
 *
 * Tracks customer visits, preferences, and relationships over time.
 * Enables:
 * - Recognition of returning customers
 * - Personalized service based on history
 * - Relationship progression (stranger → regular)
 * - Preference learning
 */

import type { DrinkType, MilkType } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export type RelationshipLevel = "stranger" | "newcomer" | "familiar" | "regular" | "favorite";

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

export interface CustomerProfile {
  name: string;
  firstVisit: number;
  lastVisit: number;
  visitCount: number;
  relationshipLevel: RelationshipLevel;
  visits: CustomerVisit[];
  preferences: CustomerPreferences;
  totalSpent: number;
  averageSatisfaction: number;
  notes: string[];
}

export interface CustomerMemoryState {
  customers: Map<string, CustomerProfile>;
  totalCustomersServed: number;
  returningCustomerRate: number;
}

// ============================================================================
// RELATIONSHIP LEVELS
// ============================================================================

const RELATIONSHIP_THRESHOLDS = {
  stranger: 0,
  newcomer: 1,
  familiar: 3,
  regular: 8,
  favorite: 15,
} as const;

function calculateRelationshipLevel(visitCount: number): RelationshipLevel {
  if (visitCount >= RELATIONSHIP_THRESHOLDS.favorite) return "favorite";
  if (visitCount >= RELATIONSHIP_THRESHOLDS.regular) return "regular";
  if (visitCount >= RELATIONSHIP_THRESHOLDS.familiar) return "familiar";
  if (visitCount >= RELATIONSHIP_THRESHOLDS.newcomer) return "newcomer";
  return "stranger";
}

// ============================================================================
// MEMORY OPERATIONS
// ============================================================================

/**
 * Create initial memory state
 */
export function createMemoryState(): CustomerMemoryState {
  return {
    customers: new Map(),
    totalCustomersServed: 0,
    returningCustomerRate: 0,
  };
}

/**
 * Get customer profile by name
 */
export function getCustomer(
  state: CustomerMemoryState,
  name: string
): CustomerProfile | null {
  return state.customers.get(name) || null;
}

/**
 * Check if customer has visited before
 */
export function isReturningCustomer(
  state: CustomerMemoryState,
  name: string
): boolean {
  return state.customers.has(name);
}

/**
 * Record a customer visit
 */
export function recordVisit(
  state: CustomerMemoryState,
  customerName: string,
  visit: {
    drinkOrdered: DrinkType;
    milkType?: MilkType;
    quality: number;
    satisfaction: number;
    payment: number;
    tip?: number;
    allergens?: string[];
  }
): CustomerMemoryState {
  const existingCustomer = state.customers.get(customerName);
  const now = Date.now();

  const newVisit: CustomerVisit = {
    date: now,
    drinkOrdered: visit.drinkOrdered,
    milkType: visit.milkType,
    quality: visit.quality,
    satisfaction: visit.satisfaction,
    payment: visit.payment,
    tip: visit.tip,
  };

  if (existingCustomer) {
    // Update existing customer
    const visits = [...existingCustomer.visits, newVisit];
    const visitCount = visits.length;
    const totalSpent = existingCustomer.totalSpent + visit.payment;

    // Update drink preferences
    const favoriteDrinks = new Map(existingCustomer.preferences.favoriteDrinks);
    favoriteDrinks.set(
      visit.drinkOrdered,
      (favoriteDrinks.get(visit.drinkOrdered) || 0) + 1
    );

    // Calculate average satisfaction
    const totalSatisfaction = visits.reduce((sum, v) => sum + v.satisfaction, 0);
    const averageSatisfaction = totalSatisfaction / visits.length;

    // Determine preferred milk (most ordered)
    let preferredMilk = existingCustomer.preferences.preferredMilk;
    if (visit.milkType) {
      const milkCounts = new Map<MilkType, number>();
      visits.forEach(v => {
        if (v.milkType) {
          milkCounts.set(v.milkType, (milkCounts.get(v.milkType) || 0) + 1);
        }
      });
      const [mostUsedMilk] = Array.from(milkCounts.entries())
        .sort((a, b) => b[1] - a[1])[0] || [];
      if (mostUsedMilk) preferredMilk = mostUsedMilk;
    }

    // Update quality expectation (weighted average, recent visits matter more)
    const recentVisits = visits.slice(-5);
    const averageQualityExpectation =
      recentVisits.reduce((sum, v) => sum + v.quality, 0) / recentVisits.length;

    const updatedProfile: CustomerProfile = {
      ...existingCustomer,
      lastVisit: now,
      visitCount,
      relationshipLevel: calculateRelationshipLevel(visitCount),
      visits,
      preferences: {
        favoriteDrinks,
        preferredMilk,
        averageQualityExpectation,
        allergens: visit.allergens || existingCustomer.preferences.allergens,
      },
      totalSpent,
      averageSatisfaction,
    };

    const newCustomers = new Map(state.customers);
    newCustomers.set(customerName, updatedProfile);

    return {
      ...state,
      customers: newCustomers,
    };
  } else {
    // New customer
    const favoriteDrinks = new Map<DrinkType, number>();
    favoriteDrinks.set(visit.drinkOrdered, 1);

    const newProfile: CustomerProfile = {
      name: customerName,
      firstVisit: now,
      lastVisit: now,
      visitCount: 1,
      relationshipLevel: "stranger",
      visits: [newVisit],
      preferences: {
        favoriteDrinks,
        preferredMilk: visit.milkType,
        averageQualityExpectation: visit.quality,
        allergens: visit.allergens || [],
      },
      totalSpent: visit.payment,
      averageSatisfaction: visit.satisfaction,
      notes: [],
    };

    const newCustomers = new Map(state.customers);
    newCustomers.set(customerName, newProfile);

    return {
      customers: newCustomers,
      totalCustomersServed: state.totalCustomersServed + 1,
      returningCustomerRate: 0,
    };
  }
}

/**
 * Add a note to customer profile
 */
export function addNote(
  state: CustomerMemoryState,
  customerName: string,
  note: string
): CustomerMemoryState {
  const customer = state.customers.get(customerName);
  if (!customer) return state;

  const updatedProfile = {
    ...customer,
    notes: [...customer.notes, note],
  };

  const newCustomers = new Map(state.customers);
  newCustomers.set(customerName, updatedProfile);

  return {
    ...state,
    customers: newCustomers,
  };
}

/**
 * Get customer's favorite drink
 */
export function getFavoriteDrink(profile: CustomerProfile): DrinkType | null {
  if (profile.preferences.favoriteDrinks.size === 0) return null;

  const [favDrink] = Array.from(profile.preferences.favoriteDrinks.entries())
    .sort((a, b) => b[1] - a[1])[0];

  return favDrink || null;
}

/**
 * Get all regular customers
 */
export function getRegularCustomers(state: CustomerMemoryState): CustomerProfile[] {
  return Array.from(state.customers.values())
    .filter(c => c.relationshipLevel === "regular" || c.relationshipLevel === "favorite")
    .sort((a, b) => b.visitCount - a.visitCount);
}

/**
 * Get customer insights for LLM context
 */
export function getCustomerInsights(profile: CustomerProfile): string {
  const favDrink = getFavoriteDrink(profile);
  const visitText = profile.visitCount === 1
    ? "first visit"
    : `${profile.visitCount} visits`;

  const parts: string[] = [];

  parts.push(`${profile.relationshipLevel} (${visitText})`);

  if (favDrink) {
    const drinkCount = profile.preferences.favoriteDrinks.get(favDrink) || 0;
    if (drinkCount > 1) {
      parts.push(`usually orders ${favDrink}`);
    }
  }

  if (profile.preferences.preferredMilk) {
    parts.push(`prefers ${profile.preferences.preferredMilk} milk`);
  }

  if (profile.averageSatisfaction >= 90) {
    parts.push("very satisfied customer");
  } else if (profile.averageSatisfaction >= 75) {
    parts.push("satisfied customer");
  } else if (profile.averageSatisfaction < 60) {
    parts.push("needs better service");
  }

  if (profile.preferences.allergens.length > 0) {
    parts.push(`allergic to: ${profile.preferences.allergens.join(", ")}`);
  }

  return parts.join(" • ");
}

/**
 * Calculate returning customer rate
 */
export function calculateReturningRate(state: CustomerMemoryState): number {
  if (state.totalCustomersServed === 0) return 0;

  const returningCount = Array.from(state.customers.values())
    .filter(c => c.visitCount > 1).length;

  return (returningCount / state.totalCustomersServed) * 100;
}

/**
 * Get memory statistics
 */
export interface MemoryStats {
  totalCustomers: number;
  returningCustomers: number;
  regularCustomers: number;
  favoriteCustomers: number;
  averageSatisfaction: number;
  totalRevenue: number;
  returningRate: number;
}

export function getMemoryStats(state: CustomerMemoryState): MemoryStats {
  const customers = Array.from(state.customers.values());

  const returningCustomers = customers.filter(c => c.visitCount > 1).length;
  const regularCustomers = customers.filter(c => c.relationshipLevel === "regular").length;
  const favoriteCustomers = customers.filter(c => c.relationshipLevel === "favorite").length;

  const totalSatisfaction = customers.reduce((sum, c) => sum + c.averageSatisfaction, 0);
  const averageSatisfaction = customers.length > 0 ? totalSatisfaction / customers.length : 0;

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return {
    totalCustomers: state.totalCustomersServed,
    returningCustomers,
    regularCustomers,
    favoriteCustomers,
    averageSatisfaction: Math.round(averageSatisfaction),
    totalRevenue,
    returningRate: calculateReturningRate(state),
  };
}
