# Small Hours - Current Status & Critical Analysis

**Last Updated:** 2025-11-10
**Current Phase:** Phase 1 (Partial) - Enhanced Brewing Mechanics
**Node Version:** 24.11.0 LTS
**Next.js Version:** 16.0.1

---

## Executive Summary

**What Works:** Production-grade rule engine with 5 drink types, clean modular architecture, working game loop with brewing mechanics, LLM integration tested.

**Critical Gaps:** No tests, no actual LLM integration in game, missing core features from Phase 0/1 plan (inventory, ticketing, customers with memory, money management), architecture diverged significantly from design document.

**Status:** We built a **brewing simulator** when the plan calls for a **café management sim**. The brewing engine is excellent, but it's only one piece of the puzzle.

---

## Critical Analysis

### ✅ What's Excellent

1. **Rule Engine Architecture (lib/game-engine.ts, recipes.ts, scoring.ts, types.ts)**
   - Clean separation of concerns
   - Production-grade validation (weights sum to 1.0, parameter ranges)
   - Pure functions, no side effects, fully testable
   - Modular and configurable - can add new drinks by editing recipes.ts
   - Proper TypeScript with no `any` types
   - Module-level validation catches errors at load time

2. **Brewing Mechanics**
   - 5 drink types (espresso, latte, cappuccino, pourover, aeropress)
   - Conditional parameters (milk for espresso-based, bloom time for pourover)
   - Tolerance-based scoring (75-100 within tolerance, decay outside)
   - Categorical grind size scoring
   - Quality breakdown by component
   - UI dynamically shows/hides controls based on drink type

3. **Code Quality**
   - No TypeScript errors
   - Clean imports and dependencies
   - Good documentation in code
   - Semantic constants (no magic numbers)

### ⚠️ What's Problematic

1. **No Tests (CRITICAL)**
   ```bash
   $ find . -name "*.test.*" | grep -v node_modules
   # (empty)
   ```
   - Plan calls for unit tests in Phase 0 exit criteria
   - No tests for rule engine, scoring, validation
   - No tests for LLM parsing, allergen gates
   - Cannot verify correctness beyond manual testing
   - **Impact:** Can't refactor safely, bugs could slip through

2. **Architecture Divergence from Plan (CRITICAL)**

   **Plan Specifies:**
   - LLM agents for customers with personas and memory
   - Tool-based API: `parse_order()`, `price_quote()`, `create_ticket()`, `brew()`, `deliver()`
   - Inventory system with stock checks
   - Ticketing system with queue management
   - Money/cash flow tracking
   - Satisfaction scoring based on accuracy + friendliness + speed
   - Reviews and reputation system

   **What We Have:**
   - Static customer (always "Alex", no memory, no personality)
   - Direct brewing without tickets or queue
   - No inventory system
   - Money increments but no COGS, no pricing logic
   - Quality scoring only (no friendliness/speed factors)
   - No reviews or reputation
   - LLM exists but NOT integrated into game loop

   **Impact:** We have a brewing practice tool, not a café simulator

3. **LLM Integration Disconnected (CRITICAL)**
   - `lib/llm.ts` has customer greeting/reaction functions
   - Test page (`app/page.tsx`) verifies LLM works
   - **But**: Game page (`app/game/page.tsx`) doesn't use LLM at all
   - Customers are hardcoded, no natural language
   - Missing the core "emergent people" pillar from design
   - **Impact:** No narrative, no personality, no replayability

4. **Missing Core Systems**
   - ❌ Inventory management (beans, milk, syrups, pastries)
   - ❌ Ticketing system (queue, prep time, station bottlenecks)
   - ❌ Order parsing (`parse_order` tool)
   - ❌ Pricing system (COGS, margins, profitability)
   - ❌ Reputation/reviews
   - ❌ Time pressure / rush mechanics
   - ❌ Allergen system (critical safety feature per plan)
   - ❌ Save/load persistence
   - ❌ Memory system for regulars

5. **Game State Issues**
   - `GameState` in types.ts has: customer, brewParams, result, money, drinksServed
   - Plan calls for: day, mode, cash, reputation, queue, tickets, inventory, menu, customers, events
   - **Gap:** Missing 70% of planned state structure
   - No progression (days, upgrades, unlocks)
   - No failure states (out of stock, bankruptcy)

6. **Data Model Mismatch**
   - Plan specifies `OrderItem` with SKU, size, temp, mods
   - We have `BrewParameters` directly (grind, temp, time)
   - Missing abstraction layer between "what customer orders" and "how to brew it"
   - **Impact:** Can't do substitutions, upsells, or order variations

### 🤔 What's Questionable

