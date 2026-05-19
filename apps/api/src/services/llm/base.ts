import OpenAI from 'openai';
import { CartItem } from '@bistro/shared';
import { LLMProvider, LLMChatRequest, LLMChatResponse } from './provider';
import { executeTool } from '../tools';
import { MENU } from '../../data/menu';

const MENU_CONTEXT = MENU.map((i) => {
  const tags = i.tags.length ? ` [${i.tags.join(', ')}]` : '';
  return `${i.id} | ${i.name} | £${(i.price / 100).toFixed(2)} | ${i.category}${tags}`;
}).join('\n');

const dietaryList = (tag: string) =>
  MENU.filter((i) => i.tags.includes(tag))
    .map((i) => `  - ${i.id} | ${i.name}`)
    .join('\n');

export const SYSTEM_PROMPT = `You are a warm waiter at The Intelligent Bistro.

TODAY'S SPECIALS (add ALL of these when guest asks for "specials"):
${dietaryList('special')}

VEGAN ITEMS (add ALL of these when guest asks for vegan):
${dietaryList('vegan')}

VEGETARIAN ITEMS (add ALL of these when guest asks for vegetarian or "veggie"):
${dietaryList('vegetarian')}

GLUTEN-FREE ITEMS (add ALL of these when guest asks for gluten-free):
${dietaryList('gluten-free')}

FULL MENU (use these exact IDs when calling tools):
${MENU_CONTEXT}

Rules:
- CRITICAL: Only call tools for items the guest EXPLICITLY names in their CURRENT message. NEVER infer or re-add items from earlier in the conversation.
- Never call add_item more than once for the same itemId in a single response. If adding multiple quantities of the same item, use quantity > 1 in a single call.
- Items tagged "special" in the menu are today's chef's specials.
- If the guest requests something NOT listed in the MENU above, do NOT add any substitute or similar item. Just say it is not available and ask if they would like something else.
- To add an item, call add_item with the exact itemId from the menu above. Do NOT call get_menu first.
- You may call multiple tools in one turn when the guest mentions multiple items in the same message.
- When removing or updating, only act on the EXACT item(s) the guest mentioned. Never remove other items.
- After tool calls complete, confirm only what was just added/removed in friendly plain language.
- Never show tool names, item IDs, or JSON to the guest.
- Prices in pence internally; display as £ with two decimal places.`;

interface ProviderConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  /** Attempt recovery from Groq-style legacy <function=name{...}> tool call errors */
  legacyRecovery?: boolean;
}

function applyCartDiff(cart: CartItem[], diff: ReturnType<typeof executeTool>['cartDiff']): CartItem[] {
  let result = [...cart];
  if (diff.cleared) result = [];
  if (diff.added) result = [...result, ...diff.added];
  if (diff.removed) result = result.filter((item) => !diff.removed!.includes(item.itemId));
  if (diff.updated)
    result = result.map((item) => diff.updated!.find((u) => u.itemId === item.itemId) ?? item);
  return result;
}

export abstract class OpenAICompatibleProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;
  private legacyRecovery: boolean;

  constructor(config: ProviderConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
    this.model = config.model;
    this.legacyRecovery = config.legacyRecovery ?? false;
  }

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    const cartSummary =
      request.cart.length === 0
        ? 'Cart is currently empty.'
        : `Cart: ${request.cart.map((i) => `${i.name} x${i.quantity}`).join(', ')}`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${cartSummary}` },
      ...request.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const tools: OpenAI.Chat.ChatCompletionTool[] = request.tools
      .filter((t) => t.name !== 'get_menu')
      .map((t) => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));

    const mergedToolCalls: LLMChatResponse['toolCalls'] = [];
    let currentCart = [...request.cart];

    for (let i = 0; i < 10; i++) {
      let choice: OpenAI.Chat.ChatCompletion['choices'][0];

      try {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages,
          tools,
          tool_choice: 'auto',
        });
        choice = response.choices[0];
      } catch (err: unknown) {
        if (this.legacyRecovery) {
          const apiErr = err as { error?: { code?: string; failed_generation?: string } };
          if (apiErr?.error?.code === 'tool_use_failed' && apiErr.error.failed_generation) {
            const match = apiErr.error.failed_generation.match(
              /<function=(\w+)[^{]*({.*?})<\/function>/s
            );
            if (match) {
              const name = match[1];
              const args = JSON.parse(match[2]) as Record<string, unknown>;
              const fakeId = `recovered_${Date.now()}`;
              const { toolResultContent, cartDiff } = executeTool(name, args, currentCart);
              mergedToolCalls.push({ id: fakeId, name, arguments: args });
              currentCart = applyCartDiff(currentCart, cartDiff);
              messages.push({ role: 'tool', tool_call_id: fakeId, content: toolResultContent });
              continue;
            }
          }
        }
        throw err;
      }

      if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
        return { text: choice.message.content, toolCalls: mergedToolCalls };
      }

      messages.push({ role: 'assistant', content: null, tool_calls: choice.message.tool_calls });

      for (const tc of choice.message.tool_calls) {
        const args = tc.function.arguments
          ? (JSON.parse(tc.function.arguments) as Record<string, unknown>)
          : null;

        const { toolResultContent, cartDiff } = executeTool(tc.function.name, args, currentCart);
        mergedToolCalls.push({ id: tc.id, name: tc.function.name, arguments: args ?? {} });
        currentCart = applyCartDiff(currentCart, cartDiff);
        messages.push({ role: 'tool', tool_call_id: tc.id, content: toolResultContent });
      }

      // Append current cart state to the last tool result so the LLM counts accurately
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'tool') {
        const cartState =
          currentCart.length === 0
            ? 'Cart is now empty.'
            : `Cart now: ${currentCart.map((i) => `${i.name} x${i.quantity}`).join(', ')}`;
        (lastMsg as { role: 'tool'; tool_call_id: string; content: string }).content +=
          `\n${cartState}`;
      }
    }

    return { text: 'Done! Is there anything else?', toolCalls: mergedToolCalls };
  }
}
