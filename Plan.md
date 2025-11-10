Below is a compact-but-complete **Design Document** you can hand to a team and build from. It keeps the cozy narrative you want while locking the “fair” mechanics in code and using LLMs only where they shine.

---

# Coffee Shop Simulator — Design Document (LLM‑Augmented)

**Working title:** *Small Hours*
**Genre:** Management sim + narrative slice‑of‑life
**Platforms (initial):** PC/Mac (desktop web or native).
**Core Fantasy:** You run a neighborhood café. Customers have stories. Craft and kindness matter.

---

## 1) Goals & Non‑Goals

**Goals**

* Deliver a replayable café sim where **natural conversation** and **deterministic craft** interlock.
* Use LLMs for **character, memory, events, and flavor**, never for money/stock/timers.
* Ship in **phases**, each a playable vertical slice with clear exit criteria.

**Non‑Goals**

* Real‑time 3D or barista simulator with full physics.
* Fully open‑world narrative. (We focus on a tight neighborhood.)

---

## 2) Player Experience Pillars

1. **Emergent People** — Regulars feel distinct and remember you.
2. **Crisp Craft** — Brewing accuracy is readable, teachable, and scoreable.
3. **Time Pressure** — Manage a queue; triage and multitask.
4. **Meaningful Management** — Inventory, pricing, upgrades matter but don’t overwhelm.
5. **Fairness** — Rules engine owns money, inventory, timers, and scores.

---

## 3) Modes

* **Story**: 3–5 chapters tied to local events; recurring cast.
* **Endless Rush**: Short, intense runs with mutators and leaderboards.
* **Sandbox**: No pressure; design menu, play with vibes.
* **(Stretch) Co‑op Party**: One player handles chat/register; another crafts.

---

## 4) Core Loops

### Daily Loop

**Prep → Service → Close & Debrief → Upgrades/Events → Save**

* *Prep:* choose beans, restock, set specials.
* *Service:* greet customers, parse/confirm orders, brew, deliver, handle hiccups.
* *Debrief:* revenue, ratings, reviews, unlocks.

### Minute‑to‑Minute

Greet → Order chat → `parse_order` → confirm → create ticket → brew (timers/accuracy) → deliver → satisfaction/tip → review/memory.

---

## 5) Systems (LLM vs Rules Ownership)

> **Principle:** LLM writes words and makes choices only via tools; **rules engine** is the source of truth.

| System                | LLM Responsibilities                                        | Rules Responsibilities                                             | Fun Levers                                    |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| Orders & Dialogue     | Natural orders, small talk, upsell responses, persona voice | Canonical recipes, stock checks, allergen gates, price & prep time | Vague orders, substitutions, regular memories |
| Brewing & Ticketing   | Flavor commentary, reactions to success/failure             | Timers, station bottlenecks, accuracy scoring, streaks             | Rush multipliers, “fast pull” risk            |
| Inventory & Menu      | Flavor text, seasonal pitch                                 | Stock, spoilage, margins, substitutions                            | Secret combos, supply events                  |
| Reputation & Reviews  | Personality‑rich reviews & DMs                              | Rating math (wait/accuracy/friendliness/price)                     | Mystery shopper, influencer spikes            |
| Staff & Training      | Banter, scheduling chatter                                  | Skills (speed/accuracy), wages, training effects                   | Traits, mentorship quests                     |
| Events & Neighborhood | Generate event narratives and NPCs                          | Foot‑traffic multipliers, permits, constraints                     | Event‑specific rules (“quiet hours”)          |

---

## 6) Technical Architecture

**Frontend:** React (or Svelte) + state (Zustand/Redux), WebAudio cues, keyboard shortcuts.
**Backend/Game Engine:** TypeScript/Node or a local deterministic core (WASM/TS).
**LLM Orchestration:** Single GM agent + per‑customer agents. Function calling to tools only.
**Persistence:** Save files (JSON); nightly memory summarization.
**RNG:** Seeded, deterministic for fairness & replay.

### Runtime Components

* **Game Master (GM, LLM):** Sets scenes/events. Read‑only state + `spawn_event`.
* **Customer Agents (LLM):** Persona prompts; call `parse_order`.
* **Rules Engine (Code):** Tickets, timers, inventory, money, ratings.
* **Memory Store:** KV + vector index; nightly summaries.

---

## 7) Tools / Function‑Calling API (authoritative)