1. **Customer Data Hardcoded in Two Places**
   ```typescript
   // lib/recipes.ts
   export const CUSTOMER_ORDERS = { ... }

   // lib/game-engine.ts
   export function createStaticCustomer() {
     const drinks: Record<DrinkType, { order: string; payment: number }> = { ... }
   }
   ```
   - Duplication risk
   - Should be in single source of truth

2. **No Error Handling**
   - `brewDrink()` validates inputs but doesn't gracefully handle errors in UI
   - No try/catch blocks in game page
   - What if `getDefaultParameters()` fails?

3. **Missing Accessibility Features**
   - Plan calls for: color-blind safe icons, remappable keys, slow-mode toggle, text-only mode
   - Currently: none of these exist
   - **Impact:** Not accessible to all players

4. **No Telemetry/Analytics**
   - Plan requires tracking: wait times, accuracy distribution, tips, session length
   - Currently: none
   - **Impact:** Can't balance game or measure engagement

---

## File Inventory

### Core Game Logic ✅
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `lib/types.ts` | 107 | ✅ Good | All shared types, clean |
| `lib/scoring.ts` | 96 | ✅ Good | Scoring logic isolated |
| `lib/recipes.ts` | 390 | ✅ Good | 5 drinks, configurable |
| `lib/game-engine.ts` | 329 | ✅ Good | Clean engine, validation |
| `lib/llm.ts` | 122 | ⚠️ Unused | Not integrated in game |

### UI Pages ⚠️
| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `app/page.tsx` | 200 | ⚠️ Test Only | LLM test, not game flow |
| `app/game/page.tsx` | 496 | ⚠️ Incomplete | Brewing only, no systems |
| `app/layout.tsx` | - | ✅ Good | Standard layout |
| `app/api/test-llm/route.ts` | - | ⚠️ Test Only | Not used in game |

### Missing Critical Files ❌
- `lib/inventory.ts` - Stock management
- `lib/orders.ts` - Order parsing and tickets
- `lib/pricing.ts` - Cost/revenue calculations
- `lib/persistence.ts` - Save/load
- `lib/memory.ts` - Customer memory store
- `__tests__/**/*.test.ts` - Any tests at all
- `lib/validation.ts` - Input sanitization

---

## Phase Completion Assessment

### Phase 0 - Foundations ⚠️ PARTIAL (50%)

**Exit Criteria Status:**
| Criterion | Status | Evidence |
|-----------|--------|----------|
| ✅ Complete one short day end-to-end | ❌ No | Can brew drinks, but no day structure, prep, debrief |
| ✅ Allergen tests pass 100% | ❌ No | No allergen system exists |
| ✅ LLM never mutates state without tools | ⚠️ N/A | LLM not integrated, so technically passes (vacuously) |
| ✅ Deterministic sim core with tests | ⚠️ Partial | Engine is deterministic, but NO TESTS |
| ✅ Tooling API wired with function calling | ❌ No | No tools implemented (parse_order, price_quote, etc.) |
| ✅ Seeded RNG | ❌ No | No RNG implemented |
| ✅ Audit log of tool calls | ❌ No | No audit mechanism |

**What We Have:**
- ✅ Brewing engine (excellent)
- ✅ LLM integration (OpenRouter with Kimi K2)
- ✅ Basic web UI
- ✅ Money counter

**What's Missing:**
- ❌ Tickets, timers, inventory
- ❌ Allergen system
- ❌ Function calling tools
- ❌ Tests
- ❌ Save/load
- ❌ Audit log

**Assessment:** Phase 0 is NOT complete. We have a beautiful brewing engine but none of the systems integration.

### Phase 1 - Text MVP ❌ NOT STARTED

**Exit Criteria Status:**
| Criterion | Status |
|-----------|--------|
| 5 customer personas with memory | ❌ No |
| 8 drinks + 4 foods | ⚠️ Partial (5 drinks, 0 foods) |
| Price quote, substitutions, refunds | ❌ No |
| End-of-day summary | ❌ No |
| Nightly memory summarization | ❌ No |
| Unit tests for parse/order, price, allergen, timers | ❌ No |
| ≥80% playtesters complete a day unaided | ❌ Can't measure |
| Ratings correlate with accuracy+wait+friendliness (r ≥ 0.8) | ❌ No wait/friendliness |
| Crash-free sessions across 50 runs | ⚠️ Unknown (no testing) |

**Assessment:** Phase 1 hasn't started. We're still in Phase 0.

---

## What Should Happen Next

### Immediate Priorities (in order)

1. **Add Tests (Week 1)**
   ```bash
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
   ```
   - Write tests for scoring functions (calculateToleranceScore, scoreGrindSize)
   - Write tests for rule evaluation
   - Write tests for weight validation
   - Write tests for parameter validation
   - Target: 80%+ coverage of lib/

