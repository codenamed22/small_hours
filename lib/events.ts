/**
 * Events System
 * 
 * Handles random and scheduled events that occur during the game.
 * Events can affect money, reputation, inventory, or just provide flavor.
 */

import type { GameState } from "./types";

export type EventType = "positive" | "negative" | "neutral";
export type EventTrigger = "random_service" | "start_day" | "end_day";

export interface EventEffect {
  money?: number;
  reputation?: number;
  inventory?: {
    beans?: number;
    milk?: number;
    syrup?: number;
    pastry?: number;
  };
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  trigger: EventTrigger;
  probability: number; // 0-1
  condition?: (state: GameState) => boolean;
  effects?: EventEffect;
  choices?: {
    text: string;
    effects?: EventEffect;
  }[];
}

// ============================================================================
// EVENT DEFINITIONS
// ============================================================================

export const EVENTS: GameEvent[] = [
  // --- SCHEDULED EVENTS ---
  {
    id: "grand_opening",
    title: "Grand Opening",
    description: "Welcome to your first day! The neighborhood is curious about the new cafe. Expect a few locals to stop by.",
    type: "positive",
    trigger: "start_day",
    probability: 1.0,
    condition: (state) => state.dayState?.dayNumber === 1,
    effects: {
      reputation: 5,
    },
  },
  {
    id: "rent_due",
    title: "Rent Day",
    description: "The landlord stops by to collect the weekly rent. It's a bit steep, but the location is good.",
    type: "negative",
    trigger: "start_day",
    probability: 1.0,
    condition: (state) => state.dayState?.dayNumber === 7,
    effects: {
      money: -500,
    },
  },

  // --- RANDOM SERVICE EVENTS ---
  {
    id: "rush_hour",
    title: "Morning Rush",
    description: "A group of commuters just got off the train. Get ready!",
    type: "neutral",
    trigger: "random_service",
    probability: 0.05,
    condition: (state) => (state.dayState?.stats.customersServed || 0) < 5,
  },
  {
    id: "generous_tip",
    title: "Generous Regular",
    description: "A customer loved the vibe so much they left a huge tip in the jar.",
    type: "positive",
    trigger: "random_service",
    probability: 0.03,
    effects: {
      money: 20,
    },
  },
  {
    id: "spilled_milk",
    title: "Spilled Milk",
    description: "Clumsy moment! You knocked over a carton of milk. Clean up on aisle bar.",
    type: "negative",
    trigger: "random_service",
    probability: 0.02,
    effects: {
      inventory: {
        milk: -1000, // Lose 1L
      },
    },
  },
  {
    id: "local_blogger",
    title: "Food Blogger",
    description: "Someone is taking a lot of photos of their drink. Could be good for business!",
    type: "positive",
    trigger: "random_service",
    probability: 0.02,
    effects: {
      reputation: 2,
    },
  },

  // --- EQUIPMENT-BASED EVENTS ---
  {
    id: "grinder_malfunction",
    title: "Grinder Trouble",
    description: "Your grinder is making strange grinding noises. You managed a quick fix, but a proper repair would cost money.",
    type: "negative",
    trigger: "random_service",
    probability: 0.015,
    condition: (state) => state.equipment?.grinder === "hand",
    effects: {
      money: -30,
    },
  },
  {
    id: "machine_breakdown",
    title: "Machine Breakdown",
    description: "Your espresso machine needs urgent maintenance. The repair technician wasn't cheap.",
    type: "negative",
    trigger: "random_service",
    probability: 0.01,
    condition: (state) => state.equipment?.espressoMachine === "basic",
    effects: {
      money: -50,
    },
  },
  {
    id: "equipment_appreciation",
    title: "Professional Recognition",
    description: "A visiting barista admires your setup. They spread the word about your quality equipment.",
    type: "positive",
    trigger: "random_service",
    probability: 0.015,
    condition: (state) => state.equipment?.espressoMachine === "commercial",
    effects: {
      reputation: 4,
    },
  },

  // --- CUSTOMER RELATIONSHIP EVENTS ---
  {
    id: "regular_recommendation",
    title: "Word of Mouth",
    description: "One of your regulars recommended you to their friends. Expect new faces!",
    type: "positive",
    trigger: "random_service",
    probability: 0.02,
    condition: (state) => {
      const regularCount = Array.from(state.customerMemory?.customers.values() || [])
        .filter(c => c.relationshipLevel === "regular" || c.relationshipLevel === "favorite")
        .length;
      return regularCount >= 3;
    },
    effects: {
      reputation: 3,
    },
  },
  {
    id: "favorite_customer_gift",
    title: "Thoughtful Gift",
    description: "One of your favorite customers brought you a gift as thanks for the great coffee!",
    type: "positive",
    trigger: "random_service",
    probability: 0.015,
    condition: (state) => {
      const favoriteCount = Array.from(state.customerMemory?.customers.values() || [])
        .filter(c => c.relationshipLevel === "favorite")
        .length;
      return favoriteCount >= 1;
    },
    effects: {
      money: 15,
      reputation: 2,
    },
  },

  // --- WEATHER EVENTS ---
  {
    id: "rainy_day",
    title: "Rainy Day",
    description: "It's pouring outside. People are seeking shelter... and warm coffee.",
    type: "positive",
    trigger: "start_day",
    probability: 0.15,
    effects: {
      reputation: 1,
    },
  },
  {
    id: "beautiful_weather",
    title: "Perfect Weather",
    description: "Beautiful day! People are out and about, some stopping by for their morning brew.",
    type: "neutral",
    trigger: "start_day",
    probability: 0.15,
  },
  {
    id: "heatwave",
    title: "Summer Heat",
    description: "It's scorching hot! Cold brew and iced drinks are flying off the counter.",
    type: "positive",
    trigger: "start_day",
    probability: 0.08,
    condition: (state) => (state.dayState?.dayNumber || 0) >= 3,
    effects: {
      money: 25,
    },
  },

  // --- SUPPLY CHAIN EVENTS ---
  {
    id: "bean_shortage",
    title: "Bean Shortage",
    description: "Your supplier is running low on your usual beans. They sent what they could.",
    type: "negative",
    trigger: "start_day",
    probability: 0.03,
    effects: {
      inventory: {
        beans: -200,
      },
    },
  },
  {
    id: "free_delivery",
    title: "Supplier Bonus",
    description: "Your bean supplier threw in extra bags as a thank you for being a loyal customer!",
    type: "positive",
    trigger: "start_day",
    probability: 0.02,
    condition: (state) => (state.dayState?.dayNumber || 0) >= 5,
    effects: {
      inventory: {
        beans: 500,
      },
    },
  },
  {
    id: "milk_delivery_delay",
    title: "Delivery Delay",
    description: "The milk delivery truck broke down. You'll have to ration what you have.",
    type: "negative",
    trigger: "start_day",
    probability: 0.025,
    effects: {
      inventory: {
        milk: -500,
      },
    },
  },
  {
    id: "surprise_shipment",
    title: "Surprise Shipment",
    description: "A shipment of specialty syrups arrived! Looks like your order was doubled by mistake.",
    type: "positive",
    trigger: "start_day",
    probability: 0.02,
    effects: {
      inventory: {
        syrup: 300,
      },
    },
  },

  // --- COMPETITION EVENTS ---
  {
    id: "competitor_opens",
    title: "New Competition",
    description: "A chain coffee shop opened down the street. You'll need to step up your game.",
    type: "negative",
    trigger: "start_day",
    probability: 0.05,
    condition: (state) => (state.dayState?.dayNumber || 0) >= 10,
    effects: {
      reputation: -5,
    },
  },
  {
    id: "competitor_closes",
    title: "Competition Closes",
    description: "The big chain down the street couldn't compete with your quality. Their customers are coming to you now!",
    type: "positive",
    trigger: "start_day",
    probability: 0.03,
    condition: (state) => (state.dayState?.dayNumber || 0) >= 20 && (state.reputation || 50) >= 70,
    effects: {
      reputation: 8,
      money: 40,
    },
  },

  // --- RANDOM LUCK EVENTS ---
  {
    id: "found_money",
    title: "Lucky Day",
    description: "You found a $20 bill on the floor that someone must have dropped. Finders keepers!",
    type: "positive",
    trigger: "random_service",
    probability: 0.01,
    effects: {
      money: 20,
    },
  },
  {
    id: "broken_cup",
    title: "Butterfingers",
    description: "Oops! You dropped a whole stack of cups. That's coming out of profits.",
    type: "negative",
    trigger: "random_service",
    probability: 0.015,
    effects: {
      money: -15,
    },
  },
  {
    id: "power_surge",
    title: "Power Surge",
    description: "A brief power surge messed with your equipment. Everything's fine, but you had to throw out some ingredients.",
    type: "negative",
    trigger: "random_service",
    probability: 0.01,
    effects: {
      inventory: {
        beans: -100,
        milk: -300,
      },
    },
  },

  // --- SOCIAL MEDIA EVENTS ---
  {
    id: "viral_post",
    title: "Gone Viral!",
    description: "Someone's Instagram post of your latte art went viral! Your shop is blowing up online.",
    type: "positive",
    trigger: "random_service",
    probability: 0.008,
    condition: (state) => (state.dayState?.stats.averageQuality || 0) >= 85,
    effects: {
      reputation: 10,
      money: 50,
    },
  },
  {
    id: "bad_review",
    title: "Negative Review",
    description: "Someone left a harsh review online complaining about wait times. It's hurting your reputation.",
    type: "negative",
    trigger: "end_day",
    probability: 0.03,
    condition: (state) => (state.dayState?.stats.averageQuality || 0) < 70,
    effects: {
      reputation: -8,
    },
  },
  {
    id: "positive_review",
    title: "Glowing Review",
    description: "A local food critic praised your coffee in their column. Business is booming!",
    type: "positive",
    trigger: "end_day",
    probability: 0.02,
    condition: (state) => (state.dayState?.stats.averageQuality || 0) >= 90,
    effects: {
      reputation: 12,
      money: 60,
    },
  },

  // --- SPECIAL MILESTONE EVENTS ---
  {
    id: "first_regular",
    title: "Your First Regular!",
    description: "You've served someone enough times that they're now a regular customer. They promise to keep coming back!",
    type: "positive",
    trigger: "random_service",
    probability: 1.0,
    condition: (state) => {
      const hasRegulars = Array.from(state.customerMemory?.customers.values() || [])
        .some(c => c.relationshipLevel === "regular" || c.relationshipLevel === "favorite");
      const alreadyTriggered = hasEventOccurredToday(state, "first_regular") ||
        state.eventsHistory?.some(e => e.eventId === "first_regular");
      return hasRegulars && !alreadyTriggered;
    },
    effects: {
      reputation: 5,
    },
  },
  {
    id: "100th_customer",
    title: "100th Customer Milestone!",
    description: "You've served your 100th customer! Time to celebrate this achievement.",
    type: "positive",
    trigger: "random_service",
    probability: 1.0,
    condition: (state) => {
      const served = state.customerMemory?.totalCustomersServed || 0;
      const alreadyTriggered = state.eventsHistory?.some(e => e.eventId === "100th_customer");
      return served === 100 && !alreadyTriggered;
    },
    effects: {
      reputation: 10,
      money: 50,
    },
  },
];

