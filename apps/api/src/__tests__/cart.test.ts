import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { CartItem } from '@bistro/shared';

// ─── applyCartDiff (via /chat route, mocked LLM) ───────────────────────────

function mockLLM(toolCalls: { name: string; arguments: Record<string, unknown> }[]) {
  vi.doMock('../services/llm', () => ({
    createLLMProvider: () => ({
      chat: vi.fn().mockResolvedValue({ text: 'Done!', toolCalls }),
    }),
  }));
}

const pizza: CartItem = { itemId: 'main-01', name: 'Margherita Pizza', quantity: 2, unitPrice: 1595 };
const espresso: CartItem = { itemId: 'drink-03', name: 'Espresso', quantity: 1, unitPrice: 350 };

// ─── applyCartDiff unit tests ────────────────────────────────────────────────

// Import the function indirectly via route behaviour (it's not exported).
// We test it by sending a crafted cart + tool call and inspecting the resulting diff.

describe('applyCartDiff — merge on add', () => {
  it('increments quantity when adding an item already in cart', async () => {
    vi.resetModules();
    vi.doMock('../services/llm', () => ({
      createLLMProvider: () => ({
        chat: vi.fn().mockResolvedValue({
          text: 'Added!',
          toolCalls: [{ id: 'c1', name: 'add_item', arguments: { itemId: 'main-01', quantity: 1 } }],
        }),
      }),
    }));
    const { app: freshApp } = await import('../index');

    const res = await request(freshApp)
      .post('/chat')
      .send({ messages: [{ role: 'user', content: 'one more pizza', timestamp: 1 }], cart: [pizza] });

    expect(res.status).toBe(200);
    // The diff should reflect only the new addition (quantity: 1), not the full merged cart
    expect(res.body.cartDiff.added[0].itemId).toBe('main-01');
    expect(res.body.cartDiff.added[0].quantity).toBe(1);
  });
});

describe('applyCartDiff — remove', () => {
  it('includes removed itemId in cartDiff', async () => {
    vi.resetModules();
    vi.doMock('../services/llm', () => ({
      createLLMProvider: () => ({
        chat: vi.fn().mockResolvedValue({
          text: 'Removed!',
          toolCalls: [{ id: 'c1', name: 'remove_item', arguments: { itemId: 'main-01' } }],
        }),
      }),
    }));
    const { app: freshApp } = await import('../index');

    const res = await request(freshApp)
      .post('/chat')
      .send({ messages: [{ role: 'user', content: 'remove pizza', timestamp: 1 }], cart: [pizza] });

    expect(res.status).toBe(200);
    expect(res.body.cartDiff.removed).toContain('main-01');
  });
});

describe('applyCartDiff — clear', () => {
  it('sets cleared:true in cartDiff', async () => {
    vi.resetModules();
    vi.doMock('../services/llm', () => ({
      createLLMProvider: () => ({
        chat: vi.fn().mockResolvedValue({
          text: 'Cleared!',
          toolCalls: [{ id: 'c1', name: 'clear_cart', arguments: {} }],
        }),
      }),
    }));
    const { app: freshApp } = await import('../index');

    const res = await request(freshApp)
      .post('/chat')
      .send({ messages: [{ role: 'user', content: 'clear my cart', timestamp: 1 }], cart: [pizza, espresso] });

    expect(res.status).toBe(200);
    expect(res.body.cartDiff.cleared).toBe(true);
  });
});

// ─── Chat route deduplication ────────────────────────────────────────────────

describe('POST /chat — LLM duplicate tool call deduplication', () => {
  it('only adds an item once when LLM calls add_item twice for the same itemId', async () => {
    vi.resetModules();
    vi.doMock('../services/llm', () => ({
      createLLMProvider: () => ({
        chat: vi.fn().mockResolvedValue({
          text: 'Added pizza!',
          toolCalls: [
            { id: 'c1', name: 'add_item', arguments: { itemId: 'main-01', quantity: 1 } },
            { id: 'c2', name: 'add_item', arguments: { itemId: 'main-01', quantity: 1 } },
          ],
        }),
      }),
    }));
    const { app: freshApp } = await import('../index');

    const res = await request(freshApp)
      .post('/chat')
      .send({ messages: [{ role: 'user', content: 'add a pizza', timestamp: 1 }], cart: [] });

    expect(res.status).toBe(200);
    const added = res.body.cartDiff.added;
    const pizzaEntries = added.filter((i: CartItem) => i.itemId === 'main-01');
    expect(pizzaEntries).toHaveLength(1);
    expect(pizzaEntries[0].quantity).toBe(1);
  });

  it('adds two different items from two tool calls', async () => {
    vi.resetModules();
    vi.doMock('../services/llm', () => ({
      createLLMProvider: () => ({
        chat: vi.fn().mockResolvedValue({
          text: 'Added both!',
          toolCalls: [
            { id: 'c1', name: 'add_item', arguments: { itemId: 'main-01', quantity: 1 } },
            { id: 'c2', name: 'add_item', arguments: { itemId: 'drink-03', quantity: 1 } },
          ],
        }),
      }),
    }));
    const { app: freshApp } = await import('../index');

    const res = await request(freshApp)
      .post('/chat')
      .send({ messages: [{ role: 'user', content: 'pizza and espresso', timestamp: 1 }], cart: [] });

    expect(res.status).toBe(200);
    expect(res.body.cartDiff.added).toHaveLength(2);
  });
});

// ─── Quantity coercion ────────────────────────────────────────────────────────

import { executeTool } from '../services/tools';

describe('executeTool — quantity coercion', () => {
  it('accepts quantity as a string (Ollama passes strings)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = executeTool('add_item', { itemId: 'main-01', quantity: '2' as any }, []);
    expect(result.cartDiff.added).toHaveLength(1);
    expect(result.cartDiff.added![0].quantity).toBe(2);
  });

  it('rejects non-numeric string quantity gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = executeTool('add_item', { itemId: 'main-01', quantity: 'lots' as any }, []);
    expect(result.cartDiff.added).toBeUndefined();
    expect(result.toolResultContent).toContain('Invalid');
  });

  it('accepts string quantity for update_item', () => {
    const cart = [{ itemId: 'main-01', name: 'Margherita Pizza', quantity: 1, unitPrice: 1595 }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = executeTool('update_item', { itemId: 'main-01', quantity: '3' as any }, cart);
    expect(result.cartDiff.updated![0].quantity).toBe(3);
  });
});
