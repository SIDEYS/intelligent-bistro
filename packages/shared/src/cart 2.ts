import { z } from 'zod';

export const CartItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().positive(),
  customisation: z.string().optional(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartDiffSchema = z.object({
  added: z.array(CartItemSchema).optional(),
  removed: z.array(z.string()).optional(),
  updated: z.array(CartItemSchema).optional(),
  cleared: z.boolean().optional(),
});
export type CartDiff = z.infer<typeof CartDiffSchema>;
