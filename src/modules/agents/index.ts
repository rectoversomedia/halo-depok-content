import { z } from 'zod';
import { insertRecord, updateRecord, queryRecords, TABLES } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { getAIProvider } from '@/lib/ai/provider';
import type { AgentRun, AgentStatus, AgentResult } from '@/types';

// ============================================================
// HALODEPOK CONTENT FACTORY — Agent Framework
// ============================================================

// Base Agent Interface
export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly promptVersion: string;

  protected getProvider() {
    return getAIProvider();
  }

  protected abstract buildPrompt(input: TInput): string;
  protected abstract parseOutput(output: string, input: TInput): TOutput;

  protected systemPrompt?(): string {
    return undefined as unknown as string;
  }

  protected temperature = 0.7;
  protected maxTokens = 2048;

  async run(input: TInput, storyId?: string): Promise<AgentResult<TOutput>> {
    const runId = generateId('run');
    const startTime = Date.now();
    const ai = this.getProvider();

    // Create agent run record
    const run: Partial<AgentRun> = {
      id: runId,
      agent_id: this.id,
      agent_name: this.name,
      status: 'running',
      input_schema: 'unknown',
      output_schema: 'unknown',
      provider: ai.provider,
      model: ai.defaultModel,
      prompt_version: this.promptVersion,
      temperature: this.temperature,
      input_summary: JSON.stringify(input).slice(0, 500),
      output_summary: null,
      errors: [],
      retry_count: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_ms: null,
      token_usage: null,
      estimated_cost: null,
      metadata: {},
      created_at: new Date().toISOString(),
    };

    await insertRecord<AgentRun>(TABLES.agent_runs, run as AgentRun);

    try {
      const prompt = this.buildPrompt(input);
      const sp = this.systemPrompt?.();
      const output = await ai.generate(prompt, {
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        system: sp ?? undefined,
      });

      const parsedOutput = this.parseOutput(output, input);
      const durationMs = Date.now() - startTime;

      await updateRecord<AgentRun>(TABLES.agent_runs, runId, {
        status: 'completed',
        output_summary: JSON.stringify(parsedOutput).slice(0, 500),
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
        estimated_cost: 0,
        metadata: { story_id: storyId },
      });

      return {
        success: true,
        data: parsedOutput,
        run: { ...run, status: 'completed', completed_at: new Date().toISOString(), duration_ms: durationMs } as AgentRun,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const durationMs = Date.now() - startTime;

      await updateRecord<AgentRun>(TABLES.agent_runs, runId, {
        status: 'failed',
        errors: [error],
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      });

      return {
        success: false,
        error,
        run: { ...run, status: 'failed', errors: [error], completed_at: new Date().toISOString(), duration_ms: durationMs } as AgentRun,
      };
    }
  }
}

// --- Individual Agent Implementations ---

export class SourceDiscoveryAgent extends BaseAgent<{ query?: string }, { sources: string[] }> {
  readonly id = 'source-discovery';
  readonly name = 'Source Discovery Agent';
  readonly description = 'Discovers new potential sources based on topic or gap analysis';
  readonly promptVersion = 'v1';
  protected temperature = 0.5;

  protected buildPrompt(input: { query?: string }) {
    return `Find RSS, Atom, or API sources related to: ${input.query ?? 'Depok local news, government announcements, traffic, weather, community events'}.

Return JSON:
{
  "sources": [
    {
      "name": "Source Name",
      "url": "https://...",
      "type": "rss | atom | api",
      "category": "government | media | official_announcement",
      "reason": "why this is valuable"
    }
  ]
}`;
  }

  protected parseOutput(output: string, _input: { query?: string }) {
    const match = output.match(/\{[\s\S]*\}/);
    if (!match) return { sources: [] };
    try {
      return JSON.parse(match[0]) as { sources: string[] };
    } catch {
      return { sources: [] };
    }
  }
}

