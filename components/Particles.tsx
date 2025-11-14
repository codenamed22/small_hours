/**
 * Particle Effects Component
 *
 * Creates celebratory particles for excellent brews and special moments
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  rotation: number;
  scale: number;
}

interface ParticlesProps {
  trigger: boolean;
  type?: "stars" | "hearts" | "sparkles" | "money";
  count?: number;
}

const EMOJI_MAP = {
  stars: ["⭐", "✨", "🌟"],
  hearts: ["❤️", "💕", "💖"],
  sparkles: ["✨", "💫", "⚡"],
  money: ["💰", "💵", "🪙"],
};

export function Particles({ trigger, type = "stars", count = 15 }: ParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const emojis = EMOJI_MAP[type];

  useEffect(() => {
    if (trigger) {
      // Generate random particles
      const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100 - 50, // -50 to 50
        y: Math.random() * 100 - 50,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }));

      setParticles(newParticles);

      // Clear particles after animation
      const timeout = setTimeout(() => {
        setParticles([]);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [trigger, count, emojis]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute text-2xl"
            style={{
              left: "50%",
              top: "50%",
            }}
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              x: particle.x * 3,
              y: particle.y * 3,
              scale: particle.scale,
              rotate: particle.rotation,
              opacity: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
            }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Confetti Effect - raining particles from top
 */
interface ConfettiProps {
  active: boolean;
  count?: number;
}

export function Confetti({ active, count = 30 }: ConfettiProps) {
  const [pieces, setPieces] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      const newPieces: Particle[] = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: -10,
        emoji: ["🎉", "🎊", "✨", "⭐"][Math.floor(Math.random() * 4)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }));

      setPieces(newPieces);

      const timeout = setTimeout(() => {
        setPieces([]);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [active, count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece, index) => (
          <motion.div
            key={piece.id}
            className="absolute text-xl"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
            }}
            initial={{
              y: -20,
              rotate: 0,
              opacity: 1,
            }}
            animate={{
              y: 120,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
              opacity: [1, 1, 0.5, 0],
            }}
            transition={{
              duration: 2 + Math.random(),
              delay: index * 0.05,
              ease: "easeIn",
            }}
          >
            {piece.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Floating Money Effect - coins floating up
 */
interface FloatingMoneyProps {
  amount: number;
  trigger: boolean;
}

export function FloatingMoney({ amount, trigger }: FloatingMoneyProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timeout = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -60 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          <div className="text-4xl font-bold text-green-500">
            +${amount.toFixed(2)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
