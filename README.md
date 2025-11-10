# Small Hours ☕

A Coffee Shop Simulator where customers have stories and craft matters. Built with Next.js, TypeScript, and AI-powered character interactions.

**Current Status:** Phase 0 - Foundation Complete ✅

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenRouter API key:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get your API key at: https://openrouter.ai/keys

### 3. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000 and test the LLM integration!

---

## What You Get

- ✨ **Next.js 14** with TypeScript and Tailwind CSS
- 🤖 **OpenRouter Integration** - Works with Claude, GPT-4, Gemini, and more
- 🎨 **Beautiful UI** - Coffee-themed design ready for gameplay
- 📖 **Phased Development** - Clear roadmap from MVP to full game

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI:** OpenRouter (default: Kimi K2 Thinking)

---

## LLM Configuration

By default, the project uses **Kimi K2 Thinking** (great for character interactions).

To switch models, edit `.env.local`:
```env
# Use a different model
LLM_MODEL=anthropic/claude-3.5-sonnet

# Or use a cheaper model for testing
LLM_MODEL=anthropic/claude-3-haiku
```

See all models: https://openrouter.ai/models

---

## Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run type-check # Run TypeScript checks
npm run lint       # Run ESLint
```

---

## Project Structure

```
small_hours/
├── app/
│   ├── api/test-llm/    # LLM API endpoint
│   ├── globals.css      # Styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── lib/
│   └── llm.ts          # LLM helper functions
├── PHASES.md           # Development roadmap
└── Plan.md            # Original design doc
```

---

## Next Steps

See [PHASES.md](./PHASES.md) for the complete development roadmap.

**Up Next:** Phase 1 - Minimal Craft Loop (brewing mechanics!)

---

## License

See [LICENSE](./LICENSE) file for details.
