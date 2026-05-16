# ADR 0002 — Groq as LLM Provider with Swappable Abstraction

**Status:** Accepted  
**Date:** 2026-05-16

## Context

The app requires a capable LLM for conversational ordering. Options considered:

| Option | Cost | Tool Calling | Latency |
|--------|------|-------------|---------|
| OpenAI GPT-4o | ~$5–15 / 1M tokens | Yes | Good |
| Groq llama-3.3-70b | Free tier | Yes | Excellent (low latency) |
| Ollama (local) | Free | Yes (model-dependent) | Variable |

The evaluation period requires $0 inference cost. A hard-coded provider would make offline testing and future swaps painful.

## Decision

Use Groq (`llama-3.3-70b-versatile`) as the default LLM provider via an OpenAI-compatible SDK. Wrap all LLM calls behind a `LLMProvider` interface so the concrete implementation is resolved from an environment variable at startup (`LLM_PROVIDER=groq` or `LLM_PROVIDER=ollama`).

## Consequences

**Positive:**
- Zero inference cost on Groq's free tier.
- Sub-second first-token latency on Groq is excellent for chat UX.
- Provider abstraction allows offline development via Ollama with no code changes.
- OpenAI-compatible SDK means minimal code change to swap providers.

**Negative:**
- Groq free tier has rate limits; sustained load could hit them.
- `llama-3.3-70b` tool calling is capable but less reliable than GPT-4o on edge cases — system prompt must be carefully engineered.