export class LocalizationAgent extends BaseAgent<{ text: string; context?: string }, {
  city: string;
  district: string;
  neighborhood: string;
  landmark: string;
  coordinates: [number, number] | null;
  localRelevance: number;
  audienceImpact: string;
}> {
  readonly id = 'localization';
  readonly name = 'Localization Agent';
  readonly description = 'Determines geographic relevance of content to Depok';
  readonly promptVersion = 'v1';
  protected temperature = 0.3;

  protected buildPrompt(input: { text: string; context?: string }) {
    return `Determine the geographic location and local relevance of this content to Depok (Depok / Depok), Indonesia.

Content: ${input.text}
Context: ${input.context ?? 'General news'}

Depok neighborhoods: Kemang, Blok M, Senayan, Kuningan, Cipete, Tebet, Kebayoran Baru, Kebayoran Lama, Pondok Indah, Gandaria, Melawai, Senopati, Ragunan, Lebak Bulus, Ampera, Warung Buncit, Kalibata, Duren Tiga, Pasar Minggu, Tanjung Barat

Respond with JSON:
{
  "city": "Depok",
  "district": "specific district if identifiable",
  "neighborhood": "specific neighborhood(s) from the list above",
  "landmark": "nearest landmark",
  "coordinates": [lng, lat] or null,
  "localRelevance": 0-100,
  "audienceImpact": "how Depok residents are affected"
}`;
  }

  protected parseOutput(output: string, _input: { text: string; context?: string }) {
    const match = output.match(/\{[\s\S]*\}/);
    if (!match) return { city: 'Depok', district: '', neighborhood: '', landmark: '', coordinates: null, localRelevance: 0, audienceImpact: '' };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { city: 'Depok', district: '', neighborhood: '', landmark: '', coordinates: null, localRelevance: 0, audienceImpact: '' };
    }
  }
}

export class ContrarianAgent extends BaseAgent<{ claim: string; evidence?: string }, {
  challenges: string[];
  alternativeViews: string[];
  riskScore: number;
  warnings: string[];
  publishBlock: boolean;
  blockedReason: string | null;
}> {
  readonly id = 'contrarian';
  readonly name = 'Contrarian Agent';
  readonly description = 'Challenges claims to find weaknesses and potential errors';
  readonly promptVersion = 'v1';
  protected temperature = 0.8;

  protected systemPrompt() {
    return 'You are a critical thinking red-team agent. Your job is to find what could be WRONG, not to validate what is right. Be adversarial.';
  }

  protected buildPrompt(input: { claim: string; evidence?: string }) {
    return `Critically analyze this claim. Find everything that could be wrong, misleading, or incomplete.

Claim: ${input.claim}
Evidence: ${input.evidence ?? 'No evidence provided'}

Check for:
- Contradictory evidence
- Missing context
- Outdated information
- Incorrect attribution
- Location mismatch
- Timing mismatch
- Unsupported conclusions
- Sensational framing
- Misleading headline
- AI hallucinations

Respond with JSON:
{
  "challenges": ["specific challenge 1", "challenge 2"],
  "alternativeViews": ["alternative interpretation 1"],
  "riskScore": 0-100,
  "warnings": ["warning 1"],
  "publishBlock": true | false,
  "blockedReason": "reason if blocked, null otherwise"
}`;
  }

  protected parseOutput(output: string, _input: { claim: string; evidence?: string }) {
    const match = output.match(/\{[\s\S]*\}/);
    if (!match) return { challenges: [], alternativeViews: [], riskScore: 0, warnings: [], publishBlock: false, blockedReason: null };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { challenges: [], alternativeViews: [], riskScore: 50, warnings: [], publishBlock: false, blockedReason: null };
    }
  }
}

export class EntityExtractionAgent extends BaseAgent<{ text: string }, {
  people: string[];
  organizations: string[];
  businesses: string[];
  places: string[];
  events: string[];
  topics: string[];
}> {
  readonly id = 'entity-extraction';
  readonly name = 'Entity Extraction Agent';
  readonly description = 'Extracts and normalizes entities from content';
  readonly promptVersion = 'v1';
  protected temperature = 0.2;

  protected buildPrompt(input: { text: string }) {
    return `Extract all named entities from this text. Group by type.

Text: ${input.text.slice(0, 2000)}

Respond with JSON:
{
  "people": ["person names"],
  "organizations": ["organization names"],
  "businesses": ["business/commercial names"],
  "places": ["place/location names"],
  "events": ["event names"],
  "topics": ["topic/issue keywords"]
}`;
  }

  protected parseOutput(output: string, _input: { text: string }) {
    const match = output.match(/\{[\s\S]*\}/);
    if (!match) return { people: [], organizations: [], businesses: [], places: [], events: [], topics: [] };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { people: [], organizations: [], businesses: [], places: [], events: [], topics: [] };
    }
  }
}

