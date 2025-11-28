/**
 * Compact Inventory Display
 *
 * Visual inventory badges with depletion animations
 * Shows coffee beans and milk with fill levels and color coding
 * Updated: Fixed null reference handling
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Inventory } from "@/lib/types";

interface CompactInventoryProps {
  inventory: Inventory;
  className?: string;
}

// Get stock level status
function getStockStatus(current: number, max: number): "high" | "medium" | "low" | "critical" {
  const percentage = (current / max) * 100;
  if (percentage > 50) return "high";
  if (percentage > 25) return "medium";
  if (percentage > 10) return "low";
  return "critical";
}

// Color mapping for stock levels
const statusColors = {
  high: { bg: "bg-green-100", text: "text-green-800", fill: "#22c55e" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-800", fill: "#eab308" },
  low: { bg: "bg-orange-100", text: "text-orange-800", fill: "#f97316" },
  critical: { bg: "bg-red-100", text: "text-red-800", fill: "#ef4444" },
};

export function CompactInventory({ inventory, className = "" }: CompactInventoryProps) {
  // Track previous inventory for depletion animations
  const prevBeansRef = useRef<number>(0);
  const prevMilksRef = useRef<Record<string, number>>({});
  const [beansDepletedRecently, setBeansDepletedRecently] = useState(false);
  const [depletedMilks, setDepletedMilks] = useState<Set<string>>(new Set());

  // Calculate total beans with safety check
  const totalBeans = inventory?.beans
    ? inventory.beans.reduce((sum, bean) => sum + bean.grams, 0)
    : 0;
  const maxBeans = 5000; // Typical max capacity
  const beansStatus = getStockStatus(totalBeans, maxBeans);
  const beansPercentage = Math.min((totalBeans / maxBeans) * 100, 100);

  // Get milk types that have stock with safety check
  const milkTypes = inventory?.milks
    ? Object.entries(inventory.milks)
      .filter(([type, amount]) => type !== "none" && amount > 0)
      .map(([type, amount]) => ({
        type,
        amount,
        status: getStockStatus(amount, 3000),
        percentage: Math.min((amount / 3000) * 100, 100),
      }))
    : [];

  // Detect depletion and trigger animations
  useEffect(() => {
    if (!inventory?.beans || !inventory?.milks) return;

    // Check beans depletion
    if (prevBeansRef.current > totalBeans && prevBeansRef.current > 0) {
      setBeansDepletedRecently(true);
      setTimeout(() => setBeansDepletedRecently(false), 800);
    }
    prevBeansRef.current = totalBeans;

    // Check milk depletion
    const newDepletedMilks = new Set<string>();
    Object.entries(inventory.milks).forEach(([type, amount]) => {
      const prevAmount = prevMilksRef.current[type] || 0;
      if (prevAmount > amount && prevAmount > 0) {
        newDepletedMilks.add(type);
      }
      prevMilksRef.current[type] = amount;
    });

    if (newDepletedMilks.size > 0) {
      setDepletedMilks(newDepletedMilks);
      setTimeout(() => setDepletedMilks(new Set()), 800);
    }
  }, [inventory, totalBeans]);

  // Guard against undefined inventory - after all hooks
  if (!inventory || !inventory.beans || !inventory.milks) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Coffee Beans Jar */}
      <motion.div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusColors[beansStatus].bg}`}
        animate={
          beansDepletedRecently
            ? {
              scale: [1, 1.1, 1],
              boxShadow: [
                "0 0 0px rgba(251, 146, 60, 0)",
                "0 0 20px rgba(251, 146, 60, 0.8)",
                "0 0 0px rgba(251, 146, 60, 0)",
              ]
            }
            : beansStatus === "critical"
              ? { scale: [1, 1.05, 1] }
              : {}
        }
        transition={{
          duration: beansDepletedRecently ? 0.6 : 1,
          repeat: beansDepletedRecently ? 0 : (beansStatus === "critical" ? Infinity : 0)
        }}
      >
        {/* Bean Jar Icon */}
        <div className="relative w-8 h-10">
          <svg viewBox="0 0 40 50" fill="none">
            {/* Jar outline */}
            <path
              d="M8 10 L8 45 Q8 48 12 48 L28 48 Q32 48 32 45 L32 10 Z"
              fill="rgba(139, 69, 19, 0.1)"
              stroke="#8B4513"
              strokeWidth="1.5"
            />
            {/* Jar lid */}
            <rect x="6" y="8" width="28" height="4" rx="1" fill="#8B4513" />

            {/* Beans fill level */}
            <defs>
              <clipPath id="jar-clip">
                <path d="M8 10 L8 45 Q8 48 12 48 L28 48 Q32 48 32 45 L32 10 Z" />
              </clipPath>
            </defs>

            <motion.rect
              x="8"
              y={48 - (beansPercentage / 100) * 38}
              width="24"
              height={(beansPercentage / 100) * 38}
              fill={statusColors[beansStatus].fill}
              opacity="0.6"
              clipPath="url(#jar-clip)"
              initial={{ height: 0 }}
              animate={{ height: (beansPercentage / 100) * 38 }}
              transition={{ duration: 0.5 }}
            />

            {/* Coffee beans texture */}
            {beansPercentage > 10 && (
              <g clipPath="url(#jar-clip)">
                <ellipse cx="15" cy={45 - (beansPercentage / 100) * 15} rx="2" ry="3" fill="#6D4C41" opacity="0.4" />
                <ellipse cx="22" cy={45 - (beansPercentage / 100) * 20} rx="2" ry="3" fill="#6D4C41" opacity="0.4" />
                <ellipse cx="18" cy={45 - (beansPercentage / 100) * 10} rx="2" ry="3" fill="#6D4C41" opacity="0.4" />
              </g>
            )}
          </svg>
        </div>

        {/* Amount text */}
        <div className="flex flex-col items-start">
          <span className={`text-xs font-bold ${statusColors[beansStatus].text}`}>
            {totalBeans}g
          </span>
          <span className="text-xs text-gray-600">Beans</span>
        </div>

        {beansStatus === "critical" && (
          <span className="text-xs">⚠️</span>
        )}
      </motion.div>

      {/* Milk Bottles */}
      {milkTypes.map(({ type, amount, status, percentage }) => {
        const isDepleting = depletedMilks.has(type);

        return (
          <motion.div
            key={type}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusColors[status].bg}`}
            animate={
              isDepleting
                ? {
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 0px rgba(251, 146, 60, 0)",
                    "0 0 20px rgba(251, 146, 60, 0.8)",
                    "0 0 0px rgba(251, 146, 60, 0)",
                  ]
                }
                : status === "critical"
                  ? { scale: [1, 1.05, 1] }
                  : {}
            }
            transition={{
              duration: isDepleting ? 0.6 : 1,
              repeat: isDepleting ? 0 : (status === "critical" ? Infinity : 0)
            }}
          >
            {/* Milk Bottle Icon */}
            <div className="relative w-6 h-10">
              <svg viewBox="0 0 30 50" fill="none">
                {/* Bottle outline */}
                <path
                  d="M10 8 L10 5 Q10 3 12 3 L18 3 Q20 3 20 5 L20 8 L22 10 L22 45 Q22 48 18 48 L12 48 Q8 48 8 45 L8 10 Z"
                  fill="rgba(255, 255, 255, 0.8)"
                  stroke="#666"
                  strokeWidth="1"
                />

                {/* Milk fill level */}
                <defs>
                  <clipPath id={`bottle-clip-${type}`}>
                    <path d="M10 8 L10 5 Q10 3 12 3 L18 3 Q20 3 20 5 L20 8 L22 10 L22 45 Q22 48 18 48 L12 48 Q8 48 8 45 L8 10 Z" />
                  </clipPath>
                </defs>

                <motion.rect
                  x="8"
                  y={48 - (percentage / 100) * 40}
                  width="14"
                  height={(percentage / 100) * 40}
                  fill={statusColors[status].fill}
                  opacity="0.5"
                  clipPath={`url(#bottle-clip-${type})`}
                  initial={{ height: 0 }}
                  animate={{ height: (percentage / 100) * 40 }}
                  transition={{ duration: 0.5 }}
                />

                {/* Cap */}
                <rect x="11" y="1" width="8" height="2" rx="1" fill="#666" />
              </svg>
            </div>

            {/* Amount text */}
            <div className="flex flex-col items-start">
              <span className={`text-xs font-bold ${statusColors[status].text}`}>
                {amount}ml
              </span>
              <span className="text-xs text-gray-600 capitalize">{type}</span>
            </div>

            {status === "critical" && (
              <span className="text-xs">⚠️</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Minimal version - just icons with counts for ultra-compact display
 */
export function MiniInventory({ inventory }: { inventory: Inventory }) {
  // Safety checks
  if (!inventory?.beans || !inventory?.milks) {
    return null;
  }

  const totalBeans = inventory.beans.reduce((sum, bean) => sum + bean.grams, 0);
  const beansStatus = getStockStatus(totalBeans, 5000);

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`flex items-center gap-1 px-2 py-1 rounded ${statusColors[beansStatus].bg}`}>
        <span>☕</span>
        <span className={`font-bold ${statusColors[beansStatus].text}`}>{totalBeans}g</span>
      </div>

      {Object.entries(inventory.milks)
        .filter(([type, amount]) => type !== "none" && amount > 0)
        .map(([type, amount]) => {
          const status = getStockStatus(amount, 3000);
          return (
            <div key={type} className={`flex items-center gap-1 px-2 py-1 rounded ${statusColors[status].bg}`}>
              <span>🥛</span>
              <span className={`font-bold ${statusColors[status].text}`}>{amount}ml</span>
            </div>
          );
        })}
    </div>
  );
}