// ============================================================================
// EVENT LOGIC
// ============================================================================

/**
 * Check if an event should trigger
 */
export function checkForEvent(
  state: GameState,
  trigger: EventTrigger
): GameEvent | null {
  // Cooldown for random events (prevent multiple in quick succession)
  if (trigger === "random_service") {
    const lastEventTime = state.eventStats?.lastEventTimestamp;
    if (lastEventTime) {
      const timeSinceLastEvent = Date.now() - lastEventTime;
      const COOLDOWN_MS = 60000; // 1 minute minimum between events
      if (timeSinceLastEvent < COOLDOWN_MS) {
        return null;
      }
    }
  }

  // Filter events by trigger and condition
  const candidates = EVENTS.filter(
    (event) =>
      event.trigger === trigger &&
      (!event.condition || event.condition(state)) &&
      !hasEventOccurredToday(state, event.id)
  );

  // Check probabilities
  for (const event of candidates) {
    if (Math.random() < event.probability) {
      return event;
    }
  }

  return null;
}

/**
 * Check if an event has already happened today to prevent duplicates
 */
function hasEventOccurredToday(state: GameState, eventId: string): boolean {
  if (!state.eventsHistory) return false;
  
  const today = state.dayState?.dayNumber || 1;
  return state.eventsHistory.some(
    (entry) => entry.eventId === eventId && entry.day === today
  );
}

