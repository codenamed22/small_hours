/**
 * Brewing Animation Component
 *
 * Full-blown animated visualization of coffee brewing process
 * Shows different stages based on drink type with real-time progress
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { DrinkType, BrewParameters, DrinkCategory } from "@/lib/types";
import { RisingSteam } from "./AmbientEffects";

interface BrewingAnimationProps {
  drinkType: DrinkType;
  category: DrinkCategory;
  brewParams: BrewParameters;
  isBrewing: boolean;
  className?: string;
}

type BrewStage = "idle" | "grinding" | "extracting" | "blooming" | "pouring" | "steeping" | "pressing" | "steaming" | "milk_pouring" | "whisking" | "complete";

interface StageProgress {
  stage: BrewStage;
  progress: number; // 0-100
  duration: number; // seconds
}

export function BrewingAnimation({
  drinkType,
  category,
  brewParams,
  isBrewing,
  className = "",
}: BrewingAnimationProps) {
  const [stageProgress, setStageProgress] = useState<StageProgress>({
    stage: "idle",
    progress: 0,
    duration: 0,
  });

  // Calculate stage durations based on brew parameters and drink type
  useEffect(() => {
    if (!isBrewing) {
      setStageProgress({ stage: "idle", progress: 0, duration: 0 });
      return;
    }

    const totalTime = brewParams.brewTime;
    let stages: { stage: BrewStage; duration: number }[] = [];

    // Define stages based on drink category and type
    if (category === "espresso-based") {
      stages = [
        { stage: "grinding", duration: totalTime * 0.15 },
        { stage: "extracting", duration: totalTime * 0.6 },
      ];

      // Add milk stages for milk drinks
      if (brewParams.milkType && brewParams.milkType !== "none") {
        stages.push(
          { stage: "steaming", duration: totalTime * 0.15 },
          { stage: "milk_pouring", duration: totalTime * 0.1 }
        );
      }
    } else if (category === "pour-over") {
      stages = [
        { stage: "grinding", duration: totalTime * 0.1 },
        { stage: "blooming", duration: brewParams.bloomTime || totalTime * 0.2 },
        { stage: "pouring", duration: totalTime * 0.7 },
      ];
    } else if (category === "immersion") {
      stages = [
        { stage: "grinding", duration: totalTime * 0.1 },
        { stage: "steeping", duration: totalTime * 0.7 },
        { stage: "pressing", duration: totalTime * 0.2 },
      ];
    } else if (drinkType === "matcha") {
      stages = [
        { stage: "grinding", duration: totalTime * 0.2 },
        { stage: "whisking", duration: totalTime * 0.8 },
      ];
    }

    // Animate through stages
    let currentTime = 0;
    let stageIndex = 0;

    const interval = setInterval(() => {
      currentTime += 0.016; // ~60fps

      // Find current stage
      let cumulativeTime = 0;
      for (let i = 0; i < stages.length; i++) {
        if (currentTime < cumulativeTime + stages[i].duration) {
          const stageElapsed = currentTime - cumulativeTime;
          const stageProgress = (stageElapsed / stages[i].duration) * 100;

          setStageProgress({
            stage: stages[i].stage,
            progress: Math.min(stageProgress, 100),
            duration: stages[i].duration,
          });
          return;
        }
        cumulativeTime += stages[i].duration;
      }

      // All stages complete
      setStageProgress({ stage: "complete", progress: 100, duration: 0 });
      clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [isBrewing, brewParams, category, drinkType]);

  if (!isBrewing) {
    return <IdleState drinkType={drinkType} category={category} className={className} />;
  }

  return (
    <div className={`bg-white/90 backdrop-blur rounded-xl shadow-xl p-6 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-amber-900 mb-1">Brewing Your {getDrinkName(drinkType)}</h3>
        <p className="text-sm text-gray-600 capitalize">{getStageLabel(stageProgress.stage)}</p>
      </div>

      <div className="relative h-96 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {stageProgress.stage === "grinding" && (
            <GrinderAnimation key="grinding" progress={stageProgress.progress} />
          )}
          {stageProgress.stage === "extracting" && (
            <EspressoExtraction key="extracting" progress={stageProgress.progress} />
          )}
          {stageProgress.stage === "blooming" && (
            <BloomAnimation key="blooming" progress={stageProgress.progress} />
          )}
          {stageProgress.stage === "pouring" && (
            <PourOverAnimation key="pouring" progress={stageProgress.progress} />
          )}
          {stageProgress.stage === "steeping" && (
            <SteepingAnimation key="steeping" progress={stageProgress.progress} />
          )}
          {stageProgress.stage === "pressing" && (
            <PressingAnimation key="pressing" progress={stageProgress.progress} />
          )}
          {stageProgress.stage === "steaming" && (
            <SteamWandAnimation key="steaming" progress={stageProgress.progress} />
          )}
          {stageProgress.stage === "milk_pouring" && (
            <MilkPourAnimation key="milk_pouring" progress={stageProgress.progress} />
          )}
          {stageProgress.stage === "whisking" && (
            <WhiskingAnimation key="whisking" progress={stageProgress.progress} />
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stageProgress.progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>{stageProgress.progress.toFixed(0)}%</span>
          <span>{(stageProgress.duration * (1 - stageProgress.progress / 100)).toFixed(1)}s remaining</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// IDLE STATE - Equipment Preview
// ============================================================================

function IdleState({ drinkType, category, className }: { drinkType: DrinkType; category: DrinkCategory; className?: string }) {
  return (
    <div className={`bg-white/90 backdrop-blur rounded-xl shadow-xl p-6 ${className}`} style={{ pointerEvents: 'none' }}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-amber-900 mb-2">Ready to Brew</h3>
        <p className="text-sm text-gray-600">Adjust your parameters and hit brew when ready</p>
      </div>

      <div className="relative h-96 flex items-center justify-center">
        {category === "espresso-based" && <EspressoMachineIdle />}
        {category === "pour-over" && <PourOverIdle />}
        {category === "immersion" && <AeropressIdle />}
        {drinkType === "matcha" && <MatchaBowlIdle />}
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        Equipment is ready. Press "Brew" to start.
      </div>
    </div>
  );
}

// ============================================================================
// GRINDER ANIMATION
// ============================================================================

function GrinderAnimation({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative"
    >
      <svg width="200" height="280" viewBox="0 0 200 280" fill="none">
        {/* Grinder body */}
        <rect x="40" y="40" width="120" height="100" rx="8" fill="#3E2723" stroke="#2C1810" strokeWidth="3" />

        {/* Hopper (bean container) */}
        <path d="M60 40 L60 10 L140 10 L140 40" fill="rgba(255,255,255,0.2)" stroke="#666" strokeWidth="2" />

        {/* Coffee beans in hopper */}
        <AnimatePresence>
          {progress < 80 && (
            <>
              <motion.ellipse
                cx="100"
                cy="20"
                rx="4"
                ry="6"
                fill="#6D4C41"
                animate={{ y: [0, 30], opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.ellipse
                cx="85"
                cy="25"
                rx="4"
                ry="6"
                fill="#6D4C41"
                animate={{ y: [0, 30], opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              />
              <motion.ellipse
                cx="115"
                cy="22"
                rx="4"
                ry="6"
                fill="#6D4C41"
                animate={{ y: [0, 30], opacity: [1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Grinding burrs (rotating) */}
        <motion.circle
          cx="100"
          cy="90"
          r="25"
          fill="#555"
          stroke="#333"
          strokeWidth="2"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          style={{ originX: "100px", originY: "90px" }}
        />

        {/* Burr details */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "100px 90px" }}
        >
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45) * (Math.PI / 180);
            const x1 = 100 + 15 * Math.cos(angle);
            const y1 = 90 + 15 * Math.sin(angle);
            const x2 = 100 + 25 * Math.cos(angle);
            const y2 = 90 + 25 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#777"
                strokeWidth="2"
              />
            );
          })}
        </motion.g>

        {/* Ground coffee collection */}
        <rect x="60" y="140" width="80" height="80" rx="4" fill="rgba(139,69,19,0.3)" stroke="#8B4513" strokeWidth="2" />

        {/* Ground coffee pile */}
        <motion.path
          d={`M 70 210 Q 100 ${220 - progress * 0.8} 130 210 L 130 220 L 70 220 Z`}
          fill="#4A3428"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Coffee particles falling */}
        <AnimatePresence>
          {[...Array(6)].map((_, i) => (
            <motion.circle
              key={i}
              cx={90 + i * 4}
              cy="140"
              r="1.5"
              fill="#4A3428"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 80, opacity: 0 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "linear",
              }}
            />
          ))}
        </AnimatePresence>
      </svg>

      <div className="text-center mt-4 text-sm font-medium text-amber-900">
        Grinding beans...
      </div>
    </motion.div>
  );
}

