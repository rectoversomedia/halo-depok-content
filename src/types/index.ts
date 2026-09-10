// ============================================================
// JAKSELNEWS CONTENT FACTORY — Core Domain Types
// ============================================================
import { z } from 'zod';

// --- Enums ---

export type SourceType = 'rss' | 'atom' | 'api' | 'webhook' | 'manual' | 'citizen';
export type SourceCategory =
  | 'government'
  | 'media'
  | 'social'
  | 'official_announcement'
  | 'citizen'
  | 'academic'
  | 'commercial'
  | 'other';
export type GeographicScope = 'national' | 'provincial' | 'city' | 'district' | 'neighborhood';
export type AuthorityLevel = 'primary' | 'secondary' | 'unverified';

export type EditorialStatus =
  | 'discovered'
  | 'investigating'
  | 'verification_required'
  | 'verified'
  | 'content_ready'
  | 'editor_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected'
  | 'conflicted'
  | 'stale'
  | 'blocked';

export type StoryClassification = 'ignore' | 'monitor' | 'investigate' | 'draft' | 'urgent_review';
export type ClaimType =
  | 'fact'
  | 'statement'
  | 'event'
  | 'prediction'
  | 'opinion'
  | 'rumor';
export type VerificationStatus =
  | 'unverified'
  | 'partially_verified'
  | 'verified'
  | 'contradicted'
  | 'stale'
  | 'needs_human_review';

export type ContentFormat =
  | 'article'
  | 'tiktok'
  | 'instagram_carousel'
  | 'instagram_reel'
  | 'youtube_short'
  | 'x_post'
  | 'facebook_post'
  | 'whatsapp_status';

export type VisualSource =
  | 'real'
  | 'citizen'
  | 'official'
  | 'licensed'
  | 'ai_generated';

export type ContentStatus = 'draft' | 'version' | 'published' | 'archived';
export type PublishStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'unpublished';

export type CitizenReportCategory =
  | 'traffic'
  | 'flood'
  | 'fire'
  | 'accident'
  | 'public_safety'
  | 'event'
  | 'infrastructure'
  | 'business'
  | 'weather'
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SafetyCheckResult = 'pass' | 'warn' | 'block';

export type CommerceType = 'affiliate' | 'editorial' | 'sponsored' | 'local_discovery';
export type AgentStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'retrying';

export type UserRole = 'owner' | 'editor' | 'moderator' | 'author' | 'analyst';

// --- Database Entities ---

