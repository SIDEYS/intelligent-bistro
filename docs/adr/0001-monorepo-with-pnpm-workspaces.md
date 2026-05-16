# ADR 0001 — Monorepo with pnpm Workspaces

**Status:** Accepted  
**Date:** 2026-05-16

## Context

The project has two deployable apps (mobile, API) and shared TypeScript types and Zod schemas used by both. We need a repository structure that allows code sharing without publishing packages, keeps CI simple, and avoids duplicating type definitions across apps.

## Decision

Use a pnpm workspace monorepo with three workspace packages:
- `apps/mobile` — Expo React Native app
- `apps/api` — Express backend
- `packages/shared` — shared types and Zod schemas

## Consequences

**Positive:**
- Types and schemas are defined once in `packages/shared` and imported by both apps — no drift between client and server contracts.
- pnpm's hard-link store means fast installs and minimal disk usage.
- Single `git clone` gives a reviewer the full system immediately.

**Negative:**
- Slightly more complex root-level `package.json` and `pnpm-workspace.yaml` setup.
- A misconfigured workspace filter can accidentally run commands in the wrong package.
