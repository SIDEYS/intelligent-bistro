import { create } from 'zustand';
import { CartItem, CartDiff } from '@bistro/shared';

interface CartState {
  items: CartItem[];
  applyDiff: (diff: CartDiff) => void;
  addOne: (item: Omit<CartItem, 'quantity'>) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  removeItem: (itemId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],

  applyDiff: (diff) =>
    set((state) => {
      if (diff.cleared) return { items: [] };
      let items = [...state.items];
      if (diff.added) {
        for (const newItem of diff.added) {
          const idx = items.findIndex((i) => i.itemId === newItem.itemId);
          if (idx >= 0) {
            items[idx] = { ...items[idx], quantity: items[idx].quantity + newItem.quantity };
          } else {
            items.push(newItem);
          }
        }
      }
      if (diff.removed) {
        items = items.filter((i) => !diff.removed!.includes(i.itemId));
      }
      if (diff.updated) {
        for (const updated of diff.updated) {
          const idx = items.findIndex((i) => i.itemId === updated.itemId);
          if (idx >= 0) items[idx] = updated;
        }
      }
      return { items };
    }),

  addOne: (item) =>
    set((state) => {
      const idx = state.items.findIndex((i) => i.itemId === item.itemId);
      if (idx >= 0) {
        const items = [...state.items];
        items[idx] = { ...items[idx], quantity: items[idx].quantity + 1 };
        return { items };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    }),

  incrementItem: (itemId) =>
    set((state) => {
      const items = state.items.map((i) =>
        i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i
      );
      return { items };
    }),

  decrementItem: (itemId) =>
    set((state) => {
      const items = state.items
        .map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);
      return { items };
    }),

  removeItem: (itemId) =>
    set((state) => ({ items: state.items.filter((i) => i.itemId !== itemId) })),

  clear: () => set({ items: [] }),
}));

export const selectCartTotal = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);
