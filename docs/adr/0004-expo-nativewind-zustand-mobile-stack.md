# ADR 0004 — Mobile Stack: Expo + NativeWind + Zustand

**Status:** Accepted  
**Date:** 2026-05-16

## Context

The mobile app needs to run on iOS and Android, ship quickly within a 4-day window, and look visually polished. Key decisions were needed on the build system, styling approach, and state management.

**Build system options:** Bare React Native vs. Expo Managed Workflow  
**Styling options:** StyleSheet API, Styled Components, NativeWind  
**State options:** Redux Toolkit, Zustand, Jotai, Context API

## Decision

- **Expo Managed Workflow** — eliminates native build configuration; EAS handles preview builds without Xcode/Android Studio.
- **NativeWind v4** — Tailwind CSS utility classes in React Native. Consistent design tokens, fast iteration, and readable JSX with no separate style objects.
- **Zustand** — minimal boilerplate, no provider wrapping, excellent TypeScript inference, and trivial to mock in tests.
- **expo-router** — file-based routing (same mental model as Next.js); tab navigator maps naturally to Chat / Menu / Cart screens.
- **react-native-reanimated** — smooth, native-thread animations for cart updates and message transitions.

## Consequences

**Positive:**
- Expo Managed Workflow means zero native toolchain setup for the reviewer.
- NativeWind produces visually consistent UI with less code than StyleSheet.
- Zustand store is a plain object — easy to snapshot in tests and seed with fixtures.
- expo-router makes navigation structure self-documenting from the file tree.

**Negative:**
- Expo Managed Workflow limits access to custom native modules (not needed here).
- NativeWind v4 is relatively new; some edge-case styling may need manual StyleSheet fallback.
