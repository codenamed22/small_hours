/**
 * Equipment System for Small Hours
 *
 * Manages equipment tiers, purchases, and quality bonuses
 * Equipment provides bonuses to brewing quality and unlocks capabilities
 */

import type { DrinkCategory } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export type EspressoMachineTier = "basic" | "professional" | "commercial";
export type GrinderTier = "hand" | "burr" | "commercial";
export type MilkSteamerTier = "basic" | "auto" | "professional";

export interface Equipment {
  espressoMachine: EspressoMachineTier;
  grinder: GrinderTier;
  milkSteamer: MilkSteamerTier;
  brewingStations: number; // 1-3
}

export interface EquipmentItem {
  id: string;
  name: string;
  description: string;
  price: number;
  tier: number; // 1-3
  category: "espressoMachine" | "grinder" | "milkSteamer" | "brewingStation";
  effects: EquipmentEffects;
}

export interface EquipmentEffects {
  qualityBonus?: number; // Added to final quality score
  brewTimeReduction?: number; // Seconds reduced from brew time
  grindBonus?: number; // Bonus to grind size scoring
  milkBonus?: number; // Bonus to milk-related scoring
  temperatureBonus?: number; // Bonus to temperature precision
  consistency?: number; // Reduces random variation (0-100)
  enableDualBrewing?: boolean; // Can brew 2 drinks simultaneously
  enableTripleBrewing?: boolean; // Can brew 3 drinks simultaneously
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  newEquipment?: Equipment;
  newMoney?: number;
}

// ============================================================================
// EQUIPMENT CATALOG
// ============================================================================

export const ESPRESSO_MACHINES: Record<EspressoMachineTier, EquipmentItem> = {
  basic: {
    id: "espresso_basic",
    name: "Basic Espresso Machine",
    description: "Your starter machine. Gets the job done.",
    price: 0,
    tier: 1,
    category: "espressoMachine",
    effects: {},
  },
  professional: {
    id: "espresso_professional",
    name: "Professional Espresso Machine",
    description: "Dual boiler with PID control. Consistent shots every time.",
    price: 300,
    tier: 2,
    category: "espressoMachine",
    effects: {
      qualityBonus: 5,
      brewTimeReduction: 2,
      temperatureBonus: 3,
    },
  },
  commercial: {
    id: "espresso_commercial",
    name: "Commercial Espresso Machine",
    description: "Top-of-the-line. Perfect extraction, dual brewing capable.",
    price: 800,
    tier: 3,
    category: "espressoMachine",
    effects: {
      qualityBonus: 10,
      brewTimeReduction: 5,
      temperatureBonus: 8,
      enableDualBrewing: true,
    },
  },
};

export const GRINDERS: Record<GrinderTier, EquipmentItem> = {
  hand: {
    id: "grinder_hand",
    name: "Hand Grinder",
    description: "Manual grinder. Inconsistent but it works.",
    price: 0,
    tier: 1,
    category: "grinder",
    effects: {},
  },
  burr: {
    id: "grinder_burr",
    name: "Burr Grinder",
    description: "Conical burr grinder. Much more consistent particle size.",
    price: 150,
    tier: 2,
    category: "grinder",
    effects: {
      grindBonus: 3,
      consistency: 40,
    },
  },
  commercial: {
    id: "grinder_commercial",
    name: "Commercial Grinder",
    description: "Flat burr, stepless adjustment. Barista-grade consistency.",
    price: 400,
    tier: 3,
    category: "grinder",
    effects: {
      grindBonus: 8,
      consistency: 80,
    },
  },
};

export const MILK_STEAMERS: Record<MilkSteamerTier, EquipmentItem> = {
  basic: {
    id: "steamer_basic",
    name: "Basic Steam Wand",
    description: "Manual steam wand. Takes skill and patience.",
    price: 0,
    tier: 1,
    category: "milkSteamer",
    effects: {},
  },
  auto: {
    id: "steamer_auto",
    name: "Automatic Frother",
    description: "Auto-temperature control. Easier microfoam.",
    price: 200,
    tier: 2,
    category: "milkSteamer",
    effects: {
      milkBonus: 5,
      temperatureBonus: 4,
    },
  },
  professional: {
    id: "steamer_professional",
    name: "Professional Steam System",
    description: "Multi-head steamer. Perfect foam and temperature every time.",
    price: 500,
    tier: 3,
    category: "milkSteamer",
    effects: {
      milkBonus: 10,
      temperatureBonus: 8,
      consistency: 60,
    },
  },
};

