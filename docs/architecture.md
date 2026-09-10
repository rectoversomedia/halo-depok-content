# Architecture

## Overview

HaloDepok Content Factory is a modular monolith built on Next.js 14 with TypeScript, Supabase (PostgreSQL), and provider-abstracted AI services.

## System Design

```
┌─────────────────────────────────────────────────────┐
│                   NEWSROOM COMMAND CENTER            │
│  (Admin Dashboard — Next.js App Router)             │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│                    API LAYER                         │
│  /api/stories  /api/sources  /api/ingestion         │
│  /api/citizens /api/commerce /api/analytics          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│               MODULE LAYER (Domain Modules)          │
│  sources │ ingestion │ discovery │ stories │ claims   │
│  content │ seo │ geo │ eeat │ commerce │ publishing │
│  analytics │ agents │ citizens │ audit │ users       │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              PROVIDER ABSTRACTION LAYER              │
│  AIProvider │ Publisher │ SearchProvider │ Affiliate   │
│  (OpenAI, Anthropic, Mock)                          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│                 DATA LAYER                          │
│  Supabase (PostgreSQL) │ Redis (optional)            │
└─────────────────────────────────────────────────────┘
```

## Domain Modules

Each module in `/src/modules` is independently responsible for one domain:

| Module | Responsibility |
|--------|---------------|
| `sources` | External source management |
| `ingestion` | RSS/API fetching and parsing |
| `discovery` | Relevance scoring, deduplication |
| `stories` | Central story entity management |
| `claims` | Atomic claim extraction and storage |
| `verification` | Evidence gathering, fact-checking |
| `content` | Article and social content generation |
| `seo` | SEO metadata, structured data |
| `geo` | AI answer engine optimization |
| `eeat` | E-E-A-T evaluation |
| `commerce` | Opportunity identification |
| `publishing` | WordPress and social publishing |
| `analytics` | Performance tracking |
| `agents` | AI agent framework |
| `citizens` | Citizen reporting pipeline |
| `audit` | Audit logging |

## AI Agent Architecture

Agents are defined in `src/modules/agents/index.ts`. Each agent:

1. Extends `BaseAgent<TInput, TOutput>`
2. Implements `buildPrompt()` and `parseOutput()`
3. Has a unique `id`, `name`, `prompt_version`
4. Records all runs to `agent_runs` table

Key agents:
- `source-discovery` — Finds new RSS/API sources
- `localization` — Determines geographic relevance
- `contrarian` — Red-team adversarial analysis
- `entity-extraction` — Named entity recognition
- `commerce-id` — Opportunity identification

## Data Flow

```
SOURCE → INGEST → RAW_ITEM → DISCOVER → STORY
  → CLAIMS → EVIDENCE → VERIFY → BRIEF
  → ARTICLE → SEO → GEO → E-E-A-T
  → TIKTOK → INSTAGRAM → X_POST
  → COMMERCE → SAFETY_CHECK
  → EDITOR_REVIEW → APPROVAL → PUBLISH
  → ANALYTICS → LEARNING
```

## Key Design Decisions

1. **Modular Monolith** — All modules in one Next.js app. No microservices until proven necessary.
2. **Provider Abstraction** — All external services (AI, search, publishing) use interfaces, not implementations.
3. **Human-in-the-loop** — No automatic publication. Every story requires human approval.
4. **Data Provenance** — Every generated fact traces to: story → claim → evidence → source.
5. **Visual Source Labeling** — All visuals must identify their source type.
6. **Commerce Separation** — Commercial recommendations are labeled and never influence editorial decisions.
