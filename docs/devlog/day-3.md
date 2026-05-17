# Devlog — Day 3

**Date:** 2026-05-17  
**Phase:** 2 — UI Polish & AI Robustness

---

## What I Built Today

### Savour Branding & Splash Screen
- Full-screen animated splash: "Savour" in Georgia, gold tagline, fade-in + spring scale
- Custom logo badge (gold rounded square + Utensils icon + "SAVOUR" / "AI DINING") applied to all three tab headers
- Warm bistro palette: `#3C2A1E` (espresso), `#C9A84C` (gold), `#FAF7F2` (cream)

### Animations
- **Tab fade**: `useFocusEffect` + `Animated.timing` on every screen — opacity 0→1 on every tab switch
- **Cart icon bounce**: `AnimatedCartIcon` springs to scale 1.4 then back whenever `cartCount` increases
- **Menu + button pulse**: `Animated.spring` to 1.35 and back on press, triggering `addOne` in the cart store
- **Typing indicator**: 3 gold pulsing dots with staggered `Animated.loop` for AI response wait state

### UI Controls
- **Menu screen**: Add-to-cart (+) button on every `MenuCard`, in-cart quantity badge overlaid on the button
- **Cart screen**: Per-row +/− quantity controls (`incrementItem`/`decrementItem`) and red ✕ remove button (`removeItem`)
- New `cartStore` actions: `addOne`, `incrementItem`, `decrementItem`, `removeItem`
- Fixed category pills from stretching vertically: replaced horizontal `FlatList` with `ScrollView` inside a fixed-height `<View style={{ height: 60 }}>`

### Menu Expansion
- Grew from 14 → 24 items: added Beef Carpaccio, Caesar Salad, Spaghetti Carbonara, Chicken Parmesan, Slow-cooked Lamb Shank, Chocolate Fondant, Crème Brûlée, Cappuccino, Aperol Spritz
- Added `special` tag to 4 hero items (Beef Carpaccio, Truffle Mushroom Risotto, Grilled Sea Bass, Chocolate Fondant)
- `TAG_COLOURS` map: special gets `#3C2A1E` background + `#C9A84C` text

### LLM / AI Robustness
- System prompt now embeds four explicit item lists: **TODAY'S SPECIALS**, **VEGAN ITEMS**, **VEGETARIAN ITEMS**, **GLUTEN-FREE ITEMS** (vegan and vegetarian kept separate — LLM was conflating them)
- Each item line includes tags: `id | name | £price | category [tags]`
- Added rules: never substitute unavailable items; never call `add_item` twice for same `itemId`; "veg/veggie = vegetarian, not vegan"
- Deduplication in `chat.ts`: `mergedDiff.added` is de-duped by `itemId` before sending to client, combining quantities if same item appears twice
- Increased agentic loop from 5 → 10 iterations to handle large "add all vegan items" orders (8 tool calls)
- Fixed legacy tool call regex: `/<function=(\w+)\s*({.*?})<\/function>/s` → `/<function=(\w+)[^{]*({.*?})<\/function>/s` to handle `<function=add_item[]{"itemId":...}>` variant

---

## Decisions Made

No new ADRs were needed — all architectural decisions (provider abstraction, tool calling, Zustand, expo-router) were already locked in Phase 1. The dietary grouping approach (explicit lists in system prompt vs. relying on the model's in-context reasoning) was validated empirically — the model consistently missed items when the list wasn't explicit.

---

## Problems Hit + How I Solved Them

- **LLM removing unmentioned items** — "remove the espresso" was also clearing pizza. Fixed with explicit rule: "only act on EXACT items mentioned in the current message."
- **LLM re-ordering from history** — When user asked for pizza, model inferred espresso from earlier turns and added both. Fixed with CRITICAL rule: "never infer or re-add items from earlier messages."
- **Truffle Risotto added twice** — Model called `add_item` twice for the same `itemId`. Fixed with deduplication in `chat.ts` + system prompt rule.
- **Chocolate Fondant (special) not added** — Model didn't know it was a special. Fixed by embedding explicit TODAY'S SPECIALS list with all IDs.
- **"Veg" adding vegan items** — Model conflated vegan and vegetarian. Fixed by keeping them as two separate lists and adding: "veg/veggie = vegetarian, not vegan."
- **`BadRequestError: <function=add_item[]{"itemId":...}`** — Regex `\s*` couldn't match `[]` between function name and args. Fixed to `[^{]*` to skip any characters before the opening brace.
- **Category pills stretching vertically** — `FlatList` with `horizontal` was expanding to fill screen height. Replaced with `ScrollView` inside `<View style={{ height: 60 }}>`.
- **Tab fade not visible** — `animation: 'fade'` in `expo-router` screenOptions didn't fire reliably. Replaced with `useFocusEffect` + `Animated.timing` directly in each screen component.
- **28 macOS duplicate files** — Finder created `* 2.ts` / `* 2.json` copies of every file in `apps/api/src`. Deleted with `rm -rf` and committed.

---

## Tomorrow's Plan

- Ollama provider integration for offline use (swap via `LLM_PROVIDER=ollama`)
- Deploy API to Railway or Render
- EAS preview build (shareable iOS/Android link)
- Write CHANGELOG.md

---

## Links to Commits & PRs

- PR #14 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/14 — LLM prompt robustness
- PR #15 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/15 — Savour branding, splash, animations, 24-item menu
- PR #16 (merged): https://github.com/SIDEYS/intelligent-bistro/pull/16 — UI overhaul, cart controls, dietary AI groups
