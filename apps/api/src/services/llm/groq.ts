import OpenAI from 'openai';
import { LLMProvider, LLMChatRequest, LLMChatResponse } from './provider';
import { executeTool } from '../tools';
import { MENU } from '../../data/menu';

const MENU_CONTEXT = MENU.map(
  (i) => `${i.id} | ${i.name} | £${(i.price / 100).toFixed(2)} | ${i.category}`
).join('\n');

const SYSTEM_PROMPT = `You are a warm waiter at The Intelligent Bistro.

MENU (use these exact IDs when calling tools):
${MENU_CONTEXT}

Rules:
- CRITICAL: Only call tools for items the guest EXPLICITLY names in their CURRENT message. NEVER infer or re-add items from earlier in the conversation.
- To add an item, call add_item with the exact itemId from the menu above. Do NOT call get_menu first.
- You may call multiple tools in one turn when the guest mentions multiple items in the same message.
- When removing or updating, only act on the EXACT item(s) the guest mentioned. Never remove other items.
- After tool calls complete, confirm only what was just added/removed in friendly plain language.
- Never show tool names, item IDs, or JSON to the guest.
- Prices in pence internally; display as £ with two decimal places.`;

export class GroqProvider implements LLMProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY ?? '',
      baseURL: 'https://api.groq.com/openai/v1',
    });
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

    for (let i = 0; i < 5; i++) {
      let choice: OpenAI.Chat.ChatCompletion['choices'][0];

      try {
        const response = await this.client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages,
          tools,
          tool_choice: 'auto',
        });
        choice = response.choices[0];
      } catch (err: unknown) {
        const apiErr = err as { error?: { code?: string; failed_generation?: string } };
        if (apiErr?.error?.code === 'tool_use_failed' && apiErr.error.failed_generation) {
          const match = apiErr.error.failed_generation.match(
            /<function=(\w+)\s*({.*?})<\/function>/s
          );
          if (match) {
            const name = match[1];
            const args = JSON.parse(match[2]) as Record<string, unknown>;
            const fakeId = `recovered_${Date.now()}`;
            const { toolResultContent, cartDiff } = executeTool(name, args, currentCart);
            mergedToolCalls.push({ id: fakeId, name, arguments: args });
            if (cartDiff.cleared) currentCart = [];
            if (cartDiff.added) currentCart = [...currentCart, ...cartDiff.added];
            if (cartDiff.removed)
              currentCart = currentCart.filter((item) => !cartDiff.removed!.includes(item.itemId));
            if (cartDiff.updated)
              currentCart = currentCart.map((item) => {
                const u = cartDiff.updated!.find((u) => u.itemId === item.itemId);
                return u ?? item;
              });
            messages.push({ role: 'tool', tool_call_id: fakeId, content: toolResultContent });
            continue;
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

        if (cartDiff.cleared) currentCart = [];
        if (cartDiff.added) currentCart = [...currentCart, ...cartDiff.added];
        if (cartDiff.removed)
          currentCart = currentCart.filter((item) => !cartDiff.removed!.includes(item.itemId));
        if (cartDiff.updated)
          currentCart = currentCart.map((item) => {
            const u = cartDiff.updated!.find((u) => u.itemId === item.itemId);
            return u ?? item;
          });

        messages.push({ role: 'tool', tool_call_id: tc.id, content: toolResultContent });
      }
    }

    return { text: 'Done! Is there anything else?', toolCalls: mergedToolCalls };
  }
}
