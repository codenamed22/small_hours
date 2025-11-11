/**
 * LocalStorage Persistence System
 *
 * Handles saving and loading game state to browser LocalStorage.
 * Includes serialization/deserialization for Map objects and version management.
 */

import type { GameState, CustomerMemoryState, CustomerProfile, DrinkType, MilkType } from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = "small-hours-save";
const VERSION = 1;

// ============================================================================
// SERIALIZATION - Convert Maps to plain objects for JSON
// ============================================================================

interface SerializedCustomerProfile {
  name: string;
  firstVisit: number;
  lastVisit: number;
  visitCount: number;
  relationshipLevel: "stranger" | "newcomer" | "familiar" | "regular" | "favorite";
  visits: any[];
  preferences: {
    favoriteDrinks: [DrinkType, number][];
    preferredMilk?: MilkType;
    averageQualityExpectation: number;
    allergens: string[];
  };
  totalSpent: number;
  averageSatisfaction: number;
  notes: string[];
}

interface SerializedMemoryState {
  customers: [string, SerializedCustomerProfile][];
  totalCustomersServed: number;
  returningCustomerRate: number;
}

interface SerializedGameState {
  customer: any;
  brewParams: any;
  result: any;
  money: number;
  drinksServed: number;
  inventory: any;
  queue?: any;
  customerMemory?: SerializedMemoryState;
}

interface SaveData {
  version: number;
  timestamp: number;
  state: SerializedGameState;
}

function serializeCustomerProfile(profile: CustomerProfile): SerializedCustomerProfile {
  return {
    ...profile,
    preferences: {
      ...profile.preferences,
      favoriteDrinks: Array.from(profile.preferences.favoriteDrinks.entries()),
    },
  };
}

function serializeMemoryState(memory: CustomerMemoryState): SerializedMemoryState {
  return {
    customers: Array.from(memory.customers.entries()).map(([name, profile]) => [
      name,
      serializeCustomerProfile(profile),
    ]),
    totalCustomersServed: memory.totalCustomersServed,
    returningCustomerRate: memory.returningCustomerRate,
  };
}

export function serializeGameState(state: GameState): SerializedGameState {
  return {
    customer: state.customer,
    brewParams: state.brewParams,
    result: state.result,
    money: state.money,
    drinksServed: state.drinksServed,
    inventory: state.inventory,
    queue: state.queue,
    customerMemory: state.customerMemory
      ? serializeMemoryState(state.customerMemory)
      : undefined,
  };
}

// ============================================================================
// DESERIALIZATION - Convert plain objects back to Maps
// ============================================================================

function deserializeCustomerProfile(
  serialized: SerializedCustomerProfile
): CustomerProfile {
  return {
    ...serialized,
    preferences: {
      ...serialized.preferences,
      favoriteDrinks: new Map(serialized.preferences.favoriteDrinks),
    },
  };
}

function deserializeMemoryState(
  serialized: SerializedMemoryState
): CustomerMemoryState {
  return {
    customers: new Map(
      serialized.customers.map(([name, profile]) => [
        name,
        deserializeCustomerProfile(profile),
      ])
    ),
    totalCustomersServed: serialized.totalCustomersServed,
    returningCustomerRate: serialized.returningCustomerRate,
  };
}

export function deserializeGameState(serialized: SerializedGameState): GameState {
  return {
    customer: serialized.customer,
    brewParams: serialized.brewParams,
    result: serialized.result,
    money: serialized.money,
    drinksServed: serialized.drinksServed,
    inventory: serialized.inventory,
    queue: serialized.queue,
    customerMemory: serialized.customerMemory
      ? deserializeMemoryState(serialized.customerMemory)
      : undefined,
  };
}

// ============================================================================
// STORAGE OPERATIONS
// ============================================================================

/**
 * Save game state to LocalStorage
 */
export function saveGame(state: GameState): boolean {
  try {
    const saveData: SaveData = {
      version: VERSION,
      timestamp: Date.now(),
      state: serializeGameState(state),
    };

    const json = JSON.stringify(saveData);
    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (error) {
    console.error("Failed to save game:", error);
    if (error instanceof Error && error.name === "QuotaExceededError") {
      alert("Storage quota exceeded. Please clear some browser data.");
    }
    return false;
  }
}

/**
 * Load game state from LocalStorage
 */
export function loadGame(): GameState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;

    const saveData: SaveData = JSON.parse(json);

    // Version check for future migrations
    if (saveData.version !== VERSION) {
      console.warn(`Save version mismatch: ${saveData.version} vs ${VERSION}`);
      // Future: Add migration logic here
    }

    return deserializeGameState(saveData.state);
  } catch (error) {
    console.error("Failed to load game:", error);
    return null;
  }
}

/**
 * Check if a save exists
 */
export function hasSave(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Get save metadata without loading full state
 */
export function getSaveInfo(): { timestamp: number; version: number } | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;

    const saveData: SaveData = JSON.parse(json);
    return {
      timestamp: saveData.timestamp,
      version: saveData.version,
    };
  } catch (error) {
    console.error("Failed to get save info:", error);
    return null;
  }
}

/**
 * Delete saved game
 */
export function deleteSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export save data as downloadable JSON
 */
export function exportSave(): string | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json;
  } catch (error) {
    console.error("Failed to export save:", error);
    return null;
  }
}

/**
 * Import save data from JSON string
 */
export function importSave(json: string): boolean {
  try {
    // Validate JSON
    const saveData: SaveData = JSON.parse(json);
    if (!saveData.version || !saveData.state) {
      throw new Error("Invalid save format");
    }

    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch (error) {
    console.error("Failed to import save:", error);
    return false;
  }
}
