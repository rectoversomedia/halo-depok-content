-- ============================================================
-- JAKSELNEWS CONTENT FACTORY — Database Migration
-- Version: 001_initial_schema
-- Description: Core tables for AI newsroom platform
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Sources: External information sources (RSS, APIs, citizen reports)
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('rss', 'atom', 'api', 'webhook', 'manual', 'citizen')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('government', 'media', 'social', 'official_announcement', 'citizen', 'academic', 'commercial', 'other')),
  geographic_scope VARCHAR(50) NOT NULL DEFAULT 'city' CHECK (geographic_scope IN ('national', 'provincial', 'city', 'district', 'neighborhood')),
  authority_level VARCHAR(50) NOT NULL DEFAULT 'secondary' CHECK (authority_level IN ('primary', 'secondary', 'unverified')),
  reliability_score INTEGER NOT NULL DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  active BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_type ON sources(type);
CREATE INDEX idx_sources_active ON sources(active);
CREATE INDEX idx_sources_category ON sources(category);

-- Raw Items: Original fetched content before processing
CREATE TABLE IF NOT EXISTS raw_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id TEXT,
  url TEXT,
  canonical_url TEXT,
  title TEXT,
  raw_content TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  media JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  content_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_id, content_hash)
);

CREATE INDEX idx_raw_items_source ON raw_items(source_id);
CREATE INDEX idx_raw_items_hash ON raw_items(content_hash);
CREATE INDEX idx_raw_items_published ON raw_items(published_at DESC);

-- Locations: Geographic hierarchy
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('country', 'province', 'city', 'district', 'neighborhood', 'landmark', 'street')),
  parent_id UUID REFERENCES locations(id),
  coordinates JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slug)
);

CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_parent ON locations(parent_id);

-- Stories: Central story entity
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  summary TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'discovered' CHECK (status IN (
    'discovered', 'investigating', 'verification_required', 'verified',
    'content_ready', 'editor_review', 'approved', 'scheduled', 'published',
    'rejected', 'conflicted', 'stale', 'blocked'
  )),
  classification VARCHAR(50) NOT NULL DEFAULT 'monitor' CHECK (classification IN ('ignore', 'monitor', 'investigate', 'draft', 'urgent_review')),
  importance_score INTEGER NOT NULL DEFAULT 0 CHECK (importance_score >= 0 AND importance_score <= 100),
  locality_score INTEGER NOT NULL DEFAULT 0 CHECK (locality_score >= 0 AND locality_score <= 100),
  novelty_score INTEGER NOT NULL DEFAULT 0 CHECK (novelty_score >= 0 AND novelty_score <= 100),
  urgency_score INTEGER NOT NULL DEFAULT 0 CHECK (urgency_score >= 0 AND urgency_score <= 100),
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  commercial_score INTEGER NOT NULL DEFAULT 0 CHECK (commercial_score >= 0 AND commercial_score <= 100),
  location_id UUID REFERENCES locations(id),
  editorial_brief JSONB,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_classification ON stories(classification);
CREATE INDEX idx_stories_location ON stories(location_id);
CREATE INDEX idx_stories_published ON stories(published_at DESC NULLS LAST);
CREATE INDEX idx_stories_updated ON stories(last_updated_at DESC);

-- Story Clusters: Groups related stories
CREATE TABLE IF NOT EXISTS story_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  member_story_ids UUID[] NOT NULL DEFAULT '{}',
  cluster_hash VARCHAR(64) NOT NULL,
  coherence_score INTEGER NOT NULL DEFAULT 0 CHECK (coherence_score >= 0 AND coherence_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cluster_hash)
);

-- Claims: Atomic verifiable facts
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  claim_type VARCHAR(50) NOT NULL DEFAULT 'fact' CHECK (claim_type IN ('fact', 'statement', 'event', 'prediction', 'opinion', 'rumor')),
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'partially_verified', 'verified', 'contradicted', 'stale', 'needs_human_review')),
  evidence_count INTEGER NOT NULL DEFAULT 0,
  contradiction_count INTEGER NOT NULL DEFAULT 0,
  first_observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  stale_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_story ON claims(story_id);
CREATE INDEX idx_claims_status ON claims(verification_status);

-- Evidence: Source evidence for claims
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  source_id UUID REFERENCES sources(id),
  raw_item_id UUID REFERENCES raw_items(id),
  evidence_text TEXT NOT NULL,
  observed_at TIMESTAMPTZ,
  relevance_score INTEGER NOT NULL DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  confidence INTEGER NOT NULL DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_claim ON evidence(claim_id);
CREATE INDEX idx_evidence_source ON evidence(source_id);

