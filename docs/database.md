# Database

## Schema

All tables use:
- UUID primary keys (`uuid_generate_v4()`)
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` (auto-updated via triggers)
- JSONB for flexible metadata

## Key Tables

### Core Entities
- `sources` — External RSS/API sources
- `raw_items` — Fetched content before processing
- `stories` — Central story entity
- `story_clusters` — Groups of related stories
- `claims` — Atomic verifiable facts
- `evidence` — Source evidence for claims
- `locations` — Geographic hierarchy

### Content
- `articles` — Generated articles
- `social_contents` — TikTok, Instagram, X posts
- `seo_metadata` — SEO fields
- `geo_metadata` — AI answer optimization
- `eeat_scores` — E-E-A-T evaluation

### Commerce
- `commerce_opportunities` — Detected opportunities
- `merchants` — Local merchant database

### Community
- `citizen_reports` — Sensor Warga reports
- `knowledge_entities` — Knowledge graph entities
- `knowledge_relations` — Entity relationships

### System
- `publishing_jobs` — Publication queue
- `analytics_events` — Performance events
- `content_performance` — Aggregated metrics
- `ai_usage` — AI cost tracking
- `agent_runs` — Agent observability
- `job_records` — Background job system
- `users` — Admin users
- `audit_logs` — Editorial audit trail

## Migrations

Run with:
```bash
npx supabase db push
# or
psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql
```

## Indexes

Key indexes for performance:
- `idx_stories_status` on `stories(status)`
- `idx_stories_published` on `stories(published_at DESC)`
- `idx_claims_story` on `claims(story_id)`
- `idx_raw_items_hash` on `raw_items(content_hash)`
- `idx_analytics_created` on `analytics_events(created_at DESC)`
- `idx_agent_runs_agent` on `agent_runs(agent_id)`

## Row-Level Security

TODO: Configure RLS policies for multi-user support.
