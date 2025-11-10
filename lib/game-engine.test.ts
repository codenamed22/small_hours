/**
 * Tests for Game Engine - Validation and Rule Evaluation
 */

import { describe, it, expect } from 'vitest'
import {
  brewDrink,
  getDefaultParameters,
  getRequiredParameters,
  createStaticCustomer,
  RECIPES,
  TEMP_RANGE,
  BREW_TIME_RANGE,
  MILK_RANGE,
  BLOOM_RANGE,
} from './game-engine'
import type { BrewParameters, DrinkType } from './types'

describe('brewDrink - Parameter Validation', () => {
  it('validates temperature range', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 250, // TOO HOT
      brewTime: 25,
    }

    expect(() => brewDrink('espresso', params)).toThrow(/Temperature.*out of range/)
  })

  it('validates temperature minimum', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 100, // TOO COLD
      brewTime: 25,
    }

    expect(() => brewDrink('espresso', params)).toThrow(/Temperature.*out of range/)
  })

  it('validates negative brew time', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: -10, // NEGATIVE
    }

    expect(() => brewDrink('espresso', params)).toThrow(/Brew time cannot be negative/)
  })

  it('validates milk temperature range', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
      milkType: 'whole',
      milkTemp: 200, // TOO HOT
      foamAmount: 20,
    }

    expect(() => brewDrink('latte', params)).toThrow(/Milk temperature.*out of range/)
  })

  it('validates foam amount range', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
      milkType: 'whole',
      milkTemp: 150,
      foamAmount: 150, // TOO MUCH
    }

    expect(() => brewDrink('latte', params)).toThrow(/Foam amount.*out of range/)
  })

  it('accepts valid parameters', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    expect(() => brewDrink('espresso', params)).not.toThrow()
  })
})

describe('brewDrink - Quality Scoring', () => {
  it('returns perfect score for ideal espresso', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const result = brewDrink('espresso', params)

    expect(result.quality).toBe(100)
    expect(result.appliedRules.length).toBeGreaterThan(0)
  })

  it('returns lower score for poor parameters', () => {
    const params: BrewParameters = {
      grindSize: 'coarse', // WRONG (should be fine)
      temperature: 180, // TOO COLD
      brewTime: 35, // TOO SLOW
    }

    const result = brewDrink('espresso', params)

    expect(result.quality).toBeLessThan(50)
  })

  it('includes breakdown by component', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const result = brewDrink('espresso', params)

    expect(result.breakdown).toBeDefined()
    expect(Object.keys(result.breakdown).length).toBeGreaterThan(0)
    expect(result.breakdown['Grind Size']).toBeDefined()
  })

  it('includes feedback string', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const result = brewDrink('espresso', params)

    expect(result.feedback).toBeDefined()
    expect(typeof result.feedback).toBe('string')
    expect(result.feedback.length).toBeGreaterThan(0)
  })

  it('tracks applied rules', () => {
    const params: BrewParameters = {
      grindSize: 'fine',
      temperature: 200,
      brewTime: 25,
    }

    const result = brewDrink('espresso', params)

    expect(result.appliedRules).toBeDefined()
    expect(Array.isArray(result.appliedRules)).toBe(true)
    expect(result.appliedRules.length).toBeGreaterThan(0)
  })
})

describe('getDefaultParameters', () => {
  it('returns espresso defaults', () => {
    const params = getDefaultParameters('espresso')

    expect(params.grindSize).toBe('medium')
    expect(params.temperature).toBe(195)
    expect(params.brewTime).toBe(25)
    expect(params.milkType).toBeUndefined()
  })

  it('returns latte defaults with milk', () => {
    const params = getDefaultParameters('latte')

    expect(params.grindSize).toBe('medium')
    expect(params.brewTime).toBe(25)
    expect(params.milkType).toBe('whole')
    expect(params.milkTemp).toBe(150)
    expect(params.foamAmount).toBe(30)
  })

  it('returns pourover defaults with bloom', () => {
    const params = getDefaultParameters('pourover')

    expect(params.grindSize).toBe('medium')
    expect(params.brewTime).toBe(90) // NOT espresso time
    expect(params.bloomTime).toBe(30)
    expect(params.milkType).toBeUndefined()
  })

  it('returns aeropress defaults', () => {
    const params = getDefaultParameters('aeropress')

    expect(params.brewTime).toBe(90)
    expect(params.milkType).toBeUndefined()
    expect(params.bloomTime).toBeUndefined()
  })
})

