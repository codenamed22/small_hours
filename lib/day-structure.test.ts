/**
 * Tests for Day Structure System
 */

import { describe, it, expect } from "vitest";
import {
  createDayState,
  startService,
  endService,
  startNewDay,
  recordCustomer,
  getRestockCost,
  restockInventory,
  getDaySummary,
  getPerformanceEmoji,
  getPerformanceDescription,
} from "./day-structure";
import { createInventory } from "./inventory";

describe("Day Structure System", () => {
  describe("createDayState", () => {
    it("should create initial day state in prep phase", () => {
      const state = createDayState();

      expect(state.dayNumber).toBe(1);
      expect(state.phase).toBe("prep");
      expect(state.stats.customersServed).toBe(0);
      expect(state.stats.totalEarnings).toBe(0);
      expect(state.targetCustomers).toBe(20);
      expect(state.openTime).toBeNull();
      expect(state.closeTime).toBeNull();
    });
  });

  describe("phase transitions", () => {
    it("should start service from prep", () => {
      const state = createDayState();
      const serviceState = startService(state);

      expect(serviceState.phase).toBe("service");
      expect(serviceState.openTime).toBeGreaterThan(0);
    });

    it("should throw error when starting service from non-prep phase", () => {
      const state = createDayState();
      const serviceState = startService(state);

      expect(() => startService(serviceState)).toThrow(
        "Can only start service from prep phase"
      );
    });

    it("should end service to debrief", () => {
      const state = createDayState();
      const serviceState = startService(state);
      const debriefState = endService(serviceState);

      expect(debriefState.phase).toBe("debrief");
      expect(debriefState.closeTime).toBeGreaterThan(0);
    });

    it("should throw error when ending service from non-service phase", () => {
      const state = createDayState();

      expect(() => endService(state)).toThrow(
        "Can only end service from service phase"
      );
    });

    it("should start new day from debrief", () => {
      const state = createDayState();
      const serviceState = startService(state);
      const debriefState = endService(serviceState);
      const newDayState = startNewDay(debriefState);

      expect(newDayState.dayNumber).toBe(2);
      expect(newDayState.phase).toBe("prep");
      expect(newDayState.stats.customersServed).toBe(0);
      expect(newDayState.openTime).toBeNull();
      expect(newDayState.closeTime).toBeNull();
    });

    it("should throw error when starting new day from non-debrief phase", () => {
      const state = createDayState();

      expect(() => startNewDay(state)).toThrow(
        "Can only start new day from debrief phase"
      );
    });
  });

  describe("recordCustomer", () => {
    it("should record customer stats during service", () => {
      const state = createDayState();
      const serviceState = startService(state);

      const updatedState = recordCustomer(serviceState, {
        earnings: 4.5,
        quality: 85,
        isReturning: false,
        isRegular: false,
        drinkType: "latte",
      });

      expect(updatedState.stats.customersServed).toBe(1);
      expect(updatedState.stats.totalEarnings).toBe(4.5);
      expect(updatedState.stats.averageQuality).toBe(85);
      expect(updatedState.stats.newCustomers).toBe(1);
      expect(updatedState.stats.returningCustomers).toBe(0);
      expect(updatedState.stats.drinksBrewedByType["latte"]).toBe(1);
    });

    it("should track returning customers", () => {
      const state = createDayState();
      const serviceState = startService(state);

      const state1 = recordCustomer(serviceState, {
        earnings: 4.5,
        quality: 85,
        isReturning: true,
        isRegular: false,
        drinkType: "latte",
      });

      expect(state1.stats.returningCustomers).toBe(1);
      expect(state1.stats.newCustomers).toBe(0);
    });

    it("should calculate average quality correctly", () => {
      const state = createDayState();
      let serviceState = startService(state);

      serviceState = recordCustomer(serviceState, {
        earnings: 4.5,
        quality: 90,
        isReturning: false,
        isRegular: false,
        drinkType: "latte",
      });

      serviceState = recordCustomer(serviceState, {
        earnings: 3.0,
        quality: 80,
        isReturning: false,
        isRegular: false,
        drinkType: "espresso",
      });

      expect(serviceState.stats.averageQuality).toBe(85); // (90 + 80) / 2
    });

    it("should track drinks brewed by type", () => {
      const state = createDayState();
      let serviceState = startService(state);

      serviceState = recordCustomer(serviceState, {
        earnings: 4.5,
        quality: 85,
        isReturning: false,
        isRegular: false,
        drinkType: "latte",
      });

      serviceState = recordCustomer(serviceState, {
        earnings: 4.5,
        quality: 85,
        isReturning: false,
        isRegular: false,
        drinkType: "latte",
      });

      serviceState = recordCustomer(serviceState, {
        earnings: 3.0,
        quality: 85,
        isReturning: false,
        isRegular: false,
        drinkType: "espresso",
      });

      expect(serviceState.stats.drinksBrewedByType["latte"]).toBe(2);
      expect(serviceState.stats.drinksBrewedByType["espresso"]).toBe(1);
    });
  });

  describe("inventory management", () => {
    it("should calculate restock cost based on day number", () => {
      expect(getRestockCost(1)).toBe(50);
      expect(getRestockCost(2)).toBe(55);
      expect(getRestockCost(5)).toBe(70);
    });

    it("should restock beans and milk", () => {
      const inventory = createInventory();
      const originalBeans = inventory.beans[0].grams;
      const originalWholeMilk = inventory.milks.whole;

      const restocked = restockInventory(inventory, 1);

      expect(restocked.beans[0].grams).toBe(originalBeans + 500);
      expect(restocked.milks.whole).toBe(originalWholeMilk + 2000);
    });
  });

  describe("day summary", () => {
    it("should generate day summary", () => {
      const state = createDayState();
      let serviceState = startService(state);

      // Add some customer data
      for (let i = 0; i < 20; i++) {
        serviceState = recordCustomer(serviceState, {
          earnings: 4.5,
          quality: 85,
          isReturning: i % 2 === 0,
          isRegular: i > 10,
          drinkType: i % 3 === 0 ? "latte" : "espresso",
        });
      }

      const debriefState = endService(serviceState);
      const summary = getDaySummary(debriefState);

      expect(summary.dayNumber).toBe(1);
      expect(summary.customersServed).toBe(20);
      expect(summary.targetCustomers).toBe(20);
      expect(summary.totalEarnings).toBe(90); // 20 * 4.5
      expect(summary.averageQuality).toBe(85);
      expect(summary.returningRate).toBe(50); // 10 out of 20
    });

    it("should determine excellent performance", () => {
      const state = createDayState();
      let serviceState = startService(state);

      // Meet target with high quality and good returning rate
      for (let i = 0; i < 20; i++) {
        serviceState = recordCustomer(serviceState, {
          earnings: 4.5,
          quality: 90,
          isReturning: i % 2 === 0, // 50% returning
          isRegular: false,
          drinkType: "latte",
        });
      }

      const debriefState = endService(serviceState);
      const summary = getDaySummary(debriefState);

      expect(summary.performance).toBe("excellent");
    });

    it("should determine good performance", () => {
      const state = createDayState();
      let serviceState = startService(state);

      // Meet target with high quality but low returning rate
      for (let i = 0; i < 20; i++) {
        serviceState = recordCustomer(serviceState, {
          earnings: 4.5,
          quality: 90,
          isReturning: false, // 0% returning
          isRegular: false,
          drinkType: "latte",
        });
      }

      const debriefState = endService(serviceState);
      const summary = getDaySummary(debriefState);

      expect(summary.performance).toBe("good");
    });

    it("should determine fair performance", () => {
      const state = createDayState();
      let serviceState = startService(state);

      // Meet target but low quality
      for (let i = 0; i < 20; i++) {
        serviceState = recordCustomer(serviceState, {
          earnings: 4.5,
          quality: 70,
          isReturning: false,
          isRegular: false,
          drinkType: "latte",
        });
      }

      const debriefState = endService(serviceState);
      const summary = getDaySummary(debriefState);

      expect(summary.performance).toBe("fair");
    });

    it("should determine poor performance", () => {
      const state = createDayState();
      let serviceState = startService(state);

      // Don't meet target with low quality
      for (let i = 0; i < 10; i++) {
        serviceState = recordCustomer(serviceState, {
          earnings: 4.5,
          quality: 70,
          isReturning: false,
          isRegular: false,
          drinkType: "latte",
        });
      }

      const debriefState = endService(serviceState);
      const summary = getDaySummary(debriefState);

      expect(summary.performance).toBe("poor");
    });

    it("should identify top drink", () => {
      const state = createDayState();
      let serviceState = startService(state);

      serviceState = recordCustomer(serviceState, {
        earnings: 4.5,
        quality: 85,
        isReturning: false,
        isRegular: false,
        drinkType: "latte",
      });

      serviceState = recordCustomer(serviceState, {
        earnings: 4.5,
        quality: 85,
        isReturning: false,
        isRegular: false,
        drinkType: "latte",
      });

      serviceState = recordCustomer(serviceState, {
        earnings: 3.0,
        quality: 85,
        isReturning: false,
        isRegular: false,
        drinkType: "espresso",
      });

      const debriefState = endService(serviceState);
      const summary = getDaySummary(debriefState);

      expect(summary.topDrink).toBe("latte");
    });
  });

  describe("performance helpers", () => {
    it("should get performance emoji", () => {
      expect(getPerformanceEmoji("excellent")).toBe("⭐");
      expect(getPerformanceEmoji("good")).toBe("👍");
      expect(getPerformanceEmoji("fair")).toBe("👌");
      expect(getPerformanceEmoji("poor")).toBe("📉");
    });

    it("should get performance description", () => {
      expect(getPerformanceDescription("excellent")).toContain("Outstanding");
      expect(getPerformanceDescription("good")).toContain("Solid");
      expect(getPerformanceDescription("fair")).toContain("Decent");
      expect(getPerformanceDescription("poor")).toContain("Challenging");
    });
  });

  describe("target customers progression", () => {
    it("should increase target customers each day", () => {
      let state = createDayState();
      expect(state.targetCustomers).toBe(20);

      state = startService(state);
      state = endService(state);
      state = startNewDay(state);
      expect(state.targetCustomers).toBe(22);

      state = startService(state);
      state = endService(state);
      state = startNewDay(state);
      expect(state.targetCustomers).toBe(24);
    });

    it("should cap target customers at 50", () => {
      let state = createDayState();

      // Simulate many days
      for (let i = 0; i < 20; i++) {
        state = startService(state);
        state = endService(state);
        state = startNewDay(state);
      }

      expect(state.targetCustomers).toBe(50); // Should be capped
    });
  });
});
