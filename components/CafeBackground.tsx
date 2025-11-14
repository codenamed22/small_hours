/**
 * Cafe Background Scene
 *
 * Atmospheric cafe counter illustration with espresso machine, shelves, etc.
 */

import { motion } from "framer-motion";
import type { LightingData } from "@/lib/time-system";

interface CafeBackgroundProps {
  lighting?: LightingData;
}

export function CafeBackground({ lighting }: CafeBackgroundProps) {
  // Default lighting if none provided (afternoon)
  const colors = lighting || {
    skyColor: "#87CEEB",
    ambientColor: "#F5F5DC",
    shadowColor: "#D3D3D3",
    overlayColor: "#FFFFFF",
    overlayOpacity: 0.05,
  };

  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 800 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Background wall */}
      <rect width="800" height="400" fill="#E8D5C5" />

      {/* Window with sky */}
      <rect x="50" y="50" width="200" height="150" rx="8" fill={colors.skyColor} />
      <rect x="50" y="50" width="200" height="150" rx="8" fill="white" opacity="0.1" />
      {/* Window panes */}
      <line x1="150" y1="50" x2="150" y2="200" stroke="#8B7355" strokeWidth="4" />
      <line x1="50" y1="125" x2="250" y2="125" stroke="#8B7355" strokeWidth="4" />

      {/* Shelves on wall */}
      <g id="shelves">
        {/* Top shelf */}
        <rect x="500" y="80" width="250" height="8" fill="#6D5A3D" />
        {/* Coffee bags */}
        <rect x="520" y="50" width="30" height="30" fill="#8B4513" rx="2" />
        <rect x="560" y="50" width="30" height="30" fill="#A0522D" rx="2" />
        <rect x="600" y="50" width="30" height="30" fill="#8B4513" rx="2" />
        {/* Cups */}
        <circle cx="670" cy="70" r="8" fill="#D4A373" />
        <circle cx="690" cy="70" r="8" fill="#C8A882" />
        <circle cx="710" cy="70" r="8" fill="#D4A373" />

        {/* Bottom shelf */}
        <rect x="500" y="180" width="250" height="8" fill="#6D5A3D" />
        {/* Bottles/syrups */}
        <rect x="520" y="145" width="15" height="35" fill="#8B0000" rx="2" opacity="0.7" />
        <rect x="545" y="145" width="15" height="35" fill="#FFD700" rx="2" opacity="0.7" />
        <rect x="570" y="145" width="15" height="35" fill="#4B0082" rx="2" opacity="0.7" />
      </g>

      {/* Counter */}
      <rect x="0" y="300" width="800" height="100" fill="#8B6F47" />
      <rect x="0" y="295" width="800" height="10" fill="#6D5A3D" />

      {/* Espresso Machine */}
      <g id="espresso-machine" transform="translate(120, 200)">
        {/* Base */}
        <rect x="0" y="60" width="120" height="40" fill="#2C3E50" rx="4" />
        {/* Body */}
        <rect x="10" y="20" width="100" height="60" fill="#34495E" rx="6" />
        {/* Top */}
        <rect x="20" y="10" width="80" height="15" fill="#2C3E50" rx="3" />
        {/* Group head */}
        <rect x="35" y="80" width="50" height="15" fill="#1A252F" rx="2" />
        {/* Portafilter */}
        <ellipse cx="60" cy="95" rx="20" ry="5" fill="#4A3428" />
        <rect x="55" y="95" width="10" height="20" fill="#4A3428" />

        {/* Steam wand */}
        <rect x="95" y="40" width="4" height="40" fill="#888" />
        <rect x="90" y="78" width="14" height="6" fill="#888" rx="3" />

        {/* Buttons/lights */}
        <circle cx="40" cy="35" r="3" fill="#E74C3C" opacity="0.8" />
        <motion.circle
          cx="60" cy="35" r="3" fill="#2ECC71"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <circle cx="80" cy="35" r="3" fill="#3498DB" opacity="0.8" />

        {/* Steam effect */}
        <motion.path
          d="M97 35 Q95 30 97 25"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.4"
          strokeLinecap="round"
          animate={{ opacity: [0.2, 0.6, 0.2], y: [-2, 0, -2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M99 38 Q101 33 99 28"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.4"
          strokeLinecap="round"
          animate={{ opacity: [0.3, 0.7, 0.3], y: [-1, 1, -1] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
        />
      </g>

      {/* Grinder */}
      <g id="grinder" transform="translate(280, 220)">
        <rect x="0" y="40" width="70" height="60" fill="#34495E" rx="4" />
        <rect x="5" y="0" width="60" height="45" fill="#2C3E50" rx="4" />
        <circle cx="35" cy="20" r="15" fill="#555" />
        <circle cx="35" cy="20" r="10" fill="#333" />
      </g>

      {/* Cash register */}
      <g id="register" transform="translate(600, 230)">
        <rect x="0" y="40" width="80" height="30" fill="#2C3E50" rx="4" />
        <rect x="10" y="10" width="60" height="35" fill="#34495E" rx="6" />
        <rect x="15" y="15" width="50" height="20" fill="#1ABC9C" opacity="0.6" rx="2" />
      </g>

      {/* Menu board */}
      <g id="menu-board" transform="translate(320, 40)">
        <rect width="150" height="120" fill="#2C1810" rx="4" />
        {/* Chalk text lines (simplified) */}
        <line x1="20" y1="25" x2="130" y2="25" stroke="white" strokeWidth="2" opacity="0.8" />
        <line x1="20" y1="40" x2="100" y2="40" stroke="white" strokeWidth="1.5" opacity="0.6" />
        <line x1="20" y1="55" x2="120" y2="55" stroke="white" strokeWidth="1.5" opacity="0.6" />
        <line x1="20" y1="70" x2="90" y2="70" stroke="white" strokeWidth="1.5" opacity="0.6" />
        <line x1="20" y1="85" x2="110" y2="85" stroke="white" strokeWidth="1.5" opacity="0.6" />
        <line x1="20" y1="100" x2="95" y2="100" stroke="white" strokeWidth="1.5" opacity="0.6" />
      </g>

      {/* Plants for ambiance */}
      <g id="plant-left" transform="translate(30, 250)">
        <ellipse cx="15" cy="50" rx="15" ry="10" fill="#8B4513" />
        <path d="M10 40 Q5 30 8 20" fill="#228B22" />
        <path d="M15 45 Q12 35 15 25" fill="#2E8B57" />
        <path d="M20 40 Q25 30 22 20" fill="#228B22" />
      </g>

      {/* Pastry display case */}
      <g id="pastry-case" transform="translate(450, 250)">
        <rect x="0" y="20" width="100" height="50" fill="#D4A373" />
        <rect x="5" y="15" width="90" height="50" fill="rgba(200,200,255,0.3)" rx="4" />
        {/* Pastries inside */}
        <circle cx="25" cy="50" r="8" fill="#D2691E" />
        <circle cx="50" cy="50" r="8" fill="#F4A460" />
        <circle cx="75" cy="50" r="8" fill="#D2691E" />
      </g>

      {/* Ambient lighting overlay */}
      <rect width="800" height="400" fill={colors.overlayColor} opacity={colors.overlayOpacity} />

      {/* Shadow/depth at counter edge */}
      <rect x="0" y="290" width="800" height="10" fill={colors.shadowColor} opacity="0.2" />
    </svg>
  );
}

/**
 * Simplified background for behind customer card
 */
export function CafeCounterSimple() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden opacity-30">
      <svg
        className="w-full h-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Wood grain pattern */}
        <defs>
          <pattern id="wood" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="#8B6F47" />
            <path d="M0 20 Q50 25 100 20" stroke="#6D5A3D" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M0 50 Q50 45 100 50" stroke="#6D5A3D" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M0 80 Q50 85 100 80" stroke="#6D5A3D" strokeWidth="1" fill="none" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#wood)" />
      </svg>
    </div>
  );
}
