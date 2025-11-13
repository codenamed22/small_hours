/**
 * Tests for Pricing System
 */

import { describe, it, expect } from "vitest";
import {
  calculateDrinkPrice,
  calculateFoodPrice,
  calculatePriceQuote,
  describeOrderItem,
  formatPriceQuote,
  DRINK_BASE_PRICES,
  FOOD_BASE_PRICES,
  SIZE_MULTIPLIERS,
  type DrinkOrderItem,
  type FoodOrderItem,
} from "./pricing";

describe("Pricing System", () => {
  describe("calculateDrinkPrice", () => {
    it("should calculate base price for medium drink with no modifiers", () => {
      const result = calculateDrinkPrice("latte");
      expect(result.basePrice).toBe(4.5);
      expect(result.modifierPrice).toBe(0);
      expect(result.totalPrice).toBe(4.5);
    });

    it("should apply size multiplier for small drink", () => {
      const result = calculateDrinkPrice("latte", { size: "small" });
      const expectedPrice = 4.5 * 0.8; // small = 0.8x
      expect(result.totalPrice).toBe(expectedPrice);
      expect(result.modifierPrice).toBe(expectedPrice - 4.5);
    });

    it("should apply size multiplier for large drink", () => {
      const result = calculateDrinkPrice("latte", { size: "large" });
      const expectedPrice = 4.5 * 1.3; // large = 1.3x
      expect(result.totalPrice).toBe(expectedPrice);
      expect(result.modifierPrice).toBe(expectedPrice - 4.5);
    });

    it("should add extra shot cost", () => {
      const result = calculateDrinkPrice("latte", { extraShot: true });
      expect(result.totalPrice).toBe(4.5 + 1.0);
      expect(result.modifierPrice).toBe(1.0);
    });

    it("should add syrup cost", () => {
      const result = calculateDrinkPrice("latte", { syrup: "vanilla" });
      expect(result.totalPrice).toBe(4.5 + 0.75);
      expect(result.modifierPrice).toBe(0.75);
    });

    it("should add alternative milk cost", () => {
      const result = calculateDrinkPrice("latte", { milk: "oat" });
      expect(result.totalPrice).toBe(4.5 + 0.75);
      expect(result.modifierPrice).toBe(0.75);
    });

    it("should not charge for whole or skim milk", () => {
      const resultWhole = calculateDrinkPrice("latte", { milk: "whole" });
      expect(resultWhole.modifierPrice).toBe(0);

      const resultSkim = calculateDrinkPrice("latte", { milk: "skim" });
      expect(resultSkim.modifierPrice).toBe(0);
    });

    it("should combine multiple modifiers", () => {
      const result = calculateDrinkPrice("latte", {
        size: "large",
        extraShot: true,
        milk: "oat",
        whippedCream: true,
      });

      const sizePrice = 4.5 * 1.3;
      const expectedTotal = sizePrice + 1.0 + 0.75 + 0.5;
      expect(result.totalPrice).toBeCloseTo(expectedTotal, 2);
    });

    it("should not charge for decaf", () => {
      const result = calculateDrinkPrice("latte", { decaf: true });
      expect(result.modifierPrice).toBe(0);
      expect(result.totalPrice).toBe(4.5);
    });

    it("should not charge for iced", () => {
      const result = calculateDrinkPrice("latte", { temp: "iced" });
      expect(result.modifierPrice).toBe(0);
      expect(result.totalPrice).toBe(4.5);
    });
  });

  describe("calculateFoodPrice", () => {
    it("should calculate base price for food", () => {
      const result = calculateFoodPrice("croissant");
      expect(result.basePrice).toBe(3.5);
      expect(result.modifierPrice).toBe(0);
      expect(result.totalPrice).toBe(3.5);
    });

    it("should not charge for warming", () => {
      const result = calculateFoodPrice("croissant", true);
      expect(result.modifierPrice).toBe(0);
      expect(result.totalPrice).toBe(3.5);
    });

    it("should calculate prices for all food types", () => {
      expect(calculateFoodPrice("croissant").totalPrice).toBe(3.5);
      expect(calculateFoodPrice("banana_bread").totalPrice).toBe(3.0);
      expect(calculateFoodPrice("bagel").totalPrice).toBe(2.5);
      expect(calculateFoodPrice("muffin").totalPrice).toBe(3.0);
    });
  });

  describe("describeOrderItem", () => {
    it("should describe basic drink", () => {
      const item: DrinkOrderItem = {
        type: "drink",
        sku: "latte",
        quantity: 1,
      };
      expect(describeOrderItem(item)).toBe("Latte");
    });

    it("should describe drink with size", () => {
      const item: DrinkOrderItem = {
        type: "drink",
        sku: "latte",
        quantity: 1,
        modifiers: { size: "large" },
      };
      expect(describeOrderItem(item)).toBe("large Latte");
    });

    it("should describe iced drink", () => {
      const item: DrinkOrderItem = {
        type: "drink",
        sku: "latte",
        quantity: 1,
        modifiers: { temp: "iced" },
      };
      expect(describeOrderItem(item)).toBe("iced Latte");
    });

    it("should describe drink with alternative milk", () => {
      const item: DrinkOrderItem = {
        type: "drink",
        sku: "latte",
        quantity: 1,
        modifiers: { milk: "oat" },
      };
      expect(describeOrderItem(item)).toBe("Latte w/ oat milk");
    });

    it("should describe drink with all modifiers", () => {
      const item: DrinkOrderItem = {
        type: "drink",
        sku: "latte",
        quantity: 1,
        modifiers: {
          size: "large",
          temp: "iced",
          milk: "oat",
          syrup: "vanilla",
          extraShot: true,
          whippedCream: true,
          decaf: true,
        },
      };
      const description = describeOrderItem(item);
      expect(description).toContain("large");
      expect(description).toContain("iced");
      expect(description).toContain("decaf");
      expect(description).toContain("oat milk");
      expect(description).toContain("vanilla syrup");
      expect(description).toContain("extra shot");
      expect(description).toContain("whipped cream");
    });

    it("should describe food item", () => {
      const item: FoodOrderItem = {
        type: "food",
        sku: "croissant",
        quantity: 1,
      };
      expect(describeOrderItem(item)).toBe("Croissant");
    });

    it("should describe warmed food item", () => {
      const item: FoodOrderItem = {
        type: "food",
        sku: "banana_bread",
        quantity: 1,
        warm: true,
      };
      expect(describeOrderItem(item)).toBe("Banana bread (warmed)");
    });
  });

  describe("calculatePriceQuote", () => {
    it("should calculate quote for single drink", () => {
      const items: DrinkOrderItem[] = [
        {
          type: "drink",
          sku: "latte",
          quantity: 1,
        },
      ];

      const quote = calculatePriceQuote(items);
      expect(quote.subtotal).toBe(4.5);
      expect(quote.tax).toBe(4.5 * 0.08);
      expect(quote.total).toBe(4.5 * 1.08);
      expect(quote.breakdown).toHaveLength(1);
      expect(quote.breakdown[0].sku).toBe("latte");
      expect(quote.breakdown[0].totalPrice).toBe(4.5);
    });

    it("should calculate quote for multiple items", () => {
      const items = [
        { type: "drink" as const, sku: "latte" as const, quantity: 2 },
        { type: "food" as const, sku: "croissant" as const, quantity: 1 },
      ];

      const quote = calculatePriceQuote(items);
      const expectedSubtotal = 4.5 * 2 + 3.5;
      expect(quote.subtotal).toBe(expectedSubtotal);
      expect(quote.tax).toBeCloseTo(expectedSubtotal * 0.08, 2);
      expect(quote.total).toBeCloseTo(expectedSubtotal * 1.08, 2);
      expect(quote.breakdown).toHaveLength(2);
    });

    it("should handle quantities correctly", () => {
      const items: DrinkOrderItem[] = [
        {
          type: "drink",
          sku: "espresso",
          quantity: 3,
        },
      ];

      const quote = calculatePriceQuote(items);
      expect(quote.subtotal).toBe(3.0 * 3);
      expect(quote.breakdown[0].totalPrice).toBe(3.0 * 3);
    });

    it("should calculate quote with modifiers", () => {
      const items: DrinkOrderItem[] = [
        {
          type: "drink",
          sku: "latte",
          quantity: 1,
          modifiers: {
            size: "large",
            extraShot: true,
            milk: "oat",
          },
        },
      ];

      const quote = calculatePriceQuote(items);
      const expectedPrice = 4.5 * 1.3 + 1.0 + 0.75;
      expect(quote.subtotal).toBeCloseTo(expectedPrice, 2);
    });

    it("should round prices to 2 decimal places", () => {
      const items: DrinkOrderItem[] = [
        {
          type: "drink",
          sku: "latte",
          quantity: 1,
          modifiers: { size: "large" },
        },
      ];

      const quote = calculatePriceQuote(items);
      expect(quote.total.toString()).toMatch(/^\d+\.\d{2}$/);
      expect(quote.subtotal.toString()).toMatch(/^\d+\.\d{2}$/);
      expect(quote.tax.toString()).toMatch(/^\d+\.\d{2}$/);
    });
  });

  describe("formatPriceQuote", () => {
    it("should format quote as readable string", () => {
      const items: DrinkOrderItem[] = [
        {
          type: "drink",
          sku: "latte",
          quantity: 1,
        },
      ];

      const quote = calculatePriceQuote(items);
      const formatted = formatPriceQuote(quote);

      expect(formatted).toContain("PRICE QUOTE");
      expect(formatted).toContain("Latte");
      expect(formatted).toContain("$4.50");
      expect(formatted).toContain("Subtotal");
      expect(formatted).toContain("Tax");
      expect(formatted).toContain("Total");
    });
  });
});
