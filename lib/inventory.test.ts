/**
 * Tests for Inventory Management System
 */

import { describe, it, expect } from 'vitest'
import {
  createInventory,
  checkStock,
  getStockRequirements,
  depleteStock,
  addStock,
  getTotalBeans,
  getAvailableMilkTypes,
  getLowStockWarnings,
  BEANS_PER_SHOT,
  MILK_PER_DRINK,
} from './inventory'
import type { BrewParameters } from './types'

describe('createInventory', () => {
  it('creates inventory with starting stock', () => {
    const inventory = createInventory()

    expect(inventory.beans.length).toBeGreaterThan(0)
    expect(inventory.beans[0].grams).toBeGreaterThan(0)
    expect(inventory.milks.whole).toBeGreaterThan(0)
    expect(inventory.syrups.vanilla).toBeGreaterThan(0)
    expect(inventory.food.croissant).toBeGreaterThan(0)
  })

  it('has valid roast date', () => {
    const inventory = createInventory()
    const roastDate = new Date(inventory.beans[0].roastDate)

    expect(roastDate).toBeInstanceOf(Date)
    expect(roastDate.getTime()).toBeLessThanOrEqual(Date.now())
  })
})

describe('checkStock', () => {
  it('returns available for espresso with sufficient beans', () => {
    const inventory = createInventory()
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const result = checkStock(inventory, 'espresso', params)

    expect(result.available).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('returns unavailable when beans are low', () => {
    const inventory = createInventory()
    inventory.beans = [{ name: 'House', grams: 10, roastDate: new Date().toISOString() }]

    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const result = checkStock(inventory, 'espresso', params)

    expect(result.available).toBe(false)
    expect(result.missing.length).toBeGreaterThan(0)
    expect(result.missing[0]).toContain('coffee beans')
  })

  it('checks milk availability for latte', () => {
    const inventory = createInventory()
    inventory.milks.whole = 0 // Out of whole milk

    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
      milkType: 'whole',
      milkTemp: 150,
      foamAmount: 20,
    }

    const result = checkStock(inventory, 'latte', params)

    expect(result.available).toBe(false)
    expect(result.missing.some(m => m.includes('milk'))).toBe(true)
  })

  it('passes with sufficient milk', () => {
    const inventory = createInventory()
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
      milkType: 'oat',
      milkTemp: 150,
      foamAmount: 20,
    }

    const result = checkStock(inventory, 'latte', params)

    expect(result.available).toBe(true)
  })
})

describe('getStockRequirements', () => {
  it('returns beans for espresso', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const reqs = getStockRequirements('espresso', params)

    expect(reqs.beans).toBe(BEANS_PER_SHOT)
    expect(reqs.milk).toBeUndefined()
  })

  it('returns beans and milk for latte', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
      milkType: 'whole',
      milkTemp: 150,
      foamAmount: 20,
    }

    const reqs = getStockRequirements('latte', params)

    expect(reqs.beans).toBe(BEANS_PER_SHOT)
    expect(reqs.milk).toBeDefined()
    expect(reqs.milk?.type).toBe('whole')
    expect(reqs.milk?.amount).toBe(MILK_PER_DRINK.latte)
  })

  it('does not require milk for pourover', () => {
    const params: BrewParameters = {
      grindSize: 'medium',
      temperature: 205,
      brewTime: 180,
      bloomTime: 30,
    }

    const reqs = getStockRequirements('pourover', params)

    expect(reqs.beans).toBe(BEANS_PER_SHOT)
    expect(reqs.milk).toBeUndefined()
  })
})

describe('depleteStock', () => {
  it('deducts beans after brewing espresso', () => {
    const inventory = createInventory()
    const initialBeans = getTotalBeans(inventory)

    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const newInventory = depleteStock(inventory, 'espresso', params)
    const finalBeans = getTotalBeans(newInventory)

    expect(finalBeans).toBe(initialBeans - BEANS_PER_SHOT)
  })

  it('deducts milk after brewing latte', () => {
    const inventory = createInventory()
    const initialMilk = inventory.milks.whole

    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
      milkType: 'whole',
      milkTemp: 150,
      foamAmount: 20,
    }

    const newInventory = depleteStock(inventory, 'latte', params)

    expect(newInventory.milks.whole).toBe(initialMilk - MILK_PER_DRINK.latte)
  })

  it('does not mutate original inventory', () => {
    const inventory = createInventory()
    const originalBeans = getTotalBeans(inventory)

    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    depleteStock(inventory, 'espresso', params)

    expect(getTotalBeans(inventory)).toBe(originalBeans)
  })

  it('removes empty bean bags', () => {
    const inventory = createInventory()
    inventory.beans = [{ name: 'House', grams: 18, roastDate: new Date().toISOString() }]

    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const newInventory = depleteStock(inventory, 'espresso', params)

    expect(newInventory.beans).toHaveLength(0)
  })

  it('deducts from multiple bean bags in order', () => {
    const inventory = createInventory()
    inventory.beans = [
      { name: 'Bag 1', grams: 10, roastDate: new Date().toISOString() },
      { name: 'Bag 2', grams: 20, roastDate: new Date().toISOString() },
    ]

    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const newInventory = depleteStock(inventory, 'espresso', params)

    expect(newInventory.beans).toHaveLength(1)
    expect(newInventory.beans[0].name).toBe('Bag 2')
    expect(newInventory.beans[0].grams).toBe(12) // 20 - 8 (remaining from 18g deduction)
  })
})

