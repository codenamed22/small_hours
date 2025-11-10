"use client";

import { useState } from "react";

export default function Home() {
  const [llmResponse, setLlmResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testLLMCall = async () => {
    setLoading(true);
    setLlmResponse("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/test-llm", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setLlmResponse(
          `Error: ${data.error}${data.details ? `\n\n${data.details}` : ""}${
            data.instructions ? `\n\n${data.instructions}` : ""
          }`
        );
      } else if (data.message) {
        setLlmResponse(data.message);
      } else {
        setLlmResponse("No response received from the LLM service.");
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setLlmResponse(
            "Request timed out after 30 seconds. The LLM service might be slow or unavailable."
          );
        } else {
          setLlmResponse(`Error: ${error.message}`);
        }
      } else {
        setLlmResponse(`Error: ${String(error)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="text-6xl mb-4">☕</div>
              <h1 className="text-7xl font-bold bg-gradient-to-r from-amber-800 to-orange-900 bg-clip-text text-transparent mb-4">
                Small Hours
              </h1>
              <p className="text-2xl text-amber-800 font-medium">
                A Coffee Shop Simulator
              </p>
            </div>
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-white font-semibold shadow-lg">
              Phase 0: Foundation & Proof of Concept
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Main Card */}
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 border border-amber-100">
              <h2 className="text-3xl font-bold mb-4 text-amber-900 flex items-center gap-2">
                <span>🏪</span>
                Welcome to Your Café
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                This is the beginning of your journey as a café owner. Right now,
                we&apos;re setting up the foundation - making sure all the pieces work
                together.
              </p>

              <div className="border-t border-amber-200 pt-6">
                <h3 className="text-xl font-bold mb-4 text-amber-900">
                  Phase 0 Checklist
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <span className="mr-3 text-2xl">✅</span>
                    <span>Project scaffolding complete</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="mr-3 text-2xl">✅</span>
                    <span>TypeScript & Next.js configured</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="mr-3 text-2xl">✅</span>
                    <span>Basic UI shell created</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="mr-3 text-2xl">
                      {llmResponse ? "✅" : "⏳"}
                    </span>
                    <span>LLM API integration</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* LLM Test Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>🤖</span>
                LLM Integration Test
              </h3>
              <p className="mb-6 text-amber-50 leading-relaxed">
                Click the button below to test the LLM API connection. This will
                verify that we can communicate with an AI service for generating
                customer dialogues and stories.
              </p>
              <p className="mb-6 text-amber-100 text-sm italic">
                ⏱️ Note: LLM calls can take 10-20 seconds. Please be patient!
              </p>

              <button
                onClick={testLLMCall}
                disabled={loading}
                className="w-full bg-white text-amber-900 font-bold px-8 py-4 rounded-xl hover:bg-amber-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Testing Connection...
                  </span>
                ) : (
                  "🚀 Test LLM Connection"
                )}
              </button>

              {llmResponse && (
                <div className="mt-6 p-5 bg-white/20 backdrop-blur rounded-xl border border-white/30">
                  <p className="text-sm font-bold text-amber-100 mb-2 uppercase tracking-wide">
                    Response from Kimi K2:
                  </p>
                  <p className="text-white leading-relaxed font-medium">
                    {llmResponse}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-center">
            <div className="inline-block bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6 border border-amber-100">
              <p className="text-gray-700 flex items-center gap-2 justify-center mb-4">
                <span className="text-2xl">🎯</span>
                <span className="font-medium">
                  {llmResponse
                    ? "Phase 0 Complete! Ready to move on to Phase 1"
                    : "Once Phase 0 is complete, we'll move on to Phase 1: Building the minimal craft loop"}
                </span>
              </p>
              {llmResponse && (
                <a
                  href="/game"
                  className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
                >
                  Play Phase 1: Brewing Mechanics →
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