export class CommerceIdentificationAgent extends BaseAgent<{ storyContext: string; brief?: string }, {
  hasOpportunity: boolean;
  category: string;
  products: Array<{ name: string; category: string; relevance: number }>;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  rationale: string;
}> {
  readonly id = 'commerce-id';
  readonly name = 'Commerce Identification Agent';
  readonly description = 'Identifies legitimate commerce opportunities from story content';
  readonly promptVersion = 'v1';
  protected temperature = 0.3;

  protected buildPrompt(input: { storyContext: string; brief?: string }) {
    return `Identify commerce opportunities related to this story that would genuinely help Depok residents.

Story: ${input.storyContext}
Brief: ${input.brief ?? ''}

Rules:
- ONLY if genuinely helpful
- NEVER fabricate pricing or availability
- NEVER let commerce influence editorial
- Return "none" if not relevant

Respond with JSON:
{
  "hasOpportunity": true | false,
  "category": "category",
  "products": [{"name": "", "category": "", "relevance": 0-100}],
  "strength": "strong | moderate | weak | none",
  "rationale": "why this helps residents"
}`;
  }

  protected parseOutput(output: string, _input: { storyContext: string; brief?: string }) {
    const match = output.match(/\{[\s\S]*\}/);
    if (!match) return { hasOpportunity: false, category: 'none', products: [], strength: 'none', rationale: '' };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { hasOpportunity: false, category: 'none', products: [], strength: 'none', rationale: '' };
    }
  }
}

// --- Agent Registry ---

export const AGENT_REGISTRY: Record<string, BaseAgent> = {
  'source-discovery': new SourceDiscoveryAgent(),
  'localization': new LocalizationAgent(),
  'contrarian': new ContrarianAgent(),
  'entity-extraction': new EntityExtractionAgent(),
  'commerce-id': new CommerceIdentificationAgent(),
};

export async function getAgentRuns(agentId?: string, limit = 50): Promise<AgentRun[]> {
  const filters: Record<string, unknown> = {};
  if (agentId) filters['agent_id'] = agentId;
  return queryRecords<AgentRun>(TABLES.agent_runs, filters, { order: 'created_at', limit });
}

export async function getAgentStats(): Promise<Array<{
  agentId: string;
  agentName: string;
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  totalCost: number;
  lastRun: string | null;
}>> {
  const runs = await queryRecords<AgentRun>(TABLES.agent_runs, {});

  const stats: Record<string, {
    agentId: string;
    agentName: string;
    totalRuns: number;
    successes: number;
    totalDurationMs: number;
    totalCost: number;
    lastRun: string | null;
  }> = {};

  for (const run of runs) {
    if (!stats[run.agent_id]) {
      stats[run.agent_id] = {
        agentId: run.agent_id,
        agentName: run.agent_name,
        totalRuns: 0,
        successes: 0,
        totalDurationMs: 0,
        totalCost: 0,
        lastRun: null,
      };
    }
    stats[run.agent_id].totalRuns++;
    if (run.status === 'completed') stats[run.agent_id].successes++;
    stats[run.agent_id].totalDurationMs += run.duration_ms ?? 0;
    stats[run.agent_id].totalCost += run.estimated_cost ?? 0;
    if (!stats[run.agent_id].lastRun || (run.completed_at && run.completed_at > stats[run.agent_id].lastRun!)) {
      stats[run.agent_id].lastRun = run.completed_at;
    }
  }

  return Object.values(stats).map((s) => ({
    ...s,
    successRate: s.totalRuns > 0 ? Math.round((s.successes / s.totalRuns) * 100) : 0,
    avgDurationMs: s.totalRuns > 0 ? Math.round(s.totalDurationMs / s.totalRuns) : 0,
  }));
}
