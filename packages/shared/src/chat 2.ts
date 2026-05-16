import { z } from 'zod';
import { CartItemSchema, CartDiffSchema } from './cart';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.number(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  cart: z.array(CartItemSchema),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  reply: z.string(),
  cartDiff: CartDiffSchema,
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