```ts
type OrderItem = {
  sku: string;             // "latte", "espresso", "croissant"
  size?: "small"|"medium"|"large";
  temp?: "hot"|"iced";
  mods?: { milk?: "whole"|"oat"|"almond"|"soy"|"none"; syrup?: Record<string, number>; decaf?: boolean; extra_shot?: boolean; warm?: boolean };
  notes?: string;
};

function parse_order(naturalText: string): { items: OrderItem[]; allergens: string[]; notes?: string };

function price_quote(items: OrderItem[]): { total: number; breakdown: Array<{sku:string; price:number}> };

function inventory_query(sku: string): { qty: number };

function create_ticket(customer_id: string, items: OrderItem[]): { ticket_id: string } | { error: string };

function brew(ticket_id: string): { quality: number; time_sec: number; stock_delta: Record<string, number> };

function deliver(ticket_id: string): { tip: number; satisfaction: number; errors?: string[] };

function inventory_adjust(delta: Record<string, number>): { ok: boolean };

function post_review(customer_id: string, text: string, stars: number): { ok: boolean };

function spawn_event(kind: string, seed?: string): { event_id: string; modifiers: Record<string, number|string> };

function remember(customer_id: string, key: string, value: string): { ok: boolean };

function recall(customer_id: string): { prefs: Record<string,string|number|boolean>; recent_orders: OrderItem[] };
```

> **Contract:** Only these tools mutate or score anything. All tool calls are logged for audit.

---

## 8) Data Model (canonical, persisted)

```json
{
  "game": {
    "day": 1,
    "mode": "story",
    "cash": 0,
    "reputation": 3.0,
    "open": false,
    "queue": [],
    "tickets": [],
    "inventory": {
      "beans": [{"name":"House Blend","grams":1000,"roast_date":"2025-11-01"}],
      "milks": {"whole":3000,"oat":1000,"almond":0},
      "syrups": {"vanilla":150,"caramel":80,"pumpkin_spice":0},
      "pastries": {"croissant":4,"banana_bread":2}
    },
    "menu": {
      "drinks": [
        {"sku":"espresso","base_price":2.5,"time_sec":20,"requires":["beans"]},
        {"sku":"latte","base_price":4.0,"time_sec":35,"requires":["beans","milk"]},
        {"sku":"americano","base_price":3.0,"time_sec":25,"requires":["beans"]}
      ],
      "food":[{"sku":"croissant","base_price":3.0,"time_sec":10,"requires":["pastries"]}]
    },
    "customers": {},
    "events": []
  }
}
```

---

## 9) Core Formulas (deterministic & tunable)

* **Prep time (ticket)** = Σ item.time_sec × station modifiers × (1 − staff_speed_bonus).
* **Accuracy (0..1)** = product(component accuracies: shot window, milk temp, modifiers).
* **Satisfaction (0..100)** = 60·accuracy + 25·friendliness + 15·speed − penalties (allergen violation = hard fail).
* **Tip %** = base(persona) ± f(satisfaction, upsell success, loyalty).
* **Star Rating (1–5)** = bucketize(satisfaction ± persona variance).
* **COGS** = Σ ingredient_cost × qty × spoilage multipliers.

---

## 10) UX / UI

**Layout**

* **Left:** Chat (customers, staff, event narration).
* **Center:** Ticket rail (drag tickets to stations: grinder → espresso → steam → handoff).
* **Right:** Inventory + menu; quick actions (substitute milk, remake, comp).
* **Top:** Cash, rep, day clock, queue length.
* **Bottom:** Tooltips, allergen flags, “Confirm Order” with price quote.

**Accessibility**

* Subtitles and text‑only mode, color‑blind safe icons, remappable keys, slow‑mode toggle.

---

## 11) Content Spec (MVP)

* **Drinks (8):** espresso, Americano, cappuccino, latte, mocha, matcha latte, chai, hot chocolate.
* **Food (4):** croissant, banana bread, bagel, muffin.
* **Personas (5):** designer‑regular, student on a budget, hurried parent, food‑allergy user, influencer.
* **Events (10):** poetry night, street fair, rainy day lull, grinder malfunction, supplier delay, rival promo, influencer visit, staff sick day, quiet hours, cash‑only moment.
* **Upgrades (3):** better grinder (speed), steam wand (accuracy), POS (upsell boost).

---

## 12) Prompt Blueprints (excerpts)

**GM (system):**

```
You are the Game Master. You never change money, stock, or timers yourself.
You set scenes, spawn events, and keep text concise and concrete.
Always check allergens and availability before encouraging items.
To affect mechanics, call tools only. Tone: cozy, grounded, lightly witty.
```

