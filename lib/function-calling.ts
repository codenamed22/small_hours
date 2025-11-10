/**
 * Function Calling / Tool Use System
 *
 * Defines the schema and handlers for LLM function calls.
 * This allows the LLM to interact with game systems:
 * - parse_order: Extract structured data from natural language
 * - create_ticket: Add order to queue system
 * - check_allergens: Validate drink safety
 * - complete_order: Finalize and score the order
 */

import type { DrinkType, MilkType, GrindSize } from "./types";
import { VALID_DRINKS, VALID_MILK_TYPES } from "./types";
import { RECIPES } from "./recipes";

// ============================================================================
// TOOL DEFINITIONS (OpenAI Function Calling Schema)
// ============================================================================

export const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "parse_order",
      description: "Parse a customer's natural language order into structured drink parameters. Extract the drink type and any specific preferences mentioned.",
      parameters: {
        type: "object",
        properties: {
          drink_type: {
            type: "string",
            enum: ["espresso", "latte", "cappuccino", "pourover", "aeropress"],
            description: "The type of coffee drink ordered"
          },
          milk_type: {
            type: "string",
            enum: ["whole", "skim", "oat", "almond"],
            description: "Type of milk if specified (omit if customer doesn't specify or drink doesn't need milk)"
          },
          temperature_preference: {
            type: "string",
            enum: ["hot", "extra_hot", "warm"],
            description: "Temperature preference if specified"
          },
          special_requests: {
            type: "array",
            items: { type: "string" },
            description: "Any special requests, modifications, or preferences mentioned by the customer"
          },
          urgency: {
            type: "string",
            enum: ["relaxed", "normal", "rushed"],
            description: "How rushed or relaxed the customer seems based on their language"
          }
        },
        required: ["drink_type"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "create_ticket",
      description: "Create an order ticket and add it to the queue. This makes the order official and trackable.",
      parameters: {
        type: "object",
        properties: {
          customer_name: {
            type: "string",
            description: "Name of the customer"
          },
          drink_type: {
            type: "string",
            enum: ["espresso", "latte", "cappuccino", "pourover", "aeropress"],
            description: "The drink to prepare"
          },
          milk_type: {
            type: "string",
            enum: ["whole", "skim", "oat", "almond"],
            description: "Type of milk if applicable"
          },
          notes: {
            type: "string",
            description: "Any special notes or requests for the barista"
          },
          priority: {
            type: "string",
            enum: ["normal", "high"],
            description: "Priority level based on customer urgency"
          }
        },
        required: ["customer_name", "drink_type"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "check_allergens",
      description: "Check if a drink configuration is safe for a customer's allergens. MUST be called before serving if customer has allergens.",
      parameters: {
        type: "object",
        properties: {
          drink_type: {
            type: "string",
            enum: ["espresso", "latte", "cappuccino", "pourover", "aeropress"],
            description: "The drink being prepared"
          },
          milk_type: {
            type: "string",
            enum: ["whole", "skim", "oat", "almond"],
            description: "Type of milk being used"
          },
          customer_allergens: {
            type: "array",
            items: { type: "string" },
            description: "List of customer's allergens"
          }
        },
        required: ["drink_type", "customer_allergens"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "complete_order",
      description: "Mark an order as completed and calculate customer satisfaction based on drink quality and service.",
      parameters: {
        type: "object",
        properties: {
          ticket_id: {
            type: "string",
            description: "ID of the order ticket"
          },
          drink_quality: {
            type: "number",
            description: "Quality score of the brewed drink (0-100)"
          },
          service_notes: {
            type: "string",
            description: "Any notes about the service or interaction"
          }
        },
        required: ["ticket_id", "drink_quality"]
      }
    }
  }
];

// ============================================================================
// TYPES
// ============================================================================

export interface ParsedOrder {
  drinkType: DrinkType;
  milkType?: MilkType;
  temperaturePreference?: "hot" | "extra_hot" | "warm";
  specialRequests?: string[];
  urgency?: "relaxed" | "normal" | "rushed";
}

export interface OrderTicket {
  id: string;
  customerName: string;
  drinkType: DrinkType;
  milkType?: MilkType;
  notes?: string;
  priority: "normal" | "high";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  createdAt: number;
  completedAt?: number;
}

export interface AllergenCheckResult {
  safe: boolean;
  warnings: string[];
  blockers: string[];
}

export interface OrderCompletion {
  ticketId: string;
  drinkQuality: number;
  customerSatisfaction: number;
  payment: number;
  tip?: number;
}

// ============================================================================
// FUNCTION HANDLERS
// ============================================================================

/**
 * Parse a natural language order into structured data
 */
export function parseOrder(args: {
  drink_type: string;
  milk_type?: string;
  temperature_preference?: string;
  special_requests?: string[];
  urgency?: string;
}): ParsedOrder {
  // Validate drink type
  if (!VALID_DRINKS.includes(args.drink_type as DrinkType)) {
    throw new Error(`Invalid drink type: ${args.drink_type}`);
  }

  const parsed: ParsedOrder = {
    drinkType: args.drink_type as DrinkType,
  };

  // Add optional fields if provided
  if (args.milk_type) {
    if (VALID_MILK_TYPES.includes(args.milk_type as Exclude<MilkType, "none">)) {
      parsed.milkType = args.milk_type as MilkType;
    }
  }

  if (args.temperature_preference) {
    parsed.temperaturePreference = args.temperature_preference as "hot" | "extra_hot" | "warm";
  }

  if (args.special_requests && args.special_requests.length > 0) {
    parsed.specialRequests = args.special_requests;
  }

  if (args.urgency) {
    parsed.urgency = args.urgency as "relaxed" | "normal" | "rushed";
  }

  return parsed;
}

/**
 * Create an order ticket
 */
export function createTicket(args: {
  customer_name: string;
  drink_type: string;
  milk_type?: string;
  notes?: string;
  priority?: string;
}): OrderTicket {
  if (!VALID_DRINKS.includes(args.drink_type as DrinkType)) {
    throw new Error(`Invalid drink type: ${args.drink_type}`);
  }

  const ticket: OrderTicket = {
    id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    customerName: args.customer_name,
    drinkType: args.drink_type as DrinkType,
    priority: (args.priority as "normal" | "high") || "normal",
    status: "pending",
    createdAt: Date.now(),
  };

  if (args.milk_type) {
    if (VALID_MILK_TYPES.includes(args.milk_type as Exclude<MilkType, "none">)) {
      ticket.milkType = args.milk_type as MilkType;
    }
  }

  if (args.notes) {
    ticket.notes = args.notes;
  }

  return ticket;
}

/**
 * Check if a drink is safe for customer allergens
 */
export function checkAllergens(args: {
  drink_type: string;
  milk_type?: string;
  customer_allergens: string[];
}): AllergenCheckResult {
  const result: AllergenCheckResult = {
    safe: true,
    warnings: [],
    blockers: [],
  };

  const recipe = RECIPES[args.drink_type as DrinkType];
  if (!recipe) {
    result.safe = false;
    result.blockers.push(`Unknown drink type: ${args.drink_type}`);
    return result;
  }

  // Check each allergen
  for (const allergen of args.customer_allergens) {
    const allergenLower = allergen.toLowerCase();

    // Dairy allergens
    if (allergenLower === "dairy" || allergenLower === "lactose") {
      // Check if drink uses dairy milk
      if (args.milk_type === "whole" || args.milk_type === "skim") {
        result.safe = false;
        result.blockers.push(`Customer is allergic to dairy but ${args.milk_type} milk was selected`);
      } else if (recipe.category === "espresso-based" && args.drink_type !== "espresso" && !args.milk_type) {
        result.warnings.push("This drink requires milk - ensure non-dairy option is selected");
      }
    }

    // Nut allergens
    if (allergenLower === "nuts" || allergenLower === "tree nuts" || allergenLower === "almond") {
      if (args.milk_type === "almond") {
        result.safe = false;
        result.blockers.push("Customer is allergic to nuts but almond milk was selected");
      }
    }

    // Soy allergens (for future soy milk option)
    if (allergenLower === "soy") {
      result.warnings.push("Customer has soy allergy - avoid soy milk");
    }
  }

  return result;
}

/**
 * Complete an order and calculate satisfaction
 */
export function completeOrder(args: {
  ticket_id: string;
  drink_quality: number;
  service_notes?: string;
}): OrderCompletion {
  const quality = Math.max(0, Math.min(100, args.drink_quality));

  // Calculate customer satisfaction (quality is main factor)
  let satisfaction = quality;

  // Quality thresholds for satisfaction
  if (quality >= 90) {
    satisfaction = 95 + Math.random() * 5; // Very happy
  } else if (quality >= 75) {
    satisfaction = 80 + Math.random() * 10; // Satisfied
  } else if (quality >= 60) {
    satisfaction = 60 + Math.random() * 15; // Okay
  } else {
    satisfaction = Math.max(20, quality - 10); // Disappointed
  }

  // Calculate base payment (this should come from the ticket, but for now use defaults)
  const basePayment = 4.0;

  // Calculate tip based on satisfaction
  let tip = 0;
  if (satisfaction >= 90) {
    tip = 1.0; // Excellent service
  } else if (satisfaction >= 80) {
    tip = 0.5; // Good service
  } else if (satisfaction >= 70) {
    tip = 0.25; // Decent service
  }

  return {
    ticketId: args.ticket_id,
    drinkQuality: quality,
    customerSatisfaction: Math.round(satisfaction),
    payment: basePayment,
    tip,
  };
}

/**
 * Execute a function call from the LLM
 */
export function executeFunctionCall(
  functionName: string,
  args: unknown
): unknown {
  switch (functionName) {
    case "parse_order":
      return parseOrder(args as Parameters<typeof parseOrder>[0]);
    case "create_ticket":
      return createTicket(args as Parameters<typeof createTicket>[0]);
    case "check_allergens":
      return checkAllergens(args as Parameters<typeof checkAllergens>[0]);
    case "complete_order":
      return completeOrder(args as Parameters<typeof completeOrder>[0]);
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}
