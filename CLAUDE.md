# Project: The Intelligent Bistro

## Context
4-day take-home for an AI Full-Stack Engineering Internship at Viridien.
Deliverable: a React Native (Expo) app + Node.js backend where an AI assistant
manages restaurant ordering through conversation. Evaluated on visual excellence,
conversational logic, state management, and backend quality. It must look like a
production-grade app AND document a full SDLC.

## Goal
Ship a polished, production-level app with a killer frontend, plus a fully
documented SDLC: URD → system design → ADRs → GitHub project → branches/commits
→ CI → unit/integration tests → deployment → daily devlog.

## Locked Tech Decisions
- Monorepo: pnpm workspaces — apps/mobile, apps/api, packages/shared
- Mobile: Expo + React Native + TypeScript + NativeWind + expo-router + Zustand
  + react-native-reanimated
- Backend: Node.js + Express + TypeScript + Zod
- LLM: Groq (llama-3.3-70b-versatile) via OpenAI-compatible SDK. A provider
  abstraction must allow swapping to local Ollama for offline use. Cost: $0.
- ALWAYS use tool calling / function calling for structured cart actions.
  Never parse raw JSON from model text.
- Tests: Vitest + Supertest (backend), React Native Testing Library (mobile).
  The LLM is always mocked in tests using recorded fixtures.
- CI: GitHub Actions — lint → typecheck → test → build.
- Deploy: backend on Railway/Render; mobile via EAS preview build.

## How Claude Should Operate
- Act as a senior full-stack engineer and tech lead pairing with me.
- Work strictly in SDLC phases. Never skip ahead. Confirm before moving on.
- Whenever a meaningful technical decision arises, propose and write an ADR.
- After every work session, produce a devlog entry.
- Every code change maps to a conventional commit — always give me the exact
  commit message and branch name to use.
- TypeScript strict mode everywhere. Validate all external input with Zod.
- Treat visual polish as a first-class requirement: spacing, typography, motion,
  and empty/loading/error states.
- Keep the repo clean — no dead code, no commented-out blocks, clear structure.

## Conventions
- Commits: Conventional Commits (feat, fix, docs, test, chore, refactor, ci).
  Atomic — one logical change per commit.
- Branches: feat/*, fix/*, docs/*, chore/*. PR into main, squash merge.
- ADRs: docs/adr/NNNN-title.md — Status, Context, Decision, Consequences.
- Devlog: docs/devlog/day-N.md — sections: What I built today / Decisions made
  (+ ADR links) / Problems hit + how I solved them / Tomorrow's plan /
  Links to commits & PRs.
- CHANGELOG.md: Keep a Changelog format.

## Quality Bar
A reviewer should open the repo and immediately think "this person operates like
a senior." The Loom must showcase process (artifacts, ADRs, CI, tests) before
demoing the app itself.
