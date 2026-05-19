# Devlog — Day 4

**Date:** 2026-05-19  
**Phase:** 3 — Testing, Deployment & Submission

---

## What I Built Today

### Expanded Test Suite
Added a third test file `cart.test.ts` covering three areas that had zero coverage after the Day 3 cart integrity work:

- **`applyCartDiff` behaviour** — tested via the `/chat` route with a mocked LLM: merge-on-add (incrementing quantity when same `itemId` added again), remove, and clear
- **Duplicate tool call deduplication** — verified that when the LLM calls `add_item` twice for the same `itemId` in one turn, only one entry appears in `cartDiff.added`
- **`z.coerce.number()` coercion** — string quantities (as Ollama sends them) are accepted and cast correctly; non-numeric strings return a graceful error result

The tests also caught a real bug: `executeTool` was calling `AddItemArgsSchema.parse()` which throws a raw `ZodError` on invalid input, crashing the route handler. Changed both `add_item` and `update_item` to `safeParse` — now returns `{ cartDiff: {}, toolResultContent: 'Invalid ...' }` instead. Test count went from 22 → 30, all passing.

### CI Verified Green
Ran `gh run list` after every merge — all GitHub Actions runs on `main` and feature branches showed `completed success` across typecheck → test → build.

### API Deployment — Render
Deployed the Express API to Render (free tier) at `https://intelligent-bistro-864u.onrender.com`.

Hit a build failure on the first attempt: `ERR_MODULE_NOT_FOUND` for `packages/shared/src/menu`. The `@bistro/shared` package had `"main": "./src/index.ts"` — fine locally with `tsx`, but Node on Render can't execute `.ts` files at runtime. Fix:
- Added `"build": "tsc"` script to shared
- Switched shared `tsconfig.json` from `module: ESNext / moduleResolution: Bundler` to `CommonJS / Node` to match the API
- Updated `main`/`types` to point to `dist/`
- Updated `render.yaml` build command to compile shared before API:  
  `pnpm --filter @bistro/shared build && pnpm --filter @bistro/api build`

Second deploy succeeded. Health check confirmed: `{"status":"ok"}`.

Updated `apps/mobile/.env` to point to the live URL instead of the local LAN IP.

### README, LICENSE & EAS Config
- **README.md** — project overview, CI/API/license badges, architecture diagram, message→cart flow walkthrough, tech stack table, full getting started guide, SDLC artifacts index
- **LICENSE** — MIT
- **eas.json** — EAS build profiles configured for Android APK (preview) and AAB (production). To generate a shareable Android build: `eas build --profile preview --platform android`

---

## Decisions Made

No new ADRs — all architectural decisions were already locked. The `safeParse` fix in `executeTool` was a correctness fix, not a design change.

---

## Problems Hit + How I Solved Them

| Problem | Root Cause | Fix |
|---|---|---|
| Render build: `ERR_MODULE_NOT_FOUND` for shared package | `@bistro/shared` pointed to `.ts` source; Node can't run TypeScript | Added build step to shared, switched to CommonJS output, updated `main` to `dist/` |
| `executeTool` throwing `ZodError` on bad args | Used `.parse()` instead of `.safeParse()` | Changed to `safeParse` with graceful error return |

---

## Final State

| Deliverable | Status |
|---|---|
| React Native app (Chat, Menu, Cart) | ✅ |
| Express API with tool-calling LLM | ✅ |
| Groq provider (cloud) | ✅ |
| Ollama provider (offline) | ✅ |
| 30 passing tests | ✅ |
| GitHub Actions CI | ✅ green |
| 6 ADRs | ✅ |
| Daily devlogs (Days 1–4) | ✅ |
| CHANGELOG.md | ✅ |
| API deployed on Render | ✅ |
| EAS build config | ✅ |
| README + MIT license | ✅ |

---

## Links to Commits & PRs

- PR #19 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/19 — cart integrity tests + ZodError fix
- Commit `127fe76`: fix shared package CommonJS build for Render
- Commit `fe4f02c`: README, MIT license, eas.json
