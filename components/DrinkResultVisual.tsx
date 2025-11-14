/**
 * Drink Result Visual Component
 *
 * Shows visual representation of the finished drink based on quality
 * 8 drinks × 3 quality levels = 24 unique SVG illustrations
 *
 * Quality Mapping:
 * - Poor (0-69): Visually wrong - pale, separated, burnt, etc.
 * - Average (70-84): Acceptable but imperfect
 * - Great (85-100): Beautiful, perfect presentation
 */

import { motion } from "framer-motion";
import type { DrinkType } from "@/lib/types";

type QualityLevel = "poor" | "average" | "great";

interface DrinkResultVisualProps {
  drinkType: DrinkType;
  quality: number; // 0-100
  className?: string;
  animated?: boolean;
}

function getQualityLevel(quality: number): QualityLevel {
  if (quality < 70) return "poor";
  if (quality < 85) return "average";
  return "great";
}

export function DrinkResultVisual({
  drinkType,
  quality,
  className = "w-32 h-32",
  animated = true,
}: DrinkResultVisualProps) {
  const qualityLevel = getQualityLevel(quality);

  const MotionWrapper = animated ? motion.div : "div";
  const animationProps = animated
    ? {
        initial: { scale: 0, rotate: -15 },
        animate: { scale: 1, rotate: 0 },
        transition: { type: "spring", stiffness: 200, damping: 15 },
      }
    : {};

  return (
    <MotionWrapper className={className} {...animationProps}>
      {renderDrink(drinkType, qualityLevel)}
    </MotionWrapper>
  );
}

function renderDrink(drinkType: DrinkType, quality: QualityLevel): JSX.Element {
  switch (drinkType) {
    case "espresso":
      return <EspressoVisual quality={quality} />;
    case "latte":
      return <LatteVisual quality={quality} />;
    case "cappuccino":
      return <CappuccinoVisual quality={quality} />;
    case "pourover":
      return <PourOverVisual quality={quality} />;
    case "aeropress":
      return <AeropressVisual quality={quality} />;
    case "mocha":
      return <MochaVisual quality={quality} />;
    case "americano":
      return <AmericanoVisual quality={quality} />;
    case "matcha":
      return <MatchaVisual quality={quality} />;
  }
}

// ============================================================================
// ESPRESSO VISUALS
// ============================================================================

function EspressoVisual({ quality }: { quality: QualityLevel }) {
  const colors = {
    poor: { coffee: "#8B7355", crema: "#C9A66B", cup: "#8B4513" },
    average: { coffee: "#5D4037", crema: "#D4A373", cup: "#8B4513" },
    great: { coffee: "#3E2723", crema: "#E5B887", cup: "#A0522D" },
  };

  const c = colors[quality];
  const cremaThickness = quality === "poor" ? 2 : quality === "average" ? 4 : 6;

  return (
    <svg viewBox="0 0 100 100" fill="none">
      {/* Cup */}
      <path d="M30 40 L30 65 Q30 72 36 72 L64 72 Q70 72 70 65 L70 40 Z" fill={c.cup} stroke="#3E2723" strokeWidth="2" />
      {/* Coffee */}
      <ellipse cx="50" cy="42" rx="20" ry="5" fill={c.coffee} />
      {/* Crema */}
      <ellipse cx="50" cy="42" rx="18" ry={cremaThickness} fill={c.crema} opacity={quality === "poor" ? 0.5 : 0.9} />
      {/* Handle */}
      <path d="M70 48 Q78 48 78 56 Q78 64 70 64" stroke={c.cup} strokeWidth="3" fill="none" />
      {/* Saucer */}
      <ellipse cx="50" cy="75" rx="25" ry="4" fill="#C8A882" stroke="#8B6F47" strokeWidth="1" />
      {/* Quality indicator */}
      {quality === "poor" && (
        <ellipse cx="50" cy="42" rx="15" ry="2" fill="#8B7355" opacity="0.3" />
      )}
    </svg>
  );
}

