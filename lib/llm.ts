import OpenAI from "openai";
import type { DrinkType, Customer } from "./types";
import { RECIPES } from "./recipes";
import {
  generateCustomerProfile,
  calculatePayment,
  type GeneratedCustomerProfile,
} from "./customer-generator";

// Initialize the OpenRouter client (uses OpenAI SDK with custom base URL)
let openrouterClient: OpenAI | null = null;

export function getOpenRouterClient(): OpenAI {
  if (!openrouterClient) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY is not set. Please add it to your .env.local file."
      );
    }
    openrouterClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "Small Hours - Coffee Shop Simulator",
      },
    });
  }
  return openrouterClient;
}

// Get the model to use (defaults to Kimi K2 Thinking)
export function getModel(): string {
  return process.env.LLM_MODEL || "moonshotai/kimi-k2-thinking";
}

// Sanitize user input to prevent prompt injection
function sanitizeInput(input: string, maxLength = 100): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/\n/g, ' ')
    .slice(0, maxLength);
}

// Types for our game
export interface CustomerGreeting {
  greeting: string;
  mood: "happy" | "neutral" | "stressed" | "tired";
}

export interface CustomerReaction {
  reaction: string;
  satisfaction: number; // 0-100
}

/**
 * Generate a customer greeting
 * This is a simple example - we'll expand this in later phases
 */
export async function generateCustomerGreeting(
  customerName: string,
  personality: string
): Promise<CustomerGreeting> {
  const client = getOpenRouterClient();
  const model = getModel();

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: `You are ${customerName}, a customer in a cozy café. Your personality: ${personality}.

Greet the barista in 1-2 sentences. Be natural and stay in character.`,
      },
    ],
    max_tokens: 256,
    temperature: 0.8,
  });

  const greeting = completion.choices[0]?.message?.content || "";

  // Simple mood detection (we can make this more sophisticated later)
  let mood: CustomerGreeting["mood"] = "neutral";
  if (greeting.includes("!") || greeting.includes("great") || greeting.includes("wonderful")) {
    mood = "happy";
  } else if (greeting.includes("tired") || greeting.includes("exhausted")) {
    mood = "tired";
  } else if (greeting.includes("rushed") || greeting.includes("hurry")) {
    mood = "stressed";
  }

  return { greeting, mood };
}

/**
 * Generate a customer's reaction to their drink
 */
export async function generateDrinkReaction(
  customerName: string,
  drinkQuality: number, // 0-100
  drinkType: string
): Promise<CustomerReaction> {
  const client = getOpenRouterClient();
  const model = getModel();

  const qualityDescriptor =
    drinkQuality >= 90
      ? "perfect"
      : drinkQuality >= 75
      ? "good"
      : drinkQuality >= 50
      ? "okay"
      : "poor";

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "You are a customer at a cozy neighborhood café. Stay in character. Be natural and concise."
      },
      {
        role: "user",
        content: `You are ${sanitizeInput(customerName)}. You just received a ${qualityDescriptor} ${drinkType} at a café.

React in 1-2 sentences. Be natural and reflect the quality of the drink.`,
      },
    ],
    max_tokens: 128,
    temperature: 0.8,
  });

  const reaction = completion.choices[0]?.message?.content || "";

  return {
    reaction,
    satisfaction: drinkQuality,
  };
}

/**
 * Generate a dynamic customer with personality
 * Uses RNG to create detailed profile, LLM to generate natural dialogue
 */
export async function generateCustomer(
  preferredDrink?: DrinkType,
  seed?: number
): Promise<Customer> {
  // Generate detailed customer profile using RNG
  const profile = generateCustomerProfile(seed, preferredDrink);
  const recipe = RECIPES[profile.drinkType];

  const client = getOpenRouterClient();
  const model = getModel();

  try {
    // Build context for LLM based on profile
    const contextParts = [
      `You are ${profile.name}, ${profile.personality}`,
      `Mood: ${profile.mood}`,
      profile.archetype.timeConstraint !== "normal" && `Time: ${profile.archetype.timeConstraint}`,
      profile.allergens.length > 0 && `Allergies: ${profile.allergens.join(", ")}`,
    ].filter(Boolean);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a customer at a cozy café called "Small Hours".
Generate ONLY a JSON object with your order (no other text):

{
  "order": "Natural language order for the drink, 1 sentence, stay in character"
}

Character: ${contextParts.join(". ")}.
You want: ${recipe.name}
${profile.milkPreference ? `Preferred milk: ${profile.milkPreference}` : ""}

Be natural and concise. Match your mood and time constraint.`
        },
        {
          role: "user",
          content: "Place your order"
        }
      ],
      max_tokens: 80,
      temperature: 0.9,
    });

    const response = completion.choices[0]?.message?.content || "";

    // Parse the JSON response
    let order: string;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        order = parsed.order || `I'd like a ${recipe.name}, please.`;
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse LLM response:", response);
      // Fallback based on archetype
      if (profile.archetype.timeConstraint === "rushed") {
        order = `Quick ${recipe.name}, please!`;
      } else if (profile.archetype.timeConstraint === "relaxed") {
        order = `I'll have a ${recipe.name}, please. Take your time.`;
      } else {
        order = `Can I get a ${recipe.name}?`;
      }
    }

    return {
      name: sanitizeInput(profile.name, 50),
      order: sanitizeInput(order, 200),
      drinkType: profile.drinkType,
      payment: calculatePayment(profile.drinkType, profile.budget),
      personality: profile.personality,
      mood: profile.mood,
      budget: profile.budget,
      allergens: profile.allergens,
    };

  } catch (error) {
    console.error("Error generating customer:", error);

    // Fallback to profile without LLM
    let order: string;
    if (profile.archetype.timeConstraint === "rushed") {
      order = `${recipe.name}, fast please!`;
    } else {
      order = `I'd like a ${recipe.name}, please.`;
    }

    return {
      name: profile.name,
      order,
      drinkType: profile.drinkType,
      payment: calculatePayment(profile.drinkType, profile.budget),
      personality: profile.personality,
      mood: profile.mood,
      budget: profile.budget,
      allergens: profile.allergens,
    };
  }
}
