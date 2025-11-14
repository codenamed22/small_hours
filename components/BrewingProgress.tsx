/**
 * Brewing Progress Component
 *
 * Shows circular progress indicator during brewing process
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface BrewingProgressProps {
  duration: number; // in seconds
  onComplete?: () => void;
}

export function BrewingProgress({ duration, onComplete }: BrewingProgressProps) {
  const [progress, setProgress] = useState(0);
  const circumference = 2 * Math.PI * 45; // radius = 45

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / (duration * 1000)) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="flex flex-col items-center justify-center gap-4"
    >
      {/* Circular Progress */}
      <div className="relative">
        <svg width="120" height="120" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="45"
            stroke="white"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="text-3xl font-bold text-white"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ☕
            </motion.div>
            <div className="text-sm text-white/80 font-medium">
              {Math.ceil(duration - (progress / 100) * duration)}s
            </div>
          </div>
        </div>
      </div>

      {/* Status text */}
      <motion.p
        className="text-white text-sm font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Brewing...
      </motion.p>
    </motion.div>
  );
}
