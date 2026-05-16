import { Router } from 'express';
import { ChatRequestSchema, CartItem, CartDiff } from '@bistro/shared';
import { createLLMProvider } from '../services/llm';
import { TOOL_DEFINITIONS, executeTool } from '../services/tools';

const router = Router();
const llm = createLLMProvider();

function applyCartDiff(cart: CartItem[], diff: CartDiff): CartItem[] {
  if (diff.cleared) return [];

  let updated = [...cart];

  if (diff.added) {
    for (const item of diff.added) {
      const existing = updated.findIndex((i) => i.itemId === item.itemId);
      if (existing >= 0) {
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + item.quantity,
        };
      } else {
        updated.push(item);
      }
    }
  }

  if (diff.removed) {
    updated = updated.filter((i) => !diff.removed!.includes(i.itemId));
  }

  if (diff.updated) {
    for (const item of diff.updated) {
      const idx = updated.findIndex((i) => i.itemId === item.itemId);
      if (idx >= 0) updated[idx] = item;
    }
  }

  return updated;
}

router.post('/', async (req, res) => {
  const result = ChatRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid request', details: result.error.flatten() });
    return;
  }

  const { messages, cart } = result.data;
  let currentCart = [...cart];
  const mergedDiff: CartDiff = {};

  try {
    const llmResponse = await llm.chat({ messages, cart: currentCart, tools: TOOL_DEFINITIONS });

    if (llmResponse.toolCalls.length > 0) {
      for (const toolCall of llmResponse.toolCalls) {
        const { cartDiff } = executeTool(toolCall.name, toolCall.arguments, currentCart);

        if (cartDiff.cleared) {
          mergedDiff.cleared = true;
          currentCart = [];
        }
        if (cartDiff.added) {
          mergedDiff.added = [...(mergedDiff.added ?? []), ...cartDiff.added];
          currentCart = applyCartDiff(currentCart, { added: cartDiff.added });
        }
        if (cartDiff.removed) {
          mergedDiff.removed = [...(mergedDiff.removed ?? []), ...cartDiff.removed];
          currentCart = applyCartDiff(currentCart, { removed: cartDiff.removed });
        }
        if (cartDiff.updated) {
          mergedDiff.updated = [...(mergedDiff.updated ?? []), ...cartDiff.updated];
          currentCart = applyCartDiff(currentCart, { updated: cartDiff.updated });
        }
      }

      const followUp = await llm.chat({
        messages,
        cart: currentCart,
        tools: TOOL_DEFINITIONS,
      });

      res.json({ reply: followUp.text ?? 'Done!', cartDiff: mergedDiff });
      return;
    }

    res.json({ reply: llmResponse.text ?? "I'm here to help!", cartDiff: mergedDiff });
  } catch (err) {
    console.error('[chat] LLM error:', err);
    res.status(504).json({
      error: 'The kitchen is a bit busy right now. Please try again in a moment.',
    });
  }
});

export default router;