describe('addStock', () => {
  it('adds new bean bag', () => {
    const inventory = createInventory()
    const initialBags = inventory.beans.length

    const newInventory = addStock(inventory, 'beans', {
      name: 'Ethiopian',
      amount: 500,
      roastDate: '2025-01-01',
    })

    expect(newInventory.beans).toHaveLength(initialBags + 1)
    expect(newInventory.beans[newInventory.beans.length - 1].name).toBe('Ethiopian')
    expect(newInventory.beans[newInventory.beans.length - 1].grams).toBe(500)
  })

  it('adds milk', () => {
    const inventory = createInventory()
    const initialOat = inventory.milks.oat

    const newInventory = addStock(inventory, 'milk', {
      type: 'oat',
      amount: 1000,
    })

    expect(newInventory.milks.oat).toBe(initialOat + 1000)
  })

  it('adds new syrup flavor', () => {
    const inventory = createInventory()

    const newInventory = addStock(inventory, 'syrup', {
      name: 'pumpkin spice',
      amount: 250,
    })

    expect(newInventory.syrups['pumpkin spice']).toBe(250)
  })

  it('adds food item', () => {
    const inventory = createInventory()
    const initialCroissants = inventory.food.croissant

    const newInventory = addStock(inventory, 'food', {
      name: 'croissant',
      amount: 5,
    })

    expect(newInventory.food.croissant).toBe(initialCroissants + 5)
  })
})

describe('getTotalBeans', () => {
  it('sums beans from multiple bags', () => {
    const inventory = createInventory()
    inventory.beans = [
      { name: 'Bag 1', grams: 100, roastDate: new Date().toISOString() },
      { name: 'Bag 2', grams: 200, roastDate: new Date().toISOString() },
      { name: 'Bag 3', grams: 300, roastDate: new Date().toISOString() },
    ]

    expect(getTotalBeans(inventory)).toBe(600)
  })

  it('returns 0 for empty inventory', () => {
    const inventory = createInventory()
    inventory.beans = []

    expect(getTotalBeans(inventory)).toBe(0)
  })
})

describe('getAvailableMilkTypes', () => {
  it('returns milk types with stock > 0', () => {
    const inventory = createInventory()
    inventory.milks.whole = 1000
    inventory.milks.oat = 500
    inventory.milks.almond = 0
    inventory.milks.skim = 0

    const available = getAvailableMilkTypes(inventory)

    expect(available).toContain('whole')
    expect(available).toContain('oat')
    expect(available).not.toContain('almond')
    expect(available).not.toContain('skim')
    expect(available).not.toContain('none')
  })

  it('returns empty array when no milk available', () => {
    const inventory = createInventory()
    inventory.milks = {
      none: 0,
      whole: 0,
      skim: 0,
      oat: 0,
      almond: 0,
    }

    const available = getAvailableMilkTypes(inventory)

    expect(available).toHaveLength(0)
  })
})

describe('getLowStockWarnings', () => {
  it('warns when beans are low', () => {
    const inventory = createInventory()
    inventory.beans = [{ name: 'House', grams: 50, roastDate: new Date().toISOString() }]

    const warnings = getLowStockWarnings(inventory)

    expect(warnings.some(w => w.includes('coffee beans'))).toBe(true)
  })

  it('warns when milk is low', () => {
    const inventory = createInventory()
    inventory.milks.whole = 100 // Low threshold

    const warnings = getLowStockWarnings(inventory)

    expect(warnings.some(w => w.includes('whole milk'))).toBe(true)
  })

  it('returns no warnings for well-stocked inventory', () => {
    const inventory = createInventory()

    const warnings = getLowStockWarnings(inventory)

    expect(warnings).toHaveLength(0)
  })

  it('does not warn for zero stock items', () => {
    const inventory = createInventory()
    inventory.milks.almond = 0

    const warnings = getLowStockWarnings(inventory)

    expect(warnings.some(w => w.includes('almond'))).toBe(false)
  })
})

describe('MILK_PER_DRINK constants', () => {
  it('has zero milk for espresso', () => {
    expect(MILK_PER_DRINK.espresso).toBe(0)
  })

  it('has milk for latte and cappuccino', () => {
    expect(MILK_PER_DRINK.latte).toBeGreaterThan(0)
    expect(MILK_PER_DRINK.cappuccino).toBeGreaterThan(0)
  })

  it('latte has more milk than cappuccino', () => {
    expect(MILK_PER_DRINK.latte).toBeGreaterThan(MILK_PER_DRINK.cappuccino)
  })

  it('has zero milk for brew methods', () => {
    expect(MILK_PER_DRINK.pourover).toBe(0)
    expect(MILK_PER_DRINK.aeropress).toBe(0)
  })
})
