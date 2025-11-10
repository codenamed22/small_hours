"use client";

import { useState } from "react";
import {
  GameState,
  BrewParameters,
  GrindSize,
  DrinkType,
  MilkType,
  RECIPES,
  brewDrink,
  createInitialState,
  createStaticCustomer,
  getRequiredParameters,
  getDefaultParameters,
  checkStock,
  depleteStock,
  getTotalBeans,
  getLowStockWarnings,
  addTicket,
  getNextTicket,
  startTicket,
  completeTicket,
  getPendingTickets,
  getQueueStats,
  type OrderTicket,
  type AllergenCheckResult,
} from "@/lib/game-engine";

export default function Game() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [showHelp, setShowHelp] = useState(false);
  const [isGeneratingCustomer, setIsGeneratingCustomer] = useState(false);
  const [allergenCheck, setAllergenCheck] = useState<AllergenCheckResult | null>(null);
  const [isCheckingAllergens, setIsCheckingAllergens] = useState(false);

  const startNewOrder = async () => {
    setShowHelp(false); // Reset help for new order
    setIsGeneratingCustomer(true);
    setAllergenCheck(null); // Reset allergen check

    try {
      // Call API route to generate a dynamic customer (server-side)
      // Customer decides what drink they want, not us!
      const response = await fetch("/api/generate-customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // No drink preference - let RNG decide
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const customer = data.customer;

      // Create a ticket for this order
      const ticketResponse = await fetch("/api/process-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_ticket",
          customer,
        }),
      });

      let ticket: OrderTicket | null = null;
      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();
        ticket = ticketData.ticket;
      }

      setGameState((prev) => {
        let newQueue = prev.queue;
        if (ticket && newQueue) {
          newQueue = addTicket(newQueue, ticket);
          newQueue = startTicket(newQueue, ticket.id);
        }

        return {
          ...prev,
          customer,
          brewParams: getDefaultParameters(customer.drinkType), // Reset params for what customer wants
          result: null,
          queue: newQueue,
        };
      });
    } catch (error) {
      console.error("Failed to generate customer:", error);

      // Fallback to static customer if API fails - random drink
      const randomDrink = ["espresso", "latte", "cappuccino", "pourover", "aeropress"][
        Math.floor(Math.random() * 5)
      ] as DrinkType;

      setGameState((prev) => ({
        ...prev,
        customer: createStaticCustomer(randomDrink),
        brewParams: getDefaultParameters(randomDrink),
        result: null,
      }));
    } finally {
      setIsGeneratingCustomer(false);
    }
  };

  const handleBrew = async () => {
    if (!gameState.customer) return;

    // Check allergens if customer has any
    if (gameState.customer.allergens && gameState.customer.allergens.length > 0) {
      setIsCheckingAllergens(true);
      try {
        const response = await fetch("/api/process-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "check_allergens",
            drinkType: gameState.customer.drinkType,
            milkType: gameState.brewParams.milkType,
            customerAllergens: gameState.customer.allergens,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const check: AllergenCheckResult = data.allergenCheck;
          setAllergenCheck(check);

          if (!check.safe) {
            alert(`⚠️ ALLERGEN WARNING!\n\n${check.blockers.join("\n")}\n\nPlease adjust the drink parameters before brewing.`);
            setIsCheckingAllergens(false);
            return;
          }

          if (check.warnings.length > 0) {
            console.warn("Allergen warnings:", check.warnings);
          }
        }
      } catch (error) {
        console.error("Failed to check allergens:", error);
      } finally {
        setIsCheckingAllergens(false);
      }
    }

    // Check if we have enough stock
    const stockCheck = checkStock(
      gameState.inventory,
      gameState.customer.drinkType,
      gameState.brewParams
    );

    if (!stockCheck.available) {
      alert(`Out of stock: ${stockCheck.missing.join(", ")}`);
      return;
    }

    // Brew the drink
    const result = brewDrink(gameState.customer.drinkType, gameState.brewParams);

    // Deplete stock
    const newInventory = depleteStock(
      gameState.inventory,
      gameState.customer.drinkType,
      gameState.brewParams
    );

    setGameState((prev) => ({
      ...prev,
      result,
      inventory: newInventory,
    }));
  };

  const handleServe = () => {
    if (!gameState.result || !gameState.customer) return;

    setShowHelp(false); // Reset help when serving
    setAllergenCheck(null); // Reset allergen check

    setGameState((prev) => {
      let newQueue = prev.queue;

      // Complete the active ticket if there is one
      if (newQueue && newQueue.activeTicketId) {
        newQueue = completeTicket(newQueue, newQueue.activeTicketId, prev.customer!.payment);
      }

      return {
        ...prev,
        money: prev.money + prev.customer!.payment,
        drinksServed: prev.drinksServed + 1,
        customer: null,
        result: null,
        queue: newQueue,
      };
    });
  };

  const updateBrewParam = <K extends keyof BrewParameters>(
    key: K,
    value: BrewParameters[K]
  ) => {
    setGameState((prev) => ({
      ...prev,
      brewParams: {
        ...prev.brewParams,
        [key]: value,
      },
    }));
  };

  const grindSizes: GrindSize[] = [
    "coarse",
    "medium-coarse",
    "medium",
    "medium-fine",
    "fine",
  ];

  const milkTypes: MilkType[] = ["none", "whole", "skim", "oat", "almond"];

  const currentDrinkType = gameState.customer?.drinkType || "espresso";
  const recipe = RECIPES[currentDrinkType];
  const requiredParams = getRequiredParameters(currentDrinkType);

  const hasMilk = requiredParams.includes("milkType");
  const hasBloom = requiredParams.includes("bloomTime");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-amber-900 mb-2">
              Small Hours
            </h1>
            <p className="text-amber-700">A Coffee Craft Simulator</p>
          </div>

          {/* Stats Bar */}
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-4 mb-6 flex justify-between items-center">
            <div>
              <span className="text-gray-600">Money:</span>
              <span className="ml-2 text-2xl font-bold text-green-600">
                ${gameState.money.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Drinks Served:</span>
              <span className="ml-2 text-2xl font-bold text-amber-600">
                {gameState.drinksServed}
              </span>
            </div>
            {gameState.queue && (
              <div>
                <span className="text-gray-600">Queue:</span>
                <span className="ml-2 text-2xl font-bold text-blue-600">
                  {getPendingTickets(gameState.queue).length}
                </span>
              </div>
            )}
          </div>

          {/* Queue Panel */}
          {gameState.queue && getPendingTickets(gameState.queue).length > 0 && (
            <div className="bg-blue-50/90 backdrop-blur rounded-xl shadow-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span>📋</span>
                Waiting Customers
              </h3>
              <div className="space-y-2">
                {getPendingTickets(gameState.queue).slice(0, 3).map((ticket, idx) => (
                  <div
                    key={ticket.id}
                    className="bg-white p-3 rounded-lg flex justify-between items-center border-l-4 border-blue-400"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">{ticket.customerName}</div>
                      <div className="text-sm text-gray-600">
                        {RECIPES[ticket.drinkType].name}
                        {ticket.priority === "high" && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            ⚡ RUSHED
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      #{idx + 1} in queue
                    </div>
                  </div>
                ))}
                {getPendingTickets(gameState.queue).length > 3 && (
                  <div className="text-center text-sm text-gray-600">
                    + {getPendingTickets(gameState.queue).length - 3} more waiting...
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column: Customer & Brewing */}
            <div className="space-y-6">
              {/* Inventory Panel */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <span>📦</span>
                  Inventory
                </h2>

                <div className="space-y-3">
                  {/* Coffee Beans */}
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Coffee Beans</span>
                      <span className="text-lg font-bold text-amber-600">
                        {getTotalBeans(gameState.inventory)}g
                      </span>
                    </div>
                  </div>

                  {/* Milk Inventory */}
                  {Object.entries(gameState.inventory.milks)
                    .filter(([type, amount]) => type !== "none" && amount > 0)
                    .map(([type, amount]) => (
                      <div key={type} className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700 capitalize">
                            {type} Milk
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {amount}ml
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Low Stock Warnings */}
                {getLowStockWarnings(gameState.inventory).length > 0 && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                    <div className="font-bold mb-2">⚠️ Low Stock Warnings</div>
                    {getLowStockWarnings(gameState.inventory).map((warning, i) => (
                      <div key={i} className="text-sm">
                        • {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Card */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <span>👤</span>
                  Customer
                </h2>

                {gameState.customer ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">
                        {gameState.customer.mood === "happy" ? "😊" :
                         gameState.customer.mood === "stressed" ? "😰" :
                         gameState.customer.mood === "tired" ? "😴" : "😐"}
                      </span>
                      <div className="flex-1">
                        <p className="text-lg font-semibold">{gameState.customer.name}</p>
                        {gameState.customer.personality && (
                          <p className="text-xs text-gray-500 italic">
                            {gameState.customer.personality}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-base mb-3 bg-amber-50 p-3 rounded-lg border-l-4 border-amber-400">
                      &quot;{gameState.customer.order}&quot;
                    </p>

                    {/* Allergen Warning */}
                    {gameState.customer.allergens && gameState.customer.allergens.length > 0 && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-red-600 font-bold">⚠️ ALLERGENS</span>
                          {allergenCheck && allergenCheck.safe && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              ✓ Checked Safe
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-red-800">
                          {gameState.customer.allergens.map((allergen) => (
                            <span key={allergen} className="inline-block bg-red-100 px-2 py-1 rounded mr-2 mb-1">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-gray-600 border-t pt-2">
                      <span>
                        Drink: <span className="font-semibold">{recipe.name}</span>
                      </span>
                      <span>
                        Payment: <span className="font-semibold text-green-600">${gameState.customer.payment.toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    {isGeneratingCustomer ? (
                      <div className="py-8">
                        <div className="text-6xl mb-4">🚪</div>
                        <p className="text-gray-600 mb-2 font-medium">A customer is approaching...</p>
                        <p className="text-xs text-gray-500 italic">They'll tell you what they want</p>
                      </div>
                    ) : (
                      <div className="py-8">
                        <div className="text-6xl mb-4">☕</div>
                        <p className="text-gray-600 mb-4">
                          Your café is ready.<br />
                          Who will walk through the door?
                        </p>
                      </div>
                    )}

                    <button
                      onClick={startNewOrder}
                      disabled={isGeneratingCustomer}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-amber-400 disabled:to-orange-400 flex items-center justify-center gap-2 mx-auto"
                    >
                      {isGeneratingCustomer ? (
                        <>
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
                          Customer arriving...
                        </>
                      ) : (
                        "Open the Door"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Brewing Controls */}
              {gameState.customer && !gameState.result && (
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <span>☕</span>
                    Brewing Station
                  </h2>

                  <div className="space-y-4">
                    {/* Grind Size */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-amber-100">
                        Grind Size
                      </label>
                      <select
                        value={gameState.brewParams.grindSize}
                        onChange={(e) =>
                          updateBrewParam("grindSize", e.target.value as GrindSize)
                        }
                        className="w-full px-4 py-2 rounded-lg text-gray-800 font-medium"
                      >
                        {grindSizes.map((size) => (
                          <option key={size} value={size}>
                            {size.charAt(0).toUpperCase() + size.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Temperature */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-amber-100">
                        Water Temperature: {gameState.brewParams.temperature}°F
                      </label>
                      <input
                        type="range"
                        min="170"
                        max="212"
                        value={gameState.brewParams.temperature}
                        onChange={(e) =>
                          updateBrewParam("temperature", parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-amber-100 mt-1">
                        <span>170°F (Cool)</span>
                        <span>212°F (Boiling)</span>
                      </div>
                    </div>

                    {/* Brew Time */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-amber-100">
                        {recipe.category === "espresso-based" ? "Pull Time" : "Brew Time"}: {gameState.brewParams.brewTime}s
                      </label>
                      <input
                        type="range"
                        min={recipe.category === "espresso-based" ? "15" : "30"}
                        max={recipe.category === "espresso-based" ? "35" : "240"}
                        value={gameState.brewParams.brewTime}
                        onChange={(e) =>
                          updateBrewParam("brewTime", parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-amber-100 mt-1">
                        <span>{recipe.category === "espresso-based" ? "15s (Fast)" : "30s (Quick)"}</span>
                        <span>{recipe.category === "espresso-based" ? "35s (Slow)" : "240s (Long)"}</span>
                      </div>
                    </div>

                    {/* Milk Controls */}
                    {hasMilk && (
                      <>
                        <div className="border-t border-amber-400 pt-4">
                          <h3 className="font-bold text-amber-100 mb-3">Milk Parameters</h3>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-amber-100">
                            Milk Type
                          </label>
                          <select
                            value={gameState.brewParams.milkType || "whole"}
                            onChange={(e) =>
                              updateBrewParam("milkType", e.target.value as MilkType)
                            }
                            className="w-full px-4 py-2 rounded-lg text-gray-800 font-medium"
                          >
                            {milkTypes.filter(m => m !== "none").map((type) => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)} Milk
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-amber-100">
                            Milk Temperature: {gameState.brewParams.milkTemp}°F
                          </label>
                          <input
                            type="range"
                            min="120"
                            max="180"
                            value={gameState.brewParams.milkTemp}
                            onChange={(e) =>
                              updateBrewParam("milkTemp", parseInt(e.target.value))
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-amber-100 mt-1">
                            <span>120°F (Cool)</span>
                            <span>180°F (Too Hot)</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-amber-100">
                            Foam Amount: {gameState.brewParams.foamAmount}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={gameState.brewParams.foamAmount}
                            onChange={(e) =>
                              updateBrewParam("foamAmount", parseInt(e.target.value))
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-amber-100 mt-1">
                            <span>0% (No Foam)</span>
                            <span>100% (All Foam)</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Bloom Time for Pour Over */}
                    {hasBloom && (
                      <>
                        <div className="border-t border-amber-400 pt-4">
                          <h3 className="font-bold text-amber-100 mb-3">Pour Over Technique</h3>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2 text-amber-100">
                            Bloom Time: {gameState.brewParams.bloomTime}s
                          </label>
                          <input
                            type="range"
                            min="15"
                            max="60"
                            value={gameState.brewParams.bloomTime}
                            onChange={(e) =>
                              updateBrewParam("bloomTime", parseInt(e.target.value))
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-amber-100 mt-1">
                            <span>15s (Quick)</span>
                            <span>60s (Long)</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Brew Button */}
                    <button
                      onClick={handleBrew}
                      disabled={isCheckingAllergens}
                      className="w-full bg-white text-amber-900 font-bold px-8 py-4 rounded-xl hover:bg-amber-50 transition-all shadow-lg text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCheckingAllergens ? (
                        <>
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
                          Checking Safety...
                        </>
                      ) : (
                        recipe.category === "espresso-based" ? "Pull Shot" : `Brew ${recipe.name}`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Results */}
            <div>
              {gameState.result && gameState.customer && (
                <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
                  <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <span>📊</span>
                    Results
                  </h2>

                  {/* Quality Score */}
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold text-amber-600 mb-2">
                      {gameState.result.quality}
                    </div>
                    <div className="text-gray-600 text-lg">Quality Score</div>
                    <div
                      className={`mt-2 px-4 py-2 rounded-lg inline-block ${
                        gameState.result.quality >= 85
                          ? "bg-green-100 text-green-800"
                          : gameState.result.quality >= 70
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {gameState.result.feedback}
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-3 mb-6">
                    {Object.entries(gameState.result.breakdown).map(([component, score]) => (
                      <div key={component} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-700">
                            {component}
                          </span>
                          <span className="text-sm font-bold text-amber-600">
                            {score}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Serve Button */}
                  <button
                    onClick={handleServe}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg text-lg"
                  >
                    Serve & Collect ${gameState.customer.payment.toFixed(2)}
                  </button>
                </div>
              )}

              {!gameState.result && !gameState.customer && (
                <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 text-center">
                  <div className="text-6xl mb-4">☕</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Waiting for customers
                  </h3>
                  <p className="text-gray-600">
                    Open the door and see who walks in
                  </p>
                </div>
              )}

              {!gameState.result && gameState.customer && (
                <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-amber-900">
                      Recipe: {recipe.name}
                    </h3>
                    <button
                      onClick={() => setShowHelp(!showHelp)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        showHelp
                          ? "bg-amber-500 text-white"
                          : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                      }`}
                    >
                      {showHelp ? "Hide Help" : "Need Help?"}
                    </button>
                  </div>

                  {showHelp && (
                    <>
                      <p className="text-sm text-gray-600 mb-4 italic">
                        {recipe.description}
                      </p>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <h4 className="font-bold text-amber-900 mb-2">Ideal Parameters:</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li><span className="font-semibold">Grind:</span> {recipe.idealGrind}</li>
                          <li><span className="font-semibold">Temp:</span> {recipe.idealTemp}°F</li>
                          <li><span className="font-semibold">Time:</span> {recipe.idealBrewTime}s</li>
                          {recipe.idealMilkTemp && (
                            <>
                              <li><span className="font-semibold">Milk Temp:</span> {recipe.idealMilkTemp}°F</li>
                              <li><span className="font-semibold">Foam:</span> {recipe.idealFoamAmount}%</li>
                            </>
                          )}
                          {recipe.idealBloomTime && (
                            <li><span className="font-semibold">Bloom:</span> {recipe.idealBloomTime}s</li>
                          )}
                        </ul>
                      </div>
                    </>
                  )}

                  {!showHelp && (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3">🤔</div>
                      <p className="text-gray-600">
                        Try your best! Use your brewing knowledge to create the perfect {recipe.name.toLowerCase()}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Back to Home Link */}
          <div className="text-center mt-8">
            <a
              href="/"
              className="text-amber-600 hover:text-amber-800 font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
