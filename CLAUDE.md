# HaloDepok Content Factory — CLAUDE.md

You are working on the HaloDepok Content Factory project.

## Project Type

AI-Native Hyperlocal Intelligence, Content & Commerce Platform (Next.js 14 + TypeScript + Supabase)

## Key Principles

1. **DO NOT rebuild existing functionality** — Only modify what's necessary
2. **Human-in-the-loop** — AI assists the newsroom, humans approve publication
3. **Editorial truth first** — Commerce never distorts factual reporting
4. **Never fabricate** — No fake quotes, statistics, eyewitness accounts, or credentials
5. **Provider abstraction** — AI vendors are replaceable; never hard-code one provider

## Architecture

The system is organized into `/modules` by domain:
`sources`, `ingestion`, `discovery`, `stories`, `claims`, `verification`, `knowledge`, `locations`, `citizens`, `content`, `social`, `seo`, `geo`, `eeat`, `commerce`, `publishing`, `analytics`, `agents`, `users`, `audit`

## Core Types

All domain entities are in `src/types/index.ts` with Zod schemas in `src/types/schemas.ts`.

## Editorial Status Flow

```
discovered → investigating → verification_required → verified
  → content_ready → editor_review → approved → scheduled → published
```

Blocking: `rejected`, `conflicted`, `stale`, `blocked`

## Critical Rules

- Never expose secrets to frontend
- All AI calls must be tracked via `ai_usage` table
- Every commerce recommendation must identify `commercial_type`: `editorial | affiliate | sponsored`
- Visual sources must be labeled: `real | citizen | official | licensed | ai_generated`
- Citizen reports are signals, NOT automatically verified facts
- Content provenance must be traceable: `story → claim → evidence → source`

## File Organization

- `src/modules/*/index.ts` — Main module entry point
- `src/app/api/*/route.ts` — API routes
- `src/app/admin/*/page.tsx` — Admin pages
- `src/lib/ai/provider.ts` — AI provider abstraction
- `src/lib/db/index.ts` — Database layer
- `src/types/index.ts` — Domain types
- `supabase/migrations/*.sql` — Database schema

## Database

Supabase (PostgreSQL). All tables use UUID primary keys with `updated_at` auto-triggers.

## AI Cost Control

Every AI execution must record usage in `ai_usage` table. Set `USE_MOCK_AI=true` for development.

## Testing

Use mock providers (`USE_MOCK_AI=true`) for all tests. Never test with real API keys in CI.

## Security

- No secrets in frontend code
- All admin routes require authentication (TODO)
- Rate limiting on public API routes
- Audit logging for all editorial actions
