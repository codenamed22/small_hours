"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  Equipment,
  EquipmentItem,
  PurchaseResult,
} from "@/lib/game-engine";
import {
  getCurrentEquipment,
  getAvailableUpgrades,
  getEquipmentValue,
} from "@/lib/game-engine";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  money: number;
  onPurchase: (itemId: string) => void;
}

export function ShopModal({
  isOpen,
  onClose,
  equipment,
  money,
  onPurchase,
}: ShopModalProps) {
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);

  const currentEquipment = getCurrentEquipment(equipment);
  const availableUpgrades = getAvailableUpgrades(equipment);
  const totalValue = getEquipmentValue(equipment);

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case "espressoMachine":
        return "☕";
      case "grinder":
        return "⚙️";
      case "milkSteamer":
        return "🥛";
      case "brewingStation":
        return "🏪";
      default:
        return "📦";
    }
  };

  const getTierColor = (tier: number): string => {
    switch (tier) {
      case 1:
        return "bg-gray-100 text-gray-700";
      case 2:
        return "bg-blue-100 text-blue-700";
      case 3:
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTierBadge = (tier: number): string => {
    switch (tier) {
      case 1:
        return "Basic";
      case 2:
        return "Professional";
      case 3:
        return "Commercial";
      default:
        return "Unknown";
    }
  };

  const handlePurchase = (itemId: string) => {
    onPurchase(itemId);
    setSelectedItem(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <span>🛒</span>
                Equipment Shop
              </h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between text-amber-100">
              <div className="text-sm">
                Total Equipment Value: <span className="font-bold">${totalValue}</span>
              </div>
              <div className="text-lg font-bold bg-white/20 px-4 py-2 rounded-lg">
                💰 ${money.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Current Equipment */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                <span>🏷️</span>
                Your Current Equipment
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {currentEquipment.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 shadow-md border-2 border-amber-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-4xl">{getCategoryIcon(item.category)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">{item.name}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded font-semibold ${getTierColor(
                              item.tier
                            )}`}
                          >
                            {getTierBadge(item.tier)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.description}
                        </p>
                        {Object.keys(item.effects).length > 0 && (
                          <div className="text-xs text-gray-500">
                            {item.effects.qualityBonus && (
                              <div>+ {item.effects.qualityBonus} quality bonus</div>
                            )}
                            {item.effects.grindBonus && (
                              <div>+ {item.effects.grindBonus} grind quality</div>
                            )}
                            {item.effects.milkBonus && (
                              <div>+ {item.effects.milkBonus} milk quality</div>
                            )}
                            {item.effects.consistency && (
                              <div>{item.effects.consistency}% consistency</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Upgrades */}
            <div>
              <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                <span>⬆️</span>
                Available Upgrades
              </h3>
              {availableUpgrades.length === 0 ? (
                <div className="bg-green-100 border-2 border-green-300 rounded-xl p-8 text-center">
                  <div className="text-5xl mb-3">✨</div>
                  <h4 className="text-xl font-bold text-green-900 mb-2">
                    Fully Upgraded!
                  </h4>
                  <p className="text-green-700">
                    You own the best equipment available. Your cafe is top-tier!
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {availableUpgrades.map((item) => {
                    const canAfford = money >= item.price;
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        className={`bg-white rounded-xl p-4 shadow-md border-2 cursor-pointer transition-all ${
                          selectedItem?.id === item.id
                            ? "border-amber-500 ring-4 ring-amber-200"
                            : canAfford
                            ? "border-green-200 hover:border-green-400"
                            : "border-gray-200 opacity-60"
                        }`}
                        onClick={() => canAfford && setSelectedItem(item)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-4xl">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900">{item.name}</h4>
                              <span
                                className={`text-xs px-2 py-1 rounded font-semibold ${getTierColor(
                                  item.tier
                                )}`}
                              >
                                {getTierBadge(item.tier)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {item.description}
                            </p>

                            {/* Effects */}
                            {Object.keys(item.effects).length > 0 && (
                              <div className="text-xs text-green-600 font-semibold mb-2">
                                {item.effects.qualityBonus && (
                                  <div>✓ +{item.effects.qualityBonus} quality bonus</div>
                                )}
                                {item.effects.grindBonus && (
                                  <div>✓ +{item.effects.grindBonus} grind quality</div>
                                )}
                                {item.effects.milkBonus && (
                                  <div>✓ +{item.effects.milkBonus} milk quality</div>
                                )}
                                {item.effects.temperatureBonus && (
                                  <div>
                                    ✓ +{item.effects.temperatureBonus} temperature precision
                                  </div>
                                )}
                                {item.effects.consistency && (
                                  <div>✓ {item.effects.consistency}% consistency boost</div>
                                )}
                                {item.effects.brewTimeReduction && (
                                  <div>
                                    ✓ -{item.effects.brewTimeReduction}s brew time
                                  </div>
                                )}
                                {item.effects.enableDualBrewing && (
                                  <div>✓ Dual brewing enabled</div>
                                )}
                                {item.effects.enableTripleBrewing && (
                                  <div>✓ Triple brewing enabled</div>
                                )}
                              </div>
                            )}

                            {/* Price */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                              <div
                                className={`text-lg font-bold ${
                                  canAfford ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                ${item.price}
                              </div>
                              {!canAfford && (
                                <span className="text-xs text-red-600 font-semibold">
                                  Need ${(item.price - money).toFixed(2)} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Purchase Button (Fixed Footer) */}
          {selectedItem && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 shadow-lg"
            >
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div>
                  <div className="font-semibold">Purchase {selectedItem.name}?</div>
                  <div className="text-sm text-green-100">
                    ${money.toFixed(2)} → ${(money - selectedItem.price).toFixed(2)}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePurchase(selectedItem.id)}
                    className="px-6 py-3 rounded-xl bg-white text-green-600 hover:bg-green-50 font-bold transition-all shadow-lg"
                  >
                    Buy for ${selectedItem.price}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
