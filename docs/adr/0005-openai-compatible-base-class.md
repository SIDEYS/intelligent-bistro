# ADR 0005 — OpenAI-Compatible Base Class for LLM Providers

**Status:** Accepted  
**Date:** 2026-05-19

---

## Context

The project originally shipped with a single `GroqProvider` containing the full system prompt, agentic loop, and tool call dispatch inlined. Adding an Ollama offline provider would have duplicated ~150 lines of core logic. The two providers differ only in three constructor values (`baseURL`, `apiKey`, `model`) and one recovery flag for Groq's non-standard legacy tool call format.

---

## Decision

Extract all shared logic into an `OpenAICompatibleProvider` abstract base class in `apps/api/src/services/llm/base.ts`. Concrete providers (`GroqProvider`, `OllamaProvider`) extend it and supply only constructor-level config via a typed options object.

The base class owns:
- Full system prompt (menu embedded, tool rules, CRITICAL constraints)
- 10-iteration agentic loop
- Tool call dispatch (`add_item`, `remove_item`, `clear_cart`, `get_menu`)
- Cart state injection into the last user message and last tool result
- `legacyRecovery` path for Groq's `<function=name{}>` format (opt-in flag)

---

## Consequences

**Good**
- Adding a third provider (e.g. OpenAI, Anthropic) is a 10-line subclass
- System prompt and loop behaviour are guaranteed identical across providers — no drift
- `legacyRecovery` is isolated to Groq; Ollama and future providers don't see it

**Bad**
- If a future provider needs fundamentally different loop behaviour (e.g. streaming), the base class will need to be split or the method overridden
- The base class is coupled to the `CartItem` and tool schemas from `@bistro/shared` — changes there ripple here
