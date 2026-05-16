import OpenAI from 'openai';
import { MENU } from '../../data/menu';
import { LLMProvider, LLMChatRequest, LLMChatResponse } from './provider';

const SYSTEM_PROMPT = `You are a warm, knowledgeable waiter at The Intelligent Bistro, an upscale Italian-Mediterranean restaurant.

Your job is to help guests order through natural conversation. You have access to the full menu and must use the provided tools to modify the cart — never invent items or prices.

Menu snapshot:
${MENU.map((i) => `- ${i.name} (${i.id}): £${(i.price / 100).toFixed(2)} — ${i.description}`).join('\n')}

Rules:
- Always confirm what you've added/removed/updated in your reply.
- If a guest's request is ambiguous, ask ONE clarifying question.
- Keep replies concise and warm — you're a waiter, not an essay writer.
- Never mention tool names or technical details to the guest.
- Prices are in pence internally; display as £ with two decimal places.`;

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
        ? 'The cart is currently empty.'
        : `Current cart:\n${request.cart
            .map(
              (i) =>
                `- ${i.name} x${i.quantity}${i.customisation ? ` (${i.customisation})` : ''}: £${((i.unitPrice * i.quantity) / 100).toFixed(2)}`
            )
            .join('\n')}`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${cartSummary}` },
      ...request.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const tools: OpenAI.Chat.ChatCompletionTool[] = request.tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto',
    });

    const choice = response.choices[0];
    const toolCalls =
      choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      })) ?? [];

    return {
      text: choice.message.content,
      toolCalls,
    };
  }
}