// ============================================================================
// LATTE VISUALS
// ============================================================================

function LatteVisual({ quality }: { quality: QualityLevel }) {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      {/* Glass */}
      <path d="M32 20 L32 75 Q32 80 37 80 L63 80 Q68 80 68 75 L68 20 Z" fill="rgba(255,255,255,0.3)" stroke="#888" strokeWidth="2" />

      {quality === "poor" ? (
        /* Poor: Separated layers, no art */
        <>
          <rect x="32" y="55" width="36" height="20" fill="#7D5A3D" opacity="0.7" />
          <rect x="32" y="35" width="36" height="20" fill="#E8D5C3" opacity="0.8" />
          <ellipse cx="50" cy="35" rx="18" ry="4" fill="#FAFAFA" />
          {/* Bubbles indicating separation */}
          <circle cx="45" cy="50" r="2" fill="#D4A373" opacity="0.5" />
          <circle cx="55" cy="48" r="1.5" fill="#D4A373" opacity="0.5" />
        </>
      ) : quality === "average" ? (
        /* Average: Okay mix, simple pour */
        <>
          <rect x="32" y="50" width="36" height="25" fill="#6D4C37" opacity="0.8" />
          <rect x="32" y="30" width="36" height="20" fill="#F5E6D3" opacity="0.9" />
          <ellipse cx="50" cy="30" rx="18" ry="4" fill="#FFFFFF" />
          {/* Simple heart */}
          <path d="M50 32 Q45 34 50 38 Q55 34 50 32" fill="#8D6E63" opacity="0.6" />
        </>
      ) : (
        /* Great: Perfect layers, beautiful rosetta */
        <>
          <rect x="32" y="50" width="36" height="25" fill="#5D4037" opacity="0.9" />
          <rect x="32" y="28" width="36" height="22" fill="#F5E6D3" opacity="0.95" />
          <ellipse cx="50" cy="28" rx="18" ry="4" fill="#FFFFFF" />
          {/* Beautiful rosetta latte art */}
          <path d="M50 30 Q48 32 50 34 Q52 32 50 30" fill="#8D6E63" opacity="0.7" />
          <path d="M50 34 Q46 36 50 40 Q54 36 50 34" fill="#8D6E63" opacity="0.7" />
          <path d="M48 32 Q44 34 46 37" fill="#8D6E63" opacity="0.6" stroke="#8D6E63" strokeWidth="0.5" fill="none" />
          <path d="M52 32 Q56 34 54 37" fill="#8D6E63" opacity="0.6" stroke="#8D6E63" strokeWidth="0.5" fill="none" />
        </>
      )}
    </svg>
  );
}

// ============================================================================
// CAPPUCCINO VISUALS
// ============================================================================

