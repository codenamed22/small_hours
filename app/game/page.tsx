"use client";

import { useState, useEffect, useRef } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuditLogViewer } from "@/components/AuditLogViewer";
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
  startTicket,
  completeTicket,
  getPendingTickets,
  type OrderTicket,
  type AllergenCheckResult,
  isReturningCustomer,
  recordVisit,
  getCustomer,
  getCustomerInsights,
  getMemoryStats,
  startService,
  endService,
  startNewDay,
  recordCustomer,
  restockInventory,
  getRestockCost,
  getDaySummary,
  getPerformanceEmoji,
  getPerformanceDescription,
} from "@/lib/game-engine";
import {
  saveGame,
  loadGame,
  deleteSave,
  exportSave,
  importSave,
} from "@/lib/persistence";

export default function Game() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [showHelp, setShowHelp] = useState(false);
  const [isGeneratingCustomer, setIsGeneratingCustomer] = useState(false);
  const [allergenCheck, setAllergenCheck] = useState<AllergenCheckResult | null>(null);
  const [isCheckingAllergens, setIsCheckingAllergens] = useState(false);
  const [isBrewing, setIsBrewing] = useState(false);
  const [isServing, setIsServing] = useState(false);
  const [showMemoryStats, setShowMemoryStats] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved game on client mount only
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      setGameState(saved);
    }
  }, []);

  // Auto-save game state (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 1 second
    saveTimeoutRef.current = setTimeout(() => {
      const success = saveGame(gameState);
      if (success) {
        setLastSaveTime(Date.now());
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [gameState]);

  // Manual save
  const handleManualSave = () => {
    const success = saveGame(gameState);
    if (success) {
      setLastSaveTime(Date.now());
      alert("Game saved successfully!");
    } else {
      alert("Failed to save game. Check browser console.");
    }
  };

  // Reset game
  const handleReset = () => {
    if (confirm("Are you sure you want to reset your game? This cannot be undone.")) {
      deleteSave();
      setGameState(createInitialState());
      setLastSaveTime(null);
      alert("Game reset successfully!");
    }
  };

  // Export save
  const handleExport = () => {
    const json = exportSave();
    if (!json) {
      alert("No save data to export.");
      return;
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `small-hours-save-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import save
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const success = importSave(json);
        if (success) {
          const loaded = loadGame();
          if (loaded) {
            setGameState(loaded);
            setLastSaveTime(Date.now());
            alert("Save imported successfully!");
          }
        } else {
          alert("Failed to import save. Invalid file format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Day phase handlers
  const handleStartDay = () => {
    if (!gameState.dayState) return;

    setGameState((prev) => ({
      ...prev,
      dayState: prev.dayState ? startService(prev.dayState) : prev.dayState,
    }));
  };

  const handleEndDay = () => {
    if (!gameState.dayState) return;

    setGameState((prev) => ({
      ...prev,
      dayState: prev.dayState ? endService(prev.dayState) : prev.dayState,
    }));
  };

  const handleRestock = () => {
    if (!gameState.dayState) return;

    const cost = getRestockCost(gameState.dayState.dayNumber);

    if (gameState.money < cost) {
      alert(`Not enough money! Restock costs $${cost.toFixed(2)}`);
      return;
    }

    setGameState((prev) => ({
      ...prev,
      money: prev.money - cost,
      inventory: restockInventory(prev.inventory, prev.dayState?.dayNumber || 1),
    }));
  };

  const handleNextDay = () => {
    if (!gameState.dayState) return;

    setGameState((prev) => ({
      ...prev,
      dayState: prev.dayState ? startNewDay(prev.dayState) : prev.dayState,
      customer: null,
      result: null,
    }));
  };

  const startNewOrder = async () => {
    // Only allow customers during service phase
    if (gameState.dayState && gameState.dayState.phase !== "service") {
      return;
    }

    setShowHelp(false); // Reset help for new order
    setIsGeneratingCustomer(true);
    setAllergenCheck(null); // Reset allergen check
    setApiError(null); // Clear any previous errors

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

      // Set user-facing error message
      setApiError("Unable to reach our customer system. Using a backup customer instead.");

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

      // Auto-clear error after 5 seconds
      setTimeout(() => setApiError(null), 5000);
    } finally {
      setIsGeneratingCustomer(false);
    }
  };

  const handleBrew = async () => {
    // Guard against race conditions (prevent double-clicks)
    if (!gameState.customer || isBrewing) return;

    setIsBrewing(true);
    try {
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
    } finally {
      setIsBrewing(false);
    }
  };

  const handleServe = () => {
    // Guard against race conditions (prevent double-clicks)
    if (!gameState.result || !gameState.customer || isServing) return;

    setIsServing(true);
    setShowHelp(false); // Reset help when serving
    setAllergenCheck(null); // Reset allergen check

    setGameState((prev) => {
      let newQueue = prev.queue;
      let newMemory = prev.customerMemory;
      let newDayState = prev.dayState;

      // Complete the active ticket if there is one
      if (newQueue && newQueue.activeTicketId) {
        newQueue = completeTicket(newQueue, newQueue.activeTicketId, prev.customer!.payment);
      }

      // Check if customer is returning/regular
      const isReturning = newMemory ? isReturningCustomer(newMemory, prev.customer!.name) : false;
      const customerProfile = newMemory ? getCustomer(newMemory, prev.customer!.name) : null;
      const isRegular = customerProfile
        ? (customerProfile.relationshipLevel === "regular" || customerProfile.relationshipLevel === "favorite")
        : false;

      // Record visit in customer memory
      if (newMemory && prev.customer && prev.result) {
        newMemory = recordVisit(newMemory, prev.customer.name, {
          drinkOrdered: prev.customer.drinkType,
          milkType: prev.brewParams.milkType,
          quality: prev.result.quality,
          satisfaction: prev.result.quality, // Use quality as satisfaction for now
          payment: prev.customer.payment,
          allergens: prev.customer.allergens,
        });
      }

      // Record customer in day stats
      if (newDayState && prev.customer && prev.result) {
        newDayState = recordCustomer(newDayState, {
          earnings: prev.customer.payment,
          quality: prev.result.quality,
          isReturning,
          isRegular,
          drinkType: prev.customer.drinkType,
        });
      }

      return {
        ...prev,
        money: prev.money + prev.customer!.payment,
        drinksServed: prev.drinksServed + 1,
        customer: null,
        result: null,
        queue: newQueue,
        customerMemory: newMemory,
        dayState: newDayState,
      };
    });

    // Reset serving flag after state update
    setIsServing(false);
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
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <AuditLogViewer />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-amber-900 mb-2">
              Small Hours
            </h1>
            <p className="text-amber-700">A Coffee Craft Simulator</p>

            {/* Save Menu */}
            <div className="mt-4 flex justify-center gap-2 flex-wrap">
              <button
                onClick={handleManualSave}
                className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-lg font-medium hover:bg-green-200 transition-all"
              >
                💾 Save
              </button>
              <button
                onClick={handleExport}
                className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-medium hover:bg-blue-200 transition-all"
              >
                📤 Export
              </button>
              <button
                onClick={handleImport}
                className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-lg font-medium hover:bg-purple-200 transition-all"
              >
                📥 Import
              </button>
              <button
                onClick={handleReset}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-lg font-medium hover:bg-red-200 transition-all"
              >
                🔄 Reset
              </button>
              {lastSaveTime && (
                <span className="text-xs text-gray-500 self-center">
                  Last saved: {new Date(lastSaveTime).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 mb-6 rounded-lg shadow-md animate-pulse">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{apiError}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setApiError(null)}
                    className="text-yellow-700 hover:text-yellow-900 transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-4 mb-6">
            <div className="flex justify-between items-center">
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
              {gameState.customerMemory && gameState.customerMemory.totalCustomersServed > 0 && (
                <button
                  onClick={() => setShowMemoryStats(!showMemoryStats)}
                  className="text-sm bg-purple-100 text-purple-800 px-3 py-2 rounded-lg font-semibold hover:bg-purple-200 transition-all"
                >
                  {showMemoryStats ? "Hide" : "Show"} Customer Stats
                </button>
              )}
            </div>

            {/* Memory Stats Panel */}
            {showMemoryStats && gameState.customerMemory && (() => {
              const stats = getMemoryStats(gameState.customerMemory);
              return (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Total Customers</div>
                    <div className="text-xl font-bold text-purple-600">{stats.totalCustomers}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Returning Rate</div>
                    <div className="text-xl font-bold text-blue-600">{stats.returningRate.toFixed(0)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Regulars</div>
                    <div className="text-xl font-bold text-amber-600">{stats.regularCustomers + stats.favoriteCustomers}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Avg. Satisfaction</div>
                    <div className="text-xl font-bold text-green-600">{stats.averageSatisfaction}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Day Phase UI */}
          {gameState.dayState && (
            <>
              {/* PREP PHASE */}
              {gameState.dayState.phase === "prep" && (
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
                  <div className="text-center mb-6">
                    <h2 className="text-4xl font-bold mb-2">☀️ Day {gameState.dayState.dayNumber}</h2>
                    <p className="text-indigo-100 text-lg">Small Hours - Morning Preparation</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
                    <h3 className="text-2xl font-bold mb-4">Today's Goals</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white/10 p-4 rounded-lg">
                        <div className="text-sm text-indigo-200 mb-1">Target Customers</div>
                        <div className="text-3xl font-bold">{gameState.dayState.targetCustomers}</div>
                      </div>
                      <div className="bg-white/10 p-4 rounded-lg">
                        <div className="text-sm text-indigo-200 mb-1">Restock Cost</div>
                        <div className="text-3xl font-bold">${getRestockCost(gameState.dayState.dayNumber).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {gameState.dayState.dayNumber === 1 && (
                    <div className="bg-amber-500/20 border-2 border-amber-300/50 rounded-xl p-6 mb-6">
                      <h3 className="text-xl font-bold mb-3">📖 Your Story Begins...</h3>
                      <p className="text-indigo-100 leading-relaxed">
                        Welcome to Small Hours, your new coffee shop. You've poured your savings into this dream,
                        and today is opening day. The morning light filters through the windows, the espresso machine
                        gleams, and your first customers are waiting. Every drink you craft, every conversation you have,
                        will shape your cafe's reputation in this neighborhood.
                      </p>
                    </div>
                  )}

                  {gameState.dayState.dayNumber > 1 && (
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
                      <h3 className="text-xl font-bold mb-3">💭 Morning Thoughts...</h3>
                      <p className="text-indigo-100">
                        {gameState.dayState.dayNumber === 2 && "You survived your first day. Time to do it again, but better."}
                        {gameState.dayState.dayNumber === 3 && "The rhythm of the cafe is becoming familiar. Customers are starting to remember you."}
                        {gameState.dayState.dayNumber > 3 && gameState.dayState.dayNumber < 7 && "You're finding your groove. The locals are talking about your coffee."}
                        {gameState.dayState.dayNumber >= 7 && "Small Hours is becoming part of the neighborhood's daily routine."}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={handleRestock}
                      className="w-full bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-all shadow-lg text-lg flex items-center justify-center gap-2"
                    >
                      <span>📦</span>
                      Restock Inventory (${getRestockCost(gameState.dayState.dayNumber).toFixed(2)})
                    </button>

                    <button
                      onClick={handleStartDay}
                      className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold px-8 py-4 rounded-xl hover:from-green-500 hover:to-emerald-600 transition-all shadow-lg text-lg flex items-center justify-center gap-2"
                    >
                      <span>🚪</span>
                      Open the Cafe
                    </button>
                  </div>
                </div>
              )}

              {/* DEBRIEF PHASE */}
              {gameState.dayState.phase === "debrief" && (() => {
                const summary = getDaySummary(gameState.dayState);
                const performanceEmoji = getPerformanceEmoji(summary.performance);
                const performanceDesc = getPerformanceDescription(summary.performance);

                return (
                  <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl shadow-xl p-8 mb-6 text-white">
                    <div className="text-center mb-6">
                      <h2 className="text-4xl font-bold mb-2">🌙 Day {summary.dayNumber} Complete</h2>
                      <p className="text-slate-300 text-lg">End of Day Summary</p>
                    </div>

                    {/* Performance */}
                    <div className="text-center mb-6">
                      <div className="text-7xl mb-3">{performanceEmoji}</div>
                      <div className="text-3xl font-bold mb-2 capitalize">{summary.performance} Day</div>
                      <p className="text-slate-300">{performanceDesc}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="text-sm text-slate-300 mb-1">Customers Served</div>
                        <div className="text-3xl font-bold">
                          {summary.customersServed} / {summary.targetCustomers}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {summary.customersServed >= summary.targetCustomers ? "✓ Target met!" : "✗ Below target"}
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="text-sm text-slate-300 mb-1">Earnings</div>
                        <div className="text-3xl font-bold text-green-400">${summary.totalEarnings.toFixed(2)}</div>
                      </div>

                      <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="text-sm text-slate-300 mb-1">Avg. Quality</div>
                        <div className="text-3xl font-bold">{summary.averageQuality}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {summary.averageQuality >= 85 ? "⭐ Excellent" : summary.averageQuality >= 70 ? "👍 Good" : "📉 Needs work"}
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="text-sm text-slate-300 mb-1">Returning Customers</div>
                        <div className="text-3xl font-bold text-blue-400">{summary.returningRate}%</div>
                      </div>

                      <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="text-sm text-slate-300 mb-1">Most Popular</div>
                        <div className="text-2xl font-bold capitalize">{summary.topDrink || "—"}</div>
                      </div>

                      <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <div className="text-sm text-slate-300 mb-1">Hours Open</div>
                        <div className="text-3xl font-bold">{summary.hoursOpen}h</div>
                      </div>
                    </div>

                    {/* Story moment based on performance */}
                    <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
                      <h3 className="text-xl font-bold mb-3">💬 As You Close Up...</h3>
                      <p className="text-slate-200 leading-relaxed">
                        {summary.performance === "excellent" &&
                          "The last customer leaves with a smile, promising to return tomorrow. You wipe down the counter with satisfaction—this is what you dreamed of when you opened Small Hours."}
                        {summary.performance === "good" &&
                          "A solid day. You learned a few things, met some interesting people. Tomorrow, you'll do even better."}
                        {summary.performance === "fair" &&
                          "Not bad for a day's work, but you know you can do better. The regulars are starting to notice your craft."}
                        {summary.performance === "poor" &&
                          "It was a rough day. Some orders didn't go as planned, and you lost track of time. But every barista has days like this. Tomorrow is a fresh start."}
                      </p>
                    </div>

                    <button
                      onClick={handleNextDay}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold px-8 py-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg text-lg flex items-center justify-center gap-2"
                    >
                      <span>☀️</span>
                      Start Day {summary.dayNumber + 1}
                    </button>
                  </div>
                );
              })()}

              {/* SERVICE PHASE - Show day progress */}
              {gameState.dayState.phase === "service" && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-4 mb-6 text-white">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold">Day {gameState.dayState.dayNumber} - Service</div>
                    <button
                      onClick={handleEndDay}
                      className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                      🌙 Close Cafe
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{gameState.dayState.stats.customersServed} / {gameState.dayState.targetCustomers}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3">
                        <div
                          className="bg-white h-3 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (gameState.dayState.stats.customersServed / gameState.dayState.targetCustomers) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-90">Today's Earnings</div>
                      <div className="text-2xl font-bold">${gameState.dayState.stats.totalEarnings.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

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
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold">{gameState.customer.name}</p>
                          {gameState.customerMemory && isReturningCustomer(gameState.customerMemory, gameState.customer.name) && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                              Returning
                            </span>
                          )}
                        </div>
                        {gameState.customer.personality && (
                          <p className="text-xs text-gray-500 italic">
                            {gameState.customer.personality}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Customer Memory Insights */}
                    {gameState.customerMemory && (() => {
                      const profile = getCustomer(gameState.customerMemory, gameState.customer!.name);
                      if (profile) {
                        const insights = getCustomerInsights(profile);
                        const relationshipColors = {
                          stranger: "bg-gray-100 text-gray-700",
                          newcomer: "bg-green-100 text-green-800",
                          familiar: "bg-blue-100 text-blue-800",
                          regular: "bg-purple-100 text-purple-800",
                          favorite: "bg-amber-100 text-amber-800",
                        };
                        const relationshipColor = relationshipColors[profile.relationshipLevel] || "bg-gray-100 text-gray-700";

                        return (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${relationshipColor}`}>
                                {profile.relationshipLevel.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-600">
                                Visit #{profile.visitCount}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 mt-2">
                              {insights}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

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
                      disabled={isCheckingAllergens || isBrewing}
                      className="w-full bg-white text-amber-900 font-bold px-8 py-4 rounded-xl hover:bg-amber-50 transition-all shadow-lg text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCheckingAllergens || isBrewing ? (
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
                          {isCheckingAllergens ? "Checking Safety..." : "Brewing..."}
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
                    disabled={isServing}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isServing ? "Serving..." : `Serve & Collect $${gameState.customer.payment.toFixed(2)}`}
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
    </ErrorBoundary>
  );
}