-- ============================================================
-- CONTENT TABLES
-- ============================================================

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  dek TEXT,
  summary TEXT,
  body TEXT,
  key_facts JSONB NOT NULL DEFAULT '[]',
  timeline JSONB NOT NULL DEFAULT '[]',
  faq JSONB NOT NULL DEFAULT '[]',
  sources_section TEXT,
  update_timestamp TIMESTAMPTZ,
  slug VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'version', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  generated_by VARCHAR(255) NOT NULL,
  prompt_version VARCHAR(50) NOT NULL,
  human_editor_id UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_story ON articles(story_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_slug ON articles(slug);

-- Social Content
CREATE TABLE IF NOT EXISTS social_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id),
  format VARCHAR(50) NOT NULL CHECK (format IN ('article', 'tiktok', 'instagram_carousel', 'instagram_reel', 'youtube_short', 'x_post', 'facebook_post', 'whatsapp_status')),
  hook TEXT,
  caption TEXT,
  body TEXT,
  hashtags JSONB NOT NULL DEFAULT '[]',
  visual_direction JSONB,
  voiceover_script TEXT,
  subtitle TEXT,
  thumbnail_concept TEXT,
  cta TEXT,
  duration_seconds INTEGER,
  source_attributions JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'version', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  generated_by VARCHAR(255) NOT NULL,
  prompt_version VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_story ON social_contents(story_id);
CREATE INDEX idx_social_format ON social_contents(format);
CREATE INDEX idx_social_status ON social_contents(status);

-- SEO Metadata
CREATE TABLE IF NOT EXISTS seo_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  seo_title VARCHAR(70),
  meta_description VARCHAR(160),
  slug VARCHAR(500),
  h1 TEXT,
  h2_list JSONB NOT NULL DEFAULT '[]',
  canonical TEXT,
  og_title VARCHAR(95),
  og_description VARCHAR(125),
  og_image TEXT,
  alt_texts JSONB NOT NULL DEFAULT '{}',
  internal_links JSONB NOT NULL DEFAULT '[]',
  external_links JSONB NOT NULL DEFAULT '[]',
  structured_data JSONB NOT NULL DEFAULT '{}',
  keywords JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(content_id)
);

-- GEO Metadata
CREATE TABLE IF NOT EXISTS geo_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  tldr TEXT,
  key_facts JSONB NOT NULL DEFAULT '{}',
  location_context TEXT,
  date_context TEXT,
  entities_list JSONB NOT NULL DEFAULT '[]',
  verified_claims JSONB NOT NULL DEFAULT '[]',
  uncertain_claims JSONB NOT NULL DEFAULT '[]',
  source_references JSONB NOT NULL DEFAULT '[]',
  structured_answer JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(content_id)
);

-- E-E-A-T Scores
CREATE TABLE IF NOT EXISTS eeat_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  experience_score INTEGER NOT NULL DEFAULT 0 CHECK (experience_score >= 0 AND experience_score <= 100),
  expertise_score INTEGER NOT NULL DEFAULT 0 CHECK (expertise_score >= 0 AND expertise_score <= 100),
  authoritativeness_score INTEGER NOT NULL DEFAULT 0 CHECK (authoritativeness_score >= 0 AND authoritativeness_score <= 100),
  trustworthiness_score INTEGER NOT NULL DEFAULT 0 CHECK (trustworthiness_score >= 0 AND trustworthiness_score <= 100),
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  missing_evidence JSONB NOT NULL DEFAULT '[]',
  warnings JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(content_id)
);

-- ============================================================
-- COMMERCE TABLES
-- ============================================================

-- Commerce Opportunities
CREATE TABLE IF NOT EXISTS commerce_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id),
  opportunity_type VARCHAR(50) NOT NULL CHECK (opportunity_type IN ('product', 'merchant', 'service', 'event', 'guide', 'affiliate', 'local_discovery')),
  relevance_score INTEGER NOT NULL DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  commercial_type VARCHAR(50) NOT NULL CHECK (commercial_type IN ('affiliate', 'editorial', 'sponsored', 'local_discovery')),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  merchant_id UUID,
  products JSONB NOT NULL DEFAULT '[]',
  affiliate_links JSONB NOT NULL DEFAULT '[]',
  recommendation_strength VARCHAR(50) NOT NULL DEFAULT 'weak' CHECK (recommendation_strength IN ('strong', 'moderate', 'weak', 'none')),
  editorial_rationale TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commerce_story ON commerce_opportunities(story_id);
CREATE INDEX idx_commerce_status ON commerce_opportunities(status);

-- Merchants
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  location_id UUID REFERENCES locations(id),
  location_text TEXT,
  category VARCHAR(255) NOT NULL DEFAULT 'general',
  price_range VARCHAR(50),
  hours TEXT,
  website TEXT,
  phone TEXT,
  products JSONB NOT NULL DEFAULT '[]',
  offers JSONB NOT NULL DEFAULT '[]',
  affiliate_status BOOLEAN NOT NULL DEFAULT false,
  sponsorship_status BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CITIZEN REPORTING
