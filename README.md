# HaloDepok Content Factory

AI-Native Hyperlocal Intelligence, Content & Commerce Platform for Depok.

## Overview

HaloDepok Content Factory transforms local news production into a continuously operating AI newsroom. The system discovers information, verifies facts, generates editorial content, creates multi-platform social content, identifies commerce opportunities, and learns from performance — all with human editorial oversight.

## Architecture

```
/src
  /app              — Next.js App Router pages
    /admin          — Newsroom Command Center (protected)
    /api            — REST API routes
  /components       — React components
    /ui             — Reusable UI components
    /admin          — Admin-specific components
  /lib
    /ai             — AI provider abstraction
    /db             — Database layer
    /job-system     — Job queue system
    /audit          — Audit logging
  /modules          — Domain modules
    /sources        — Source management
    /ingestion      — RSS/API ingestion
    /discovery      — Relevance scoring & classification
    /stories        — Story management
    /claims         — Claim extraction & verification
    /content        — Article & social content generation
    /seo            — SEO & GEO optimization
    /commerce       — Commerce opportunity detection
    /citizens       — Sensor Warga citizen reporting
    /publishing     — WordPress & social publishing
    /analytics      — Performance tracking & learning
    /agents         — AI agent framework (21 agents)
  /types            — TypeScript type definitions
  /pipeline         — CLI pipeline runner

/supabase
  /migrations       — Database schema
  /seed             — Seed data
```

## Core Engines

1. **Source Intelligence** — RSS, Atom, API ingestion from Depok-relevant sources
2. **Ingestion** — Fetch, parse, normalize, deduplicate, store
3. **Discovery** — AI-powered relevance, locality, urgency scoring
4. **Verification** — Claim extraction, evidence gathering, fact-checking
5. **Contrarian/Red Team** — Adversarial safety checks before publication
6. **Content Factory** — Article, TikTok, Instagram, X content generation
7. **SEO** — Title, meta, slug, structured data, OpenGraph
8. **GEO** — AI answer engine optimization
9. **E-E-A-T** — Experience, Expertise, Authoritativeness, Trustworthiness scoring
10. **Commerce** — Legitimate opportunity identification (editorial-first)
11. **Sensor Warga** — Citizen reporting with moderation pipeline
12. **Analytics** — Performance tracking and strategic recommendations

## Editorial Workflow

```
DISCOVERED → INVESTIGATING → VERIFICATION_REQUIRED → VERIFIED
  → CONTENT_READY → EDITOR_REVIEW → APPROVED → PUBLISHED
```

Blocking states: `REJECTED`, `CONFLICTED`, `STALE`, `BLOCKED`

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Environment Variables

See `.env.example` for all required and optional variables.

## Key AI Providers

- **OpenAI** — Primary for generation tasks (GPT-4o, GPT-4o-mini)
- **Anthropic** — Alternative provider (Claude Sonnet)
- Both are abstracted via `src/lib/ai/provider.ts`

## Development

```bash
npm run dev              # Start Next.js
npm run ingest:sources   # Run source ingestion CLI
npm run pipeline:run     # Run full pipeline CLI
npm run type-check       # TypeScript check
npm run lint             # ESLint
npm run test             # Run tests
```

## Testing

```bash
npm run test             # Unit tests
npm run test:e2e         # E2E tests with Playwright
```

## Deployment

See `DEPLOYMENT.md` for full deployment instructions.
