# Devlog — Day 2

**Date:** 2026-05-16  
**Phase:** 2 — Build & Test

---

## What I Built Today

- Root monorepo config: `pnpm-workspace.yaml`, `tsconfig.base.json`, ESLint, Prettier
- `packages/shared`: Zod schemas and TypeScript types for MenuItem, CartItem, ChatMessage, ChatRequest, ChatResponse, CartDiff — single source of truth for both apps
- `apps/api`: Full Express server with:
  - `/health`, `/menu`, `/menu/:category`, `/chat`, `/orders` routes
  - Groq + Ollama LLM provider abstraction (swap via `LLM_PROVIDER` env var)
  - Tool executor for `add_item`, `remove_item`, `update_item`, `clear_cart`, `get_menu`
  - Zod validation on all request boundaries
- `apps/mobile`: Expo SDK 55 app with:
  - expo-router tab navigation (Chat / Menu / Cart)
  - NativeWind v4 with custom bistro colour palette
  - Zustand stores for cart and chat state
  - Typed API service layer
- 22 passing tests: 11 unit (tool executor) + 11 integration (API routes, LLM mocked)
- GitHub Actions CI pipeline — typecheck + test on every push and PR, running green

---

## Decisions Made

All decisions were locked in ADRs during Phase 1. No new ADRs required today.

---

## Problems Hit + How I Solved Them

- **pnpm v11 requires Node.js v22+** — CI failed on Node 20. Fixed by bumping `node-version` to 22 in `ci.yml`.
- **NativeWind `className` TypeScript errors** — 45 type errors across all screens because TypeScript didn't know NativeWind extends RN component props. Fixed with a single `nativewind-env.d.ts` file containing `/// <reference types="nativewind/types" />`.
- **`@bistro/shared` workspace link** — `pnpm add @bistro/shared` tried npm registry. Fixed by using `'@bistro/shared@workspace:*'` with quotes to prevent zsh glob expansion.
- **Multi-item tool call gap** — LLM sometimes only calls `add_item` once when user requests two items. Noted as a known edge case; will fix in Phase 3 with a proper tool-call loop that feeds results back into the message history.

---

## Tomorrow's Plan

- Fix the multi-item tool calling loop in `/chat`
- Run the mobile app in Expo Go and do a full end-to-end manual test
- Deploy API to Railway
- Set up EAS preview build for mobile
- Write CHANGELOG.md

---

## Links to Commits & PRs

- PR #9 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/9
- PR #10 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/10
- PR #11 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/11
- CI run (green): https://github.com/SIDEYS/intelligent-bistro/actions/runs/25970375653
