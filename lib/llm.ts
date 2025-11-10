import OpenAI from "openai";

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
        role: "user",
        content: `You are ${customerName}. You just received a ${qualityDescriptor} ${drinkType} at a café.

React in 1-2 sentences. Be natural and reflect the quality of the drink.`,
      },
    ],
    max_tokens: 256,
    temperature: 0.8,
  });

  const reaction = completion.choices[0]?.message?.content || "";

  return {
    reaction,
    satisfaction: drinkQuality,
  };
}