function CappuccinoVisual({ quality }: { quality: QualityLevel }) {
  const foamHeight = quality === "poor" ? 8 : quality === "average" ? 15 : 22;

  return (
    <svg viewBox="0 0 100 100" fill="none">
      {/* Cup */}
      <path d="M28 40 L28 68 Q28 74 34 74 L66 74 Q72 74 72 68 L72 40 Z" fill="#D4A373" stroke="#8B6F47" strokeWidth="2" />

      {quality === "poor" ? (
        /* Poor: Flat foam, wet */
        <>
          <rect x="28" cy="55" width="44" height="13" fill="#5D4037" />
          <ellipse cx="50" cy="55" rx="22" ry="4" fill="#FAFAFA" opacity="0.7" />
          {/* Large bubbles - wet foam */}
          <circle cx="45" cy="52" r="3" fill="white" opacity="0.4" />
          <circle cx="55" cy="53" r="2.5" fill="white" opacity="0.4" />
        </>
      ) : quality === "average" ? (
        /* Average: Decent foam */
        <>
          <rect x="28" y="50" width="44" height="18" fill="#5D4037" />
          <ellipse cx="50" cy="50" rx="22" ry="6" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="50" cy="44" rx="20" ry="5" fill="#FAFAFA" />
          {/* Some cocoa */}
          <circle cx="46" cy="45" r="0.5" fill="#6D4C41" opacity="0.5" />
          <circle cx="54" cy="46" r="0.5" fill="#6D4C41" opacity="0.5" />
        </>
      ) : (
        /* Great: Perfect microfoam dome */
        <>
          <rect x="28" y="46" width="44" height="22" fill="#5D4037" />
          <ellipse cx="50" cy="46" rx="22" ry="7" fill="#FFFFFF" />
          <ellipse cx="50" cy="39" rx="20" ry="6" fill="#FAFAFA" />
          <ellipse cx="50" cy="33" rx="18" ry="4" fill="#F5F5F5" />
          {/* Perfect cocoa dusting */}
          {[...Array(12)].map((_, i) => (
            <circle
              key={i}
              cx={42 + (i % 4) * 4}
              cy={35 + Math.floor(i / 4) * 3}
              r="0.5"
              fill="#6D4C41"
              opacity="0.6"
            />
          ))}
        </>
      )}

      {/* Handle */}
      <path d="M72 48 Q80 48 80 56 Q80 64 72 64" stroke="#D4A373" strokeWidth="3" fill="none" />
      {/* Saucer */}
      <ellipse cx="50" cy="77" rx="28" ry="4" fill="#C8A882" stroke="#8B6F47" strokeWidth="1" />
    </svg>
  );
}

// ============================================================================
// POUR OVER VISUALS
// ============================================================================

function PourOverVisual({ quality }: { quality: QualityLevel }) {
  const colors = {
    poor: "#8B7355", // Murky
    average: "#6D4C37", // Decent brown
    great: "#5D3A1A", // Rich amber
  };

  return (
    <svg viewBox="0 0 100 100" fill="none">
      {/* Server/carafe */}
      <path d="M35 45 L35 75 Q35 80 40 80 L60 80 Q65 80 65 75 L65 45" fill="rgba(139,69,19,0.2)" stroke="#5D4037" strokeWidth="2" />

      {quality === "poor" ? (
        /* Poor: Murky, sediment */
        <>
          <path d="M35 55 L35 75 Q35 80 40 80 L60 80 Q65 80 65 75 L65 55 Z" fill={colors.poor} opacity="0.6" />
          {/* Sediment at bottom */}
          <ellipse cx="50" cy="78" rx="12" ry="2" fill="#4A3428" opacity="0.5" />
          <circle cx="45" cy="70" r="1" fill="#4A3428" opacity="0.4" />
          <circle cx="55" cy="72" r="0.8" fill="#4A3428" opacity="0.4" />
        </>
      ) : quality === "average" ? (
        /* Average: Clear but not perfect */
        <>
          <path d="M35 52 L35 75 Q35 80 40 80 L60 80 Q65 80 65 75 L65 52 Z" fill={colors.average} opacity="0.75" />
        </>
      ) : (
        /* Great: Crystal clear, beautiful amber */
        <>
          <path d="M35 50 L35 75 Q35 80 40 80 L60 80 Q65 80 65 75 L65 50 Z" fill={colors.great} opacity="0.85" />
          {/* Highlight showing clarity */}
          <ellipse cx="45" cy="60" rx="4" ry="12" fill="white" opacity="0.15" />
        </>
      )}

      {/* Dripper (simplified) */}
      <path d="M32 30 L50 42 L68 30 Z" fill="#E0E0E0" stroke="#999" strokeWidth="1.5" />
    </svg>
  );
}

// ============================================================================
// AEROPRESS VISUALS
// ============================================================================

