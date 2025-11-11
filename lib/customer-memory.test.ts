/**
 * Tests for Customer Memory System
 */

import { describe, it, expect } from "vitest";
import {
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

describe("Customer Memory System", () => {
  describe("createMemoryState", () => {
    it("should create empty memory state", () => {
      const state = createMemoryState();

      expect(state.customers.size).toBe(0);
      expect(state.totalCustomersServed).toBe(0);
      expect(state.returningCustomerRate).toBe(0);
    });
  });

  describe("recordVisit", () => {
    it("should record first visit for new customer", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Alex", {
        drinkOrdered: "latte",
        milkType: "oat",
        quality: 85,
        satisfaction: 90,
        payment: 4.5,
        allergens: ["dairy"],
      });

      expect(state.customers.size).toBe(1);
      expect(state.totalCustomersServed).toBe(1);

      const customer = getCustomer(state, "Alex");
      expect(customer).not.toBeNull();
      expect(customer!.visitCount).toBe(1);
      expect(customer!.relationshipLevel).toBe("stranger");
      expect(customer!.preferences.allergens).toEqual(["dairy"]);
    });

    it("should update existing customer on return visit", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Sam", {
        drinkOrdered: "espresso",
        quality: 90,
        satisfaction: 95,
        payment: 3.0,
      });

      state = recordVisit(state, "Sam", {
        drinkOrdered: "espresso",
        quality: 88,
        satisfaction: 92,
        payment: 3.0,
      });

      const customer = getCustomer(state, "Sam");
      expect(customer!.visitCount).toBe(2);
      expect(customer!.relationshipLevel).toBe("newcomer");
      expect(customer!.visits).toHaveLength(2);
    });

    it("should track favorite drinks", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Jordan", {
        drinkOrdered: "latte",
        milkType: "whole",
        quality: 85,
        satisfaction: 88,
        payment: 4.5,
      });

      state = recordVisit(state, "Jordan", {
        drinkOrdered: "latte",
        milkType: "whole",
        quality: 90,
        satisfaction: 92,
        payment: 4.5,
      });

      state = recordVisit(state, "Jordan", {
        drinkOrdered: "cappuccino",
        milkType: "whole",
        quality: 87,
        satisfaction: 85,
        payment: 4.5,
      });

      const customer = getCustomer(state, "Jordan");
      const favDrink = getFavoriteDrink(customer!);

      expect(favDrink).toBe("latte");
      expect(customer!.preferences.favoriteDrinks.get("latte")).toBe(2);
      expect(customer!.preferences.favoriteDrinks.get("cappuccino")).toBe(1);
    });

    it("should determine preferred milk type", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Taylor", {
        drinkOrdered: "latte",
        milkType: "oat",
        quality: 85,
        satisfaction: 90,
        payment: 4.5,
      });

      state = recordVisit(state, "Taylor", {
        drinkOrdered: "cappuccino",
        milkType: "oat",
        quality: 88,
        satisfaction: 91,
        payment: 4.5,
      });

      state = recordVisit(state, "Taylor", {
        drinkOrdered: "latte",
        milkType: "almond",
        quality: 87,
        satisfaction: 89,
        payment: 4.5,
      });

      const customer = getCustomer(state, "Taylor");
      expect(customer!.preferences.preferredMilk).toBe("oat");
    });

    it("should calculate average satisfaction", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Morgan", {
        drinkOrdered: "espresso",
        quality: 90,
        satisfaction: 95,
        payment: 3.0,
      });

      state = recordVisit(state, "Morgan", {
        drinkOrdered: "espresso",
        quality: 85,
        satisfaction: 85,
        payment: 3.0,
      });

      const customer = getCustomer(state, "Morgan");
      expect(customer!.averageSatisfaction).toBe(90);
    });

    it("should track total spending", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Casey", {
        drinkOrdered: "latte",
        quality: 85,
        satisfaction: 90,
        payment: 4.5,
        tip: 0.5,
      });

      state = recordVisit(state, "Casey", {
        drinkOrdered: "latte",
        quality: 88,
        satisfaction: 92,
        payment: 5.0,
        tip: 1.0,
      });

      const customer = getCustomer(state, "Casey");
      expect(customer!.totalSpent).toBe(9.5);
    });
  });

  describe("isReturningCustomer", () => {
    it("should return true for existing customer", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Riley", {
        drinkOrdered: "espresso",
        quality: 85,
        satisfaction: 88,
        payment: 3.0,
      });

      expect(isReturningCustomer(state, "Riley")).toBe(true);
      expect(isReturningCustomer(state, "Unknown")).toBe(false);
    });
  });

  describe("relationshipLevel", () => {
    it("should progress relationship levels with visits", () => {
      let state = createMemoryState();

      const recordMultipleVisits = (count: number) => {
        for (let i = 0; i < count; i++) {
          state = recordVisit(state, "Avery", {
            drinkOrdered: "latte",
            quality: 85,
            satisfaction: 90,
            payment: 4.5,
          });
        }
      };

      recordMultipleVisits(1);
      expect(getCustomer(state, "Avery")!.relationshipLevel).toBe("stranger");

      recordMultipleVisits(1);
      expect(getCustomer(state, "Avery")!.relationshipLevel).toBe("newcomer");

      recordMultipleVisits(2);
      expect(getCustomer(state, "Avery")!.relationshipLevel).toBe("familiar");

      recordMultipleVisits(5);
      expect(getCustomer(state, "Avery")!.relationshipLevel).toBe("regular");

      recordMultipleVisits(7);
      expect(getCustomer(state, "Avery")!.relationshipLevel).toBe("favorite");
    });
  });

  describe("addNote", () => {
    it("should add notes to customer profile", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Quinn", {
        drinkOrdered: "espresso",
        quality: 85,
        satisfaction: 88,
        payment: 3.0,
      });

      state = addNote(state, "Quinn", "Likes extra hot drinks");
      state = addNote(state, "Quinn", "Always tips well");

      const customer = getCustomer(state, "Quinn");
      expect(customer!.notes).toHaveLength(2);
      expect(customer!.notes[0]).toBe("Likes extra hot drinks");
    });

    it("should ignore notes for non-existent customers", () => {
      let state = createMemoryState();

      const newState = addNote(state, "Unknown", "Test note");
      expect(newState).toBe(state);
    });
  });

  describe("getRegularCustomers", () => {
    it("should return only regular and favorite customers", () => {
      let state = createMemoryState();

      const addCustomer = (name: string, visitCount: number) => {
        for (let i = 0; i < visitCount; i++) {
          state = recordVisit(state, name, {
            drinkOrdered: "latte",
            quality: 85,
            satisfaction: 90,
            payment: 4.5,
          });
        }
      };

      addCustomer("Stranger", 1);
      addCustomer("Newcomer", 2);
      addCustomer("Familiar", 5);
      addCustomer("Regular", 10);
      addCustomer("Favorite", 20);

      const regulars = getRegularCustomers(state);

      expect(regulars).toHaveLength(2);
      expect(regulars[0].name).toBe("Favorite");
      expect(regulars[1].name).toBe("Regular");
    });
  });

  describe("getCustomerInsights", () => {
    it("should generate insight text for new customer", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Sage", {
        drinkOrdered: "latte",
        quality: 85,
        satisfaction: 90,
        payment: 4.5,
      });

      const customer = getCustomer(state, "Sage")!;
      const insights = getCustomerInsights(customer);

      expect(insights).toContain("stranger");
      expect(insights).toContain("first visit");
    });

    it("should include favorite drink for returning customer", () => {
      let state = createMemoryState();

      state = recordVisit(state, "River", {
        drinkOrdered: "espresso",
        quality: 85,
        satisfaction: 90,
        payment: 3.0,
      });

      state = recordVisit(state, "River", {
        drinkOrdered: "espresso",
        quality: 88,
        satisfaction: 92,
        payment: 3.0,
      });

      const customer = getCustomer(state, "River")!;
      const insights = getCustomerInsights(customer);

      expect(insights).toContain("usually orders espresso");
    });

    it("should include satisfaction level", () => {
      let state = createMemoryState();

      state = recordVisit(state, "Skylar", {
        drinkOrdered: "latte",
        quality: 95,
        satisfaction: 98,
        payment: 4.5,
      });

      const customer = getCustomer(state, "Skylar")!;
      const insights = getCustomerInsights(customer);

      expect(insights).toContain("very satisfied customer");
    });
  });

  describe("calculateReturningRate", () => {
    it("should calculate percentage of returning customers", () => {
      let state = createMemoryState();

      state = recordVisit(state, "A", {
        drinkOrdered: "latte",
        quality: 85,
        satisfaction: 90,
        payment: 4.5,
      });

      state = recordVisit(state, "B", {
        drinkOrdered: "espresso",
        quality: 85,
        satisfaction: 90,
        payment: 3.0,
      });

      state = recordVisit(state, "A", {
        drinkOrdered: "latte",
        quality: 85,
        satisfaction: 90,
        payment: 4.5,
      });

      const rate = calculateReturningRate(state);
      expect(rate).toBe(50);
    });
  });

  describe("getMemoryStats", () => {
    it("should calculate comprehensive statistics", () => {
      let state = createMemoryState();

      const addCustomer = (name: string, visitCount: number, satisfaction: number) => {
        for (let i = 0; i < visitCount; i++) {
          state = recordVisit(state, name, {
            drinkOrdered: "latte",
            quality: 85,
            satisfaction,
            payment: 4.5,
          });
        }
      };

      addCustomer("A", 1, 80);
      addCustomer("B", 5, 90);
      addCustomer("C", 10, 95);
      addCustomer("D", 20, 98);

      const stats = getMemoryStats(state);

      expect(stats.totalCustomers).toBe(4);
      expect(stats.returningCustomers).toBe(3);
      expect(stats.regularCustomers).toBe(1);
      expect(stats.favoriteCustomers).toBe(1);
      expect(stats.totalRevenue).toBeGreaterThan(0);
      expect(stats.averageSatisfaction).toBeGreaterThan(0);
    });
  });
});
