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
} from "@/lib/game-engine";

export default function Game() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [selectedDrink, setSelectedDrink] = useState<DrinkType>("espresso");
  const [showHelp, setShowHelp] = useState(false);

  const startNewOrder = () => {
    setShowHelp(false); // Reset help for new order
    setGameState((prev) => ({
      ...prev,
      customer: createStaticCustomer(selectedDrink),
      brewParams: getDefaultParameters(selectedDrink), // Reset params for drink type
      result: null,
    }));
  };

  const handleBrew = () => {
    if (!gameState.customer) return;

    const result = brewDrink(gameState.customer.drinkType, gameState.brewParams);

    setGameState((prev) => ({
      ...prev,
      result,
    }));
  };

  const handleServe = () => {
    if (!gameState.result || !gameState.customer) return;

    setShowHelp(false); // Reset help when serving
    setGameState((prev) => ({
      ...prev,
      money: prev.money + prev.customer!.payment,
      drinksServed: prev.drinksServed + 1,
      customer: null,
      result: null,
    }));
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

  const drinkTypes: DrinkType[] = ["espresso", "latte", "cappuccino", "pourover", "aeropress"];

  const currentDrinkType = gameState.customer?.drinkType || selectedDrink;
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
            <p className="text-amber-700">Phase 1+: Enhanced Brewing Mechanics</p>
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
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column: Customer & Brewing */}
            <div className="space-y-6">
              {/* Customer Card */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <span>👤</span>
                  Customer
                </h2>

                {gameState.customer ? (
                  <div>
                    <p className="text-lg mb-2">
                      <span className="font-semibold">{gameState.customer.name}:</span>
                      <span className="ml-2 italic">&quot;{gameState.customer.order}&quot;</span>
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Drink: <span className="font-semibold">{recipe.name}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Payment: ${gameState.customer.payment.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">Select a drink and welcome a customer</p>

                    {/* Drink Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Drink Type
                      </label>
                      <select
                        value={selectedDrink}
                        onChange={(e) => setSelectedDrink(e.target.value as DrinkType)}
                        className="w-full px-4 py-2 rounded-lg text-gray-800 font-medium border border-amber-200"
                      >
                        {drinkTypes.map((drink) => (
                          <option key={drink} value={drink}>
                            {RECIPES[drink].name} - ${createStaticCustomer(drink).payment.toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        {RECIPES[selectedDrink].description}
                      </p>
                    </div>

                    <button
                      onClick={startNewOrder}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
                    >
                      Welcome Next Customer
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
                      className="w-full bg-white text-amber-900 font-bold px-8 py-4 rounded-xl hover:bg-amber-50 transition-all shadow-lg text-lg mt-4"
                    >
                      {recipe.category === "espresso-based" ? "Pull Shot" : `Brew ${recipe.name}`}
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
                  <div className="text-6xl mb-4">👋</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Ready to start?
                  </h3>
                  <p className="text-gray-600">
                    Select a drink and click &quot;Welcome Next Customer&quot; to begin!
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