/**
 * Apply event effects to game state
 */
export function applyEventEffects(
  state: GameState,
  event: GameEvent
): GameState {
  let newState = { ...state };

  if (!event.effects) return newState;

  // Apply money changes
  if (event.effects.money) {
    newState.money = Math.max(0, newState.money + event.effects.money);
  }

  // Apply reputation changes (clamped 0-100)
  if (event.effects.reputation !== undefined) {
    const currentReputation = newState.reputation || 50; // Default to 50 if not set
    newState.reputation = Math.max(0, Math.min(100,
      currentReputation + event.effects.reputation
    ));
  }

  // Apply inventory changes
  if (event.effects.inventory) {
    const effects = event.effects.inventory;
    const inventory = { ...newState.inventory };

    // Update milk (all types equally)
    if (effects.milk) {
      inventory.milks = { ...inventory.milks };
      const milkTypes = ['whole', 'skim', 'oat', 'almond'] as const;
      milkTypes.forEach(type => {
        inventory.milks[type] = Math.max(0,
          inventory.milks[type] + effects.milk!
        );
      });
    }

    // Update beans
    if (effects.beans && inventory.beans.length > 0) {
      inventory.beans = inventory.beans.map((bean, index) => {
        if (index === 0) {
          return {
            ...bean,
            grams: Math.max(0, bean.grams + effects.beans!)
          };
        }
        return bean;
      });
    }

    // Update syrups
    if (effects.syrup) {
      inventory.syrups = { ...inventory.syrups };
      Object.keys(inventory.syrups).forEach(syrup => {
        inventory.syrups[syrup] = Math.max(0,
          inventory.syrups[syrup] + effects.syrup!
        );
      });
    }

    // Update food/pastries
    if (effects.pastry) {
      inventory.food = { ...inventory.food };
      Object.keys(inventory.food).forEach(food => {
        inventory.food[food] = Math.max(0,
          inventory.food[food] + effects.pastry!
        );
      });
    }

    newState.inventory = inventory;
  }

  // Update event statistics
  const eventStats = {
    totalEvents: (state.eventStats?.totalEvents || 0) + 1,
    eventCounts: {
      ...(state.eventStats?.eventCounts || {}),
      [event.id]: ((state.eventStats?.eventCounts?.[event.id] || 0) + 1),
    },
    lastEventTimestamp: Date.now(),
  };
  newState.eventStats = eventStats;

  // Record event in history
  const historyEntry = {
    eventId: event.id,
    day: state.dayState?.dayNumber || 1,
    timestamp: Date.now(),
  };

  newState.eventsHistory = [
    ...(state.eventsHistory || []),
    historyEntry,
  ];

  return newState;
}
