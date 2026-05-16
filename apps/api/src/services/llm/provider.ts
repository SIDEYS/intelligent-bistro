import { ChatMessage, CartItem } from '@bistro/shared';

export interface LLMChatRequest {
  messages: ChatMessage[];
  cart: CartItem[];
  tools: LLMTool[];
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMChatResponse {
  text: string | null;
  toolCalls: LLMToolCall[];
}

export interface LLMTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMProvider {
  chat(request: LLMChatRequest): Promise<LLMChatResponse>;
}
