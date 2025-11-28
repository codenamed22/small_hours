/**
 * Customer Avatar Component
 *
 * SVG avatars with different moods and personalities
 */

import { motion } from "framer-motion";

export type Mood = "happy" | "neutral" | "stressed" | "tired";

interface CustomerAvatarProps {
  mood?: Mood;
  className?: string;
  animated?: boolean;
}

export function CustomerAvatar({ mood = "neutral", className = "w-16 h-16", animated = false }: CustomerAvatarProps) {
  // Color schemes based on mood
  const moodColors = {
    happy: { skin: "#FFD7BA", cheeks: "#FFB4A2" },
    neutral: { skin: "#F5D5C5", cheeks: "#E8C4B4" },
    stressed: { skin: "#E8D4C4", cheeks: "#D9B5A5" },
    tired: { skin: "#E0D0C0", cheeks: "#D0C0B0" },
  };

  const colors = moodColors[mood];

  return (
    <motion.svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={animated ? { scale: 0, rotate: -180 } : {}}
      animate={animated ? { scale: 1, rotate: 0 } : {}}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Head */}
      <circle cx="50" cy="50" r="35" fill={colors.skin} />

      {/* Hair */}
      <path
        d="M20 40 Q20 15 50 15 Q80 15 80 40"
        fill="#4A3428"
      />

      {/* Eyes */}
      {mood === "tired" ? (
        // Tired eyes (half-closed)
        <>
          <path d="M35 45 Q35 48 38 48 Q41 48 41 45" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M59 45 Q59 48 62 48 Q65 48 65 45" stroke="#2C1810" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : mood === "stressed" ? (
        // Stressed eyes (wide)
        <>
          <circle cx="38" cy="45" r="4" fill="#2C1810" />
          <circle cx="62" cy="45" r="4" fill="#2C1810" />
          {/* Worry lines */}
          <path d="M30 35 Q32 32 34 35" stroke="#8B6F47" strokeWidth="1" fill="none" />
          <path d="M66 35 Q68 32 70 35" stroke="#8B6F47" strokeWidth="1" fill="none" />
        </>
      ) : (
        // Normal/happy eyes
        <>
          <circle cx="38" cy="45" r="3" fill="#2C1810" />
          <circle cx="62" cy="45" r="3" fill="#2C1810" />
          {/* Sparkle in eyes for happy */}
          {mood === "happy" && (
            <>
              <circle cx="39" cy="44" r="1" fill="white" />
              <circle cx="63" cy="44" r="1" fill="white" />
            </>
          )}
        </>
      )}

      {/* Nose */}
      <ellipse cx="50" cy="55" rx="2" ry="3" fill="#D9A88A" opacity="0.6" />

      {/* Mouth */}
      {mood === "happy" ? (
        // Big smile
        <path
          d="M40 62 Q50 70 60 62"
          stroke="#8B4513"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      ) : mood === "neutral" ? (
        // Slight smile
        <path
          d="M42 64 Q50 67 58 64"
          stroke="#8B4513"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      ) : mood === "stressed" ? (
        // Concerned/worried
        <path
          d="M42 66 Q50 64 58 66"
          stroke="#8B4513"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        // Tired (small O mouth)
        <ellipse cx="50" cy="65" rx="3" ry="4" fill="#8B4513" />
      )}

      {/* Cheeks */}
      {mood === "happy" && (
        <>
          <circle cx="30" cy="55" r="5" fill={colors.cheeks} opacity="0.6" />
          <circle cx="70" cy="55" r="5" fill={colors.cheeks} opacity="0.6" />
        </>
      )}

      {/* Accessories based on mood */}
      {mood === "stressed" && (
        // Sweat drop
        <motion.path
          d="M75 35 Q77 38 75 40 Q73 38 75 35"
          fill="#6DB4E8"
          opacity="0.7"
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

// Alternative: Simple coffee cup icon avatar
export function CustomerWithCoffee({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Person silhouette */}
      <circle cx="50" cy="35" r="15" fill="#8B6F47" />
      <path d="M30 50 Q50 55 70 50 L70 80 Q70 85 65 85 L35 85 Q30 85 30 80 Z" fill="#6D5A3D" />

      {/* Coffee cup in hand */}
      <g transform="translate(55, 60)">
        <rect x="0" y="0" width="20" height="15" rx="2" fill="#D4A373" />
        <ellipse cx="10" cy="1" rx="8" ry="2" fill="#3E2723" />
        <path d="M20 5 Q25 5 25 10 Q25 15 20 15" stroke="#D4A373" strokeWidth="2" fill="none" />
      </g>
    </svg>
  );
}