// ============================================================================
// ESPRESSO EXTRACTION
// ============================================================================

function EspressoExtraction({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative"
    >
      <svg width="240" height="300" viewBox="0 0 240 300" fill="none">
        {/* Espresso machine */}
        <rect x="40" y="20" width="160" height="120" rx="8" fill="#3E2723" stroke="#2C1810" strokeWidth="3" />

        {/* Machine details */}
        <rect x="60" y="35" width="40" height="30" rx="4" fill="#555" />
        <rect x="140" y="35" width="40" height="30" rx="4" fill="#555" />
        <circle cx="120" cy="80" r="15" fill="#888" stroke="#666" strokeWidth="2" />
        <motion.circle
          cx="120"
          cy="80"
          r="12"
          fill="#4CAF50"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />

        {/* Portafilter */}
        <rect x="90" y="130" width="60" height="20" rx="4" fill="#8B4513" stroke="#5D4037" strokeWidth="2" />
        <circle cx="120" cy="140" r="25" fill="#4A3428" stroke="#2C1810" strokeWidth="2" />

        {/* Handle */}
        <rect x="145" y="135" width="40" height="10" rx="5" fill="#8B4513" stroke="#5D4037" strokeWidth="1" />

        {/* Espresso streams */}
        <AnimatePresence>
          {progress > 10 && (
            <>
              {/* Left stream */}
              <motion.path
                d="M 105 165 Q 105 190 102 220"
                stroke="#3E2723"
                strokeWidth="4"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 1, ease: "easeIn" }}
              />

              {/* Right stream */}
              <motion.path
                d="M 135 165 Q 135 190 138 220"
                stroke="#3E2723"
                strokeWidth="4"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{ duration: 1, ease: "easeIn" }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Espresso cup */}
        <path d="M 80 220 L 80 260 Q 80 270 90 270 L 150 270 Q 160 270 160 260 L 160 220" fill="#D4A373" stroke="#8B6F47" strokeWidth="2" />

        {/* Espresso liquid filling */}
        <motion.rect
          x="80"
          y={270 - (progress * 0.4)}
          width="80"
          height={progress * 0.4}
          fill="#3E2723"
          initial={{ height: 0 }}
          animate={{ height: progress * 0.4 }}
          transition={{ duration: 0.2 }}
        />

        {/* Crema forming */}
        {progress > 50 && (
          <motion.ellipse
            cx="120"
            cy={270 - (progress * 0.4)}
            rx="38"
            ry="4"
            fill="#E5B887"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.5 }}
          />
        )}

        {/* Cup handle */}
        <path d="M 160 240 Q 175 240 175 250 Q 175 260 160 260" stroke="#D4A373" strokeWidth="3" fill="none" />

        {/* Saucer */}
        <ellipse cx="120" cy="273" rx="50" ry="6" fill="#C8A882" stroke="#8B6F47" strokeWidth="1" />

        {/* Steam rising */}
        <RisingSteam count={3} className="absolute top-0 left-20" />
      </svg>

      <div className="text-center mt-4 text-sm font-medium text-amber-900">
        Extracting espresso... {progress > 50 ? "Crema forming!" : ""}
      </div>
    </motion.div>
  );
}

