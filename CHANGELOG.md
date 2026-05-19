# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- Premium mobile UI overhaul across all three screens (Chat, Menu, Cart)
- Chat screen: AI avatar, message timestamps, animated typing indicator, suggestion chips, gold focus ring on input
- Menu screen: per-item emoji artwork, category pills, Chef's Special ribbon, dietary tags (Vegan / Veggie / GF), price badges
- Cart screen: order summary card with subtotal + 10% service charge, `OrderConfirmedModal` replacing system `Alert`
- `OrderConfirmedModal`: spring-animated card, order ID badge, estimated wait badge, dark overlay
- `AnimatedCartIcon` in tab bar: spring bounce when item is added to cart
- Splash screen on app launch with spring entrance and fade-out
- Savour wordmark logo in header with gold monogram badge

---

## [0.3.0] — 2026-05-19 — Ollama Provider + LLM Cart Fixes

### Added
- `OllamaProvider` for fully offline LLM inference via local Ollama
- `OpenAICompatibleProvider` abstract base class — shared system prompt, 10-iteration agentic loop, tool call dispatch
- `.env.example` for API documenting `LLM_PROVIDER`, `GROQ_*`, and `OLLAMA_*` variables
- Day 3 devlog

### Fixed
- Cart quantity coercion: `z.coerce.number()` handles Ollama passing quantity as a string
- Duplicate cart entries: `applyCartDiff` now merges quantities by `itemId` instead of appending
- LLM calling `add_item` twice in one turn → skip (not sum) duplicate `itemId` calls in `chat.ts`
- LLM re-adding items on vague confirmations: cart state prepended to last user message each turn
- Inaccurate LLM item counts: current cart state appended to last tool result after each agentic iteration
- Unit price not displayed on cart rows

---

## [0.2.0] — 2026-05-18 — UI Polish + Cart Controls

### Added
- Animated splash screen with spring entrance
- Staggered fade-in animations on menu cards and cart rows
- Quantity +/− controls on cart rows
- Remove button per cart item
- Dietary filter groups on menu (starter / main / dessert / drink)
- Logo and branding in app header

### Fixed
- LLM system prompt tightened to reduce hallucinated tool calls
- Duplicate source files removed from repo

---

## [0.1.0] — 2026-05-17 — Foundation

### Added
- Monorepo scaffold: `apps/mobile`, `apps/api`, `packages/shared`
- Expo + React Native app with Zustand cart and chat stores
- Express API with `/chat` and `/order` endpoints
- Groq LLM integration via OpenAI-compatible SDK with tool calling
- `add_item`, `remove_item`, `clear_cart`, `get_menu` tools
- 22 passing Vitest + Supertest tests (LLM mocked via fixtures)
- GitHub Actions CI: lint → typecheck → test → build
- ADRs 0001–0004 (monorepo, Expo, Groq, tool calling)
- URD, system design document
- Day 1 and Day 2 devlogs
