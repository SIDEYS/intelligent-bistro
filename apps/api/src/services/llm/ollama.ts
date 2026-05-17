import { OpenAICompatibleProvider } from './base';

export class OllamaProvider extends OpenAICompatibleProvider {
  constructor() {
    super({
      baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
      apiKey: 'ollama',
      model: process.env.OLLAMA_MODEL ?? 'llama3.2',
    });
  }
}
