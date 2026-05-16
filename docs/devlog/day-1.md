# Devlog — Day 1

**Date:** 2026-05-16  
**Phase:** 1 — SDLC Foundation

---

## What I Built Today

- Initialised the pnpm monorepo skeleton with full folder structure (`apps/mobile`, `apps/api`, `packages/shared`, `docs/adr`, `docs/devlog`, `.github/workflows`)
- Created and pushed the GitHub repository: [SIDEYS/intelligent-bistro](https://github.com/SIDEYS/intelligent-bistro)
- Wrote the **User Requirements Document** — 3 personas, 17 functional requirements, 7 non-functional requirements, and acceptance criteria
- Wrote the **System Design** — architecture diagram, component breakdown, LLM tool calling flow, data models, API contract, state sync strategy, error handling, and deployment plan
- Wrote **ADRs 0001–0004** covering every locked technical decision
- Set up the **GitHub Project board** with 6 tracked issues covering all remaining phases

---

## Decisions Made

| Decision | ADR |
|----------|-----|
| pnpm monorepo for shared types across apps | [ADR 0001](../adr/0001-monorepo-with-pnpm-workspaces.md) |
| Groq (llama-3.3-70b) with swappable LLM provider abstraction | [ADR 0002](../adr/0002-groq-llm-with-provider-abstraction.md) |
| Tool calling only for cart mutations — no free-text JSON parsing | [ADR 0003](../adr/0003-tool-calling-for-cart-mutations.md) |
| Expo + NativeWind + Zustand for the mobile stack | [ADR 0004](../adr/0004-expo-nativewind-zustand-mobile-stack.md) |

---

## Problems Hit + How I Solved Them

- **`npm install -g pnpm` failed with EACCES** — npm was installed system-wide, so the user account lacked write permission to `/usr/local/lib/node_modules`. Fixed by installing pnpm via Homebrew instead.
- **`gh auth login` blocked by stale `GITHUB_TOKEN`** — an expired token was hardcoded in `~/.zshrc`. Removed the line, sourced the file, and ran `unset GITHUB_TOKEN` to clear the live session before re-authenticating.
- **GitHub Projects API scope missing** — `gh project create` failed with a missing `project` scope. Fixed with `gh auth refresh -s project,read:project`.

---

## Tomorrow's Plan

- Phase 2, Step 1: configure root `package.json`, `pnpm-workspace.yaml`, shared `tsconfig`, ESLint, and Prettier
- Phase 2, Step 2: scaffold the Express API with `/chat`, `/menu`, `/orders` routes, Zod validation, and the Groq + Ollama provider abstraction
- Phase 2, Step 3: scaffold the Expo mobile app with expo-router tabs, Zustand stores, and the API service layer

---

## Links

- Repo: https://github.com/SIDEYS/intelligent-bistro
- PR #1 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/1
- Project board: https://github.com/users/SIDEYS/projects/1
