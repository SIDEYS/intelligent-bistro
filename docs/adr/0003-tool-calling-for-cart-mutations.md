# ADR 0003 — Tool Calling for All Cart Mutations

**Status:** Accepted  
**Date:** 2026-05-16

## Context

The assistant must modify cart state (add, remove, update, clear items) based on user conversation. Two approaches were considered:

**Option A — Parse JSON from LLM text response**  
Ask the LLM to include a JSON block in its reply (e.g. `{"action":"add","itemId":"pizza-01"}`), then parse it with regex or `JSON.parse`.

**Option B — LLM Tool Calling (function calling)**  
Define structured tools (`add_item`, `remove_item`, etc.) with typed schemas. The LLM invokes them explicitly; the server executes them and returns results.

## Decision

Use LLM tool calling exclusively for all cart mutations. The LLM is never asked to embed structured data in free text. All tool schemas are defined with Zod and validated on execution.

## Consequences

**Positive:**
- Tool calls are guaranteed-structured — no regex fragility or `JSON.parse` try/catch.
- The LLM's intent is explicit and auditable in logs.
- Zod validation at tool execution boundary means malformed tool arguments are caught early.
- Tests can assert on specific tool invocations rather than parsing assistant text.

**Negative:**
- Requires two LLM round-trips when a tool is called (call → tool result → final response), adding ~200–400ms latency.
- Tool calling reliability varies by model — requires careful tool description authoring.
