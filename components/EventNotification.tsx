import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameEvent } from "@/lib/types";

interface EventNotificationProps {
    event: GameEvent | null;
    onDismiss: () => void;
}

export function EventNotification({ event, onDismiss }: EventNotificationProps) {
    if (!event) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case "positive": return "✨";
            case "negative": return "⚠️";
            default: return "📢";
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case "positive": return "bg-green-100 border-green-300 text-green-900";
            case "negative": return "bg-red-100 border-red-300 text-red-900";
            default: return "bg-blue-100 border-blue-300 text-blue-900";
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-2 ${getColor(event.type)}`}
                >
                    <div className="p-6">
                        <div className="text-4xl mb-4 text-center">{getIcon(event.type)}</div>

                        <h2 className="text-2xl font-bold text-center mb-2">
                            {event.title}
                        </h2>

                        <p className="text-center text-lg opacity-90 mb-6 leading-relaxed">
                            {event.description}
                        </p>

                        {event.effects && (
                            <div className="bg-white/50 rounded-lg p-3 mb-6 text-sm">
                                {event.effects.money && (
                                    <div className="flex justify-between items-center">
                                        <span>Money</span>
                                        <span className={event.effects.money > 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                                            {event.effects.money > 0 ? "+" : ""}${event.effects.money}
                                        </span>
                                    </div>
                                )}
                                {event.effects.reputation && (
                                    <div className="flex justify-between items-center">
                                        <span>Reputation</span>
                                        <span className={event.effects.reputation > 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                                            {event.effects.reputation > 0 ? "+" : ""}{event.effects.reputation}
                                        </span>
                                    </div>
                                )}
                                {event.effects.inventory && Object.entries(event.effects.inventory).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center capitalize">
                                        <span>{key}</span>
                                        <span className={value && value > 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                                            {value && value > 0 ? "+" : ""}{value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={onDismiss}
                            className="w-full bg-white/80 hover:bg-white text-inherit font-bold py-3 px-6 rounded-xl transition-colors shadow-sm"
                        >
                            Continue
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