export interface Source {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  category: SourceCategory;
  geographic_scope: GeographicScope;
  authority_level: AuthorityLevel;
  reliability_score: number; // 0-100
  active: boolean;
  last_fetched_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RawItem {
  id: string;
  source_id: string;
  external_id: string | null;
  url: string | null;
  canonical_url: string | null;
  title: string | null;
  raw_content: string;
  published_at: string | null;
  retrieved_at: string;
  media: RawItemMedia[];
  metadata: Record<string, unknown>;
  content_hash: string;
  created_at: string;
}

export interface RawItemMedia {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  caption?: string;
  source?: VisualSource;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  type: 'country' | 'province' | 'city' | 'district' | 'neighborhood' | 'landmark' | 'street';
  parent_id: string | null;
  coordinates: [number, number] | null; // [lng, lat]
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  title: string | null;
  summary: string | null;
  status: EditorialStatus;
  classification: StoryClassification;
  importance_score: number; // 0-100
  locality_score: number; // 0-100
  novelty_score: number; // 0-100
  urgency_score: number; // 0-100
  risk_score: number; // 0-100
  commercial_score: number; // 0-100
  location_id: string | null;
  editorial_brief: EditorialBrief | null;
  first_seen_at: string;
  last_updated_at: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditorialBrief {
  what_happened: string;
  where: string;
  when: string;
  who: string;
  what_is_verified: string[];
  what_is_uncertain: string[];
  why_it_matters: string;
  what_residents_should_know: string;
  what_happens_next: string;
}

export interface StoryCluster {
  id: string;
  primary_story_id: string;
  member_story_ids: string[];
  cluster_hash: string;
  coherence_score: number;
  created_at: string;
}

export interface Claim {
  id: string;
  story_id: string;
  claim_text: string;
  claim_type: ClaimType;
  confidence: number; // 0-100
  verification_status: VerificationStatus;
  evidence_count: number;
  contradiction_count: number;
  first_observed_at: string;
  last_verified_at: string | null;
  stale_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  claim_id: string;
  source_id: string;
  raw_item_id: string | null;
  evidence_text: string;
  observed_at: string | null;
  relevance_score: number; // 0-100
  confidence: number; // 0-100
  created_at: string;
}

export interface VerificationRun {
  id: string;
  claim_id: string;
  agent_id: string;
  status: AgentStatus;
  verification_status: VerificationStatus;
  confidence: number;
  details: Record<string, unknown>;
  errors: string[];
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface KnowledgeEntity {
  id: string;
  entity_type: 'person' | 'organization' | 'business' | 'place' | 'landmark' | 'event' | 'product' | 'topic';
  name: string;
  normalized_name: string;
  slug: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeRelation {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  relation_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CitizenReport {
  id: string;
  category: CitizenReportCategory;
  text: string | null;
  media: RawItemMedia[];
  location_text: string | null;
  location_id: string | null;
  coordinates: [number, number] | null;
  submitted_at: string;
  reporter_ip_hash: string | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_notes: string | null;
  story_signal: string | null; // linked story_id
  confidence: number; // 0-100
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  story_id: string;
  title: string;
  dek: string | null;
  summary: string | null;
  body: string | null;
  key_facts: string[];
  timeline: TimelineEvent[];
  faq: FAQItem[];
  sources_section: string | null;
  update_timestamp: string | null;
  slug: string | null;
  status: ContentStatus;
  version: number;
  generated_by: string; // agent_id
  prompt_version: string;
  human_editor_id: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
  source?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SEOMetadata {
  id: string;
  content_id: string;
  content_type: ContentFormat;
  seo_title: string | null;
  meta_description: string | null;
  slug: string | null;
  h1: string | null;
  h2_list: string[];
  canonical: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  alt_texts: Record<string, string>;
  internal_links: string[];
  external_links: string[];
  structured_data: Record<string, unknown>;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

export interface GEOMetadata {
  id: string;
  content_id: string;
  tldr: string | null;
  key_facts: Record<string, string>;
  location_context: string | null;
  date_context: string | null;
  entities_list: string[];
  verified_claims: string[];
  uncertain_claims: string[];
  source_references: string[];
  structured_answer: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EEATScore {
  id: string;
  content_id: string;
  experience_score: number;
  expertise_score: number;
  authoritativeness_score: number;
  trustworthiness_score: number;
  overall_score: number;
  missing_evidence: string[];
  warnings: string[];
  recommendations: string[];
  created_at: string;
  updated_at: string;
}

export interface SocialContent {
  id: string;
  story_id: string;
  article_id: string | null;
  format: ContentFormat;
  hook: string | null;
  caption: string | null;
  body: string | null;
  hashtags: string[];
  visual_direction: VisualPlan | null;
  voiceover_script: string | null;
  subtitle: string | null;
  thumbnail_concept: string | null;
  cta: string | null;
  duration_seconds: number | null;
  source_attributions: string[];
  status: ContentStatus;
  version: number;
  generated_by: string;
  prompt_version: string;
  created_at: string;
  updated_at: string;
}

export interface VisualPlan {
  scenes: VisualScene[];
  total_duration_seconds: number;
  style: string;
}

export interface VisualScene {
  order: number;
  start_time: number;
  duration_seconds: number;
  visual_type: 'image' | 'video' | 'infographic' | 'kinetic_typography' | 'map' | 'ai_generated';
  visual_source: VisualSource;
  visual_description: string;
  on_screen_text: string | null;
  narration: string | null;
  transition: string;
  source_attribution: string | null;
}

export interface CommerceOpportunity {
  id: string;
  story_id: string;
  article_id: string | null;
  opportunity_type: 'product' | 'merchant' | 'service' | 'event' | 'guide' | 'affiliate' | 'local_discovery';
  relevance_score: number; // 0-100
  commercial_type: CommerceType;
  title: string;
  description: string | null;
  merchant_id: string | null;
  products: ProductRecommendation[];
  affiliate_links: AffiliateLink[];
  recommendation_strength: 'strong' | 'moderate' | 'weak' | 'none';
  editorial_rationale: string;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: string;
  name: string;
  location_id: string | null;
  location_text: string | null;
  category: string;
  price_range: string | null;
  hours: string | null;
  website: string | null;
  phone: string | null;
  products: string[];
  offers: string[];
  affiliate_status: boolean;
  sponsorship_status: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductRecommendation {
  name: string;
  category: string;
  price_range: string | null;
  merchant_id: string | null;
  affiliate_link: string | null;
  tracking_url: string | null;
  relevance_score: number;
}

export interface AffiliateLink {
  product_name: string;
  tracking_url: string;
  provider: string;
  commission_metadata: Record<string, unknown> | null;
}

export interface PublishingJob {
  id: string;
  content_id: string;
  content_type: ContentFormat;
  status: PublishStatus;
  provider: 'wordpress' | 'website' | 'social';
  provider_id: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  errors: string[];
  retry_count: number;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_type: 'page_view' | 'content_view' | 'engagement' | 'social_view' | 'commerce_click' | 'conversion';
  content_id: string | null;
  story_id: string | null;
  format: ContentFormat | null;
  metadata: Record<string, unknown>;
  session_id: string | null;
  user_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
}

export interface ContentPerformance {
  id: string;
  content_id: string;
  story_id: string | null;
  format: ContentFormat;
  topic: string | null;
  location_id: string | null;
  publish_time: string;
  views: number;
  engagement: number;
  shares: number;
  saves: number;
  ctr: number;
  commerce_clicks: number;
  revenue: number;
  watch_time_seconds: number | null;
  completion_rate: number | null;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface AIIonUsage {
  id: string;
  agent_id: string;
  provider: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost: number;
  story_id: string | null;
  content_id: string | null;
  run_id: string;
  duration_ms: number | null;
  errors: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  agent_name: string;
  status: AgentStatus;
  input_schema: string;
  output_schema: string;
  provider: string;
  model: string;
  prompt_version: string;
  temperature: number;
  input_summary: string;
  output_summary: string | null;
  errors: string[];
  retry_count: number;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  token_usage: { input: number; output: number; total: number } | null;
  estimated_cost: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  object_type: string;
  object_id: string | null;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface JobRecord {
  id: string;
  job_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'retrying' | 'dead_letter';
  priority: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  errors: string[];
  attempts: number;
  max_attempts: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  timeout_at: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

// --- Agent Types ---

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  provider: string;
  model: string;
  prompt_version: string;
  temperature: number;
  input_schema: z.ZodSchema;
  output_schema: z.ZodSchema;
  timeout_ms: number;
  max_retries: number;
  cost_budget: number; // max cost per run in USD
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  run: AgentRun;
  warnings?: string[];
}

// --- Discovery Types ---

export interface DiscoveryScore {
  relevance_score: number;
  locality_score: number;
  novelty_score: number;
  urgency_score: number;
  potential_reach_score: number;
  commercial_intent_score: number;
  overall_score: number;
  classification: StoryClassification;
}

export interface DeduplicationMatch {
  existing_raw_item_id: string;
  confidence: number; // 0-100
  match_reasons: string[];
  should_merge: boolean;
}

// --- Pipeline Types ---

export interface PipelineStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  errors: string[];
  output: unknown;
}

export interface PipelineRun {
  id: string;
  story_id: string;
  stages: PipelineStage[];
  status: 'running' | 'completed' | 'failed' | 'partial';
  started_at: string;
  completed_at: string | null;
  total_duration_ms: number | null;
  created_at: string;
}

// --- Safety Types ---

export interface SafetyCheck {
  result: SafetyCheckResult;
  risk_level: RiskLevel;
  categories: SafetyCategory[];
  warnings: string[];
  conflicts: string[];
  recommended_changes: string[];
  publish_block: boolean;
  blocked_reason: string | null;
}

export interface SafetyCategory {
  category: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

// --- Convenience Union Types ---

export type AnyEntity =
  | Source
  | RawItem
  | Story
  | Claim
  | Evidence
  | CitizenReport
  | Article
  | SocialContent
  | CommerceOpportunity
  | Merchant
  | KnowledgeEntity;

export type AnyContent = Article | SocialContent;
