import OpenAI from 'openai';
import { LLMProvider, LLMChatRequest, LLMChatResponse } from './provider';

export class OllamaProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: 'ollama',
      baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
    });
    this.model = process.env.OLLAMA_MODEL ?? 'llama3.2';
  }

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = request.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const tools: OpenAI.Chat.ChatCompletionTool[] = request.tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const response = await this.client.chat.completions.create({
      model: this.model,
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
