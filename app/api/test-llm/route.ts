import { getOpenRouterClient, getModel } from "@/lib/llm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENROUTER_API_KEY not configured. Please add it to your .env.local file.",
          instructions: "Get your API key from https://openrouter.ai/keys",
        },
        { status: 500 }
      );
    }

    // Initialize OpenRouter client
    const client = getOpenRouterClient();
    const model = getModel();

    // Test call to the LLM via OpenRouter
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content:
            "You are a friendly barista in a cozy neighborhood café called 'Small Hours'. Greet me warmly and tell me about today's special coffee in 2-3 sentences.",
        },
      ],
      max_tokens: 2048, // Increased for reasoning models like Kimi K2
      temperature: 0.8,
    });

    // Extract the response text
    // Kimi K2 Thinking uses 'reasoning' field, other models use 'content'
    const message = completion.choices[0]?.message;
    let responseText = message?.content || "";

    // If content is empty, try the reasoning field (for Kimi K2)
    if (!responseText && message) {
      const reasoning = (message as any).reasoning;
      if (reasoning) {
        responseText = reasoning;
      }
    }

    return NextResponse.json({
      success: true,
      message: responseText,
      model: completion.model,
      provider: "OpenRouter",
      usage: completion.usage,
    });
  } catch (error) {
    console.error("LLM Test Error:", error);
    return NextResponse.json(
      {
        error: "Failed to connect to OpenRouter API",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