function AeropressVisual({ quality }: { quality: QualityLevel }) {
  const colors = {
    poor: "#9B8B7E", // Weak/muddy
    average: "#6D4C37", // Decent
    great: "#4A2C1A", // Rich and clean
  };

  return (
    <svg viewBox="0 0 100 100" fill="none">
      {/* Chamber (simplified) */}
      <rect x="38" y="30" width="24" height="35" rx="2" fill="rgba(100,100,100,0.2)" stroke="#555" strokeWidth="2" />

      {/* Coffee in cup below */}
      <path d="M32 65 L32 78 Q32 82 36 82 L64 82 Q68 82 68 78 L68 65" fill="rgba(139,69,19,0.2)" stroke="#8B4513" strokeWidth="2" />

      {quality === "poor" ? (
        /* Poor: Muddy, particles */
        <>
          <rect x="32" y="70" width="36" height="8" fill={colors.poor} opacity="0.7" />
          <circle cx="45" cy="74" r="1.5" fill="#4A3428" opacity="0.5" />
          <circle cx="55" cy="75" r="1" fill="#4A3428" opacity="0.5" />
        </>
      ) : quality === "average" ? (
        /* Average: Clean, decent */
        <>
          <rect x="32" y="68" width="36" height="10" fill={colors.average} opacity="0.8" />
        </>
      ) : (
        /* Great: Rich, perfect concentration */
        <>
          <rect x="32" y="67" width="36" height="11" fill={colors.great} opacity="0.9" />
          <ellipse cx="50" cy="67" rx="16" ry="2" fill="#2C1810" opacity="0.5" />
        </>
      )}
    </svg>
  );
}

// ============================================================================
// MOCHA VISUALS
// ============================================================================

function MochaVisual({ quality }: { quality: QualityLevel }) {
  return (
    <svg viewBox="0 0 100 100" fill="none">
      {/* Glass */}
      <path d="M32 25 L32 75 Q32 80 37 80 L63 80 Q68 80 68 75 L68 25 Z" fill="rgba(255,255,255,0.3)" stroke="#888" strokeWidth="2" />

      {quality === "poor" ? (
        /* Poor: Separated chocolate, lumpy cream */
        <>
          <rect x="32" y="60" width="36" height="15" fill="#4A2C1A" opacity="0.8" />
          <rect x="32" y="45" width="36" height="15" fill="#7D5A3D" opacity="0.7" />
          <rect x="32" y="35" width="36" height="10" fill="#E8D5C3" opacity="0.8" />
          {/* Lumpy whipped cream */}
          <ellipse cx="45" cy="32" rx="7" ry="4" fill="#FFFFFF" />
          <ellipse cx="55" cy="30" rx="8" ry="5" fill="#FAFAFA" />
        </>
      ) : quality === "average" ? (
        /* Average: Mixed okay */
        <>
          <rect x="32" y="58" width="36" height="17" fill="#3E2723" opacity="0.9" />
          <rect x="32" y="43" width="36" height="15" fill="#6D4C37" opacity="0.8" />
          <rect x="32" y="34" width="36" height="9" fill="#F5E6D3" opacity="0.9" />
          <ellipse cx="50" cy="31" rx="12" ry="5" fill="#FFFFFF" />
          <path d="M45 29 Q50 30 55 29" stroke="#6D4C41" strokeWidth="1" fill="none" />
        </>
      ) : (
        /* Great: Perfect layers, elegant drizzle */
        <>
          <rect x="32" y="56" width="36" height="19" fill="#2C1810" opacity="0.95" />
          <rect x="32" y="42" width="36" height="14" fill="#5D4037" opacity="0.9" />
          <rect x="32" y="32" width="36" height="10" fill="#F5E6D3" opacity="0.95" />
          <ellipse cx="50" cy="29" rx="14" ry="6" fill="#FFFFFF" />
          <ellipse cx="50" cy="23" rx="11" ry="4" fill="#FAFAFA" />
          <ellipse cx="50" cy="19" rx="8" ry="3" fill="#FFFFFF" />
          {/* Perfect chocolate drizzle */}
          <path d="M42 20 Q45 21 48 20 Q51 19 54 20 Q57 21 58 20" stroke="#6D4C41" strokeWidth="1.2" fill="none" />
          <path d="M43 23 Q46 24 49 23 Q52 22 55 23" stroke="#6D4C41" strokeWidth="1" fill="none" />
        </>
      )}
    </svg>
  );
}