**Customer (system template):**

```
You are a café customer.
Persona: {archetype}. Budget: {budget}. Patience: {0..1}. Allergens: {list}.
Prefs: milk={milk}, sweet={0..3}, temp={iced|hot}, caffeine={decaf|caf}.
Place an order naturally; when certain, call parse_order(text). Wait for confirmation.
Never assert price, stock, or prep time; ask or accept the barista’s confirmation.
```

**Reviewer (system):**

```
Write a 1–3 sentence review capturing specifics (accuracy, wait, friendliness).
No mechanics changes. Avoid inventing prices. Mention notable events if relevant.
```

---

## 13) Testing & Evaluation

**Unit Tests (Rules)**

* Recipe resolution, price quote math, allergen gating (unsafe always blocked).
* Timers/accuracy scoring given seed inputs.
* Inventory adjustments idempotency.

**LLM Harness**

* Adversarial orders (“iced extra hot?”, “almond allergy but almond milk?”).
* Language noise (typos, code‑switching).
* Persona drift checks (constrain to template).
* “Groundedness” tests: agents never claim stock/price/time.

**Playtests**

* First‑session success (complete a day).
* Stress (rush survival, remake tokens).
* Narrative retention (regulars remembered across days).

---

## 14) Telemetry & KPIs

Track: wait times, abandons, accuracy distribution, tips, rating breakdown, commonly out‑of‑stock items, dialogue branch usage, session length, rage‑quits.
KPIs per phase: % players completing day, median satisfaction, % allergen blocks caught, churn after Day 2.

Nightly auto‑summary prompt on telemetry → single proposed balancing change.

---

## 15) Safety, Reliability, Cost

* **Moderation:** Filter slurs/harassment; ejection event path.
* **Allergens:** Hard gate before ticket creation; red‑flag UI.
* **Determinism:** All resources/time/score via tools; audit log.
* **Latency/Cost:** Cache persona intros; use light model for `parse_order`; summarize memories nightly; cap token budgets per interaction.

---

## 16) Phased Build Plan (Milestones & Exit Criteria)

> Each phase ships a playable slice. No calendar estimates included; use your team’s cadence.

### **Phase 0 — Foundations / Spike**

**Goals:** Prove loop viability and LLM boundaries.
**Scope:**

* Minimal rules engine: tickets, timers, accuracy, cash, inventory.
* One customer persona, 3 drink SKUs, allergen gate, save/load.
* CLI or chat‑only UI.
  **Deliverables:**
* Deterministic sim core with tests.
* Tooling API wired with function calling.
* Seeded RNG; audit log of tool calls.
  **Exit Criteria:**
* Complete one short day end‑to‑end.
* Allergen tests pass 100%.
* LLM never mutates state without tools (verified by log).

---

### **Phase 1 — Text MVP (Single‑Day Web Prototype)**

**Goals:** Full day experience; 8–10 customers; end‑of‑day review.
**Scope:**

* 5 customer personas with memory across interactions.
* 8 drinks + 4 foods; price quote; substitutions; refunds/comp.
* End‑of‑day summary; simple ratings & tips.
* Basic telemetry pipeline.
  **Deliverables:**
* Webchat with ticket list (textual).
* Nightly memory summarization.
* Unit tests for parse/order, price, allergen, timers.
  **Exit Criteria:**
* ≥80% playtesters complete a day unaided.
* Ratings correlate with accuracy+wait+friendliness (r ≥ 0.8).
* Crash‑free sessions across 50 consecutive runs.

---

### **Phase 2 — UI & Progression Vertical Slice**

**Goals:** Make it *feel* like a game.
**Scope:**

* Visual ticket rail with stations; drag‑and‑drop; progress bars.
* Prep phase, specials, inventory restock, simple upgrades.
* 10+ events; influencer spike; rainy day lull; equipment failure.
* Sound cues; accessibility (color‑blind icons, slow mode).
  **Deliverables:**
* React/Svelte UI; remappable keys; tooltip system.
* Leaderboards for Endless Rush (local or global stub).
* Expanded telemetry dashboards.
  **Exit Criteria:**
* Average session length within target band; no tutorial needed to pass first day.
* 95th percentile frame time under budget on low‑spec target.
* Tutorialization: >70% players use a substitution at least once.

---

### **Phase 3 — Depth & Live Feel**

**Goals:** Longevity and community hooks.
**Scope:**

* Staff system (skills, wages, training), rival café events.
* Reviews/DMs feed; social flavor (LLM authored).
* Endless Rush mutators; seeds; daily challenges.
* Localization scaffold; mod‑ready content packs.
  **Deliverables:**
