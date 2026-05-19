import { OpenAICompatibleProvider } from './base';

export class GroqProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY ?? '',
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      legacyRecovery: true,
    });
  }
}
