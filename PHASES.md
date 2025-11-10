# Coffee Shop Simulator - Development Phases

**Project:** Small Hours
**Last Updated:** 2025-11-10

---

## Phase 0: Foundation & Proof of Concept ⚡
**Timeline:** ~1-2 weeks
**Goal:** Validate tech stack and get something running

### Deliverables
- Project scaffolding (TypeScript + chosen framework)
- Basic UI shell (main screen, placeholder components)
- Simple state management setup
- LLM API integration test (one simple call/response)

### Exit Criteria
✓ Can render UI and make one successful LLM call
✓ Project builds without errors
✓ Development environment is set up and documented

**Why start here:** De-risk the technical unknowns before building gameplay.

---

## Phase 1: Minimal Craft Loop ☕
**Timeline:** ~2-3 weeks
**Goal:** One playable drink-making cycle with deterministic scoring

### Deliverables
- **One drink type** (e.g., drip coffee or espresso)
- **Deterministic brewing mechanics:**
  - 2-3 variables (grind, temperature, timing)
  - Simple scoring algorithm (→ quality score 0-100)
  - Visual feedback for player actions
- **Static "customer"** (text-only, no LLM)
  - Hardcoded order: "One coffee, please"
  - Shows drink quality score
  - Fixed payment (e.g., $3)
- **Turn-based** (no timer yet)

### Exit Criteria
✓ Can brew one drink, see score, get paid
✓ Scoring is deterministic and understandable
✓ Basic game loop is playable

**Why this first:** Proves the core craft loop before adding complexity.

---

## Phase 2: Basic Economy Loop 💰
**Timeline:** ~1-2 weeks
**Goal:** Add inventory, money, and day structure

### Deliverables
- **Inventory system:**
  - Track beans, milk (if added second drink)
  - Deduct ingredients on brew
- **Money tracking:**
  - Revenue from sales
  - Pay for restocking
- **Day cycle:**
  - Prep phase: buy ingredients
  - Service phase: serve N customers (e.g., 5 static orders)
  - Debrief: show revenue, costs, profit

### Exit Criteria
✓ Can play through 3 days, go bankrupt if you mismanage
✓ Economy feels balanced and meaningful
✓ Clear feedback on financial performance

**Why here:** Establishes the management layer while still simple.

---

## Phase 3: LLM Characters (Simple) 💬
**Timeline:** ~2-3 weeks
**Goal:** Replace static customers with LLM-powered NPCs

### Deliverables
- **3-5 simple characters** (hardcoded personalities, no long-term memory yet)
- **LLM-generated dialogue:**
  - Greetings
  - Reactions to drink quality (good/bad/perfect)
  - Farewell
- **Fixed menu** (customer still orders from set list, no NL parsing)
- **Mood system stub** (just track satisfaction)

### Exit Criteria
✓ Customers feel distinct and respond dynamically
✓ LLM costs and latency are acceptable
✓ Conversation quality meets expectations

**Why now:** LLM adds flavor without complexity; test costs and latency with real gameplay.

---

## Phase 4: Time Pressure & Queue ⏱️
**Timeline:** ~2 weeks
**Goal:** Add urgency and multi-tasking

### Deliverables
- **Timer system:**
  - Each customer has patience meter
  - Service window has time limit
- **Queue mechanics:**
  - 2-3 customers waiting simultaneously
  - Player must triage (who to serve first)
- **Consequences:**
  - Customer leaves if too slow → lost sale
  - Rushed drinks → lower quality → bad reviews

### Exit Criteria
✓ Pressure feels real; success requires skill and strategy
✓ Queue management is intuitive
✓ Difficulty curve is appropriate

**Why here:** Now the core gameplay loop is engaging and challenging.

---

## Phase 5: Expanded Craft System 🎨
**Timeline:** ~3-4 weeks
**Goal:** More drinks, more complexity, more mastery

### Deliverables
- **5-10 drink types** (espresso, latte, pour-over, cold brew, etc.)
- **More brewing variables:**
  - Water ratios, bloom time, pressure, milk frothing
  - Different recipes per drink type
- **"Specials" system:**
  - Player can create custom drinks
  - Pricing flexibility
- **Ingredient variety:**
  - Multiple bean origins
  - Alternative milks, syrups

### Exit Criteria
✓ Crafting feels deep; skilled players can consistently score 90+
✓ Each drink type has distinct mechanics
✓ Mastery is rewarding

**Why here:** With economy and pressure working, depth keeps players engaged.

---

## Phase 6: Rich Narrative Layer 📖
**Timeline:** ~4-5 weeks
**Goal:** Story mode and emergent character arcs

### Deliverables
- **Natural language order parsing:**
  - LLM interprets "Can I get something strong and sweet?" → suggests Mocha
  - `parse_order` and `confirm_order` flow
- **Character memory:**
  - Track preferences, past interactions, story beats
  - Vector DB or simple tagged KV store
- **3-5 story chapters:**
  - Recurring characters with arcs
  - Neighborhood events (festival, construction, etc.)
  - Unlocks tied to story progression
- **Relationship system:**
  - Regulars vs. new customers
  - Reputation affects who shows up

### Exit Criteria
✓ Story mode playable start-to-finish (2-3 hours)
✓ Characters feel alive with memory and growth
✓ Natural language ordering works reliably

**Why here:** With all core systems working, narrative can shine.

---

## Phase 7: Additional Modes & Polish ✨
**Timeline:** ~3-4 weeks
**Goal:** Replayability and production quality

### Deliverables
- **Endless Rush mode:**
  - Procedural customer generation
  - Difficulty scaling
  - Leaderboards (local or online)
  - Mutators (modifiers like "all orders are decaf")
- **Sandbox mode:**
  - No pressure, creative menu design
  - Experiment with recipes
- **UI/UX polish:**
  - Animations, SFX, music
  - Onboarding tutorial
  - Settings and accessibility
- **Balancing pass:**
  - Tune economy, difficulty curves, progression

### Exit Criteria
✓ Game feels complete and polished
✓ Multiple modes provide replayability
✓ Onboarding is smooth for new players

---

## Phase 8: Advanced Features (Stretch) 🚀
**Timeline:** ~4-6 weeks
**Goal:** Differentiation and community features

### Deliverables
- **Co-op mode:**
  - Split roles (chat/register vs. brewing)
  - Local or online multiplayer
- **Modding support:**
  - Custom drinks, characters, events
- **Additional content:**
  - More chapters, more characters
  - Seasonal events
- **Performance & scale:**
  - Optimize LLM calls (caching, batching)
  - Cost monitoring dashboard

### Exit Criteria
✓ Shipped additional value, community engaged
✓ Performance is optimized
✓ Modding tools are documented

---

## Key Principles Across All Phases

1. **Playable at each phase:** Every phase should produce something you can actually play and show people
2. **Deterministic core, LLM flavor:** Money, timers, scoring always handled by rules engine
3. **Test LLM early:** Phase 3 validates costs/latency before going deep on narrative
4. **Defer complexity:** Co-op and advanced features wait until core loop is solid
5. **Version control milestones:** Tag releases at end of each phase

---

## Risk Mitigation

- **LLM costs:** Start with budget limits and caching strategies in Phase 3
- **Scope creep:** Each phase has clear exit criteria; resist adding "just one more thing"
- **Tech debt:** Reserve 20% of each phase for refactoring and cleanup
- **Playtesting:** Get external feedback at Phases 1, 4, 6, and 7

---

## Current Status

**Current Phase:** Phase 0 - Foundation & Proof of Concept
**Status:** In Progress
**Started:** 2025-11-10
