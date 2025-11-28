<img width="1260" height="819" alt="image" src="https://github.com/user-attachments/assets/efdb454a-0ec4-4fc0-a68e-9c7aa027434f" /># Small Hours ☕

A café management simulator where every espresso matters and customers remember your face.

**Current Status:** Phase 0 Complete (95%) • Phase 1 Active (60%) | **[Read STATUS.md for full details →](./STATUS.md)**

---

## Quick Start

```bash
# Install
npm install

# Configure (add your OpenRouter API key)
cp .env.example .env.local

# Run dev server
npm run dev

# Run tests
npm test
```

Visit http://localhost:3000/game to play.

---

## ✨ What's Playable Now

**Core Systems:**
- **8 Drink Types:** Espresso, Latte, Cappuccino, Pour Over, Aeropress, Mocha, Americano, Matcha
- **Full Day Cycle:** Prep phase (restock/shop) → Service (customers) → Debrief (performance review)
- **Dynamic Customers:** LLM-powered personalities with unique orders and moods
- **Customer Memory:** Build relationships from stranger → regular → favorite (5 levels)
- **Equipment Progression:** Shop with 4 categories × 3 tiers (12 upgrades total)
- **Inventory Management:** Stock tracking, depletion, low-stock warnings, restock system
- **Quality Scoring:** Celsius-based brewing with equipment bonuses (0-100 scale)
- **Save/Load:** LocalStorage persistence with import/export

**Progression Features:**
- 💰 Money system with daily earnings
- 📈 Quality bonuses from better equipment (+5 to +10 per tier)
- 🏪 Equipment shop (espresso machines, grinders, milk steamers, brewing stations)
- 👥 Relationship tracking (customers remember quality and preferences)
- 📊 Day-to-day performance metrics

---

## 🚧 What's Coming Next

**Phase 1 Completion:**
- ⏭️ **Events System:** Random/scheduled events (coffee critic, rush hour, breakdowns)
- ⏭️ **Goals & Achievements:** Daily goals and long-term milestones
- ⏭️ **Reputation System:** Quality-based progression with premium unlocks
- ⏭️ Allergen safety system
- ⏭️ Additional tests for new systems

**See [STATUS.md](./STATUS.md) for complete analysis, roadmap, and next steps.**

---

## Tech Stack

- **Framework:** Next.js 16.0.1 + Turbopack
- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js 24.11.0 LTS
- **LLM:** OpenRouter (Kimi K2, Kimi K2 Thinking)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Testing:** Vitest (77 tests passing)

---

## Documentation

- **[STATUS.md](./STATUS.md)** - Complete status, gaps, roadmap (start here)
- **[PHASES.md](./PHASES.md)** - Phase tracking and completion criteria
- **[Plan.md](./Plan.md)** - Original design document
- **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** - Development roadmap

---

## Development

```bash
npm run dev         # Start dev server (localhost:3000)
npm run build       # Build for production
npm run type-check  # TypeScript validation
npm run lint        # ESLint
npm test            # Run tests (77 tests)
```

### Testing

```bash
npm test                    # Run all tests
npm test -- lib/scoring     # Run specific test file
npm test -- --coverage      # Generate coverage report
```

**Current test coverage:** 77 tests across 3 files (scoring, game-engine, inventory)

---

Built with [Next.js](https://nextjs.org) • [OpenRouter](https://openrouter.ai) • [Tailwind](https://tailwindcss.com)


<img width="1497" height="1324" alt="image" src="https://github.com/user-attachments/assets/1f74e871-1ca6-4964-a452-e08a02b522cd" />

<img width="1260" height="819" alt="image" src="https://github.com/user-attachments/assets/8b8a5d7b-9e9e-4d2c-b6ba-c7aa7eb8e8b5" />

<img width="1260" height="819" alt="image" src="https://github.com/user-attachments/assets/b7d6be2e-9475-4605-9e0d-0db74cd166c0" />

<img width="1457" height="1031" alt="image" src="https://github.com/user-attachments/assets/2786b1eb-6ad3-4571-a768-83a1a6349579" />

<img width="1266" height="339" alt="image" src="https://github.com/user-attachments/assets/9de33001-5d58-4d72-bdcc-78040c62610e" />

<img width="1527" height="881" alt="image" src="https://github.com/user-attachments/assets/7f4b79cc-ed6c-488b-9af6-a46145eaae13" />

<img width="524" height="881" alt="image" src="https://github.com/user-attachments/assets/f22d2fe4-2eef-40c9-8e25-bb6e06ae36e6" />


<img width="1266" height="771" alt="image" src="https://github.com/user-attachments/assets/188f2b45-460c-46a4-9f32-5254decce3bf" />

