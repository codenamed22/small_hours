# Changelog

All notable changes to Small Hours will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Events system (random and scheduled events during service)
- Goals and achievements tracking
- Reputation system with unlocks
- Allergen safety system
- Additional tests for new systems

## [0.4.0] - 2025-11-14

### Added - Equipment Progression System
- **Equipment Shop**: Beautiful modal UI accessible during prep phase
- **4 Equipment Categories**: Espresso machines, grinders, milk steamers, brewing stations
- **3 Tiers per Category**: Basic (free) → Professional ($150-$300) → Commercial ($400-$800)
- **Quality Bonuses**: Equipment provides +5 to +10 quality bonuses to brewed drinks
- **12 Total Upgrades**: Strategic progression path for players
- **Equipment Persistence**: Save/load equipment state with game
- **Purchase Flow**: Validation, affordability checking, confirmation

### Changed - Temperature System Overhaul
- **Metric System**: Converted all temperatures from Fahrenheit to Celsius
- **8 Drink Recipes**: Updated all ideal temperatures and tolerances
- **UI Sliders**: Water temp (77-100°C), milk temp (49-82°C)
- **Validation Ranges**: Updated to match Celsius ranges
- **Help Dialog**: All recipe guides now show Celsius

### Fixed
- **Help Dialog**: Restored recipe guide access with proper positioning
- **Temperature Validation**: Fixed range errors after Celsius conversion
- **Equipment Integration**: Brewing engine now applies equipment bonuses correctly

### Technical
- Created `lib/equipment.ts` (425 lines) - Equipment system core
- Created `components/ShopModal.tsx` (385 lines) - Shop UI
- Updated `lib/persistence.ts` - Equipment save/load
- Updated `lib/types.ts` - Equipment interfaces
- Updated `lib/game-engine.ts` - Equipment bonus integration

## [0.3.0] - 2025-11-13

### Added - Full Café Simulator
- **Customer Memory System**: 5 relationship levels (stranger → regular → favorite)
- **Customer Preferences**: Track favorite drinks, milk types, satisfaction
- **Visit History**: Complete tracking of past orders and quality
- **Relationship Progression**: Customers remember quality and return more often
- **Regulars**: Better tips and patience for favorite customers

### Added - Day Structure
- **3 Day Phases**: Prep (restock/planning) → Service (customers) → Debrief (review)
- **Performance Tracking**: Customers served, earnings, quality average
- **Daily Goals**: Target customer count increases with day number
- **Restock System**: Inventory restocking with scaling costs
- **Day Summary**: Performance review with stats and progression

### Added - Core Systems
- **Queue & Ticketing**: Order queue management with ticket tracking
- **Save/Load**: LocalStorage persistence with Map serialization
- **Time System**: Dynamic time of day with lighting effects
- **Audit Logging**: Development tools for debugging

### Technical
- Created `lib/customer-memory.ts` (340 lines)
- Created `lib/day-structure.ts` (280 lines)
- Created `lib/ticketing.ts` (215 lines)
- Created `lib/persistence.ts` (289 lines)
- Created `lib/time-system.ts` (150 lines)

## [0.2.0] - 2025-11-11

### Added - LLM Integration
- **Dynamic Customers**: LLM-powered customer generation with unique personalities
- **Natural Language Orders**: Customers order drinks in natural language
- **Personality System**: Different moods, time constraints, and behaviors
- **Order Processing**: LLM parses natural language to drink types
- **API Routes**: `/api/generate-customer` and `/api/process-order`

### Added - Expanded Drinks
- **8 Drink Types**: Added Mocha, Americano, Matcha to existing 5 drinks
- **Recipe Complexity**: Unique parameters and tolerances per drink
- **Dynamic UI**: Controls adapt to drink requirements

### Added - Inventory System
- **Stock Tracking**: Beans (grams), milk (ml), syrups (ml), food items
- **Stock Depletion**: Automatic deduction when brewing
- **Low Stock Warnings**: Alerts when running low
- **Restock Interface**: Purchase ingredients during prep phase
- **Stock Validation**: Cannot brew without sufficient ingredients

### Technical
- Created `lib/inventory.ts` (306 lines)
- Created `lib/inventory.test.ts` (402 lines) - 30 tests
- Created `app/api/generate-customer/route.ts`
- Created `app/api/process-order/route.ts`
- Created `components/CompactInventory.tsx`

## [0.1.0] - 2025-11-10

### Added - Foundation
- **Brewing Engine**: Rule-based quality scoring system
- **5 Initial Drinks**: Espresso, Latte, Cappuccino, Pour Over, Aeropress
- **Quality Scoring**: Tolerance-based scoring (0-100) with component breakdown
- **Brewing Parameters**: Grind size, temperature, time, milk options
- **Dynamic UI**: Controls change based on drink type
- **Testing Framework**: Vitest setup with 77 passing tests

### Added - Components
- **Beautiful UI**: Tailwind CSS with gradient backgrounds
- **Brewing Animation**: Stage-based animation system
- **Customer Avatars**: Visual representation of customers
- **Particle Effects**: Confetti, floating money, steam effects
- **Responsive Design**: Works on desktop and mobile

### Technical
- **Framework**: Next.js 16.0.1 with Turbopack
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 24.11.0 LTS
- **Testing**: Vitest with 77 tests passing
- **LLM**: OpenRouter integration (Kimi K2)

### Technical Files
- `lib/game-engine.ts` (415 lines) - Core brewing engine
- `lib/recipes.ts` (510 lines) - Drink recipes and parameters
- `lib/scoring.ts` (96 lines) - Scoring algorithms
- `lib/types.ts` (230 lines) - TypeScript definitions
- `lib/scoring.test.ts` (188 lines) - 17 tests
- `lib/game-engine.test.ts` (392 lines) - 30 tests

## [0.0.1] - 2025-11-09

### Added
- Project initialization
- Next.js scaffolding
- TypeScript configuration
- Basic UI shell

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes, major feature releases
- **Minor (0.X.0)**: New features, non-breaking changes
- **Patch (0.0.X)**: Bug fixes, small improvements

## Links

- [Repository](https://github.com/anthropics/small_hours)
- [Issues](https://github.com/anthropics/small_hours/issues)
- [Documentation](./README.md)
