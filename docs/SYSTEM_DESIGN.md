# System Design
## The Intelligent Bistro

**Version:** 1.0  
**Date:** 2026-05-16  
**Author:** Siddharth Bhangale  
**Status:** Approved

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Mobile App (Expo)                  │
│                                                     │
│  ┌─────────────┐   ┌──────────────┐  ┌──────────┐   │
│  │  Chat UI    │   │  Cart UI     │  │ Menu UI  │   │
│  └──────┬──────┘   └──────┬───────┘  └────┬─────┘   │
│         │                 │               │         │
│         └─────────────────┼───────────────┘         │
│                           │                         │
│                    ┌──────▼──────┐                  │
│                    │  Zustand    │                  │
│                    │  Store      │                  │
│                    └──────┬──────┘                  │
└───────────────────────────┼─────────────────────────┘
                            │ HTTP (REST)
                            │
┌───────────────────────────▼─────────────────────────┐
│                  API Server (Express)               │
│                                                     │
│  ┌──────────────┐   ┌───────────────────────────┐   │
│  │  /chat route │──▶│  LLM Provider Abstraction │   │
│  └──────────────┘   └───────────┬───────────────┘   │
│                                 │                   │
│  ┌──────────────┐   ┌───────────▼───────────────┐   │
│  │  /menu route │   │  Tool Executor            │   │
│  └──────────────┘   │  (add/remove/clear cart)  │   │
│                     └───────────────────────────┘   │
│  ┌──────────────┐                                   │
│  │  /orders     │                                   │
│  │  route       │                                   │
│  └──────────────┘                                   │
└─────────────────────┬───────────────────────────────┘
                      │
          ┌───────────▼───────────┐
          │   Groq API            │
          │   (llama-3.3-70b)     │
          │                       │
          │   — or —              │
          │                       │
          │   Ollama (local)      │
          └───────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Mobile App (`apps/mobile`)

| Component | Responsibility |
|-----------|---------------|
| `app/(tabs)/chat.tsx` | Conversational UI — message list, input bar, typing indicator |
| `app/(tabs)/menu.tsx` | Browsable menu grid with categories and item detail |
| `app/(tabs)/cart.tsx` | Live cart summary with line items, total, and confirm button |
| `store/chatStore.ts` | Zustand slice — conversation history, loading state |
| `store/cartStore.ts` | Zustand slice — cart items, derived total |
| `services/api.ts` | Typed HTTP client wrapping fetch calls to the backend |
| `packages/shared` | Zod schemas and TypeScript types shared with the backend |

### 2.2 API Server (`apps/api`)

| Module | Responsibility |
|--------|---------------|
| `routes/chat.ts` | Receives message + cart state, calls LLM, returns reply + tool results |
| `routes/menu.ts` | Serves the static menu catalogue |
| `routes/orders.ts` | Accepts confirmed orders, returns order ID + wait time |
| `services/llm/provider.ts` | Abstract `LLMProvider` interface |
| `services/llm/groq.ts` | Groq implementation (OpenAI-compatible SDK) |
| `services/llm/ollama.ts` | Ollama implementation for offline use |
| `services/tools.ts` | Tool definitions and executor for cart actions |
| `data/menu.ts` | In-memory menu catalogue (source of truth) |

---

## 3. LLM Integration Design

### 3.1 Provider Abstraction

```typescript
interface LLMProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}

// Resolved at startup via env var:
// LLM_PROVIDER=groq  → GroqProvider
// LLM_PROVIDER=ollama → OllamaProvider
```

### 3.2 Tool Calling Flow

The LLM never returns cart mutations as free text. All cart actions are
expressed as tool calls, executed server-side, and the result is returned
to the client.

```
Client sends:  { messages, cartState }
                        │
               ┌────────▼────────┐
               │  Build prompt   │
               │  + tool defs    │
               └────────┬────────┘
                        │
               ┌────────▼────────┐
               │   LLM call      │
               └────────┬────────┘
                        │
            ┌───────────┴───────────┐
            │ text reply?           │ tool call?
            ▼                       ▼
        Return text            Execute tool
        to client              → mutate cart
                               → call LLM again
                               → return text + cartDiff
```

### 3.3 Defined Tools

| Tool | Parameters | Effect |
|------|-----------|--------|
| `add_item` | `itemId`, `quantity`, `customisation?` | Adds item to cart |
| `remove_item` | `itemId` | Removes item from cart |
| `update_item` | `itemId`, `quantity`, `customisation?` | Updates existing cart line |
| `clear_cart` | — | Empties the cart |
| `get_menu` | `category?` | Returns menu items (for LLM context) |

---

## 4. Data Models

### 4.1 MenuItem (shared)
```typescript
type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;        // in cents
  category: 'starter' | 'main' | 'dessert' | 'drink';
  tags: string[];       // 'vegan', 'gluten-free', etc.
};
```

### 4.2 CartItem (shared)
```typescript
type CartItem = {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  customisation?: string;
};
```

### 4.3 ChatMessage (shared)
```typescript
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};
```

### 4.4 POST /chat — Request / Response
```typescript
// Request
type ChatRequest = {
  messages: ChatMessage[];
  cart: CartItem[];
};

// Response
type ChatResponse = {
  reply: string;
  cartDiff: {
    added?: CartItem[];
    removed?: string[];   // itemIds
    updated?: CartItem[];
    cleared?: boolean;
  };
};
```

---

## 5. State Management

Cart state lives in **two places** and must be kept in sync:

| Location | Purpose |
|----------|---------|
| Zustand `cartStore` (mobile) | Source of truth for UI rendering |
| `CartItem[]` sent in each `/chat` request | Context for the LLM |

On every `/chat` response, the mobile app applies `cartDiff` to the Zustand
store. This ensures the UI and LLM always agree on cart contents.

---

## 6. API Routes Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/menu` | None | Return full menu catalogue |
| GET | `/menu/:category` | None | Return items by category |
| POST | `/chat` | None | Send message, get reply + cartDiff |
| POST | `/orders` | None | Submit confirmed cart, get order ID |

---

## 7. Error Handling Strategy

| Layer | Strategy |
|-------|---------|
| Zod (API boundary) | Reject malformed requests with 400 + structured error |
| LLM timeout | Return 504 with friendly message; client shows retry prompt |
| Tool execution failure | Log server-side; return assistant message explaining the issue |
| Network offline (mobile) | Zustand detects fetch failure; shows offline banner |

---

## 8. Testing Strategy

| Layer | Tool | Approach |
|-------|------|---------|
| API routes | Vitest + Supertest | Hit real Express routes; LLM replaced with fixture |
| Tool executor | Vitest | Unit test each tool function in isolation |
| Mobile components | RNTL | Render with mocked store and API responses |
| LLM fixture | Recorded JSON | Captured from real Groq call; committed to repo |

---

## 9. Deployment

| Component | Platform | Trigger |
|-----------|---------|---------|
| API | Railway (or Render) | Push to `main` → auto-deploy |
| Mobile | EAS Preview Build | Manual `eas build --profile preview` |
| CI | GitHub Actions | Every push / PR |
