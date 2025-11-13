/**
 * Inventory Management System
 *
 * Tracks stock levels for:
 * - Coffee beans (grams)
 * - Milk (ml, different types)
 * - Syrups (ml, flavors)
 * - Food items (count)
 */

import type { MilkType, DrinkType, BrewParameters } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface BeanStock {
  name: string
  grams: number
  roastDate: string // ISO date string
}

export interface Inventory {
  beans: BeanStock[]
  milks: Record<MilkType, number> // ml
  syrups: Record<string, number> // ml
  food: Record<string, number> // count
}

export interface StockRequirement {
  beans?: number // grams
  milk?: { type: MilkType; amount: number } // ml
  syrups?: Record<string, number> // ml
  food?: Record<string, number> // count
}

export interface StockCheckResult {
  available: boolean
  missing: string[]
}

// ============================================================================
// CONSTANTS - Stock requirements per drink
// ============================================================================

const BEANS_PER_SHOT = 18 // grams per espresso shot
const MILK_PER_DRINK: Record<DrinkType, number> = {
  espresso: 0,
  latte: 240, // ml (8 oz)
  cappuccino: 180, // ml (6 oz)
  pourover: 0,
  aeropress: 0,
  mocha: 240, // ml (8 oz with chocolate)
  americano: 0,
  matcha: 240, // ml (8 oz)
}

// ============================================================================
// INVENTORY CREATION
// ============================================================================

/**
 * Create a new inventory with starting stock
 */
export function createInventory(): Inventory {
  return {
    beans: [
      {
        name: 'House Blend',
        grams: 1000,
        roastDate: new Date().toISOString(),
      },
    ],
    milks: {
      none: 0,
      whole: 3000, // 3 liters
      skim: 1000,
      oat: 1000,
      almond: 500,
    },
    syrups: {
      vanilla: 500,
      caramel: 500,
      hazelnut: 250,
    },
    food: {
      croissant: 10,
      'banana bread': 8,
      bagel: 12,
      muffin: 6,
    },
  }
}

// ============================================================================
// STOCK CHECKING
// ============================================================================

/**
 * Check if inventory has sufficient stock for a drink
 */
export function checkStock(
  inventory: Inventory,
  drinkType: DrinkType,
  params: BrewParameters
): StockCheckResult {
  const missing: string[] = []

  // Check beans
  const beansNeeded = BEANS_PER_SHOT
  const totalBeans = inventory.beans.reduce((sum, bean) => sum + bean.grams, 0)
  if (totalBeans < beansNeeded) {
    missing.push(`coffee beans (need ${beansNeeded}g, have ${totalBeans}g)`)
  }

  // Check milk (if needed)
  const milkNeeded = MILK_PER_DRINK[drinkType]
  if (milkNeeded > 0 && params.milkType && params.milkType !== 'none') {
    const milkAvailable = inventory.milks[params.milkType] || 0
    if (milkAvailable < milkNeeded) {
      missing.push(`${params.milkType} milk (need ${milkNeeded}ml, have ${milkAvailable}ml)`)
    }
  }

  return {
    available: missing.length === 0,
    missing,
  }
}

/**
 * Calculate stock requirements for a drink
 */
export function getStockRequirements(
  drinkType: DrinkType,
  params: BrewParameters
): StockRequirement {
  const requirements: StockRequirement = {
    beans: BEANS_PER_SHOT,
  }

  // Add milk if needed
  const milkNeeded = MILK_PER_DRINK[drinkType]
  if (milkNeeded > 0 && params.milkType && params.milkType !== 'none') {
    requirements.milk = {
      type: params.milkType,
      amount: milkNeeded,
    }
  }

  return requirements
}

// ============================================================================
// STOCK DEPLETION
// ============================================================================

/**
 * Deduct stock from inventory after brewing a drink
 * Returns new inventory state (immutable)
 */
export function depleteStock(
  inventory: Inventory,
  drinkType: DrinkType,
  params: BrewParameters
): Inventory {
  const requirements = getStockRequirements(drinkType, params)

  // Create new inventory (immutable update)
  const newInventory: Inventory = {
    beans: [...inventory.beans],
    milks: { ...inventory.milks },
    syrups: { ...inventory.syrups },
    food: { ...inventory.food },
  }

  // Deduct beans
  if (requirements.beans) {
    let remaining = requirements.beans
    newInventory.beans = newInventory.beans.map((bean) => {
      if (remaining > 0) {
        const deduct = Math.min(remaining, bean.grams)
        remaining -= deduct
        return { ...bean, grams: bean.grams - deduct }
      }
      return bean
    }).filter((bean) => bean.grams > 0) // Remove empty bean bags
  }

  // Deduct milk
  if (requirements.milk) {
    const { type, amount } = requirements.milk
    newInventory.milks[type] = Math.max(0, newInventory.milks[type] - amount)
  }

  return newInventory
}

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

/**
 * Add stock to inventory
 */
export function addStock(
  inventory: Inventory,
  item: 'beans' | 'milk' | 'syrup' | 'food',
  details: {
    name?: string
    type?: MilkType
    amount: number
    roastDate?: string
  }
): Inventory {
  const newInventory = { ...inventory }

  switch (item) {
    case 'beans':
      if (details.name) {
        newInventory.beans = [
          ...inventory.beans,
          {
            name: details.name,
            grams: details.amount,
            roastDate: details.roastDate || new Date().toISOString(),
          },
        ]
      }
      break

    case 'milk':
      if (details.type) {
        newInventory.milks = {
          ...inventory.milks,
          [details.type]: inventory.milks[details.type] + details.amount,
        }
      }
      break

    case 'syrup':
      if (details.name) {
        newInventory.syrups = {
          ...inventory.syrups,
          [details.name]: (inventory.syrups[details.name] || 0) + details.amount,
        }
      }
      break

    case 'food':
      if (details.name) {
        newInventory.food = {
          ...inventory.food,
          [details.name]: (inventory.food[details.name] || 0) + details.amount,
        }
      }
      break
  }

  return newInventory
}

/**
 * Get total beans available
 */
export function getTotalBeans(inventory: Inventory): number {
  return inventory.beans.reduce((sum, bean) => sum + bean.grams, 0)
}

/**
 * Get available milk types with stock > 0
 */
export function getAvailableMilkTypes(inventory: Inventory): MilkType[] {
  return (Object.entries(inventory.milks) as [MilkType, number][])
    .filter(([type, amount]) => type !== 'none' && amount > 0)
    .map(([type]) => type)
}

/**
 * Check if inventory is low on any items
 */
export function getLowStockWarnings(inventory: Inventory): string[] {
  const warnings: string[] = []

  // Check beans
  const totalBeans = getTotalBeans(inventory)
  if (totalBeans < 100) {
    warnings.push(`Low on coffee beans (${totalBeans}g remaining)`)
  }

  // Check milks
  Object.entries(inventory.milks).forEach(([type, amount]) => {
    if (type !== 'none' && amount > 0 && amount < 200) {
      warnings.push(`Low on ${type} milk (${amount}ml remaining)`)
    }
  })

  return warnings
}

// ============================================================================
// EXPORTS
// ============================================================================

export { BEANS_PER_SHOT, MILK_PER_DRINK }
