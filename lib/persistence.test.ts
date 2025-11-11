/**
 * Tests for LocalStorage Persistence System
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveGame,
  loadGame,
  hasSave,
  deleteSave,
  exportSave,
  importSave,
  getSaveInfo,
  serializeGameState,
  deserializeGameState,
} from "./persistence";
import { createInitialState } from "./game-engine";
import type { GameState, DrinkType, MilkType } from "./types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

describe("Persistence System", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("saveGame and loadGame", () => {
    it("should save and load game state", () => {
      const state = createInitialState();
      state.money = 100;
      state.drinksServed = 5;

      const saved = saveGame(state);
      expect(saved).toBe(true);

      const loaded = loadGame();
      expect(loaded).not.toBeNull();
      expect(loaded!.money).toBe(100);
      expect(loaded!.drinksServed).toBe(5);
    });

    it("should return null when no save exists", () => {
      const loaded = loadGame();
      expect(loaded).toBeNull();
    });

    it("should preserve customer memory state", () => {
      const state = createInitialState();

      // Add a customer to memory (simulate recording a visit)
      if (state.customerMemory) {
        state.customerMemory.totalCustomersServed = 10;
        state.customerMemory.returningCustomerRate = 50;
      }

      saveGame(state);
      const loaded = loadGame();

      expect(loaded).not.toBeNull();
      expect(loaded!.customerMemory?.totalCustomersServed).toBe(10);
      expect(loaded!.customerMemory?.returningCustomerRate).toBe(50);
    });

    it("should handle corrupted save data", () => {
      localStorage.setItem("small-hours-save", "invalid json");
      const loaded = loadGame();
      expect(loaded).toBeNull();
    });
  });

  describe("hasSave", () => {
    it("should return false when no save exists", () => {
      expect(hasSave()).toBe(false);
    });

    it("should return true when save exists", () => {
      const state = createInitialState();
      saveGame(state);
      expect(hasSave()).toBe(true);
    });
  });

  describe("deleteSave", () => {
    it("should delete saved game", () => {
      const state = createInitialState();
      saveGame(state);
      expect(hasSave()).toBe(true);

      deleteSave();
      expect(hasSave()).toBe(false);
    });
  });

  describe("getSaveInfo", () => {
    it("should return save metadata", () => {
      const state = createInitialState();
      saveGame(state);

      const info = getSaveInfo();
      expect(info).not.toBeNull();
      expect(info!.version).toBe(1);
      expect(info!.timestamp).toBeGreaterThan(0);
    });

    it("should return null when no save exists", () => {
      const info = getSaveInfo();
      expect(info).toBeNull();
    });
  });

  describe("exportSave and importSave", () => {
    it("should export and import save data", () => {
      const state = createInitialState();
      state.money = 250;
      state.drinksServed = 15;

      saveGame(state);
      const exported = exportSave();
      expect(exported).not.toBeNull();

      // Clear storage
      deleteSave();
      expect(hasSave()).toBe(false);

      // Import
      const imported = importSave(exported!);
      expect(imported).toBe(true);

      const loaded = loadGame();
      expect(loaded).not.toBeNull();
      expect(loaded!.money).toBe(250);
      expect(loaded!.drinksServed).toBe(15);
    });

    it("should reject invalid import data", () => {
      const result = importSave("invalid json");
      expect(result).toBe(false);
    });

    it("should reject save with missing fields", () => {
      const result = importSave('{"version": 1}');
      expect(result).toBe(false);
    });
  });

  describe("serialization", () => {
    it("should serialize and deserialize Maps correctly", () => {
      const state = createInitialState();

      // Create a customer with favorite drinks Map
      if (state.customerMemory) {
        const favoriteDrinks = new Map<DrinkType, number>();
        favoriteDrinks.set("latte", 5);
        favoriteDrinks.set("espresso", 3);

        // Manually create a customer profile for testing
        const testProfile = {
          name: "Test Customer",
          firstVisit: Date.now(),
          lastVisit: Date.now(),
          visitCount: 8,
          relationshipLevel: "familiar" as const,
          visits: [],
          preferences: {
            favoriteDrinks,
            preferredMilk: "oat" as MilkType,
            averageQualityExpectation: 85,
            allergens: ["dairy"],
          },
          totalSpent: 50,
          averageSatisfaction: 90,
          notes: ["Loves oat milk lattes"],
        };

        state.customerMemory.customers.set("Test Customer", testProfile);
      }

      // Serialize
      const serialized = serializeGameState(state);

      // Deserialize
      const deserialized = deserializeGameState(serialized);

      // Verify Maps are restored
      expect(deserialized.customerMemory).toBeDefined();
      const customer = deserialized.customerMemory!.customers.get("Test Customer");
      expect(customer).toBeDefined();
      expect(customer!.preferences.favoriteDrinks).toBeInstanceOf(Map);
      expect(customer!.preferences.favoriteDrinks.get("latte")).toBe(5);
      expect(customer!.preferences.favoriteDrinks.get("espresso")).toBe(3);
      expect(customer!.preferences.preferredMilk).toBe("oat");
    });
  });
});
