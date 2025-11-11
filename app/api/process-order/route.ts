/**
 * Process Order API Route
 *
 * Uses LLM function calling to:
 * 1. Parse natural language orders into structured data
 * 2. Create order tickets
 * 3. Check allergen safety
 * 4. Manage the order workflow
 */

import { NextResponse } from "next/server";
import { getOpenRouterClient, getModel } from "@/lib/llm";
import {
  TOOLS,
  executeFunctionCall,
  type ParsedOrder,
  type OrderTicket,
  type AllergenCheckResult,
} from "@/lib/function-calling";
import type { Customer } from "@/lib/types";
import { auditedLLMCall, auditedToolCall } from "@/lib/audit-log";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, customer, orderText, allergens } = body;

    const client = getOpenRouterClient();
    const model = getModel();

    // ========================================================================
    // ACTION: Parse Order
    // ========================================================================
    if (action === "parse_order") {
      if (!orderText) {
        return NextResponse.json(
          { error: "orderText is required for parse_order action" },
          { status: 400 }
        );
      }

      const completion = await auditedLLMCall({
        source: "process_order",
        model,
        prompt: `Parse order: "${orderText}"`,
        fn: () => client.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: `You are a helpful barista assistant at "Small Hours" café.
Your job is to parse customer orders into structured data.

Listen carefully to what the customer says and extract:
- The drink they want
- Any milk preferences
- Temperature preferences
- Special requests
- How rushed they seem

Use the parse_order function to structure the order.`,
            },
            {
              role: "user",
              content: `Customer says: "${orderText}"`,
            },
          ],
          tools: TOOLS,
          tool_choice: { type: "function", function: { name: "parse_order" } },
          max_tokens: 256,
          temperature: 0.3, // Lower temperature for more consistent parsing
        }),
      });

      const message = completion.choices[0]?.message;
      if (!message?.tool_calls || message.tool_calls.length === 0) {
        return NextResponse.json(
          { error: "LLM did not call parse_order function" },
          { status: 500 }
        );
      }

      const toolCall = message.tool_calls[0];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      const parsedOrder = auditedToolCall({
        source: "process_order",
        toolName: "parse_order",
        toolArgs: functionArgs,
        fn: () => executeFunctionCall("parse_order", functionArgs),
      }) as ParsedOrder;

      return NextResponse.json({ parsedOrder });
    }

    // ========================================================================
    // ACTION: Create Ticket
    // ========================================================================
    if (action === "create_ticket") {
      if (!customer) {
        return NextResponse.json(
          { error: "customer is required for create_ticket action" },
          { status: 400 }
        );
      }

      const customerData = customer as Customer;

      const completion = await auditedLLMCall({
        source: "process_order",
        model,
        prompt: `Create ticket for: ${customerData.name} - ${customerData.drinkType}`,
        fn: () => client.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: `You are a barista at "Small Hours" café managing the order queue.

Create an order ticket for this customer. Extract key information:
- Customer name
- Drink type
- Milk preference if applicable
- Any special notes
- Priority (high if customer seems rushed, otherwise normal)

Use the create_ticket function.`,
            },
            {
              role: "user",
              content: `Customer: ${customerData.name}
Order: "${customerData.order}"
Drink: ${customerData.drinkType}
Mood: ${customerData.mood || "neutral"}
${customerData.allergens && customerData.allergens.length > 0 ? `Allergens: ${customerData.allergens.join(", ")}` : ""}

Create a ticket for this order.`,
            },
          ],
          tools: TOOLS,
          tool_choice: { type: "function", function: { name: "create_ticket" } },
          max_tokens: 256,
          temperature: 0.3,
        }),
      });

      const message = completion.choices[0]?.message;
      if (!message?.tool_calls || message.tool_calls.length === 0) {
        return NextResponse.json(
          { error: "LLM did not call create_ticket function" },
          { status: 500 }
        );
      }

      const toolCall = message.tool_calls[0];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      const ticket = auditedToolCall({
        source: "process_order",
        toolName: "create_ticket",
        toolArgs: functionArgs,
        fn: () => executeFunctionCall("create_ticket", functionArgs),
      }) as OrderTicket;

      return NextResponse.json({ ticket });
    }

    // ========================================================================
    // ACTION: Check Allergens
    // ========================================================================
    if (action === "check_allergens") {
      const { drinkType, milkType, customerAllergens } = body;

      if (!drinkType || !customerAllergens) {
        return NextResponse.json(
          { error: "drinkType and customerAllergens are required" },
          { status: 400 }
        );
      }

      // Use LLM to intelligently check allergens
      const completion = await auditedLLMCall({
        source: "process_order",
        model,
        prompt: `Check allergens: ${drinkType} with ${milkType || "no milk"} for ${customerAllergens.join(", ")}`,
        fn: () => client.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: `You are a safety-focused barista at "Small Hours" café.

Your job is to check if a drink configuration is safe for customers with allergens.
Always prioritize customer safety. Use the check_allergens function.`,
            },
            {
              role: "user",
              content: `Check safety:
Drink: ${drinkType}
Milk: ${milkType || "none"}
Customer allergens: ${customerAllergens.join(", ")}

Is this safe to serve?`,
            },
          ],
          tools: TOOLS,
          tool_choice: { type: "function", function: { name: "check_allergens" } },
          max_tokens: 256,
          temperature: 0.1, // Very low temperature for safety checks
        }),
      });

      const message = completion.choices[0]?.message;
      if (!message?.tool_calls || message.tool_calls.length === 0) {
        return NextResponse.json(
          { error: "LLM did not call check_allergens function" },
          { status: 500 }
        );
      }

      const toolCall = message.tool_calls[0];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      const allergenCheck = auditedToolCall({
        source: "process_order",
        toolName: "check_allergens",
        toolArgs: functionArgs,
        fn: () => executeFunctionCall("check_allergens", functionArgs),
      }) as AllergenCheckResult;

      return NextResponse.json({ allergenCheck });
    }

    // ========================================================================
    // Invalid Action
    // ========================================================================
    return NextResponse.json(
      { error: `Invalid action: ${action}. Valid actions: parse_order, create_ticket, check_allergens` },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error in process-order API:", error);
    return NextResponse.json(
      {
        error: "Failed to process order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
