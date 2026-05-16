import { create } from 'zustand';
import { CartItem, CartDiff } from '@bistro/shared';

interface CartState {
  items: CartItem[];
  applyDiff: (diff: CartDiff) => void;
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

  clear: () => set({ items: [] }),
}));

export const selectCartTotal = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);
