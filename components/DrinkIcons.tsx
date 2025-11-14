/**
 * SVG Drink Icons
 *
 * Simple, clean coffee drink illustrations
 */

import type { DrinkType } from "@/lib/types";

interface DrinkIconProps {
  type: DrinkType;
  className?: string;
  animated?: boolean;
}

export function DrinkIcon({ type, className = "w-16 h-16", animated = false }: DrinkIconProps) {
  const icons: Record<DrinkType, JSX.Element> = {
    espresso: <EspressoIcon className={className} animated={animated} />,
    latte: <LatteIcon className={className} animated={animated} />,
    cappuccino: <CappuccinoIcon className={className} animated={animated} />,
    pourover: <PourOverIcon className={className} animated={animated} />,
    aeropress: <AeropressIcon className={className} animated={animated} />,
    mocha: <MochaIcon className={className} animated={animated} />,
    americano: <AmericanoIcon className={className} animated={animated} />,
    matcha: <MatchaIcon className={className} animated={animated} />,
  };

  return icons[type] || null;
}

// Espresso - Small demitasse cup
function EspressoIcon({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cup */}
      <path d="M20 25 L20 42 Q20 48 26 48 L38 48 Q44 48 44 42 L44 25 Z" fill="#8B4513" stroke="#5D2E0F" strokeWidth="2"/>
      {/* Coffee */}
      <ellipse cx="32" cy="26" rx="12" ry="3" fill="#3E2723"/>
      {/* Crema */}
      <ellipse cx="32" cy="26" rx="10" ry="2" fill="#D4A373" className={animated ? "animate-pulse" : ""}/>
      {/* Handle */}
      <path d="M44 28 Q50 28 50 34 Q50 40 44 40" stroke="#8B4513" strokeWidth="2" fill="none"/>
      {/* Saucer */}
      <ellipse cx="32" cy="50" rx="18" ry="3" fill="#C8A882" stroke="#8B6F47" strokeWidth="1"/>
    </svg>
  );
}

// Latte - Tall glass with layers
function LatteIcon({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Glass */}
      <path d="M22 15 L22 50 Q22 54 26 54 L38 54 Q42 54 42 50 L42 15 Z" fill="rgba(255,255,255,0.3)" stroke="#888" strokeWidth="2"/>
      {/* Coffee layer */}
      <rect x="22" y="35" width="20" height="15" fill="#5D4037" opacity="0.8"/>
      {/* Milk layer */}
      <rect x="22" y="20" width="20" height="15" fill="#F5E6D3" opacity="0.9"/>
      {/* Foam top */}
      <ellipse cx="32" cy="20" rx="10" ry="3" fill="#FFFFFF" className={animated ? "animate-pulse" : ""}/>
      {/* Latte art */}
      <path d="M32 22 Q28 24 32 26 Q36 24 32 22" fill="#8D6E63" opacity="0.6"/>
      {/* Steam */}
      {animated && (
        <>
          <path d="M28 12 Q27 8 28 6" stroke="#AAA" strokeWidth="1.5" opacity="0.6" className="animate-pulse" strokeLinecap="round"/>
          <path d="M32 10 Q31 6 32 4" stroke="#AAA" strokeWidth="1.5" opacity="0.6" className="animate-pulse" strokeLinecap="round" style={{animationDelay: "0.3s"}}/>
          <path d="M36 12 Q37 8 36 6" stroke="#AAA" strokeWidth="1.5" opacity="0.6" className="animate-pulse" strokeLinecap="round" style={{animationDelay: "0.6s"}}/>
        </>
      )}
    </svg>
  );
}

