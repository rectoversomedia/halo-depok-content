# Agents

## Overview

HaloDepok Content Factory uses a structured AI agent system where each agent has:
- Unique ID and name
- Versioned prompts
- Structured input/output via Zod schemas
- Full run tracking (duration, cost, tokens, errors)

## Agent Base Class

All agents extend `BaseAgent<TInput, TOutput>` from `src/modules/agents/index.ts`:

```typescript
class MyAgent extends BaseAgent<TInput, TOutput> {
  readonly id = 'my-agent';
  readonly name = 'My Agent';
  readonly description = 'Description';
  readonly promptVersion = 'v1';
  protected temperature = 0.7;
  protected maxTokens = 2048;

  protected buildPrompt(input: TInput): string { ... }
  protected parseOutput(output: string, input: TInput): TOutput { ... }
  protected systemPrompt?(): string { ... }
}
```

## Agent Registry

```typescript
import { AGENT_REGISTRY } from '@/modules/agents';

// Get an agent by ID
const agent = AGENT_REGISTRY['source-discovery'];
const result = await agent.run({ query: 'traffic news' });
```

## Available Agents

### SourceDiscoveryAgent
- **ID**: `source-discovery`
- **Purpose**: Discovers new RSS/API sources
- **Input**: `{ query?: string }`
- **Output**: `{ sources: Array<{ name, url, type, category, reason }> }`

### LocalizationAgent
- **ID**: `localization`
- **Purpose**: Determines geographic relevance to Depok
- **Input**: `{ text: string; context?: string }`
- **Output**: `{ city, district, neighborhood, landmark, coordinates, localRelevance, audienceImpact }`

### ContrarianAgent
- **ID**: `contrarian`
- **Purpose**: Adversarial red-team analysis
- **Input**: `{ claim: string; evidence?: string }`
- **Output**: `{ challenges, alternativeViews, riskScore, warnings, publishBlock, blockedReason }`
- **System Prompt**: "Be adversarial. Find what could be WRONG."

### EntityExtractionAgent
- **ID**: `entity-extraction`
- **Purpose**: Named entity recognition
- **Input**: `{ text: string }`
- **Output**: `{ people, organizations, businesses, places, events, topics }`

### CommerceIdentificationAgent
- **ID**: `commerce-id`
- **Purpose**: Identifies legitimate commerce opportunities
- **Input**: `{ storyContext: string; brief?: string }`
- **Output**: `{ hasOpportunity, category, products, strength, rationale }`

## Adding a New Agent

1. Create a new class extending `BaseAgent`
2. Implement `buildPrompt()` and `parseOutput()`
3. Register in `AGENT_REGISTRY`
4. Add API route handler if needed
5. Document in this file

## Observability

Agent runs are tracked in `agent_runs` table:

```sql
SELECT agent_name, status, duration_ms, estimated_cost
FROM agent_runs
ORDER BY created_at DESC
LIMIT 100;
```

## Cost Control

Each agent run records:
- `input_tokens`, `output_tokens`
- `estimated_cost` (calculated via provider pricing)
- `duration_ms`
- `errors` array

Budget threshold: Set `MONTHLY_AI_BUDGET` in environment.
