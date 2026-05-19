import { z } from 'zod';
import { CartItem, CartDiff } from '@bistro/shared';
import { MENU } from '../data/menu';
import { LLMTool } from './llm';

const AddItemArgsSchema = z.object({
  itemId: z.string(),
  quantity: z.coerce.number().int().positive(),
  customisation: z.string().optional(),
});

const RemoveItemArgsSchema = z.object({
  itemId: z.string(),
});

const UpdateItemArgsSchema = z.object({
  itemId: z.string(),
  quantity: z.coerce.number().int().positive(),
  customisation: z.string().optional(),
});

const GetMenuArgsSchema = z.object({
  category: z.enum(['starter', 'main', 'dessert', 'drink']).optional(),
});

export const TOOL_DEFINITIONS: LLMTool[] = [
  {
    name: 'add_item',
    description: 'Add a menu item to the cart.',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'The menu item ID to add.' },
        quantity: { type: 'number', description: 'How many to add.' },
        customisation: { type: 'string', description: 'Optional customisation note (e.g. "no onions").' },
      },
      required: ['itemId', 'quantity'],
    },
  },
  {
    name: 'remove_item',
    description: 'Remove a menu item from the cart entirely.',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'The menu item ID to remove.' },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'update_item',
    description: 'Update the quantity or customisation of an item already in the cart.',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'The menu item ID to update.' },
        quantity: { type: 'number', description: 'New quantity.' },
        customisation: { type: 'string', description: 'Updated customisation note.' },
      },
      required: ['itemId', 'quantity'],
    },
  },
  {
    name: 'clear_cart',
    description: 'Remove all items from the cart.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_menu',
    description: 'Retrieve menu items, optionally filtered by category.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['starter', 'main', 'dessert', 'drink'],
          description: 'Filter by category. Omit to get the full menu.',
        },
      },
    },
  },
];

export interface ToolResult {
  cartDiff: CartDiff;
  toolResultContent: string;
}

export function executeTool(
  name: string,
  args: Record<string, unknown> | null,
  currentCart: CartItem[]
): ToolResult {
  const safeArgs = args ?? {};
  switch (name) {
    case 'add_item': {
      const { itemId, quantity, customisation } = AddItemArgsSchema.parse(safeArgs);
      const menuItem = MENU.find((m) => m.id === itemId);
      if (!menuItem) {
        return { cartDiff: {}, toolResultContent: `Item ${itemId} not found on the menu.` };
      }
      const newItem: CartItem = {
        itemId,
        name: menuItem.name,
        quantity,
        unitPrice: menuItem.price,
        customisation,
      };
      return {
        cartDiff: { added: [newItem] },
        toolResultContent: `Added ${quantity}x ${menuItem.name} to the cart.`,
      };
    }

    case 'remove_item': {
      const { itemId } = RemoveItemArgsSchema.parse(safeArgs);
      const exists = currentCart.some((i) => i.itemId === itemId);
      if (!exists) {
        return { cartDiff: {}, toolResultContent: `Item ${itemId} is not in the cart.` };
      }
      return {
        cartDiff: { removed: [itemId] },
        toolResultContent: `Removed ${itemId} from the cart.`,
      };
    }

    case 'update_item': {
      const { itemId, quantity, customisation } = UpdateItemArgsSchema.parse(safeArgs);
      const existing = currentCart.find((i) => i.itemId === itemId);
      if (!existing) {
        return { cartDiff: {}, toolResultContent: `Item ${itemId} is not in the cart.` };
      }
      const updated: CartItem = { ...existing, quantity, customisation };
      return {
        cartDiff: { updated: [updated] },
        toolResultContent: `Updated ${itemId} to quantity ${quantity}.`,
      };
    }

    case 'clear_cart': {
      return {
        cartDiff: { cleared: true },
        toolResultContent: 'Cart cleared.',
      };
    }

    case 'get_menu': {
      const { category } = GetMenuArgsSchema.parse(safeArgs);
      const items = category ? MENU.filter((m) => m.category === category) : MENU;
      return {
        cartDiff: {},
        toolResultContent: JSON.stringify(items),
      };
    }

    default:
      return { cartDiff: {}, toolResultContent: `Unknown tool: ${name}` };
  }
}