// Cappuccino - Cup with lots of foam
function CappuccinoIcon({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cup */}
      <path d="M18 25 L18 45 Q18 50 23 50 L41 50 Q46 50 46 45 L46 25 Z" fill="#D4A373" stroke="#8B6F47" strokeWidth="2"/>
      {/* Coffee */}
      <rect x="18" y="32" width="28" height="13" fill="#5D4037"/>
      {/* Foam - lots of it! */}
      <ellipse cx="32" cy="32" rx="14" ry="5" fill="#FFFFFF"/>
      <ellipse cx="32" cy="28" rx="12" ry="4" fill="#FAFAFA" className={animated ? "animate-pulse" : ""}/>
      <ellipse cx="32" cy="24" rx="10" ry="3" fill="#F5F5F5"/>
      {/* Cocoa powder */}
      <circle cx="28" cy="26" r="0.5" fill="#6D4C41" opacity="0.6"/>
      <circle cx="32" cy="25" r="0.5" fill="#6D4C41" opacity="0.6"/>
      <circle cx="36" cy="26" r="0.5" fill="#6D4C41" opacity="0.6"/>
      <circle cx="30" cy="28" r="0.5" fill="#6D4C41" opacity="0.6"/>
      <circle cx="34" cy="28" r="0.5" fill="#6D4C41" opacity="0.6"/>
      {/* Handle */}
      <path d="M46 30 Q52 30 52 36 Q52 42 46 42" stroke="#D4A373" strokeWidth="2" fill="none"/>
      {/* Saucer */}
      <ellipse cx="32" cy="52" rx="20" ry="3" fill="#C8A882" stroke="#8B6F47" strokeWidth="1"/>
    </svg>
  );
}

// Pour Over - V60 dripper
function PourOverIcon({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Server/carafe */}
      <path d="M24 35 L24 50 Q24 54 28 54 L36 54 Q40 54 40 50 L40 35" fill="rgba(139,69,19,0.3)" stroke="#5D4037" strokeWidth="1.5"/>
      {/* Coffee in server */}
      <path d="M24 40 L24 50 Q24 54 28 54 L36 54 Q40 54 40 50 L40 40 Z" fill="#3E2723" opacity="0.7"/>
      {/* Dripper cone */}
      <path d="M20 18 L32 32 L44 18 Z" fill="#E0E0E0" stroke="#999" strokeWidth="2"/>
      {/* Coffee grounds */}
      <path d="M24 20 L32 28 L40 20 Z" fill="#4E342E"/>
      {/* Ridges */}
      <line x1="26" y1="22" x2="31" y2="28" stroke="#AAA" strokeWidth="0.5"/>
      <line x1="30" y1="21" x2="32" y2="28" stroke="#AAA" strokeWidth="0.5"/>
      <line x1="34" y1="21" x2="33" y2="28" stroke="#AAA" strokeWidth="0.5"/>
      <line x1="38" y1="22" x2="33" y2="28" stroke="#AAA" strokeWidth="0.5"/>
      {/* Drip */}
      {animated && (
        <circle cx="32" cy="32" r="1.5" fill="#3E2723" className="animate-bounce" style={{animationDuration: "2s"}}/>
      )}
      {/* Water pouring */}
      {animated && (
        <path d="M28 10 Q28 12 28 14" stroke="#4FC3F7" strokeWidth="2" className="animate-pulse" strokeLinecap="round"/>
      )}
    </svg>
  );
}

// Aeropress - Plunger device
function AeropressIcon({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chamber */}
      <rect x="26" y="20" width="12" height="30" rx="2" fill="rgba(100,100,100,0.3)" stroke="#555" strokeWidth="2"/>
      {/* Coffee inside */}
      <rect x="27" y="35" width="10" height="14" fill="#3E2723" opacity="0.8"/>
      {/* Plunger */}
      <rect x="28" y="15" width="8" height="8" rx="1" fill="#666" stroke="#333" strokeWidth="1.5"/>
      <rect x="30" y="8" width="4" height="8" fill="#777"/>
      <circle cx="32" cy="7" r="3" fill="#888" stroke="#555" strokeWidth="1"/>
      {/* Filter cap */}
      <path d="M24 50 L26 52 L38 52 L40 50 Z" fill="#444" stroke="#222" strokeWidth="1"/>
      {/* Cup below */}
      <path d="M22 52 L22 56 Q22 58 25 58 L39 58 Q42 58 42 56 L42 52" fill="rgba(139,69,19,0.2)" stroke="#8B4513" strokeWidth="1.5"/>
      {/* Drip */}
      {animated && (
        <circle cx="32" cy="53" r="1" fill="#3E2723" className="animate-ping"/>
      )}
    </svg>
  );
}

