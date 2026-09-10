import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================
// JAKSELNEWS CONTENT FACTORY — AI Provider Abstraction
// ============================================================

export type AIProviderType = 'openai' | 'anthropic' | 'mock';

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  system?: string;
}

export interface StructuredGenerateOptions extends GenerateOptions {
  schema?: Record<string, unknown>;
}

export interface EmbedOptions {
  model?: string;
}

export interface ClassifyOptions {
  labels: string[];
}

// Abstract AI Provider Interface
export interface AIProvider {
  readonly provider: AIProviderType;
  readonly defaultModel: string;
  readonly maxRetries: number;

  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  structuredGenerate<T>(prompt: string, options?: StructuredGenerateOptions): Promise<T>;
  embed(text: string, options?: EmbedOptions): Promise<number[]>;
  classify(text: string, labels: string[], options?: GenerateOptions): Promise<{ label: string; confidence: number }>;
  estimateCost(model: string, inputTokens: number, outputTokens: number): number;
}

// ============================================================
// OpenAI Provider
// ============================================================

export class OpenAIProvider implements AIProvider {
  readonly provider: AIProviderType = 'openai';
  readonly defaultModel = 'gpt-4o-mini';
  readonly maxRetries = 3;

  private client: OpenAI;

  constructor(apiKey?: string, baseURL?: string) {
    this.client = new OpenAI({
      apiKey: apiKey ?? process.env.OPENAI_API_KEY,
      baseURL: baseURL ?? process.env.OPENAI_BASE_URL,
    });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (options?.system) messages.push({ role: 'system', content: options.system });
    messages.push({ role: 'user', content: prompt });

    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP,
      stop: options?.stop,
    });

    return response.choices[0]?.message?.content ?? '';
  }

  async structuredGenerate<T>(prompt: string, options?: StructuredGenerateOptions): Promise<T> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (options?.system) messages.push({ role: 'system', content: options.system });
    messages.push({ role: 'user', content: `${prompt}\n\nRespond with valid JSON only.` });

    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content ?? '{}';
    return JSON.parse(content) as T;
  }

  async embed(text: string, options?: EmbedOptions): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: options?.model ?? 'text-embedding-3-small',
      input: text,
    });
    return response.data[0]?.embedding ?? [];
  }

  async classify(text: string, labels: string[], options?: GenerateOptions): Promise<{ label: string; confidence: number }> {
    const prompt = `Classify the following text into ONE of these categories: ${labels.join(', ')}.\n\nText: ${text}\n\nRespond with JSON: {"label": "category_name", "confidence": 0.0}`;
    const result = await this.structuredGenerate<{ label: string; confidence: number }>(prompt, { ...options, temperature: 0.1 });
    return result;
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5, output: 10 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'text-embedding-3-small': { input: 0.02, output: 0 },
      'text-embedding-3-large': { input: 0.13, output: 0 },
    };
    const p = pricing[model] ?? { input: 1, output: 1 };
    return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
  }
}

// ============================================================
// Anthropic Provider
// ============================================================

export class AnthropicProvider implements AIProvider {
  readonly provider: AIProviderType = 'anthropic';
  readonly defaultModel = 'claude-sonnet-4-20250514';
  readonly maxRetries = 3;

  private client: Anthropic;

  constructor(apiKey?: string, baseURL?: string) {
    this.client = new Anthropic({
      apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
      baseURL: baseURL ?? process.env.ANTHROPIC_BASE_URL,
    });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: this.defaultModel,
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.7,
      system: options?.system,
      messages: [{ role: 'user', content: prompt }],
      stop_sequences: options?.stop,
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async structuredGenerate<T>(prompt: string, options?: StructuredGenerateOptions): Promise<T> {
    const response = await this.client.messages.create({
      model: this.defaultModel,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.3,
      system: `${options?.system ?? ''}\n\nYou must respond with valid JSON only. No markdown, no explanation.`,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(text) as T;
  }

  async embed(_text: string, _options?: EmbedOptions): Promise<number[]> {
    throw new Error('Anthropic does not support embeddings. Use OpenAI for embeddings.');
  }

  async classify(text: string, labels: string[], options?: GenerateOptions): Promise<{ label: string; confidence: number }> {
    const prompt = `Classify this text: ${text}\n\nCategories: ${labels.join(', ')}\n\nJSON: {"label": "", "confidence": 0.0}`;
    const result = await this.structuredGenerate<{ label: string; confidence: number }>(prompt, { ...options, temperature: 0.1 });
    return result;
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-sonnet-4-20250514': { input: 3, output: 15 },
      'claude-opus-4-20250514': { input: 15, output: 75 },
      'claude-3-5-sonnet-latest': { input: 3, output: 15 },
      'claude-3-5-haiku-latest': { input: 0.8, output: 4 },
    };
    const p = pricing[model] ?? { input: 3, output: 15 };
    return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
  }
}

// ============================================================
// Mock Provider (for development / CI)
// ============================================================

export class MockAIProvider implements AIProvider {
  readonly provider: AIProviderType = 'mock';
  readonly defaultModel = 'mock-model';
  readonly maxRetries = 1;

  private responses: Map<string, string> = new Map();

  setResponse(key: string, response: string) {
    this.responses.set(key, response);
  }

  async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    await new Promise((r) => setTimeout(r, 100));
    const cached = this.responses.get(prompt);
    if (cached) return cached;
    return `Mock response to: ${prompt.slice(0, 50)}...`;
  }

  async structuredGenerate<T>(prompt: string, _options?: StructuredGenerateOptions): Promise<T> {
    await new Promise((r) => setTimeout(r, 100));
    const cached = this.responses.get(prompt);
    if (cached) return JSON.parse(cached) as T;
    return { success: true, message: `Mock response to: ${prompt.slice(0, 50)}` } as unknown as T;
  }

  async embed(_text: string, _options?: EmbedOptions): Promise<number[]> {
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }

  async classify(text: string, labels: string[], _options?: GenerateOptions): Promise<{ label: string; confidence: number }> {
    return { label: labels[0] ?? 'unknown', confidence: 0.8 };
  }

  estimateCost(): number {
    return 0;
  }
}

// ============================================================
// Provider Factory
// ============================================================

let _provider: AIProvider | null = null;

export function getAIProvider(type?: AIProviderType): AIProvider {
  if (process.env.USE_MOCK_AI === 'true') {
    return new MockAIProvider();
  }

  if (_provider) return _provider;

  const providerType = type ?? (process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai');

  switch (providerType) {
    case 'anthropic':
      _provider = new AnthropicProvider();
      break;
    case 'openai':
    default:
      _provider = new OpenAIProvider();
      break;
  }

  return _provider;
}

export function resetAIProvider() {
  _provider = null;
}
