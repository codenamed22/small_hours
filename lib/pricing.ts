/**
 * Pricing System
 *
 * Handles price quotes, modifiers, sizes, and add-ons for Phase 1.
 */

import type { DrinkType, FoodType, MilkType } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export type OrderSize = "small" | "medium" | "large";
export type OrderTemp = "hot" | "iced";

export interface OrderModifiers {
  size?: OrderSize;
  temp?: OrderTemp;
  milk?: MilkType;
  extraShot?: boolean;
  decaf?: boolean;
  syrup?: string; // flavor name
  whippedCream?: boolean;
}

export interface DrinkOrderItem {
  type: "drink";
  sku: DrinkType;
  quantity: number;
  modifiers?: OrderModifiers;
}

export interface FoodOrderItem {
  type: "food";
  sku: FoodType;
  quantity: number;
  warm?: boolean; // for pastries
}

export type OrderItem = DrinkOrderItem | FoodOrderItem;

export interface PriceBreakdown {
  sku: string;
  basePrice: number;
  modifierPrice: number;
  totalPrice: number;
  description: string;
}

export interface PriceQuote {
  total: number;
  subtotal: number;
  tax: number;
  breakdown: PriceBreakdown[];
}

// ============================================================================
// BASE PRICING
// ============================================================================

export const DRINK_BASE_PRICES: Record<DrinkType, number> = {
  espresso: 3.0,
  latte: 4.5,
  cappuccino: 4.5,
  pourover: 5.0,
  aeropress: 4.0,
  mocha: 5.0,
  americano: 3.5,
  matcha: 5.5,
};

export const FOOD_BASE_PRICES: Record<FoodType, number> = {
  croissant: 3.5,
  banana_bread: 3.0,
  bagel: 2.5,
  muffin: 3.0,
};

// ============================================================================
// MODIFIER PRICING
// ============================================================================

export const SIZE_MULTIPLIERS: Record<OrderSize, number> = {
  small: 0.8, // -20%
  medium: 1.0, // base
  large: 1.3, // +30%
};

export const MODIFIER_PRICES = {
  extraShot: 1.0,
  decaf: 0.0, // free
  iced: 0.0, // free
  whippedCream: 0.5,
  syrup: 0.75,
  milkUpgrade: {
    none: 0.0,
    whole: 0.0,
    skim: 0.0,
    oat: 0.75,
    almond: 0.75,
  },
  warming: 0.0, // free for food
};

export const TAX_RATE = 0.08; // 8% tax

// ============================================================================
// PRICING FUNCTIONS
// ============================================================================

/**
 * Calculate price for a drink with modifiers
 */
export function calculateDrinkPrice(
  drinkType: DrinkType,
  modifiers?: OrderModifiers
): { basePrice: number; modifierPrice: number; totalPrice: number } {
  const basePrice = DRINK_BASE_PRICES[drinkType];
  let modifierPrice = 0;

  if (modifiers) {
    // Size modifier
    const sizeMultiplier = SIZE_MULTIPLIERS[modifiers.size || "medium"];
    const sizedPrice = basePrice * sizeMultiplier;
    modifierPrice = sizedPrice - basePrice;

    // Add-ons
    if (modifiers.extraShot) modifierPrice += MODIFIER_PRICES.extraShot;
    if (modifiers.whippedCream) modifierPrice += MODIFIER_PRICES.whippedCream;
    if (modifiers.syrup) modifierPrice += MODIFIER_PRICES.syrup;
    if (modifiers.milk && modifiers.milk !== "none") {
      modifierPrice += MODIFIER_PRICES.milkUpgrade[modifiers.milk];
    }
  }

  const totalPrice = basePrice + modifierPrice;

  return {
    basePrice,
    modifierPrice,
    totalPrice,
  };
}

/**
 * Calculate price for a food item
 */
export function calculateFoodPrice(
  foodType: FoodType,
  warm?: boolean
): { basePrice: number; modifierPrice: number; totalPrice: number } {
  const basePrice = FOOD_BASE_PRICES[foodType];
  const modifierPrice = 0; // warming is free

  return {
    basePrice,
    modifierPrice,
    totalPrice: basePrice,
  };
}

/**
 * Generate a readable description for an order item
 */
export function describeOrderItem(item: OrderItem): string {
  if (item.type === "drink") {
    const parts: string[] = [];

    // Size
    if (item.modifiers?.size && item.modifiers.size !== "medium") {
      parts.push(item.modifiers.size);
    }

    // Temp
    if (item.modifiers?.temp === "iced") {
      parts.push("iced");
    }

    // Decaf
    if (item.modifiers?.decaf) {
      parts.push("decaf");
    }

    // Drink name
    const drinkName = item.sku.charAt(0).toUpperCase() + item.sku.slice(1);
    parts.push(drinkName);

    // Milk
    if (item.modifiers?.milk && item.modifiers.milk !== "none" && item.modifiers.milk !== "whole") {
      parts.push(`w/ ${item.modifiers.milk} milk`);
    }

    // Syrup
    if (item.modifiers?.syrup) {
      parts.push(`w/ ${item.modifiers.syrup} syrup`);
    }

    // Extra shot
    if (item.modifiers?.extraShot) {
      parts.push("+ extra shot");
    }

    // Whipped cream
    if (item.modifiers?.whippedCream) {
      parts.push("+ whipped cream");
    }

    return parts.join(" ");
  } else {
    // Food item
    const foodName = item.sku.replace("_", " ");
    const name = foodName.charAt(0).toUpperCase() + foodName.slice(1);
    return item.warm ? `${name} (warmed)` : name;
  }
}

/**
 * Calculate price quote for an order
 */
export function calculatePriceQuote(items: OrderItem[]): PriceQuote {
  const breakdown: PriceBreakdown[] = [];
  let subtotal = 0;

  for (const item of items) {
    let itemPrice: { basePrice: number; modifierPrice: number; totalPrice: number };
    let description: string;

    if (item.type === "drink") {
      itemPrice = calculateDrinkPrice(item.sku, item.modifiers);
      description = describeOrderItem(item);
    } else {
      itemPrice = calculateFoodPrice(item.sku, item.warm);
      description = describeOrderItem(item);
    }

    const lineTotal = itemPrice.totalPrice * item.quantity;
    subtotal += lineTotal;

    breakdown.push({
      sku: item.sku,
      basePrice: itemPrice.basePrice,
      modifierPrice: itemPrice.modifierPrice,
      totalPrice: lineTotal,
      description,
    });
  }

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return {
    total: Number(total.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    breakdown,
  };
}

/**
 * Format price quote as a readable string
 */
export function formatPriceQuote(quote: PriceQuote): string {
  const lines: string[] = ["=== PRICE QUOTE ===", ""];

  for (const item of quote.breakdown) {
    const price = item.totalPrice.toFixed(2);
    lines.push(`${item.description.padEnd(40)} $${price}`);
  }

  lines.push("");
  lines.push(`${"Subtotal:".padEnd(40)} $${quote.subtotal.toFixed(2)}`);
  lines.push(`${"Tax (8%):".padEnd(40)} $${quote.tax.toFixed(2)}`);
  lines.push(`${"Total:".padEnd(40)} $${quote.total.toFixed(2)}`);

  return lines.join("\n");
}