* Staff UI and training outcomes; rival event chain.
* Daily challenge generator & validation.
* Localization keys & font fallbacks.
  **Exit Criteria:**
* Retention uplift across multi‑day runs.
* Balance passes keep abandon rate under threshold during rushes.
* Content pack loader tested with 2 sample packs.

---

### **Phase 4 (Stretch) — Co‑op & Party**

**Goals:** Shared chaos, social fun.
**Scope:**

* Two roles: Register/Chat vs Bar.
* Voice‑to‑text hinting (optional), shared state.
  **Exit Criteria:**
* Co‑op session stability; grief‑proof tool gating.

---

## 17) Backlog (by system)

**Rules Engine**

* Stations & queues; overlapping timers; remake token logic.
* Accuracy model (shot window, temp, modifiers).
* Allergen resolver; substitution suggester.

**LLM Orchestration**

* GM cadence pacing (spawn rates, event injection).
* Persona templates + memory schema.
* Review writer & DM generator.

**UI/UX**

* Ticket rail, station panels, error states, allergen flags.
* Price quote & confirm flow; refund/comp.
* Accessibility controls, keybinds, audio cues.

**Content**

* 5 personas × 3 arcs; 10 events with modifiers; 8 drinks + 4 foods; 3 upgrades.
* Tutorials: prep, brewing basics, substitutions, rush tips.

**Telemetry/LiveOps**

* Metrics ingestion; nightly summarizer; balancing hooks.
* A/B flags: prep times, pricing, arrival rate, upsell copy.

**Safety**

* Moderation; ejection flow; banter guardrails.
* Red‑team prompt set (harassment, medical claims, doxxing).

---

## 18) Example Flows (Happy Path & Edge)

**Happy Path**

1. Customer chat → `parse_order` → confirm → `price_quote`
2. Stock OK → `create_ticket` → `brew` → `deliver` → `post_review`

**Edge: Allergen Conflict**

* `parse_order` detects almond + almond allergy → GM proposes safe alternatives → if accepted, proceed; else refuse politely.

**Edge: Stockout**

* `inventory_query` shows oat=0 → substitution UI offers whole/soy; LLM proposes flavor.

---

## 19) Example Type Definitions (Rules Side)

```ts
interface Ticket {
  id: string;
  customer_id: string;
  items: OrderItem[];
  status: "queued"|"brewing"|"ready"|"delivered"|"remade"|"canceled";
  started_at?: number;
  eta_sec?: number;
  quality?: number; // 0..1
}

interface Inventory {
  beans: { name: string; grams: number; roast_date: string }[];
  milks: Record<string, number>; // ml
  syrups: Record<string, number>; // ml
  pastries: Record<string, number>; // count
}

interface Persona {
  id: string;
  name: string;
  budget: number;
  patience: number; // 0..1
  allergens: string[];
  prefs: Record<string, string|number|boolean>;
  loyalty: number;
  history: string[]; // compact order strings
  mood: "rushed"|"chill"|"curious"|"anxious";
}
```

---

## 20) Risks & Mitigations

* **LLM Hallucination / Rule Violation** → Strict tool boundaries + audit logs + automated groundedness checks.
* **Latency/Cost Spikes** → Cache prompts, lightweight parsing model, streaming responses, aggressive truncation.
* **Difficulty Spikes** → Dynamic arrival rate; remake tokens; tutorial nudges.
* **Content Safety** → Moderation, opt‑out filters, report/eject flow.

---

## 21) Definition of Done (Global)

* No state mutation outside tools; every economic or inventory change auditable.
* Allergen test suite passes 100%.
* First‑session completion rate ≥ target; rage‑quit under threshold.
* Crash‑free runs across a long soak test.
* Accessibility basics implemented.
* Telemetry live; nightly balance summary produced.

---

## 22) What You Can Build First (Immediate, Hands‑On)

* **Repo skeleton** with: rules engine (tickets, timers), tool stubs, seed data (menu, inventory), 1 persona, CLI driver.
* **parse_order** unit tests with adversarial inputs.
* **Chat page** that lists tickets and calls `price_quote`/`create_ticket` securely.
* **End‑of‑day** summary with cash flow, satisfaction histogram, and 3‑line LLM review.

---

If you want, I can **generate a starter repo plan** (folders, TS interfaces, first tests) and a **copy‑paste prompt pack** for GM/Persona/Reviewer tailored to your exact menu and personas.