2. **Complete Phase 0 Systems (Week 2-3)**
   - Implement inventory system:
     ```typescript
     interface Inventory {
       beans: { name: string; grams: number; roast_date: string }[];
       milks: Record<MilkType, number>; // ml
       syrups: Record<string, number>; // ml
     }
     ```
   - Implement ticketing:
     ```typescript
     interface Ticket {
       id: string;
       customer_id: string;
       drinkType: DrinkType;
       params: BrewParameters;
       status: "queued" | "brewing" | "ready" | "delivered";
     }
     ```
   - Implement allergen system (CRITICAL for safety)
   - Implement tool-based API (parse_order, price_quote, create_ticket)
   - Wire LLM into game loop with function calling
   - Add save/load

3. **Integrate LLM Properly (Week 4)**
   - Create customer personas (5 archetypes)
   - Implement memory system (key-value + recent orders)
   - Connect `lib/llm.ts` to game page
   - Implement natural order parsing
   - Add customer reactions to drink quality

4. **Add Progression (Week 5)**
   - Day structure (prep → service → debrief)
   - Money management (COGS, revenue, profitability)
   - Reputation system
   - End-of-day review
   - Simple upgrades

### Strategic Decisions Needed

1. **Scope Question:** Should we:
   - A) Complete Phase 0/1 properly per the plan (café sim)
   - B) Polish current brewing mechanics into standalone training tool
   - C) Hybrid: Keep brewing engine, bolt on minimal café systems

   **Recommendation:** Option A. The plan is solid, and we have excellent foundations.

2. **Testing Strategy:**
   - Add Vitest for unit tests
   - Add Playwright/Cypress for E2E tests
   - CI/CD with GitHub Actions

3. **LLM Integration:**
   - Keep current direct LLM calls (simple)
   - OR use LangChain for tool orchestration (complex but powerful)
   - **Recommendation:** Start simple, migrate to LangChain if needed

---

## Risk Assessment

### High Risk ❗
1. **No Tests** - Can't refactor safely, bugs accumulate
2. **Architecture Drift** - Further from plan with each feature
3. **LLM Disconnect** - Core differentiator not integrated

### Medium Risk ⚠️
1. **Scope Creep** - Brewing is polished, other systems neglected
2. **Technical Debt** - Hardcoded data, duplicated logic
3. **Accessibility** - Not building with accessibility from start

### Low Risk ✅
1. **Code Quality** - TypeScript, clean modules, good patterns
2. **Build System** - Next.js, Turbopack working well
3. **Performance** - Fast compilation, no performance issues

---

## Recommendations

### Do This Now
1. ✅ **Write tests** - Start with scoring.ts, then game-engine.ts
2. ✅ **Complete Phase 0** - Implement inventory, tickets, tools
3. ✅ **Integrate LLM** - Get customers talking naturally
4. ✅ **Add allergen system** - Critical safety feature

### Do This Soon
1. **Refactor customer data** - Single source of truth
2. **Add error handling** - Try/catch, graceful failures
3. **Implement save/load** - LocalStorage for now
4. **Add telemetry** - Track key metrics

### Do This Later
1. **Accessibility** - Color-blind mode, keyboard shortcuts
2. **Advanced features** - Staff, events, co-op
3. **Polish** - Animations, sound, juice

### Don't Do
1. ❌ Add more drink types (5 is enough for Phase 0/1)
2. ❌ Polish UI before core systems work
3. ❌ Optimize performance (it's already fast)
4. ❌ Add multiplayer (Phase 4 stretch goal)

---

## Key Metrics

### Current State
- **Lines of Code:** ~1,440 (lib + app)
- **Test Coverage:** 0%
- **TypeScript Errors:** 0
- **Build Time:** <1s (Turbopack)
- **Phase Completion:** Phase 0 at 50%, Phase 1 at 0%

### Target State (Phase 0 Complete)
- **Lines of Code:** ~3,000 (estimate)
- **Test Coverage:** ≥80% for lib/
- **TypeScript Errors:** 0
- **Systems Implemented:** 8/8 core systems
- **Phase Completion:** Phase 0 at 100%

---

## Conclusion

**What we built:** A beautiful, production-grade brewing engine with excellent architecture and clean code.

**What we need:** Inventory, ticketing, LLM integration, customers, money management, allergens, tests, and save/load to make it a café simulator.

**The good news:** The hardest part (rule engine) is done and done right. The architecture is solid. We can build on this foundation.

**The path forward:** Complete Phase 0 properly before adding more features. Write tests. Integrate LLM. Add the missing systems. Then polish.

**Estimated time to Phase 0 complete:** 3-4 weeks of focused work.

**Estimated time to Phase 1 complete:** 2-3 additional weeks.

---

## Next Session Tasks

1. Set up Vitest and write first tests for scoring.ts
2. Design inventory system schema
3. Implement `parse_order` function with LLM
4. Create customer persona templates
5. Wire LLM into game loop

**Focus:** Tests, Inventory, LLM Integration (in that order)
