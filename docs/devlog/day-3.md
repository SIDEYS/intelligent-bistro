# Devlog — Day 3

**Date:** 2026-05-19  
**Phase:** 2 — UI Polish, Ollama Integration & LLM Cart Robustness

---

## What I Built Today

### Ollama Offline Provider
Introduced `OpenAICompatibleProvider` — an abstract base class that holds the full system prompt, 10-iteration agentic loop, tool call dispatch, and cart state injection logic. Both `GroqProvider` and the new `OllamaProvider` extend it with just a constructor supplying `baseURL`, `apiKey`, and `model`. The Groq subclass adds `legacyRecovery: true` for its `<function=name{}>` format quirk; Ollama needs nothing extra.

Switching providers: `LLM_PROVIDER=ollama` in the API `.env`. Documented in `.env.example`.

### Multi-Layer LLM Cart Integrity
The LLM was exhibiting three distinct failure modes that each needed a separate fix:

1. **Duplicate entries** — `applyCartDiff` on the server was blindly appending `diff.added` to the cart array. Changed to a merge-by-`itemId` loop that adds to `quantity` if the item already exists.
2. **Double tool calls in one turn** — LLM would call `add_item` twice for the same `itemId` in a single agentic turn. Chat route now skips (not sums) any `itemId` already present in `mergedDiff.added` for that turn.
3. **Re-adding on vague replies** — After "Yess" or "ok", the LLM would re-add items from earlier turns. Fixed with two guards: (a) the cart state is prepended to the last user message as a bracketed constraint (`[Cart already has: ... — do NOT add these again]`), and (b) the current cart state is appended to the last tool result after each iteration so the model sees it continuously.

Also added `z.coerce.number()` on quantity fields in tool schemas — Ollama passes quantity as a string, which Zod would otherwise reject.

### Premium UI Overhaul

**Chat screen**
- AI avatar (30×30 espresso circle with gold "S") beside every assistant bubble
- Message timestamps below each bubble using `toLocaleTimeString`
- 3-dot animated typing indicator with staggered `Animated.loop` while response is loading
- Suggestion chips on empty state (`"I'd like a pizza"`, `"Show me vegan options"`, `"Surprise me"`) that populate the input on tap
- Gold `#C9A84C55` focus ring on the input bar
- Send button glows gold with shadow when input is non-empty

**Menu screen**
- `ITEM_EMOJI` map: every menu item gets a unique emoji in a rounded artwork box
- Chef's Special items: full-width dark ribbon (`CHEF'S SPECIAL`), gold border on the card
- Dietary tags redesigned: `🌱 Vegan`, `🥦 Veggie`, `🌾 GF` with colour-coded pill backgrounds
- Price shown in a cream badge (`#FDF6E3`) at the card footer
- In-cart quantity badge overlaid next to the add button

**Cart screen**
- Order Summary card: subtotal row, service charge row (10%), divider, total in large gold text
- `OrderConfirmedModal` replaces `Alert.alert` — spring-animated card (scale 0.85→1 + fade) over a dark overlay, order ID badge, estimated wait badge, Done button
- Bug fix: modal was never rendering because `clear()` triggered the `items.length === 0` early-return before `setOrderResult` could mount it. Fixed by guarding with `items.length === 0 && !orderResult`.

**Layout**
- Savour wordmark header (gold monogram badge + `SAVOUR` / `AI DINING` wordmark) across all tabs
- Tab bar darkened to `#2A1D12`; `AnimatedCartIcon` springs to 1.4× when item is added
- Full-screen splash on launch: fade-in + spring scale, auto-dismisses after 2.4 s

### CHANGELOG.md
Added `CHANGELOG.md` at repo root following Keep a Changelog format, covering all three phases.

---

## Decisions Made

- **ADR 0005** — `OpenAICompatibleProvider` abstract base class (see `docs/adr/0005-openai-compatible-base-class.md`)
- **ADR 0006** — Multi-layer LLM cart integrity (see `docs/adr/0006-multi-layer-cart-integrity.md`)

The custom modal decision (replacing `Alert.alert`) was a UI call, not an architectural one — `Alert` is unthemeable and breaks the premium feel, so a custom `Modal` was the only viable path.

---

## Problems Hit + How I Solved Them

| Problem | Root Cause | Fix |
|---|---|---|
| Ollama quantity as string | Zod `z.number()` rejects `"2"` | `z.coerce.number()` on all quantity fields |
| Cart showing 4 pizzas (ordered 2) | `applyCartDiff` appended duplicates | Merge-by-`itemId` loop on server |
| LLM calling `add_item` twice | Tool called twice in one agentic turn | Skip duplicate `itemId` in `mergedDiff.added` |
| LLM re-adding pizza on "Yess" | Model inferred from chat history | Prepend cart state to last user message |
| LLM miscounting items | No mid-loop cart feedback | Append "Cart now: …" to last tool result each iteration |
| `OrderConfirmedModal` never shown | `clear()` triggered empty-cart early-return | Guard: `items.length === 0 && !orderResult` |
| Logo on edge of header | `headerStyle.height: 80` too short | Bumped to `115` |
| Phone can't reach API | Wrong LAN IP in `.env` | `ipconfig getifaddr en1` → `192.168.1.170` |

---

## Tomorrow's Plan

- Day 4: tests, CI green check, EAS preview build
- Deploy API to Railway or Render
- Record Loom walkthrough (most critical submission deliverable)

---

## Links to Commits & PRs

- PR #17 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/17 — Ollama provider + shared base class + LLM cart fixes
- PR #18 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/18 — Premium UI overhaul + OrderConfirmedModal + CHANGELOG