export const BREWING_STATIONS: EquipmentItem[] = [
  {
    id: "station_single",
    name: "Single Brewing Station",
    description: "One drink at a time.",
    price: 0,
    tier: 1,
    category: "brewingStation",
    effects: {},
  },
  {
    id: "station_double",
    name: "Second Brewing Station",
    description: "Brew two drinks simultaneously. Double the throughput!",
    price: 600,
    tier: 2,
    category: "brewingStation",
    effects: {
      enableDualBrewing: true,
    },
  },
  {
    id: "station_triple",
    name: "Third Brewing Station",
    description: "Three brewing stations. You're a one-person factory now.",
    price: 1200,
    tier: 3,
    category: "brewingStation",
    effects: {
      enableTripleBrewing: true,
    },
  },
];

// ============================================================================
// EQUIPMENT CREATION
// ============================================================================

/**
 * Create default equipment (all tier 1)
 */
export function createDefaultEquipment(): Equipment {
  return {
    espressoMachine: "basic",
    grinder: "hand",
    milkSteamer: "basic",
    brewingStations: 1,
  };
}

// ============================================================================
// EQUIPMENT QUERIES
// ============================================================================

/**
 * Get all available upgrades for current equipment
 */
export function getAvailableUpgrades(equipment: Equipment): EquipmentItem[] {
  const upgrades: EquipmentItem[] = [];

  // Espresso machine upgrades
  if (equipment.espressoMachine === "basic") {
    upgrades.push(ESPRESSO_MACHINES.professional);
  } else if (equipment.espressoMachine === "professional") {
    upgrades.push(ESPRESSO_MACHINES.commercial);
  }

  // Grinder upgrades
  if (equipment.grinder === "hand") {
    upgrades.push(GRINDERS.burr);
  } else if (equipment.grinder === "burr") {
    upgrades.push(GRINDERS.commercial);
  }

  // Milk steamer upgrades
  if (equipment.milkSteamer === "basic") {
    upgrades.push(MILK_STEAMERS.auto);
  } else if (equipment.milkSteamer === "auto") {
    upgrades.push(MILK_STEAMERS.professional);
  }

  // Brewing station upgrades
  if (equipment.brewingStations === 1) {
    upgrades.push(BREWING_STATIONS[1]); // Second station
  } else if (equipment.brewingStations === 2) {
    upgrades.push(BREWING_STATIONS[2]); // Third station
  }

  return upgrades;
}

/**
 * Get current equipment items
 */
export function getCurrentEquipment(equipment: Equipment): EquipmentItem[] {
  return [
    ESPRESSO_MACHINES[equipment.espressoMachine],
    GRINDERS[equipment.grinder],
    MILK_STEAMERS[equipment.milkSteamer],
    BREWING_STATIONS[equipment.brewingStations - 1],
  ];
}

/**
 * Get total equipment value
 */
