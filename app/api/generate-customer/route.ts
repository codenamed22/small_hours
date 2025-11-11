import { generateCustomer } from "@/lib/llm";
import { NextResponse } from "next/server";
import type { DrinkType } from "@/lib/types";
import { VALID_DRINKS } from "@/lib/types";
import { auditedLLMCall } from "@/lib/audit-log";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { drinkType } = body;

    // Validate drink type
    if (drinkType && !VALID_DRINKS.includes(drinkType)) {
      return NextResponse.json(
        { error: "Invalid drink type" },
        { status: 400 }
      );
    }

    // Generate customer using LLM with audit logging
    const customer = await auditedLLMCall({
      source: "generate_customer",
      model: "anthropic/claude-3.5-sonnet",
      prompt: `Generate customer for drink: ${drinkType || "random"}`,
      fn: () => generateCustomer(drinkType),
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error generating customer:", error);
    return NextResponse.json(
      {
        error: "Failed to generate customer",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