-- ============================================================

CREATE TABLE IF NOT EXISTS citizen_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL CHECK (category IN ('traffic', 'flood', 'fire', 'accident', 'public_safety', 'event', 'infrastructure', 'business', 'weather', 'other')),
  text TEXT,
  media JSONB NOT NULL DEFAULT '[]',
  location_text TEXT,
  location_id UUID REFERENCES locations(id),
  coordinates JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reporter_ip_hash TEXT,
  moderation_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_notes TEXT,
  story_signal UUID REFERENCES stories(id),
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citizen_category ON citizen_reports(category);
CREATE INDEX idx_citizen_moderation ON citizen_reports(moderation_status);
CREATE INDEX idx_citizen_location ON citizen_reports(location_id);

-- ============================================================
-- KNOWLEDGE GRAPH
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('person', 'organization', 'business', 'place', 'landmark', 'event', 'product', 'topic')),
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(slug)
);

CREATE TABLE IF NOT EXISTS knowledge_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  to_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relation_type VARCHAR(100) NOT NULL CHECK (relation_type IN ('located_in', 'occurred_at', 'involves', 'owned_by', 'related_to', 'mentions', 'caused_by', 'near', 'belongs_to', 'sold_by')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_entity_id, to_entity_id, relation_type)
);

-- ============================================================
-- PUBLISHING & ANALYTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS publishing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'unpublished')),
  provider VARCHAR(50) NOT NULL DEFAULT 'wordpress',
  provider_id TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  errors JSONB NOT NULL DEFAULT '[]',
  retry_count INTEGER NOT NULL DEFAULT 0,
  idempotency_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  content_id UUID,
  story_id UUID,
  format VARCHAR(50),
  metadata JSONB NOT NULL DEFAULT '{}',
  session_id VARCHAR(255),
  user_id UUID,
  ip_hash VARCHAR(64),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_content ON analytics_events(content_id);
CREATE INDEX idx_analytics_story ON analytics_events(story_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

CREATE TABLE IF NOT EXISTS content_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  story_id UUID,
  format VARCHAR(50) NOT NULL,
  topic VARCHAR(255),
  location_id UUID,
  publish_time TIMESTAMPTZ NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  engagement INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  ctr DECIMAL(5, 2) NOT NULL DEFAULT 0,
  commerce_clicks INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  watch_time_seconds INTEGER,
  completion_rate DECIMAL(5, 2),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI TRACKING & AGENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  story_id UUID,
  content_id UUID,
  run_id VARCHAR(255) NOT NULL,
  duration_ms INTEGER,
  errors JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_agent ON ai_usage(agent_id);
CREATE INDEX idx_ai_usage_story ON ai_usage(story_id);
CREATE INDEX idx_ai_usage_created ON ai_usage(created_at DESC);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id VARCHAR(255) NOT NULL,
  agent_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'queued', 'running', 'completed', 'failed', 'retrying')),
  input_schema TEXT,
  output_schema TEXT,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt_version VARCHAR(50) NOT NULL,
  temperature DECIMAL(3, 2) NOT NULL DEFAULT 0.7,
  input_summary TEXT,
  output_summary TEXT,
  errors JSONB NOT NULL DEFAULT '[]',
  retry_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  token_usage JSONB,
  estimated_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_agent ON agent_runs(agent_id);
CREATE INDEX idx_agent_runs_created ON agent_runs(created_at DESC);

-- ============================================================
-- JOB SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS job_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'retrying', 'dead_letter')),
  priority INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  errors JSONB NOT NULL DEFAULT '[]',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ,
  idempotency_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON job_records(status);
CREATE INDEX idx_jobs_type ON job_records(job_type);

-- ============================================================
-- USERS & AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'author' CHECK (role IN ('owner', 'editor', 'moderator', 'author', 'analyst')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action VARCHAR(255) NOT NULL,
  object_type VARCHAR(100) NOT NULL,
  object_id UUID,
  previous_state JSONB,
  new_state JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_object ON audit_logs(object_type, object_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_claims_updated_at BEFORE UPDATE ON claims FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_social_contents_updated_at BEFORE UPDATE ON social_contents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_commerce_opportunities_updated_at BEFORE UPDATE ON commerce_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_citizen_reports_updated_at BEFORE UPDATE ON citizen_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_knowledge_entities_updated_at BEFORE UPDATE ON knowledge_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_publishing_jobs_updated_at BEFORE UPDATE ON publishing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_content_performance_updated_at BEFORE UPDATE ON content_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_job_records_updated_at BEFORE UPDATE ON job_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
