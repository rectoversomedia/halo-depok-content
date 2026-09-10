import { z } from 'zod';
import { insertRecord, updateRecord, deleteRecord, queryRecords, getRecord, TABLES } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Source, SourceType, SourceCategory, GeographicScope } from '@/types';

// ============================================================
// HALODEPOK CONTENT FACTORY — Sources Module
// ============================================================

export const CreateSourceSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  type: z.enum(['rss', 'atom', 'api', 'webhook', 'manual', 'citizen']),
  category: z.enum(['government', 'media', 'social', 'official_announcement', 'citizen', 'academic', 'commercial', 'other']),
  geographic_scope: z.enum(['national', 'provincial', 'city', 'district', 'neighborhood']),
  authority_level: z.enum(['primary', 'secondary', 'unverified']),
  reliability_score: z.number().min(0).max(100).default(50),
  active: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({}),
});

export const UpdateSourceSchema = CreateSourceSchema.partial();

export type CreateSourceInput = z.infer<typeof CreateSourceSchema>;
export type UpdateSourceInput = z.infer<typeof UpdateSourceSchema>;

export async function createSource(input: CreateSourceInput): Promise<Source> {
  const data = {
    ...input,
    id: generateId('src'),
    last_fetched_at: null,
    last_success_at: null,
    last_error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return insertRecord<Source>(TABLES.sources, data);
}

export async function updateSource(id: string, input: UpdateSourceInput): Promise<Source> {
  return updateRecord<Source>(TABLES.sources, id, input);
}

export async function deleteSource(id: string): Promise<void> {
  return deleteRecord(TABLES.sources, id);
}

export async function getSource(id: string): Promise<Source | null> {
  return getRecord<Source>(TABLES.sources, id);
}

export async function getAllSources(filters?: {
  active?: boolean;
  type?: SourceType;
  category?: SourceCategory;
}): Promise<Source[]> {
  return queryRecords<Source>(TABLES.sources, filters as Record<string, unknown>);
}

export async function getActiveSources(): Promise<Source[]> {
  return queryRecords<Source>(TABLES.sources, { active: true });
}

export async function getSourcesByType(type: SourceType): Promise<Source[]> {
  return queryRecords<Source>(TABLES.sources, { type, active: true });
}

export async function markSourceFetched(id: string, success: boolean, error?: string): Promise<void> {
  const now = new Date().toISOString();
  await updateRecord<Source>(TABLES.sources, id, {
    last_fetched_at: now,
    ...(success ? { last_success_at: now, last_error: null } : { last_error: error ?? null }),
  });
}

export async function toggleSourceActive(id: string, active: boolean): Promise<Source> {
  return updateRecord<Source>(TABLES.sources, id, { active });
}

// Predefined Depok-relevant sources
export const DEFAULT_SOURCES = [
  {
    name: 'BNPB Indonesia',
    url: 'https://bnpb.go.id/feed',
    type: 'rss',
    category: 'government',
    geographic_scope: 'national',
    authority_level: 'primary',
    reliability_score: 95,
    active: true,
  },
  {
    name: 'DKI Jakarta Provincial Government',
    url: 'https://www.jakarta.go.id/rss',
    type: 'rss',
    category: 'government',
    geographic_scope: 'city',
    authority_level: 'primary',
    reliability_score: 90,
    active: true,
  },
  {
    name: 'BMKG Weather',
    url: 'https://www.bmkg.go.id/feed/berita.xml',
    type: 'rss',
    category: 'government',
    geographic_scope: 'national',
    authority_level: 'primary',
    reliability_score: 90,
    active: true,
  },
  {
    name: 'Detik News',
    url: 'https://feed.detik.com/mediacontent/detiknews',
    type: 'rss',
    category: 'media',
    geographic_scope: 'national',
    authority_level: 'secondary',
    reliability_score: 80,
    active: true,
  },
  {
    name: 'Kompas News',
    url: 'https://news.kompas.com/rss/latest',
    type: 'rss',
    category: 'media',
    geographic_scope: 'national',
    authority_level: 'secondary',
    reliability_score: 82,
    active: true,
  },
  {
    name: 'Tribun Jakarta',
    url: 'https://jakarta.tribunnews.com/rss',
    type: 'rss',
    category: 'media',
    geographic_scope: 'city',
    authority_level: 'secondary',
    reliability_score: 75,
    active: true,
  },
  {
    name: 'Kata Data',
    url: 'https://katadata.co.id/feed',
    type: 'rss',
    category: 'media',
    geographic_scope: 'national',
    authority_level: 'secondary',
    reliability_score: 78,
    active: true,
  },
  {
    name: 'CNN Indonesia',
    url: 'https://www.cnnindonesia.com/rss',
    type: 'rss',
    category: 'media',
    geographic_scope: 'national',
    authority_level: 'secondary',
    reliability_score: 80,
    active: true,
  },
  {
    name: 'Jakarta Traffic Police',
    url: 'https://twitter.com/jakpolres/statuses/feed',
    type: 'atom',
    category: 'government',
    geographic_scope: 'city',
    authority_level: 'primary',
    reliability_score: 85,
    active: true,
  },
  {
    name: 'Depok Government',
    url: 'https://www.depok.go.id/berita/feed',
    type: 'rss',
    category: 'government',
    geographic_scope: 'district',
    authority_level: 'primary',
    reliability_score: 88,
    active: true,
  },
];