// ============================================================================
// AMERICANO VISUALS
// ============================================================================

function AmericanoVisual({ quality }: { quality: QualityLevel }) {
  const colors = {
    poor: { coffee: "#9B8B7E", crema: "#C9A66B" }, // Weak
    average: { coffee: "#5D4037", crema: "#D4A373" }, // Decent
    great: { coffee: "#3E2723", crema: "#E5B887" }, // Rich
  };

  const c = colors[quality];
  const cremaPresent = quality !== "poor";

  return (
    <svg viewBox="0 0 100 100" fill="none">
      {/* Mug */}
      <path d="M30 35 L30 70 Q30 75 35 75 L65 75 Q70 75 70 70 L70 35 Z" fill="#8B4513" stroke="#5D4037" strokeWidth="2" />

      {/* Coffee */}
      <ellipse cx="50" cy="37" rx="20" ry="4" fill={c.coffee} />
      <rect x="30" y="37" width="40" height="33" fill={c.coffee} />

      {/* Crema (if present) */}
      {cremaPresent && (
        <ellipse
          cx="50"
          cy="37"
          rx="18"
          ry={quality === "great" ? 3 : 2}
          fill={c.crema}
          opacity={quality === "great" ? 0.8 : 0.5}
        />
      )}

      {/* Handle */}
      <path d="M70 45 Q80 45 80 55 Q80 65 70 65" stroke="#8B4513" strokeWidth="3" fill="none" />
    </svg>
  );
}

// ============================================================================
// MATCHA VISUALS
// ============================================================================

function MatchaVisual({ quality }: { quality: QualityLevel }) {
  const colors = {
    poor: "#9B8B7A", // Brown/pale - oxidized
    average: "#7A9F35", // Decent green
    great: "#6B8E23", // Vibrant jade
  };

  return (
    <svg viewBox="0 0 100 100" fill="none">
      {/* Bowl */}
      <path d="M28 42 Q28 68 50 72 Q72 68 72 42" fill="#E8DCC8" stroke="#C8B896" strokeWidth="2" />
      <ellipse cx="50" cy="42" rx="22" ry="6" fill="#D4C4A8" stroke="#C8B896" strokeWidth="1.5" />

      {quality === "poor" ? (
        /* Poor: Wrong color, clumps */
        <>
          <ellipse cx="50" cy="44" rx="20" ry="4" fill={colors.poor} opacity="0.7" />
          <rect x="30" y="44" width="40" height="22" fill={colors.poor} opacity="0.6" />
          {/* Clumps */}
          <circle cx="45" cy="50" r="2" fill="#4A3428" opacity="0.4" />
          <circle cx="55" cy="52" r="1.5" fill="#4A3428" opacity="0.4" />
        </>
      ) : quality === "average" ? (
        /* Average: Decent green */
        <>
          <ellipse cx="50" cy="44" rx="20" ry="4" fill={colors.average} opacity="0.85" />
          <rect x="30" y="44" width="40" height="22" fill={colors.average} opacity="0.8" />
          {/* Some bubbles */}
          <circle cx="46" cy="46" r="1" fill="#A8D08D" opacity="0.6" />
          <circle cx="54" cy="47" r="1.2" fill="#A8D08D" opacity="0.6" />
        </>
      ) : (
        /* Great: Vibrant jade, perfect froth */
        <>
          <ellipse cx="50" cy="44" rx="20" ry="4" fill={colors.great} />
          <rect x="30" y="44" width="40" height="22" fill={colors.great} opacity="0.95" />
          {/* Perfect foam bubbles */}
          {[...Array(8)].map((_, i) => (
            <circle
              key={i}
              cx={42 + (i % 4) * 4}
              cy={45 + Math.floor(i / 4) * 2}
              r={0.8 + Math.random() * 0.4}
              fill="#A8D08D"
              opacity="0.7"
            />
          ))}
        </>
      )}
    </svg>
  );
}
