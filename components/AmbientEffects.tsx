/**
 * Ambient Effects
 *
 * Subtle atmospheric effects like floating steam, dust particles, etc.
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SteamParticle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  opacity: number;
}

/**
 * Rising steam effect (for espresso machine, cups, etc.)
 */
export function RisingSteam({ count = 5, className = "" }: { count?: number; className?: string }) {
  const [particles, setParticles] = useState<SteamParticle[]>([]);

  useEffect(() => {
    const newParticles: SteamParticle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 30 - 15, // -15 to 15
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.3,
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className={`relative ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bottom-0 left-1/2 w-8 h-8 rounded-full bg-white blur-sm"
          style={{
            x: particle.x,
            opacity: particle.opacity,
          }}
          animate={{
            y: [-10, -80],
            scale: [0.5, 1.5, 0.5],
            opacity: [particle.opacity, particle.opacity * 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * Floating dust particles (subtle ambiance)
 */
export function FloatingDust({ count = 10 }: { count?: number }) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Pulsing glow effect (for perfect brews, special moments)
 */
export function PulsingGlow({ active, color = "amber" }: { active: boolean; color?: string }) {
  const colorMap = {
    amber: "rgba(251, 191, 36, 0.3)",
    green: "rgba(34, 197, 94, 0.3)",
    blue: "rgba(59, 130, 246, 0.3)",
    purple: "rgba(168, 85, 247, 0.3)",
  };

  if (!active) return null;

  return (
    <motion.div
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{
        boxShadow: `0 0 30px ${colorMap[color as keyof typeof colorMap] || colorMap.amber}`,
      }}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/**
 * Simple clock showing time of day
 */
interface ClockProps {
  hour: number; // 0-23
  minute: number; // 0-59
}

export function SimpleClock({ hour, minute }: ClockProps) {
  const hourAngle = ((hour % 12) * 30) + (minute * 0.5); // 360/12 = 30 degrees per hour
  const minuteAngle = minute * 6; // 360/60 = 6 degrees per minute

  return (
    <svg width="60" height="60" viewBox="0 0 100 100" className="opacity-60">
      {/* Clock face */}
      <circle cx="50" cy="50" r="45" fill="white" stroke="#8B6F47" strokeWidth="3" />

      {/* Hour markers */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x1 = 50 + 35 * Math.cos(angle);
        const y1 = 50 + 35 * Math.sin(angle);
        const x2 = 50 + 40 * Math.cos(angle);
        const y2 = 50 + 40 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#8B6F47"
            strokeWidth="2"
          />
        );
      })}

      {/* Hour hand */}
      <motion.line
        x1="50"
        y1="50"
        x2="50"
        y2="30"
        stroke="#2C1810"
        strokeWidth="4"
        strokeLinecap="round"
        style={{
          transformOrigin: "50px 50px",
        }}
        animate={{
          rotate: hourAngle,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Minute hand */}
      <motion.line
        x1="50"
        y1="50"
        x2="50"
        y2="20"
        stroke="#4A3428"
        strokeWidth="3"
        strokeLinecap="round"
        style={{
          transformOrigin: "50px 50px",
        }}
        animate={{
          rotate: minuteAngle,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Center dot */}
      <circle cx="50" cy="50" r="4" fill="#2C1810" />
    </svg>
  );
}
