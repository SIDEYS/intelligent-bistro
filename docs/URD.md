# User Requirements Document
## The Intelligent Bistro

**Version:** 1.0  
**Date:** 2026-05-16  
**Author:** Siddharth Bhangale  
**Status:** Approved

---

## 1. Purpose

This document defines the user-facing requirements for The Intelligent Bistro — a conversational AI ordering assistant embedded in a React Native mobile app. It serves as the contract between user needs and system behaviour throughout the SDLC.

---

## 2. Stakeholders

| Role | Concern |
|------|---------|
| Diner (primary user) | Place orders quickly and naturally through conversation |
| Restaurant Staff | Receive accurate, structured orders with no ambiguity |
| Evaluating Reviewer | Assess engineering quality, SDLC rigour, and AI integration |

---

## 3. User Personas

### 3.1 — The Casual Diner (Maya, 28)
- Eats out 3–4 times a week; comfortable with mobile apps
- Wants to order without reading an entire menu; prefers to just say what she feels like
- Frustrated by multi-step checkout flows
- **Key need:** "Just let me talk to it like I'm talking to a waiter."

### 3.2 — The Indecisive Diner (Rohan, 35)
- Changes his mind mid-order; often asks "what comes with this?"
- Wants to modify items (no onions, extra sauce) without starting over
- **Key need:** "I need to feel like my changes are actually heard and confirmed."

### 3.3 — The Group Orderer (Priya, 24)
- Ordering for a table; adding multiple items across several messages
- Needs a clear running cart she can review before confirming
- **Key need:** "Show me everything in the cart before I pay."

---

## 4. Functional Requirements

### 4.1 Conversational Ordering
| ID | Requirement |
|----|-------------|
| FR-01 | The user shall be able to describe an order in natural language (e.g. "I'd like a margherita pizza and a Diet Coke"). |
| FR-02 | The assistant shall confirm each item added to the cart within the same turn. |
| FR-03 | The user shall be able to modify an existing cart item by describing the change (e.g. "make that a large"). |
| FR-04 | The user shall be able to remove items by name (e.g. "actually, drop the Coke"). |
| FR-05 | The user shall be able to ask about menu items and receive accurate descriptions and prices. |
| FR-06 | The assistant shall handle ambiguous requests by asking a single clarifying question. |
| FR-07 | The user shall be able to say "clear my order" or equivalent to reset the cart. |

### 4.2 Cart & Checkout
| ID | Requirement |
|----|-------------|
| FR-08 | The user shall be able to view a summary of their current cart at any time. |
| FR-09 | The cart shall display item names, customisations, quantities, and a running total. |
| FR-10 | The user shall confirm the order before it is submitted. |
| FR-11 | Upon confirmation, the system shall display a unique order ID and estimated wait time. |

### 4.3 Menu
| ID | Requirement |
|----|-------------|
| FR-12 | The system shall expose a browsable menu with categories (starters, mains, desserts, drinks). |
| FR-13 | Each menu item shall have a name, description, price, and dietary tags (vegan, gluten-free, etc.). |
| FR-14 | The assistant shall only recommend items that exist on the menu. |

### 4.4 Conversation UX
| ID | Requirement |
|----|-------------|
| FR-15 | The chat interface shall display a typing indicator while the assistant is generating a response. |
| FR-16 | The user shall be able to scroll through full conversation history within a session. |
| FR-17 | Error messages shall be friendly and actionable, never expose raw API errors. |

---

## 5. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | **Latency:** Assistant first-token response shall appear within 2 seconds under normal network conditions. |
| NFR-02 | **Cost:** LLM inference cost shall be $0 for the evaluation period (Groq free tier). |
| NFR-03 | **Offline resilience:** The app shall display a graceful error state when the API is unreachable. |
| NFR-04 | **Type safety:** All data crossing API boundaries shall be validated with Zod schemas. |
| NFR-05 | **Accessibility:** Interactive elements shall meet WCAG 2.1 AA contrast ratios. |
| NFR-06 | **Correctness:** Cart state shall never diverge from what the assistant has confirmed verbally. |
| NFR-07 | **Testability:** LLM calls shall be abstracted so tests run fully offline using recorded fixtures. |

---

## 6. Constraints

- LLM provider: Groq (`llama-3.3-70b-versatile`) — no paid APIs.
- Platform: iOS and Android via Expo managed workflow.
- Timeline: 4 days total.
- Cart mutations must use LLM tool calling — never free-text JSON parsing.

---

## 7. Out of Scope

- Payment processing
- Multi-restaurant support
- User accounts / order history persistence across sessions
- Push notifications
- Real kitchen integration

---

## 8. Acceptance Criteria

The system is accepted when:
1. A user can complete a full order (browse → add → modify → confirm) entirely through conversation.
2. The cart UI always reflects the assistant's confirmed state.
3. All CI checks pass on the main branch.
4. A reviewer can run the app locally with a single `pnpm dev` command.