export function getEquipmentValue(equipment: Equipment): number {
  const items = getCurrentEquipment(equipment);
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ============================================================================
// EQUIPMENT BONUSES
// ============================================================================

/**
 * Calculate total quality bonus from all equipment
 */
export function calculateEquipmentBonus(
  equipment: Equipment,
  drinkCategory: DrinkCategory
): EquipmentEffects {
  const items = getCurrentEquipment(equipment);

  const totalEffects: EquipmentEffects = {
    qualityBonus: 0,
    brewTimeReduction: 0,
    grindBonus: 0,
    milkBonus: 0,
    temperatureBonus: 0,
    consistency: 0,
  };

  items.forEach((item) => {
    const effects = item.effects;
    totalEffects.qualityBonus! += effects.qualityBonus || 0;
    totalEffects.brewTimeReduction! += effects.brewTimeReduction || 0;
    totalEffects.grindBonus! += effects.grindBonus || 0;
    totalEffects.milkBonus! += effects.milkBonus || 0;
    totalEffects.temperatureBonus! += effects.temperatureBonus || 0;
    totalEffects.consistency! = Math.max(
      totalEffects.consistency!,
      effects.consistency || 0
    );
  });

  // Apply category-specific bonuses
  if (drinkCategory === "espresso-based") {
    // Espresso drinks benefit more from espresso machine
    totalEffects.qualityBonus! *= 1.2;
  } else if (drinkCategory === "pour-over") {
    // Pour over benefits more from grinder
    totalEffects.grindBonus! *= 1.3;
  }

  return totalEffects;
}

/**
 * Apply equipment bonuses to a quality score
 */
export function applyEquipmentBonus(
  baseQuality: number,
  equipment: Equipment,
  drinkCategory: DrinkCategory
): number {
  const bonuses = calculateEquipmentBonus(equipment, drinkCategory);

  // Apply quality bonus (direct addition)
  let finalQuality = baseQuality + (bonuses.qualityBonus || 0);

  // Apply consistency bonus (reduces penalties for minor mistakes)
  if (bonuses.consistency && bonuses.consistency > 0) {
    // If quality is below perfect, consistency helps bring it up slightly
    if (finalQuality < 100) {
      const improvement = (100 - finalQuality) * (bonuses.consistency / 200);
      finalQuality += improvement;
    }
  }

  // Cap at 100
  return Math.min(Math.round(finalQuality), 100);
}

// ============================================================================
// EQUIPMENT PURCHASES
// ============================================================================

/**
 * Attempt to purchase an equipment upgrade
 */
export function purchaseEquipment(
  equipment: Equipment,
  money: number,
  itemId: string
): PurchaseResult {
  // Find the item
  const allItems = [
    ...Object.values(ESPRESSO_MACHINES),
    ...Object.values(GRINDERS),
    ...Object.values(MILK_STEAMERS),
    ...BREWING_STATIONS,
  ];

  const item = allItems.find((i) => i.id === itemId);
  if (!item) {
    return {
      success: false,
      message: "Equipment not found",
    };
  }

  // Check if player can afford it
  if (money < item.price) {
    return {
      success: false,
      message: `Not enough money. Need $${item.price.toFixed(2)}, have $${money.toFixed(2)}`,
    };
  }

  // Check if this is a valid upgrade
  const availableUpgrades = getAvailableUpgrades(equipment);
  if (!availableUpgrades.find((u) => u.id === itemId)) {
    return {
      success: false,
      message: "This equipment is not available for purchase",
    };
  }

  // Apply the purchase
  const newEquipment = { ...equipment };
  const newMoney = money - item.price;

  switch (item.category) {
    case "espressoMachine":
      newEquipment.espressoMachine = item.id.split("_")[1] as EspressoMachineTier;
      break;
    case "grinder":
      newEquipment.grinder = item.id.split("_")[1] as GrinderTier;
      break;
    case "milkSteamer":
      newEquipment.milkSteamer = item.id.split("_")[1] as MilkSteamerTier;
      break;
    case "brewingStation":
      newEquipment.brewingStations = item.tier;
      break;
  }

  return {
    success: true,
    message: `Purchased ${item.name}!`,
    newEquipment,
    newMoney,
  };
}

/**
 * Can player afford any equipment upgrades?
 */
export function canAffordAnyUpgrade(equipment: Equipment, money: number): boolean {
  const upgrades = getAvailableUpgrades(equipment);
  return upgrades.some((item) => money >= item.price);
}

/**
 * Get cheapest available upgrade
 */
export function getCheapestUpgrade(equipment: Equipment): EquipmentItem | null {
  const upgrades = getAvailableUpgrades(equipment);
  if (upgrades.length === 0) return null;

  return upgrades.reduce((cheapest, item) =>
    item.price < cheapest.price ? item : cheapest
  );
}
