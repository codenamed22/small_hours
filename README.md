# Small Hours ☕

A coffee shop simulator where brewing matters and customers have stories.

**Current Status:** Phase 0 - 50% Complete | **[Read STATUS.md for full details →](./STATUS.md)**

---

## Quick Start

```bash
# Install
npm install

# Configure (add your OpenRouter API key)
cp .env.example .env.local

# Run
npm run dev
```

Visit http://localhost:3000/game to play.

---

## What Works Now

- **5 Drink Types:** Espresso, Latte, Cappuccino, Pour Over, Aeropress
- **Quality Scoring:** Tolerance-based scoring (0-100) with component breakdown
- **Dynamic UI:** Controls change based on drink type
- **Production Code:** Clean architecture, TypeScript, no tests yet

---

## What's Missing

- Tests (0% coverage)
- Inventory system
- LLM integration in game (exists but not connected)
- Customer personas and memory
- Ticketing/queue system
- Allergen safety system
- Save/load

**See [STATUS.md](./STATUS.md) for complete analysis, roadmap, and next steps.**

---

## Tech Stack

- Next.js 16.0.1 + Turbopack
- TypeScript (strict mode)
- Node.js 24.11.0 LTS
- OpenRouter (Kimi K2 Thinking)
- Tailwind CSS

---

## Documentation

- **[STATUS.md](./STATUS.md)** - Complete status, gaps, roadmap (start here)
- **[Plan.md](./Plan.md)** - Original design document

---

## Development

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run type-check  # TypeScript validation
npm run lint        # ESLint
```

---

Built with [Next.js](https://nextjs.org) • [OpenRouter](https://openrouter.ai) • [Tailwind](https://tailwindcss.com)
