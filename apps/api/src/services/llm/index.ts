import { LLMProvider } from './provider';
import { GroqProvider } from './groq';
import { OllamaProvider } from './ollama';

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? 'groq';
  if (provider === 'ollama') return new OllamaProvider();
  return new GroqProvider();
}

export type { LLMProvider, LLMChatRequest, LLMChatResponse, LLMTool } from './provider';
