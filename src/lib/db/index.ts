import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// HALODEPOK CONTENT FACTORY — Database Layer
// Lazy initialization so clients are created at RUNTIME, not build time
// This prevents build errors when env vars differ between environments
// ============================================================

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function requireSupabaseUrl(): string {
  // Prefer non-NEXT_PUBLIC_ for server-side to avoid build-time stripping
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!url) throw new Error('SUPABASE_URL is not set');
  return url;
}

function requireAnonKey(): string {
  // Prefer non-NEXT_PUBLIC_ for server-side to avoid build-time stripping
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!key) throw new Error('SUPABASE_ANON_KEY is not set');
  return key;
}

function requireServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return key;
}

// Client-side Supabase (anon key)
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(requireSupabaseUrl(), requireAnonKey(), {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _supabase;
}

// Server-side Supabase (service role — bypasses RLS)
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(requireSupabaseUrl(), requireServiceKey(), {
      auth: { persistSession: false },
    });
  }
  return _supabaseAdmin;
}

// Backwards-compatible named exports (these will throw if called before init,
// which is the correct behavior — callers should use the factory functions)
export const supabase = new Proxy({} as SupabaseClient, {
  get: () => { throw new Error('Use getSupabase() instead of supabase'); },
});
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: () => { throw new Error('Use getSupabaseAdmin() instead of supabaseAdmin'); },
});

// Type-safe table names
export const TABLES = {
  sources: 'sources',
  raw_items: 'raw_items',
  stories: 'stories',
  story_clusters: 'story_clusters',
  claims: 'claims',
  evidence: 'evidence',
  locations: 'locations',
  knowledge_entities: 'knowledge_entities',
  knowledge_relations: 'knowledge_relations',
  citizen_reports: 'citizen_reports',
  articles: 'articles',
  social_contents: 'social_contents',
  seo_metadata: 'seo_metadata',
  geo_metadata: 'geo_metadata',
  eeat_scores: 'eeat_scores',
  commerce_opportunities: 'commerce_opportunities',
  merchants: 'merchants',
  publishing_jobs: 'publishing_jobs',
  analytics_events: 'analytics_events',
  content_performance: 'content_performance',
  ai_usage: 'ai_usage',
  agent_runs: 'agent_runs',
  job_records: 'job_records',
  users: 'users',
  audit_logs: 'audit_logs',
} as const;

// Generic CRUD helpers

export async function insertRecord<T>(table: string, data: Partial<T>, options?: { returning?: boolean }) {
  const { data: result, error } = await getSupabaseAdmin()
    .from(table)
    .insert(data as Record<string, unknown>)
    .select(options?.returning !== false ? '*' : '')
    .single();
  if (error) throw new Error(`Insert failed for ${table}: ${error.message}`);
  return result as T;
}

export async function updateRecord<T>(table: string, id: string, data: Partial<T>) {
  const { data: result, error } = await getSupabaseAdmin()
    .from(table)
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Update failed for ${table}: ${error.message}`);
  return result as T;
}

export async function deleteRecord(table: string, id: string) {
  const { error } = await getSupabaseAdmin().from(table).delete().eq('id', id);
  if (error) throw new Error(`Delete failed for ${table}: ${error.message}`);
}

export async function getRecord<T>(table: string, id: string): Promise<T | null> {
  const { data, error } = await getSupabaseAdmin().from(table).select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw new Error(`Get failed for ${table}: ${error.message}`);
  return data as T | null;
}

export async function queryRecords<T>(
  table: string,
  filters: Record<string, unknown> = {},
  options?: { order?: string; limit?: number; offset?: number; select?: string }
) {
  let q = getSupabaseAdmin().from(table).select(options?.select ?? '*');
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q = q.eq(k, v);
  });
  if (options?.order) q = q.order(options.order as never, { ascending: false });
  if (options?.limit) q = q.limit(options.limit);
  if (options?.offset) q = q.range(options.offset, options.offset + (options.limit ?? 50) - 1);
  const { data, error } = await q;
  if (error) throw new Error(`Query failed for ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

export async function batchInsert<T>(table: string, records: Partial<T>[]) {
  if (records.length === 0) return [];
  const { data, error } = await getSupabaseAdmin().from(table).insert(records as Record<string, unknown>[]).select();
  if (error) throw new Error(`Batch insert failed for ${table}: ${error.message}`);
  return data as T[];
}

export async function upsertRecord<T>(table: string, data: Partial<T>, uniqueKeys: string[]) {
  const { data: result, error } = await getSupabaseAdmin()
    .from(table)
    .upsert(data as never, { onConflict: uniqueKeys.join(',') })
    .select()
    .single();
  if (error) throw new Error(`Upsert failed for ${table}: ${error.message}`);
  return result as T;
}
