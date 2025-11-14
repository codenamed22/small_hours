/**
 * Customer Reaction Component
 *
 * Shows customer's animated reaction to the drink quality
 * - Poor (0-69): Disappointed reaction
 * - Average (70-84): Satisfied but not impressed
 * - Great (85-94): Happy and pleased
 * - Perfect (95-100): Absolutely delighted
 */

import { motion, AnimatePresence } from "framer-motion";
import { CustomerAvatar } from "./CustomerAvatar";
import type { Mood } from "./CustomerAvatar";

type ReactionLevel = "poor" | "average" | "great" | "perfect";

interface CustomerReactionProps {
  quality: number; // 0-100
  customerName: string;
  show: boolean;
  onComplete?: () => void;
}

function getReactionLevel(quality: number): ReactionLevel {
  if (quality < 70) return "poor";
  if (quality < 85) return "average";
  if (quality < 95) return "great";
  return "perfect";
}

function getReactionData(level: ReactionLevel) {
  const reactions = {
    poor: {
      mood: "stressed" as Mood,
      emoji: "😕",
      thoughts: ["Not quite right...", "This isn't what I expected", "Hmm..."],
      feedback: "tries to smile politely but looks disappointed",
    },
    average: {
      mood: "neutral" as Mood,
      emoji: "😊",
      thoughts: ["Not bad", "It's alright", "Could be better"],
      feedback: "takes a sip and nods politely",
    },
    great: {
      mood: "happy" as Mood,
      emoji: "😄",
      thoughts: ["This is really good!", "Perfect!", "Delicious!"],
      feedback: "smiles warmly after the first sip",
    },
    perfect: {
      mood: "happy" as Mood,
      emoji: "🤩",
      thoughts: ["This is AMAZING!", "Best coffee ever!", "Absolutely perfect!"],
      feedback: "eyes light up with pure joy",
    },
  };

  return reactions[level];
}

export function CustomerReaction({
  quality,
  customerName,
  show,
  onComplete,
}: CustomerReactionProps) {
  const level = getReactionLevel(quality);
  const reaction = getReactionData(level);

  // Random thought from the pool
  const thought = reaction.thoughts[Math.floor(Math.random() * reaction.thoughts.length)];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={() => {
            // Call onComplete after animations finish
            setTimeout(() => onComplete?.(), 2500);
          }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-xl p-3 border-2 border-blue-200"
        >
          <div className="flex items-center gap-3 mb-2">
            {/* Customer Avatar with Drinking Animation */}
            <motion.div
              animate={{
                y: [0, -5, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: 2,
                ease: "easeInOut",
              }}
            >
              <CustomerAvatar mood={reaction.mood} className="w-12 h-12" animated={true} />
            </motion.div>

            <div className="flex-1">
              <div className="font-bold text-gray-800 mb-0.5 text-sm">{customerName}</div>
              <div className="text-xs text-gray-600 italic">{reaction.feedback}</div>
            </div>
          </div>

          {/* Thought Bubble */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="relative bg-white rounded-xl p-2 shadow-md"
          >
            {/* Bubble tail */}
            <div className="absolute -top-3 left-8 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white" />

            <div className="flex items-center gap-2">
              {/* Emoji Reaction */}
              <motion.div
                className="text-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.8,
                  repeat: 1,
                }}
              >
                {reaction.emoji}
              </motion.div>

              {/* Thought Text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm font-semibold text-gray-700"
              >
                "{thought}"
              </motion.div>
            </div>

            {/* Quality-specific effects */}
            {level === "perfect" && (
              <motion.div
                className="mt-1 flex gap-1 justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {["✨", "⭐", "💫"].map((star, i) => (
                  <motion.span
                    key={i}
                    animate={{
                      y: [-2, 2, -2],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    {star}
                  </motion.span>
                ))}
              </motion.div>
            )}

            {level === "poor" && (
              <motion.div
                className="mt-2 text-xs text-gray-500 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                (Maybe I'll try somewhere else next time...)
              </motion.div>
            )}
          </motion.div>

          {/* Sipping Steam Effect for hot drinks */}
          <div className="relative mt-4">
            <motion.div
              className="text-center text-sm text-gray-500"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              *sip* *sip*
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Mini version - just the emoji reaction (for compact spaces)
 */
export function QuickReaction({ quality }: { quality: number }) {
  const level = getReactionLevel(quality);
  const reaction = getReactionData(level);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="text-6xl"
    >
      {reaction.emoji}
    </motion.div>
  );
}
