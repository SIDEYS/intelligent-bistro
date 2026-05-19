# ADR 0006 — Multi-Layer LLM Cart Integrity

**Status:** Accepted  
**Date:** 2026-05-19

---

## Context

LLMs are non-deterministic and tool-calling models can produce the same tool call multiple times within a single turn, across turns, or infer intent from conversation history. Three distinct failure modes were observed in testing:

1. **Server append**: `applyCartDiff` blindly concatenated `diff.added` to the cart array, creating duplicate entries for the same `itemId`.
2. **Double tool call**: Within a single agentic turn the model called `add_item` twice for the same `itemId`, resulting in 4 items when 2 were ordered.
3. **History inference**: After a vague user confirmation ("Yess"), the model re-added items from earlier in the conversation.

A single fix at any one layer was insufficient — the model could still find ways to reach an incorrect cart state.

---

## Decision

Apply three independent guards in a defence-in-depth stack:

| Layer | Location | Mechanism |
|---|---|---|
| Server merge | `apps/api/src/services/llm/base.ts` — `applyCartDiff` | Merge-by-`itemId`: if the item already exists, add to `quantity`; don't append |
| Turn deduplication | `apps/api/src/routes/chat.ts` | Skip any `itemId` already present in `mergedDiff.added` for the current turn |
| Context injection | `apps/api/src/services/llm/base.ts` — agentic loop | (a) Prepend current cart to last user message as a bracketed constraint; (b) append "Cart now: …" to last tool result after each iteration |

The system prompt also carries explicit CRITICAL rules, but prompt rules alone are unreliable — the code-level guards are the authoritative defence.

---

## Consequences

**Good**
- Each layer independently catches a different failure mode — no single point of failure
- Cart state injection gives the model continuous, accurate context without relying on its own memory across turns
- The guards are transparent to the client — the mobile app and cart store require no changes

**Bad**
- Context injection increases token usage slightly each agentic iteration (one short line per loop)
- The bracketed cart constraint in the user message is visible in the raw API payload — not a user-facing issue but worth noting for debugging
- Three separate places must be kept in sync if the cart data model changes