// Mocha - Latte with whipped cream
function MochaIcon({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Glass */}
      <path d="M22 20 L22 50 Q22 54 26 54 L38 54 Q42 54 42 50 L42 20 Z" fill="rgba(255,255,255,0.3)" stroke="#888" strokeWidth="2"/>
      {/* Chocolate layer */}
      <rect x="22" y="40" width="20" height="10" fill="#3E2723" opacity="0.9"/>
      {/* Coffee layer */}
      <rect x="22" y="30" width="20" height="10" fill="#5D4037" opacity="0.8"/>
      {/* Milk layer */}
      <rect x="22" y="24" width="20" height="6" fill="#F5E6D3" opacity="0.9"/>
      {/* Whipped cream */}
      <ellipse cx="32" cy="22" rx="11" ry="4" fill="#FFFFFF"/>
      <ellipse cx="32" cy="18" rx="9" ry="3.5" fill="#FAFAFA" className={animated ? "animate-pulse" : ""}/>
      <ellipse cx="32" cy="15" rx="7" ry="3" fill="#FFFFFF"/>
      {/* Chocolate drizzle */}
      <path d="M28 16 Q30 17 32 16 Q34 15 36 16" stroke="#6D4C41" strokeWidth="1" fill="none"/>
      <path d="M29 18 Q31 19 33 18 Q35 17 35 18" stroke="#6D4C41" strokeWidth="1" fill="none"/>
    </svg>
  );
}

// Americano - Black coffee in mug
function AmericanoIcon({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mug */}
      <path d="M20 25 L20 48 Q20 52 24 52 L40 52 Q44 52 44 48 L44 25 Z" fill="#8B4513" stroke="#5D4037" strokeWidth="2"/>
      {/* Coffee */}
      <ellipse cx="32" cy="26" rx="12" ry="3" fill="#2C1810"/>
      <rect x="20" y="26" width="24" height="22" fill="#3E2723"/>
      {/* Handle */}
      <path d="M44 30 Q52 30 52 38 Q52 46 44 46" stroke="#8B4513" strokeWidth="2.5" fill="none"/>
      {/* Steam */}
      {animated && (
        <>
          <path d="M26 18 Q25 14 26 12" stroke="#AAA" strokeWidth="1.5" opacity="0.5" className="animate-pulse" strokeLinecap="round"/>
          <path d="M32 16 Q31 12 32 10" stroke="#AAA" strokeWidth="1.5" opacity="0.5" className="animate-pulse" strokeLinecap="round" style={{animationDelay: "0.4s"}}/>
          <path d="M38 18 Q39 14 38 12" stroke="#AAA" strokeWidth="1.5" opacity="0.5" className="animate-pulse" strokeLinecap="round" style={{animationDelay: "0.8s"}}/>
        </>
      )}
    </svg>
  );
}

// Matcha - Traditional bowl
function MatchaIcon({ className, animated }: { className?: string; animated?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bowl */}
      <path d="M18 30 Q18 50 32 52 Q46 50 46 30" fill="#E8DCC8" stroke="#C8B896" strokeWidth="2"/>
      <ellipse cx="32" cy="30" rx="14" ry="4" fill="#D4C4A8" stroke="#C8B896" strokeWidth="1.5"/>
      {/* Matcha */}
      <ellipse cx="32" cy="32" rx="12" ry="3" fill="#88B04B" className={animated ? "animate-pulse" : ""}/>
      <rect x="20" y="32" width="24" height="15" fill="#7A9F35" opacity="0.9"/>
      {/* Foam bubbles */}
      <circle cx="28" cy="33" r="1" fill="#A8D08D" opacity="0.7"/>
      <circle cx="32" cy="32" r="1.5" fill="#A8D08D" opacity="0.7"/>
      <circle cx="36" cy="33" r="1" fill="#A8D08D" opacity="0.7"/>
      <circle cx="30" cy="35" r="0.8" fill="#A8D08D" opacity="0.7"/>
      <circle cx="34" cy="35" r="0.8" fill="#A8D08D" opacity="0.7"/>
      {/* Whisk */}
      {animated && (
        <g opacity="0.4" className="animate-pulse">
          <line x1="32" y1="20" x2="32" y2="28" stroke="#8B7355" strokeWidth="1"/>
          <line x1="30" y1="28" x2="30" y2="32" stroke="#8B7355" strokeWidth="0.5"/>
          <line x1="32" y1="28" x2="32" y2="32" stroke="#8B7355" strokeWidth="0.5"/>
          <line x1="34" y1="28" x2="34" y2="32" stroke="#8B7355" strokeWidth="0.5"/>
        </g>
      )}
    </svg>
  );
}
