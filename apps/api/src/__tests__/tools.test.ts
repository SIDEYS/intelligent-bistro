import { describe, it, expect } from 'vitest';
import { executeTool } from '../services/tools';
import { CartItem } from '@bistro/shared';

const emptyCart: CartItem[] = [];

const cartWithPizza: CartItem[] = [
  { itemId: 'main-01', name: 'Margherita Pizza', quantity: 1, unitPrice: 1595 },
];

describe('executeTool — add_item', () => {
  it('adds a valid menu item to an empty cart', () => {
    const result = executeTool('add_item', { itemId: 'main-01', quantity: 1 }, emptyCart);
    expect(result.cartDiff.added).toHaveLength(1);
    expect(result.cartDiff.added![0].itemId).toBe('main-01');
    expect(result.cartDiff.added![0].name).toBe('Margherita Pizza');
    expect(result.cartDiff.added![0].unitPrice).toBe(1595);
  });

  it('includes customisation when provided', () => {
    const result = executeTool(
      'add_item',
      { itemId: 'main-01', quantity: 1, customisation: 'no basil' },
      emptyCart
    );
    expect(result.cartDiff.added![0].customisation).toBe('no basil');
  });

  it('returns empty diff for unknown item', () => {
    const result = executeTool('add_item', { itemId: 'fake-99', quantity: 1 }, emptyCart);
    expect(result.cartDiff.added).toBeUndefined();
    expect(result.toolResultContent).toContain('not found');
  });
});

describe('executeTool — remove_item', () => {
  it('removes an item that exists in the cart', () => {
    const result = executeTool('remove_item', { itemId: 'main-01' }, cartWithPizza);
    expect(result.cartDiff.removed).toContain('main-01');
  });

  it('returns empty diff when item is not in cart', () => {
    const result = executeTool('remove_item', { itemId: 'main-01' }, emptyCart);
    expect(result.cartDiff.removed).toBeUndefined();
    expect(result.toolResultContent).toContain('not in the cart');
  });
});

describe('executeTool — update_item', () => {
  it('updates quantity of an existing cart item', () => {
    const result = executeTool('update_item', { itemId: 'main-01', quantity: 3 }, cartWithPizza);
    expect(result.cartDiff.updated).toHaveLength(1);
    expect(result.cartDiff.updated![0].quantity).toBe(3);
  });

  it('returns empty diff when item is not in cart', () => {
    const result = executeTool('update_item', { itemId: 'main-01', quantity: 2 }, emptyCart);
    expect(result.cartDiff.updated).toBeUndefined();
  });
});

describe('executeTool — clear_cart', () => {
  it('sets cleared to true', () => {
    const result = executeTool('clear_cart', {}, cartWithPizza);
    expect(result.cartDiff.cleared).toBe(true);
  });
});

describe('executeTool — get_menu', () => {
  it('returns all items when no category given', () => {
    const result = executeTool('get_menu', {}, emptyCart);
    const items = JSON.parse(result.toolResultContent);
    expect(items.length).toBeGreaterThan(0);
  });

  it('filters by category', () => {
    const result = executeTool('get_menu', { category: 'drink' }, emptyCart);
    const items = JSON.parse(result.toolResultContent);
    expect(items.every((i: { category: string }) => i.category === 'drink')).toBe(true);
  });
});

describe('executeTool — unknown tool', () => {
  it('returns unknown tool message', () => {
    const result = executeTool('nonexistent_tool', {}, emptyCart);
    expect(result.toolResultContent).toContain('Unknown tool');
  });
});