describe('getRequiredParameters', () => {
  it('returns base params for espresso', () => {
    const required = getRequiredParameters('espresso')

    expect(required).toContain('grindSize')
    expect(required).toContain('temperature')
    expect(required).toContain('brewTime')
    expect(required).not.toContain('milkType')
  })

  it('returns milk params for latte', () => {
    const required = getRequiredParameters('latte')

    expect(required).toContain('grindSize')
    expect(required).toContain('milkType')
    expect(required).toContain('milkTemp')
    expect(required).toContain('foamAmount')
  })

  it('returns bloom param for pourover', () => {
    const required = getRequiredParameters('pourover')

    expect(required).toContain('bloomTime')
    expect(required).not.toContain('milkType')
  })
})

describe('createStaticCustomer', () => {
  it('creates espresso customer', () => {
    const customer = createStaticCustomer('espresso')

    expect(customer.name).toBe('Alex')
    expect(customer.drinkType).toBe('espresso')
    expect(customer.payment).toBe(3)
    expect(customer.order).toContain('espresso')
  })

  it('creates latte customer', () => {
    const customer = createStaticCustomer('latte')

    expect(customer.drinkType).toBe('latte')
    expect(customer.payment).toBe(4.5)
  })

  it('creates customer for all drink types', () => {
    const drinkTypes: DrinkType[] = ['espresso', 'latte', 'cappuccino', 'pourover', 'aeropress']

    drinkTypes.forEach((drinkType) => {
      const customer = createStaticCustomer(drinkType)

      expect(customer.name).toBeDefined()
      expect(customer.drinkType).toBe(drinkType)
      expect(customer.payment).toBeGreaterThan(0)
      expect(customer.order).toBeDefined()
    })
  })
})

describe('RECIPES validation', () => {
  it('all recipes have weights summing to 1.0', () => {
    const drinkTypes: DrinkType[] = ['espresso', 'latte', 'cappuccino', 'pourover', 'aeropress']

    drinkTypes.forEach((drinkType) => {
      const recipe = RECIPES[drinkType]
      const totalWeight = recipe.rules.reduce((sum, rule) => sum + rule.weight, 0)

      expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.001)
    })
  })

  it('all recipes have valid temperature ranges', () => {
    const drinkTypes: DrinkType[] = ['espresso', 'latte', 'cappuccino', 'pourover', 'aeropress']

    drinkTypes.forEach((drinkType) => {
      const recipe = RECIPES[drinkType]

      expect(recipe.idealTemp).toBeGreaterThanOrEqual(TEMP_RANGE.MIN)
      expect(recipe.idealTemp).toBeLessThanOrEqual(TEMP_RANGE.MAX)
    })
  })

  it('espresso-based drinks have correct category', () => {
    expect(RECIPES.espresso.category).toBe('espresso-based')
    expect(RECIPES.latte.category).toBe('espresso-based')
    expect(RECIPES.cappuccino.category).toBe('espresso-based')
  })

  it('pourover has correct category', () => {
    expect(RECIPES.pourover.category).toBe('pour-over')
  })

  it('aeropress has correct category', () => {
    expect(RECIPES.aeropress.category).toBe('immersion')
  })
})

describe('Constants validation', () => {
  it('TEMP_RANGE is valid', () => {
    expect(TEMP_RANGE.MIN).toBeLessThan(TEMP_RANGE.MAX)
    expect(TEMP_RANGE.MIN).toBeGreaterThan(0)
  })

  it('BREW_TIME_RANGE is valid', () => {
    expect(BREW_TIME_RANGE.ESPRESSO_MIN).toBeLessThan(BREW_TIME_RANGE.ESPRESSO_MAX)
    expect(BREW_TIME_RANGE.BREW_MIN).toBeLessThan(BREW_TIME_RANGE.BREW_MAX)
  })

  it('MILK_RANGE is valid', () => {
    expect(MILK_RANGE.TEMP_MIN).toBeLessThan(MILK_RANGE.TEMP_MAX)
    expect(MILK_RANGE.FOAM_MIN).toBe(0)
    expect(MILK_RANGE.FOAM_MAX).toBe(100)
  })

  it('BLOOM_RANGE is valid', () => {
    expect(BLOOM_RANGE.MIN).toBeLessThan(BLOOM_RANGE.MAX)
  })
})
