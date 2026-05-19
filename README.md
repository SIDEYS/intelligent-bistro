<div align="center">

<img src="apps/mobile/assets/icon.png" width="96" height="96" style="border-radius: 22px" />

# Savour — AI Dining Companion

**A production-grade AI ordering assistant for restaurants.**  
Converse naturally. The AI handles your order.

[![CI](https://github.com/SIDEYS/intelligent-bistro/actions/workflows/ci.yml/badge.svg)](https://github.com/SIDEYS/intelligent-bistro/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-C9A84C.svg)](LICENSE)
[![API](https://img.shields.io/badge/API-Live%20on%20Render-3C2A1E)](https://intelligent-bistro-864u.onrender.com/health)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org/)

</div>

---

## What is this?

Savour is a full-stack React Native + Node.js application where an AI assistant manages restaurant ordering entirely through natural conversation. You tell it what you want — it calls structured tools to build your cart, handles dietary preferences, customisations, and ambiguous requests, then places the order.

Built as a 4-day take-home for an AI Full-Stack Engineering Internship. Evaluated on visual excellence, conversational logic, state management, and backend quality. Documented with a full SDLC: URD → system design → ADRs → CI → tests → deployment → daily devlogs.

---

## Demo

| Chat | Menu | Cart |
|:---:|:---:|:---:|
| Conversational AI ordering | Browse & add items directly | Review, edit, and confirm |

> **Live API:** [`https://intelligent-bistro-864u.onrender.com/health`](https://intelligent-bistro-864u.onrender.com/health)  
> *(Free tier — first request after inactivity takes ~50s to wake up)*

---

## Features

- **Conversational ordering** — natural language in, structured cart actions out. The LLM never guesses — it calls typed tools.
- **Multi-layer cart integrity** — server-side merge, turn-level deduplication, and live cart state injection prevent the LLM from ever miscounting or re-adding items
- **Dual LLM providers** — Groq (cloud, fast) or Ollama (local, offline) via a shared base class. Switch with `LLM_PROVIDER=ollama`
- **24-item menu** — starters, mains, desserts, drinks with dietary tags (vegan, vegetarian, gluten-free) and Chef's Specials
- **Premium mobile UI** — animated splash, staggered card entrances, typing indicator, order confirmation modal, cart badge bounce
- **Full SDLC** — 6 ADRs, daily devlogs, GitHub Actions CI, 30 passing tests, deployed API

---

## Architecture

```
intelligent-bistro/
├── apps/
│   ├── mobile/          # Expo + React Native (TypeScript)
│   │   ├── app/         # expo-router screens: index (chat), menu, cart
│   │   └── store/       # Zustand: cartStore, chatStore
│   └── api/             # Node.js + Express (TypeScript)
│       ├── routes/      # /chat  /menu  /orders  /health
│       └── services/
│           ├── llm/     # base.ts (OpenAICompatibleProvider), groq.ts, ollama.ts
│           └── tools.ts # add_item, remove_item, update_item, clear_cart, get_menu
└── packages/
    └── shared/          # CartItem, ChatMessage, MenuItem — shared types + Zod schemas
```

**How a message becomes a cart action:**

```
User: "I'd like 2 pizzas, extra cheese"
  → POST /chat { messages, cart }
  → LLM agentic loop (up to 10 iterations)
  → tool call: add_item({ itemId: "main-01", quantity: 2, customisation: "extra cheese" })
  → executeTool() → CartDiff
  → response: { reply: "Added 2x Margherita Pizza...", cartDiff: { added: [...] } }
  → Zustand applyDiff() updates mobile cart state
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo 55, React Native, TypeScript, expo-router, Zustand, NativeWind |
| Backend | Node.js, Express, TypeScript, Zod |
| AI | Groq (`llama-3.3-70b-versatile`) via OpenAI-compatible SDK + Ollama for offline |
| Monorepo | pnpm workspaces |
| Tests | Vitest + Supertest (30 tests, LLM mocked via fixtures) |
| CI | GitHub Actions — typecheck → test → build |
| Deploy | Render (API), EAS (mobile preview builds) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Expo Go app on your phone
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Local Development

```bash
# Clone and install
git clone https://github.com/SIDEYS/intelligent-bistro.git
cd intelligent-bistro
pnpm install

# API — create apps/api/.env
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Mobile — create apps/mobile/.env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000

# Start API
pnpm --filter @bistro/api dev

# Start mobile (new terminal)
pnpm --filter @bistro/mobile start
```

Scan the QR code with Expo Go on your phone.

### Run Tests

```bash
pnpm --filter @bistro/api test
```

### Offline Mode (Ollama)

```bash
# Install Ollama: https://ollama.com
ollama pull llama3.2

# In apps/api/.env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.2
```

### Mobile Preview Build (Android APK)

```bash
npm install -g eas-cli
cd apps/mobile
eas build --profile preview --platform android
```

---

## SDLC Artifacts

| Artifact | Link |
|---|---|
| User Requirements Document | [`docs/urd.md`](docs/urd.md) |
| System Design | [`docs/system-design.md`](docs/system-design.md) |
| ADR 0001 — Monorepo with pnpm | [`docs/adr/0001`](docs/adr/0001-monorepo-with-pnpm-workspaces.md) |
| ADR 0002 — Groq + provider abstraction | [`docs/adr/0002`](docs/adr/0002-groq-llm-with-provider-abstraction.md) |
| ADR 0003 — Tool calling for cart mutations | [`docs/adr/0003`](docs/adr/0003-tool-calling-for-cart-mutations.md) |
| ADR 0004 — Expo + NativeWind + Zustand | [`docs/adr/0004`](docs/adr/0004-expo-nativewind-zustand-mobile-stack.md) |
| ADR 0005 — OpenAI-compatible base class | [`docs/adr/0005`](docs/adr/0005-openai-compatible-base-class.md) |
| ADR 0006 — Multi-layer cart integrity | [`docs/adr/0006`](docs/adr/0006-multi-layer-cart-integrity.md) |
| Day 1 Devlog | [`docs/devlog/day-1.md`](docs/devlog/day-1.md) |
| Day 2 Devlog | [`docs/devlog/day-2.md`](docs/devlog/day-2.md) |
| Day 3 Devlog | [`docs/devlog/day-3.md`](docs/devlog/day-3.md) |
| Day 4 Devlog | [`docs/devlog/day-4.md`](docs/devlog/day-4.md) |
| Changelog | [`CHANGELOG.md`](CHANGELOG.md) |

---

## License

[MIT](LICENSE)
