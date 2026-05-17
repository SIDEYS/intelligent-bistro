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
- **Multi-item tool calling (Groq)** — Groq's `llama-3.3-70b-versatile` would sometimes output `<function=add_item{...}>` legacy text format instead of proper OpenAI tool call objects, causing a `tool_use_failed` error. Fixed by implementing a proper agentic loop (up to 5 iterations) that feeds each tool result back into the message history, and added a regex recovery path to parse the legacy format from `failed_generation`.
- **LLM calling `get_menu` before `add_item`** — Model was making two-step calls (first `get_menu`, then describing what to add as plain text rather than calling `add_item`). Fixed by embedding the full menu directly in the system prompt and removing `get_menu` from the tools list passed to Groq.
- **Null tool arguments crashing Zod** — `executeTool` received `null` args when the model omitted them. Fixed by changing the signature to `args: Record<string, unknown> | null` and defaulting with `const safeArgs = args ?? {}`.
- **Port 3000 EADDRINUSE during vitest** — Express bound the port even in test runs, causing `EADDRINUSE` when tests ran in parallel. Fixed with an `if (process.env.NODE_ENV !== 'test')` guard around `app.listen()` and `env: { NODE_ENV: 'test' }` in `vitest.config.ts`.
- **LLM removing the wrong items** — When user said "I don't want the espresso", model removed all items including pizza. Fixed by adding explicit rules to the system prompt: only act on items named in the current message; never remove items the user didn't mention.
- **LLM re-ordering from conversation history** — When user said "I'd like a pizza", the model inferred from earlier messages that espresso was also wanted and added both. Fixed by adding a CRITICAL rule to the system prompt: never infer or re-add items from earlier in the conversation.
- **28 accidental macOS duplicate files** — macOS Finder created `* 2.json` / `* 2.yaml` / `* 2.ts` copies of every config and source file. All deleted and committed.

---

## Tomorrow's Plan

- Deploy API to Railway or Render
- Set up EAS preview build for mobile (shareable iOS/Android link)
- Write CHANGELOG.md
- Devlog day-3

---

## Links to Commits & PRs

- PR #9 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/9
- PR #10 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/10
- PR #11 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/11
- PR #12 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/12
- PR #13 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/13
- CI run (green): https://github.com/SIDEYS/intelligent-bistro/actions/runs/25970375653
