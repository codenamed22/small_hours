"use client";

import { useState, useEffect, useRef } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuditLogViewer } from "@/components/AuditLogViewer";
import { DrinkIcon } from "@/components/DrinkIcons";
import { BrewingProgress } from "@/components/BrewingProgress";
import { Particles, Confetti, FloatingMoney } from "@/components/Particles";
import { CustomerAvatar } from "@/components/CustomerAvatar";
import { CafeBackground } from "@/components/CafeBackground";
import { RisingSteam, FloatingDust, PulsingGlow } from "@/components/AmbientEffects";
import { DrinkResultVisual } from "@/components/DrinkResultVisual";
import { CustomerReaction } from "@/components/CustomerReaction";
import { CompactInventory } from "@/components/CompactInventory";
import { BrewingAnimation } from "@/components/BrewingAnimation";
import { ShopModal } from "@/components/ShopModal";
import { EventNotification } from "@/components/EventNotification";
import { calculateTimeOfDay, getLightingForTime, formatTime, getTimeEmoji } from "@/lib/time-system";
import { motion, AnimatePresence } from "framer-motion";
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
  purchaseEquipment,
  type EquipmentItem,
} from "@/lib/game-engine";
import { checkForEvent, applyEventEffects } from "@/lib/events";
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
  const [showExcellenceParticles, setShowExcellenceParticles] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMoneyFloat, setShowMoneyFloat] = useState(false);
  const [moneyAmount, setMoneyAmount] = useState(0);
  const [showReaction, setShowReaction] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showShop, setShowShop] = useState(false);
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

    // Check for start-of-day events
    const event = checkForEvent(gameState, "start_day");

    setGameState((prev) => {
      let newState: GameState = {
        ...prev,
        dayState: prev.dayState ? startService(prev.dayState) : prev.dayState,
      };

      if (event) {
        newState = applyEventEffects(newState, event);
        newState.activeEvent = event;
      }

      return newState;
    });
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
      activeEvent: undefined, // Clear any active event
    }));
  };

  const handlePurchaseEquipment = (itemId: string) => {
    if (!gameState.equipment) return;

    const result = purchaseEquipment(gameState.equipment, gameState.money, itemId);

    if (result.success && result.newEquipment && result.newMoney !== undefined) {
      setGameState((prev) => ({
        ...prev,
        equipment: result.newEquipment,
        money: result.newMoney!,
      }));
      alert(result.message);
    } else {
      alert(result.message);
    }
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
              setIsBrewing(false);
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
        setIsBrewing(false);
        return;
      }

      // Wait for brewing animation to complete
      // Animation duration is based on brewTime parameter
      const animationDuration = gameState.brewParams.brewTime * 1000; // Convert to milliseconds

      await new Promise(resolve => setTimeout(resolve, animationDuration));

      // Brew the drink (with equipment bonuses)
      const result = brewDrink(
        gameState.customer.drinkType,
        gameState.brewParams,
        gameState.equipment
      );

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

      // Trigger customer reaction animation
      setTimeout(() => {
        setShowReaction(true);
      }, 800); // Delay to let drink visual appear first

      // Trigger particle effects based on quality
      if (result.quality >= 95) {
        // Perfect brew - confetti!
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else if (result.quality >= 85) {
        // Excellent brew - stars!
        setShowExcellenceParticles(true);
        setTimeout(() => setShowExcellenceParticles(false), 2000);
      }
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
    setShowReaction(false); // Reset reaction animation

    // Show floating money animation
    setMoneyAmount(gameState.customer.payment);
    setShowMoneyFloat(true);
    setTimeout(() => setShowMoneyFloat(false), 2000);

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

    // Check for random service events after serving
    // Small delay to let other animations finish
    setTimeout(() => {
      const event = checkForEvent(gameState, "random_service");
      if (event) {
        setGameState(prev => {
          let newState = { ...prev };
          newState = applyEventEffects(newState, event);
          newState.activeEvent = event;
          return newState;
        });
      }
    }, 1500);
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

  // Calculate time of day based on progress
  const timeData = gameState.dayState
    ? calculateTimeOfDay(
      gameState.dayState.stats.customersServed,
      gameState.dayState.targetCustomers
    )
    : calculateTimeOfDay(0, 20);
  const lighting = getLightingForTime(timeData);

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden flex flex-col">
        {/* Cafe Background Scene */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <CafeBackground lighting={lighting} />
        </div>

        <EventNotification
          event={gameState.activeEvent || null}
          onDismiss={() => setGameState(prev => ({ ...prev, activeEvent: undefined }))}
        />

        {/* Atmospheric lighting overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-1000"
          style={{
            backgroundColor: lighting.overlayColor,
            opacity: lighting.overlayOpacity * 0.5,
          }}
        />

        {/* Floating dust particles for ambiance */}
        <FloatingDust count={15} />

        <AuditLogViewer />
        <main className="container mx-auto px-4 py-3 relative z-10 flex-1 flex flex-col overflow-hidden">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="relative mb-3">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                className="absolute top-0 right-0 p-2 rounded-lg hover:bg-amber-100 transition-all z-10"
                aria-label="Menu"
              >
                <svg className="w-6 h-6 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showSaveMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-12 right-0 bg-white rounded-xl shadow-2xl p-3 z-20 min-w-[200px]"
                  >
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          handleManualSave();
                          setShowSaveMenu(false);
                        }}
                        className="text-sm bg-green-100 text-green-800 px-3 py-2 rounded-lg font-medium hover:bg-green-200 transition-all text-left"
                      >
                        💾 Save Game
                      </button>
                      <button
                        onClick={() => {
                          handleExport();
                          setShowSaveMenu(false);
                        }}
                        className="text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded-lg font-medium hover:bg-blue-200 transition-all text-left"
                      >
                        📤 Export Save
                      </button>
                      <button
                        onClick={() => {
                          handleImport();
                          setShowSaveMenu(false);
                        }}
                        className="text-sm bg-purple-100 text-purple-800 px-3 py-2 rounded-lg font-medium hover:bg-purple-200 transition-all text-left"
                      >
                        📥 Import Save
                      </button>
                      <button
                        onClick={() => {
                          handleReset();
                          setShowSaveMenu(false);
                        }}
                        className="text-sm bg-red-100 text-red-800 px-3 py-2 rounded-lg font-medium hover:bg-red-200 transition-all text-left"
                      >
                        🔄 Reset Game
                      </button>
                      {lastSaveTime && (
                        <div className="text-xs text-gray-500 px-3 py-1 border-t border-gray-200 mt-1">
                          Last saved: {new Date(lastSaveTime).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-center">
                <h1 className="text-3xl font-bold text-amber-900 mb-1">
                  Small Hours
                </h1>
                <p className="text-sm text-amber-700">A Coffee Craft Simulator</p>
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
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg p-3 mb-3">
              <div className="flex justify-between items-center text-sm gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-xl font-bold text-green-600">
                      ${gameState.money.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">☕</span>
                    <span className="text-xl font-bold text-amber-600">
                      {gameState.drinksServed}
                    </span>
                  </div>
                  {gameState.queue && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📋</span>
                      <span className="text-xl font-bold text-blue-600">
                        {getPendingTickets(gameState.queue).length}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <CompactInventory inventory={gameState.inventory} />

                  {gameState.customerMemory && gameState.customerMemory.totalCustomersServed > 0 && (
                    <button
                      onClick={() => setShowMemoryStats(!showMemoryStats)}
                      className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-lg font-semibold hover:bg-purple-200 transition-all whitespace-nowrap"
                    >
                      {showMemoryStats ? "Hide" : "Show"} Stats
                    </button>
                  )}
                </div>
              </div>

              {/* Memory Stats Panel */}
              {showMemoryStats && gameState.customerMemory && (() => {
                const stats = getMemoryStats(gameState.customerMemory);
                return (
                  <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-4 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-gray-600">Total Customers</div>
                      <div className="text-lg font-bold text-purple-600">{stats.totalCustomers}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Returning Rate</div>
                      <div className="text-lg font-bold text-blue-600">{stats.returningRate.toFixed(0)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Regulars</div>
                      <div className="text-lg font-bold text-amber-600">{stats.regularCustomers + stats.favoriteCustomers}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">Avg. Satisfaction</div>
                      <div className="text-lg font-bold text-green-600">{stats.averageSatisfaction}</div>
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
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-4 text-white">
                    <div className="text-center mb-4">
                      <h2 className="text-3xl font-bold">☀️ Day {gameState.dayState.dayNumber}</h2>
                      <p className="text-indigo-100 text-sm">Small Hours - Morning Preparation</p>
                    </div>

                    {/* Goals and Actions Side by Side */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Left: Goals */}
                      <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                        <h3 className="text-lg font-bold mb-3">Today's Goals</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-indigo-200">Target Customers</span>
                            <span className="text-2xl font-bold">{gameState.dayState.targetCustomers}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-indigo-200">Restock Cost</span>
                            <span className="text-2xl font-bold">${getRestockCost(gameState.dayState.dayNumber).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Actions */}
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowShop(true)}
                          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg text-sm"
                        >
                          🛒 Equipment Shop
                        </button>

                        <button
                          onClick={handleRestock}
                          className="w-full bg-white/90 text-indigo-600 font-bold py-3 rounded-xl hover:bg-white transition-all shadow-lg text-sm"
                        >
                          📦 Restock (${getRestockCost(gameState.dayState.dayNumber).toFixed(2)})
                        </button>

                        <button
                          onClick={handleStartDay}
                          className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-green-500 hover:to-emerald-600 transition-all shadow-lg text-base"
                        >
                          🚪 Open the Cafe
                        </button>
                      </div>
                    </div>

                    {/* Optional Story Section - Collapsible for Day 1+ */}
                    {gameState.dayState.dayNumber === 1 && (
                      <details className="bg-amber-500/20 border border-amber-300/50 rounded-xl overflow-hidden">
                        <summary className="px-4 py-2 cursor-pointer hover:bg-amber-500/30 transition-all font-semibold text-sm">
                          📖 Your Story (click to read)
                        </summary>
                        <p className="px-4 py-3 text-sm leading-relaxed text-indigo-100">
                          Welcome to Small Hours, your new coffee shop. You've poured your savings into this dream,
                          and today is opening day. The morning light filters through the windows, the espresso machine
                          gleams, and your first customers are waiting.
                        </p>
                      </details>
                    )}

                    {gameState.dayState.dayNumber > 1 && (
                      <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                        <p className="text-sm text-indigo-100">
                          {gameState.dayState.dayNumber === 2 && "💭 You survived your first day. Time to do it again, but better."}
                          {gameState.dayState.dayNumber === 3 && "💭 The rhythm is becoming familiar. Customers remember you."}
                          {gameState.dayState.dayNumber > 3 && gameState.dayState.dayNumber < 7 && "💭 You're finding your groove. The locals are talking."}
                          {gameState.dayState.dayNumber >= 7 && "💭 Small Hours is part of the neighborhood now."}
                        </p>
                      </div>
                    )}
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
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg p-2 mb-3 text-white">
                    <div className="flex items-center gap-3">
                      {/* Day and Time */}
                      <div className="text-sm font-bold whitespace-nowrap">
                        Day {gameState.dayState.dayNumber} {getTimeEmoji(timeData.period)}
                      </div>

                      {/* Progress Bar */}
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-0.5 opacity-90">
                          <span>{formatTime(timeData)}</span>
                          <span>{gameState.dayState.stats.customersServed} / {gameState.dayState.targetCustomers}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (gameState.dayState.stats.customersServed / gameState.dayState.targetCustomers) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Earnings */}
                      <div className="text-right whitespace-nowrap">
                        <div className="text-xs opacity-90">Today</div>
                        <div className="text-lg font-bold">${gameState.dayState.stats.totalEarnings.toFixed(2)}</div>
                      </div>

                      {/* Close Button */}
                      <button
                        onClick={handleEndDay}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                      >
                        🌙 Close
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Queue Panel */}
            {gameState.queue && getPendingTickets(gameState.queue).length > 0 && (
              <div className="bg-blue-50/90 backdrop-blur rounded-xl shadow-lg p-3 mb-3">
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

            {/* Low Stock Warnings Banner */}
            {getLowStockWarnings(gameState.inventory).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 border-l-4 border-red-500 text-red-800 p-2 mb-3 rounded-lg shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div className="flex-1">
                    <div className="font-bold text-sm">Low Stock Alert</div>
                    <div className="text-xs">
                      {getLowStockWarnings(gameState.inventory).join(" • ")}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid md:grid-cols-2 gap-4 flex-1 overflow-hidden">
              {/* Left Column: Customer & Brewing */}
              <div className="space-y-3 overflow-y-auto pr-2 relative z-20">
                {/* Customer Card */}
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-3">
                  <h2 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <span>👤</span>
                    Customer
                  </h2>

                  <AnimatePresence mode="wait">
                    {gameState.customer ? (
                      <motion.div
                        key="customer-present"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <CustomerAvatar
                              mood={gameState.customer.mood}
                              className="w-16 h-16"
                              animated={true}
                            />
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

                          {/* Order with drink icon */}
                          <div className="mb-3 bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                            <div className="flex items-center gap-4">
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                              >
                                <DrinkIcon type={gameState.customer.drinkType} className="w-20 h-20" animated={true} />
                              </motion.div>
                              <p className="text-base flex-1">
                                &quot;{gameState.customer.order}&quot;
                              </p>
                            </div>
                          </div>

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
                      </motion.div>
                    ) : (
                      <motion.div
                        key="customer-absent"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-center py-4"
                      >
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

                        <motion.button
                          onClick={startNewOrder}
                          disabled={isGeneratingCustomer}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
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
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Brewing Controls */}
                <AnimatePresence>
                  {gameState.customer && !gameState.result && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-xl p-3 text-white relative overflow-hidden"
                    >
                      {/* Steam rising from brewing station */}
                      <div className="absolute top-0 left-1/4">
                        <RisingSteam count={3} />
                      </div>
                      <div className="absolute top-0 right-1/4">
                        <RisingSteam count={3} />
                      </div>

                      <div className="flex items-center justify-between mb-2 relative z-10">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                          <span>☕</span>
                          Brewing Station
                        </h2>
                        <button
                          onClick={() => setShowHelp(true)}
                          className="text-amber-100 hover:text-white transition-colors p-1"
                          aria-label="Show recipe guide"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* Grind Size */}
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-amber-100">
                            Grind Size
                          </label>
                          <select
                            value={gameState.brewParams.grindSize}
                            onChange={(e) =>
                              updateBrewParam("grindSize", e.target.value as GrindSize)
                            }
                            className="w-full px-2 py-1 rounded-lg text-gray-800 font-medium text-sm"
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
                          <label className="block text-xs font-semibold mb-1 text-amber-100">
                            Water Temperature: {gameState.brewParams.temperature}°C
                          </label>
                          <input
                            type="range"
                            min="77"
                            max="100"
                            value={gameState.brewParams.temperature}
                            onChange={(e) =>
                              updateBrewParam("temperature", parseInt(e.target.value))
                            }
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-amber-100 mt-1">
                            <span className="text-xs">77°C</span>
                            <span className="text-xs">100°C</span>
                          </div>
                        </div>

                        {/* Brew Time */}
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-amber-100">
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
                            <span className="text-xs">{recipe.category === "espresso-based" ? "15s" : "30s"}</span>
                            <span className="text-xs">{recipe.category === "espresso-based" ? "35s" : "240s"}</span>
                          </div>
                        </div>

                        {/* Milk Controls */}
                        {hasMilk && (
                          <>
                            <div className="border-t border-amber-400 pt-2">
                              <h3 className="font-bold text-amber-100 mb-1 text-xs">Milk Parameters</h3>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold mb-1 text-amber-100">
                                Milk Type
                              </label>
                              <select
                                value={gameState.brewParams.milkType || "whole"}
                                onChange={(e) =>
                                  updateBrewParam("milkType", e.target.value as MilkType)
                                }
                                className="w-full px-2 py-1 rounded-lg text-gray-800 font-medium text-sm"
                              >
                                {milkTypes.filter(m => m !== "none").map((type) => (
                                  <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)} Milk
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold mb-1 text-amber-100">
                                Milk Temperature: {gameState.brewParams.milkTemp}°C
                              </label>
                              <input
                                type="range"
                                min="49"
                                max="82"
                                value={gameState.brewParams.milkTemp}
                                onChange={(e) =>
                                  updateBrewParam("milkTemp", parseInt(e.target.value))
                                }
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-amber-100 mt-1">
                                <span className="text-xs">49°C</span>
                                <span className="text-xs">82°C</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold mb-1 text-amber-100">
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
                                <span className="text-xs">0%</span>
                                <span className="text-xs">100%</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Bloom Time for Pour Over */}
                        {hasBloom && (
                          <>
                            <div className="border-t border-amber-400 pt-2">
                              <h3 className="font-bold text-amber-100 mb-1 text-xs">Pour Over Technique</h3>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold mb-1 text-amber-100">
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
                                <span className="text-xs">15s</span>
                                <span className="text-xs">60s</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Brewing Progress Overlay - Removed: Now using full animation on right side */}

                        {/* Brew Button */}
                        <motion.button
                          onClick={handleBrew}
                          disabled={isCheckingAllergens || isBrewing}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-white text-amber-900 font-bold px-4 py-2 rounded-xl hover:bg-amber-50 transition-all shadow-lg text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            "Brew"
                          )}
                        </motion.button>

                        {/* Recipe Help Button */}
                        <button
                          onClick={() => setShowHelp(true)}
                          className="w-full bg-amber-100 text-amber-900 font-semibold px-4 py-1.5 rounded-lg hover:bg-amber-200 transition-all text-xs mt-1 flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View Recipe Guide
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column: Results */}
              <div className="overflow-y-auto pr-2 relative z-10">
                <AnimatePresence mode="wait">
                  {gameState.result && gameState.customer && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                      className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-3 relative"
                    >
                      {/* Particle effects for excellent brews */}
                      <Particles trigger={showExcellenceParticles} type="stars" count={20} />
                      <Confetti active={showConfetti} count={40} />
                      <FloatingMoney amount={moneyAmount} trigger={showMoneyFloat} />

                      {/* Pulsing glow for excellent results */}
                      <PulsingGlow
                        active={gameState.result.quality >= 90}
                        color={gameState.result.quality >= 95 ? "green" : "amber"}
                      />

                      <h2 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                        <span>📊</span>
                        Results
                      </h2>

                      {/* Drink Visual */}
                      <div className="flex justify-center mb-3">
                        <DrinkResultVisual
                          drinkType={gameState.customer.drinkType}
                          quality={gameState.result.quality}
                          className="w-32 h-32"
                          animated={true}
                        />
                      </div>

                      {/* Quality Score */}
                      <div className="text-center mb-3">
                        <motion.div
                          className="text-4xl font-bold text-amber-600 mb-1"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
                        >
                          {gameState.result.quality}
                        </motion.div>
                        <div className="text-gray-600 text-sm">Quality Score</div>
                        <div
                          className={`mt-1 px-3 py-1 rounded-lg inline-block text-xs ${gameState.result.quality >= 85
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
                      <div className="space-y-2 mb-3">
                        {Object.entries(gameState.result.breakdown).map(([component, score], index) => (
                          <motion.div
                            key={component}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="bg-gray-50 p-2 rounded-lg"
                          >
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-700">
                                {component}
                              </span>
                              <span className="text-xs font-bold text-amber-600">
                                {score}/100
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 0.8, delay: 0.4 + index * 0.1, ease: "easeOut" }}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Customer Reaction */}
                      <div className="mb-3">
                        <CustomerReaction
                          quality={gameState.result.quality}
                          customerName={gameState.customer.name}
                          show={showReaction}
                          onComplete={() => {
                            // Reaction animation complete
                          }}
                        />
                      </div>

                      {/* Serve Button */}
                      <motion.button
                        onClick={handleServe}
                        disabled={isServing}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-4 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isServing ? "Serving..." : `Serve & Collect $${gameState.customer.payment.toFixed(2)}`}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!gameState.result && !gameState.customer && (
                  <div className="bg-white/90 backdrop-blur rounded-xl shadow-xl p-4 text-center">
                    <div className="text-5xl mb-3">☕</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">
                      Waiting for customers
                    </h3>
                    <p className="text-sm text-gray-600">
                      Open the door and see who walks in
                    </p>
                  </div>
                )}

                {!gameState.result && gameState.customer && (
                  <>
                    {/* Brewing Animation */}
                    <BrewingAnimation
                      drinkType={gameState.customer.drinkType}
                      category={recipe.category}
                      brewParams={gameState.brewParams}
                      isBrewing={isBrewing}
                    />
                  </>
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

        {/* Shop Modal */}
        {gameState.equipment && (
          <ShopModal
            isOpen={showShop}
            onClose={() => setShowShop(false)}
            equipment={gameState.equipment}
            money={gameState.money}
            onPurchase={handlePurchaseEquipment}
          />
        )}

        {/* Help Dialog Overlay - Positioned at top level */}
        <AnimatePresence>
          {showHelp && gameState.customer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                    <span>📖</span>
                    {recipe.name} Recipe
                  </h3>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-amber-900 mb-3">Ideal Parameters</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-600">Grind Size</div>
                      <div className="font-semibold text-gray-900">{recipe.idealGrind}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Temperature</div>
                      <div className="font-semibold text-gray-900">{recipe.idealTemp}°C</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Brew Time</div>
                      <div className="font-semibold text-gray-900">{recipe.idealBrewTime}s</div>
                    </div>
                    {recipe.idealMilkTemp && (
                      <div>
                        <div className="text-xs text-gray-600">Milk Temp</div>
                        <div className="font-semibold text-gray-900">{recipe.idealMilkTemp}°C</div>
                      </div>
                    )}
                    {recipe.idealBloomTime && (
                      <div>
                        <div className="text-xs text-gray-600">Bloom Time</div>
                        <div className="font-semibold text-gray-900">{recipe.idealBloomTime}s</div>
                      </div>
                    )}
                    {recipe.idealFoamAmount !== undefined && (
                      <div>
                        <div className="text-xs text-gray-600">Foam Amount</div>
                        <div className="font-semibold text-gray-900">{recipe.idealFoamAmount}%</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-700 italic">
                  {recipe.description}
                </div>

                <button
                  onClick={() => setShowHelp(false)}
                  className="mt-4 w-full bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition-all"
                >
                  Got it!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