// ============================================================================
// BLOOM ANIMATION (Pour Over)
// ============================================================================

function BloomAnimation({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
        {/* Dripper */}
        <path d="M 50 80 L 70 140 L 130 140 L 150 80 Z" fill="#E0E0E0" stroke="#999" strokeWidth="2" />

        {/* Coffee grounds */}
        <ellipse cx="100" cy="100" rx="40" ry="8" fill="#4A3428" />

        {/* Blooming grounds - expanding */}
        <motion.ellipse
          cx="100"
          cy="100"
          rx={30 + progress * 0.2}
          ry={6 + progress * 0.08}
          fill="#6D4C37"
          opacity={0.8}
          animate={{
            rx: 30 + progress * 0.2,
            ry: 6 + progress * 0.08,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Water pouring */}
        <motion.path
          d="M 100 20 Q 100 40 100 65"
          stroke="#64B5F6"
          strokeWidth="6"
          fill="none"
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress > 20 ? 0 : 1 }}
          transition={{ duration: 2, repeat: progress < 20 ? Infinity : 0 }}
        />

        {/* CO2 bubbles rising */}
        <AnimatePresence>
          {progress > 30 && [...Array(8)].map((_, i) => (
            <motion.circle
              key={i}
              cx={85 + (i % 4) * 10}
              cy="100"
              r="2"
              fill="rgba(255,255,255,0.5)"
              initial={{ y: 0, opacity: 1, scale: 0.5 }}
              animate={{ y: -30, opacity: 0, scale: 1.5 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Carafe below */}
        <path d="M 60 180 L 60 250 Q 60 260 70 260 L 130 260 Q 140 260 140 250 L 140 180" fill="rgba(139,69,19,0.2)" stroke="#5D4037" strokeWidth="2" />
        <path d="M 55 180 L 145 180" stroke="#5D4037" strokeWidth="2" />
      </svg>

      <div className="text-center mt-4 text-sm font-medium text-amber-900">
        Blooming... letting the grounds release CO₂
      </div>
    </motion.div>
  );
}

// ============================================================================
// POUR OVER ANIMATION
// ============================================================================

function PourOverAnimation({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
        {/* Kettle pouring (circular motion) */}
        <motion.g
          animate={{
            x: [0, 15, 0, -15, 0],
            y: [0, 5, 10, 5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <path d="M 80 20 Q 60 20 60 40 L 60 60 Q 60 70 70 70 L 110 70 Q 120 70 120 60 L 120 40 Q 120 20 100 20" fill="#666" stroke="#333" strokeWidth="2" />
          <path d="M 120 35 L 140 35 Q 150 35 150 45 Q 150 55 140 55 L 120 55" stroke="#666" strokeWidth="3" fill="none" />

          {/* Water stream */}
          <motion.path
            d="M 70 70 Q 70 100 90 120"
            stroke="#64B5F6"
            strokeWidth="5"
            fill="none"
            opacity={0.7}
          />
        </motion.g>

        {/* Dripper */}
        <path d="M 50 120 L 70 180 L 130 180 L 150 120 Z" fill="#E0E0E0" stroke="#999" strokeWidth="2" />

        {/* Coffee bed */}
        <ellipse cx="100" cy="140" rx="42" ry="10" fill="#6D4C37" />

        {/* Dripping */}
        <AnimatePresence>
          {[...Array(5)].map((_, i) => (
            <motion.circle
              key={i}
              cx={90 + i * 5}
              cy="180"
              r="2"
              fill="#5D4037"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 80, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeIn",
              }}
            />
          ))}
        </AnimatePresence>

        {/* Carafe with coffee filling */}
        <path d="M 60 220 L 60 270 Q 60 280 70 280 L 130 280 Q 140 280 140 270 L 140 220" fill="rgba(139,69,19,0.2)" stroke="#5D4037" strokeWidth="2" />

        <motion.rect
          x="60"
          y={280 - progress}
          width="80"
          height={progress}
          fill="#5D4037"
          opacity={0.7}
        />
      </svg>

      <div className="text-center mt-4 text-sm font-medium text-amber-900">
        Pouring in circular motion...
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEEPING ANIMATION (Aeropress)
// ============================================================================

function SteepingAnimation({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
        {/* Aeropress chamber */}
        <rect x="70" y="60" width="60" height="140" rx="4" fill="rgba(100,100,100,0.3)" stroke="#555" strokeWidth="3" />

        {/* Coffee + water mixture */}
        <motion.rect
          x="72"
          y="120"
          width="56"
          height="75"
          fill="#6D4C37"
          opacity={0.6 + progress * 0.003}
        />

        {/* Swirling particles */}
        <AnimatePresence>
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180);
            return (
              <motion.circle
                key={i}
                cx={100}
                cy={157}
                r="1.5"
                fill="#4A3428"
                animate={{
                  x: 15 * Math.cos(angle + progress * 0.1),
                  y: 15 * Math.sin(angle + progress * 0.1),
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            );
          })}
        </AnimatePresence>

        {/* Plunger (not pressed yet) */}
        <rect x="68" y="40" width="64" height="20" rx="4" fill="#333" stroke="#222" strokeWidth="2" />
        <rect x="97" y="10" width="6" height="30" fill="#555" />

        {/* Cup below */}
        <path d="M 60 220 L 60 270 Q 60 275 65 275 L 135 275 Q 140 275 140 270 L 140 220" fill="rgba(139,69,19,0.2)" stroke="#8B4513" strokeWidth="2" />
      </svg>

      <div className="text-center mt-4 text-sm font-medium text-amber-900">
        Steeping... extracting flavors
      </div>
    </motion.div>
  );
}

// ============================================================================
// PRESSING ANIMATION (Aeropress)
// ============================================================================

function PressingAnimation({ progress }: { progress: number }) {
  const plungerY = 40 + progress * 1.2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
        {/* Aeropress chamber */}
        <rect x="70" y="60" width="60" height="140" rx="4" fill="rgba(100,100,100,0.3)" stroke="#555" strokeWidth="3" />

        {/* Coffee being pressed */}
        <rect x="72" y={plungerY + 30} width="56" height={195 - plungerY} fill="#6D4C37" opacity={0.7} />

        {/* Plunger pressing down */}
        <motion.g animate={{ y: progress * 1.2 }}>
          <rect x="68" y="40" width="64" height="20" rx="4" fill="#333" stroke="#222" strokeWidth="2" />
          <rect x="97" y="10" width="6" height="30" fill="#555" />

          {/* Pressure indicator */}
          <motion.circle
            cx="100"
            cy="50"
            r="3"
            fill="#FF5722"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </motion.g>

        {/* Coffee dripping into cup */}
        <AnimatePresence>
          {[...Array(3)].map((_, i) => (
            <motion.circle
              key={i}
              cx={95 + i * 5}
              cy="200"
              r="2"
              fill="#3E2723"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: 60, opacity: 0 }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeIn",
              }}
            />
          ))}
        </AnimatePresence>

        {/* Cup filling */}
        <path d="M 60 220 L 60 270 Q 60 275 65 275 L 135 275 Q 140 275 140 270 L 140 220" fill="rgba(139,69,19,0.2)" stroke="#8B4513" strokeWidth="2" />

        <motion.rect
          x="60"
          y={275 - progress * 0.4}
          width="80"
          height={progress * 0.4}
          fill="#3E2723"
          opacity={0.8}
        />
      </svg>

      <div className="text-center mt-4 text-sm font-medium text-amber-900">
        Pressing... applying pressure
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEAM WAND ANIMATION
// ============================================================================

function SteamWandAnimation({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      <svg width="240" height="300" viewBox="0 0 240 300" fill="none">
        {/* Espresso machine side */}
        <rect x="20" y="60" width="80" height="120" rx="6" fill="#3E2723" stroke="#2C1810" strokeWidth="2" />

        {/* Steam wand */}
        <motion.path
          d="M 100 120 L 140 120 L 140 180"
          stroke="#888"
          strokeWidth="6"
          fill="none"
          animate={{ rotate: [0, -2, 0, 2, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ transformOrigin: "100px 120px" }}
        />

        {/* Milk pitcher */}
        <path d="M 110 180 L 110 240 Q 110 250 120 250 L 160 250 Q 170 250 170 240 L 170 180" fill="#C0C0C0" stroke="#888" strokeWidth="2" />
        <path d="M 170 200 L 185 200 L 185 210 L 170 210" stroke="#888" strokeWidth="2" fill="none" />

        {/* Milk inside */}
        <motion.rect
          x="112"
          y="220"
          width="56"
          height="28"
          fill="#FAFAFA"
          opacity={0.9}
        />

        {/* Milk swirling */}
        <motion.ellipse
          cx="140"
          cy="220"
          rx="25"
          ry="4"
          fill="#F5F5F5"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "140px 220px" }}
        />

        {/* Steam particles */}
        <RisingSteam count={8} className="absolute top-24 left-32" />

        {/* Bubbles forming in milk */}
        <AnimatePresence>
          {progress > 30 && [...Array(10)].map((_, i) => (
            <motion.circle
              key={i}
              cx={120 + (i % 5) * 10}
              cy={235}
              r="1.5"
              fill="rgba(255,255,255,0.8)"
              initial={{ y: 0, opacity: 1, scale: 0.5 }}
              animate={{ y: -20, opacity: 0, scale: 1.2 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </AnimatePresence>

        {/* Microfoam texture indicator */}
        {progress > 60 && (
          <motion.text
            x="140"
            y="235"
            textAnchor="middle"
            fontSize="10"
            fill="#666"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Perfect microfoam!
          </motion.text>
        )}
      </svg>

      <div className="text-center mt-4 text-sm font-medium text-amber-900">
        Steaming milk... {progress > 60 ? "Microfoam achieved!" : "Creating texture"}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MILK POUR ANIMATION
// ============================================================================

function MilkPourAnimation({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
        {/* Milk pitcher tilted */}
        <motion.g
          animate={{ rotate: progress > 50 ? -45 : -30 }}
          style={{ transformOrigin: "110px 100px" }}
        >
          <path d="M 80 100 L 80 150 Q 80 160 90 160 L 130 160 Q 140 160 140 150 L 140 100" fill="#C0C0C0" stroke="#888" strokeWidth="2" />
          <path d="M 140 120 L 155 120 L 155 130 L 140 130" stroke="#888" strokeWidth="2" fill="none" />

          {/* Milk inside pitcher */}
          <rect x="82" y="130" width="56" height="28" fill="#FAFAFA" opacity={0.9} />
        </motion.g>

        {/* Milk stream pouring */}
        <motion.path
          d="M 120 150 Q 110 180 105 220"
          stroke="#FAFAFA"
          strokeWidth={progress > 50 ? "12" : "8"}
          fill="none"
          opacity={0.9}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Espresso cup with milk mixing */}
        <path d="M 70 220 L 70 260 Q 70 270 80 270 L 130 270 Q 140 270 140 260 L 140 220" fill="#D4A373" stroke="#8B6F47" strokeWidth="2" />

        {/* Espresso base */}
        <rect x="70" y="250" width="70" height="18" fill="#3E2723" />

        {/* Milk mixing in (latte art forming) */}
        <motion.ellipse
          cx="105"
          cy="235"
          rx="25"
          ry="8"
          fill="#F5E6D3"
          opacity={0.9}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Simple latte art pattern */}
        {progress > 70 && (
          <motion.path
            d="M 105 230 Q 100 235 105 240 Q 110 235 105 230"
            fill="#8D6E63"
            opacity={0.6}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          />
        )}

        {/* Handle */}
        <path d="M 140 235 Q 155 235 155 245 Q 155 255 140 255" stroke="#D4A373" strokeWidth="3" fill="none" />
      </svg>

      <div className="text-center mt-4 text-sm font-medium text-amber-900">
        Pouring milk... {progress > 70 ? "Creating latte art!" : ""}
      </div>
    </motion.div>
  );
}

// ============================================================================
// WHISKING ANIMATION (Matcha)
// ============================================================================

function WhiskingAnimation({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative"
    >
      <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
        {/* Matcha bowl */}
        <path d="M 50 120 Q 50 180 100 190 Q 150 180 150 120" fill="#E8DCC8" stroke="#C8B896" strokeWidth="2" />
        <ellipse cx="100" cy="120" rx="50" ry="12" fill="#D4C4A8" stroke="#C8B896" strokeWidth="2" />

        {/* Matcha liquid */}
        <ellipse cx="100" cy="125" rx="45" ry="10" fill="#6B8E23" opacity={0.9} />
        <rect x="55" y="125" width="90" height="55" fill="#6B8E23" opacity={0.85} />

        {/* Chasen (bamboo whisk) whisking */}
        <motion.g
          animate={{ x: [-10, 10, -10], rotate: [-5, 5, -5] }}
          transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "100px 80px" }}
        >
          {/* Whisk handle */}
          <rect x="97" y="20" width="6" height="70" fill="#8B7355" rx="2" />

          {/* Whisk bristles */}
          {[...Array(9)].map((_, i) => (
            <line
              key={i}
              x1={92 + i * 2}
              y1="90"
              x2={90 + i * 2}
              y2="130"
              stroke="#C8B896"
              strokeWidth="1.5"
            />
          ))}
        </motion.g>

        {/* Foam bubbles forming */}
        <AnimatePresence>
          {progress > 40 && [...Array(15)].map((_, i) => (
            <motion.circle
              key={i}
              cx={70 + (i % 6) * 10}
              cy={120 + Math.floor(i / 6) * 3}
              r={1 + Math.random() * 1.5}
              fill="#A8D08D"
              opacity={0.7}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            />
          ))}
        </AnimatePresence>

        {/* Perfect froth indicator */}
        {progress > 80 && (
          <motion.ellipse
            cx="100"
            cy="122"
            rx="40"
            ry="6"
            fill="#A8D08D"
            opacity={0.8}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </svg>

      <div className="text-center mt-4 text-sm font-medium text-amber-900">
        Whisking matcha... {progress > 80 ? "Perfect froth!" : ""}
      </div>
    </motion.div>
  );
}

// ============================================================================
// IDLE EQUIPMENT PREVIEWS
// ============================================================================

function EspressoMachineIdle() {
  return (
    <svg width="240" height="280" viewBox="0 0 240 280" fill="none">
      <rect x="40" y="40" width="160" height="140" rx="8" fill="#3E2723" stroke="#2C1810" strokeWidth="3" />
      <rect x="60" y="60" width="50" height="40" rx="4" fill="#555" />
      <rect x="130" y="60" width="50" height="40" rx="4" fill="#555" />
      <circle cx="120" cy="130" r="25" fill="#888" stroke="#666" strokeWidth="2" />
      <text x="120" y="138" textAnchor="middle" fontSize="14" fill="#333" fontFamily="monospace">BREW</text>

      <path d="M 90 180 L 90 210 Q 90 220 100 220 L 140 220 Q 150 220 150 210 L 150 180" fill="#D4A373" stroke="#8B6F47" strokeWidth="2" opacity="0.5" />
      <ellipse cx="120" cy="223" rx="40" ry="5" fill="#C8A882" stroke="#8B6F47" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function PourOverIdle() {
  return (
    <svg width="200" height="280" viewBox="0 0 200 280" fill="none">
      <path d="M 50 80 L 70 160 L 130 160 L 150 80 Z" fill="#E0E0E0" stroke="#999" strokeWidth="2" />
      <path d="M 60 200 L 60 260 Q 60 270 70 270 L 130 270 Q 140 270 140 260 L 140 200" fill="rgba(139,69,19,0.1)" stroke="#5D4037" strokeWidth="2" />
      <path d="M 55 200 L 145 200" stroke="#5D4037" strokeWidth="2" />
      <text x="100" y="30" textAnchor="middle" fontSize="12" fill="#666" fontFamily="sans-serif">Pour Over Setup</text>
    </svg>
  );
}

function AeropressIdle() {
  return (
    <svg width="200" height="280" viewBox="0 0 200 280" fill="none">
      <rect x="70" y="60" width="60" height="150" rx="4" fill="rgba(100,100,100,0.2)" stroke="#555" strokeWidth="3" />
      <rect x="68" y="40" width="64" height="20" rx="4" fill="#333" stroke="#222" strokeWidth="2" />
      <rect x="97" y="10" width="6" height="30" fill="#555" />
      <path d="M 60 220 L 60 260 Q 60 265 65 265 L 135 265 Q 140 265 140 260 L 140 220" fill="rgba(139,69,19,0.1)" stroke="#8B4513" strokeWidth="2" />
      <text x="100" y="250" textAnchor="middle" fontSize="10" fill="#666">Aeropress</text>
    </svg>
  );
}

function MatchaBowlIdle() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
      <path d="M 40 80 Q 40 140 100 150 Q 160 140 160 80" fill="#E8DCC8" stroke="#C8B896" strokeWidth="2" />
      <ellipse cx="100" cy="80" rx="60" ry="15" fill="#D4C4A8" stroke="#C8B896" strokeWidth="2" />

      {/* Chasen whisk */}
      <rect x="95" y="30" width="10" height="40" fill="#8B7355" rx="3" />
      {[...Array(7)].map((_, i) => (
        <line key={i} x1={92 + i * 3} y1="70" x2={90 + i * 3} y2="85" stroke="#C8B896" strokeWidth="1.5" />
      ))}

      <text x="100" y="170" textAnchor="middle" fontSize="12" fill="#666">Matcha Ceremony</text>
    </svg>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDrinkName(drinkType: DrinkType): string {
  const names: Record<DrinkType, string> = {
    espresso: "Espresso",
    latte: "Latte",
    cappuccino: "Cappuccino",
    pourover: "Pour Over",
    aeropress: "Aeropress",
    mocha: "Mocha",
    americano: "Americano",
    matcha: "Matcha",
  };
  return names[drinkType];
}

function getStageLabel(stage: BrewStage): string {
  const labels: Record<BrewStage, string> = {
    idle: "Ready",
    grinding: "Grinding Beans",
    extracting: "Extracting Espresso",
    blooming: "Blooming Grounds",
    pouring: "Pouring Water",
    steeping: "Steeping",
    pressing: "Pressing",
    steaming: "Steaming Milk",
    milk_pouring: "Pouring Milk",
    whisking: "Whisking Matcha",
    complete: "Complete",
  };
  return labels[stage];
}
