import { queryRecords, insertRecord, updateRecord, TABLES } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Story, EditorialStatus } from '@/types';

// ============================================================
// JAKSELNEWS CONTENT FACTORY — Stories Management
// ============================================================

export async function getStories(filters?: {
  status?: EditorialStatus;
  classification?: string;
  limit?: number;
  offset?: number;
}): Promise<Story[]> {
  return queryRecords<Story>(TABLES.stories, filters as Record<string, unknown>, {
    order: 'last_updated_at',
    limit: filters?.limit ?? 50,
    offset: filters?.offset,
  });
}

export async function getStory(id: string): Promise<Story | null> {
  const { getRecord } = await import('@/lib/db');
  return getRecord<Story>(TABLES.stories, id);
}

export async function updateStoryStatus(id: string, status: EditorialStatus): Promise<Story> {
  return updateRecord<Story>(TABLES.stories, id, {
    status,
    last_updated_at: new Date().toISOString(),
  });
}

export async function approveStory(id: string, approvedBy: string): Promise<Story> {
  return updateRecord<Story>(TABLES.stories, id, {
    status: 'approved',
    last_updated_at: new Date().toISOString(),
  });
}

export async function rejectStory(id: string, reason?: string): Promise<Story> {
  return updateRecord<Story>(TABLES.stories, id, {
    status: 'rejected',
    last_updated_at: new Date().toISOString(),
  });
}

export async function getStoryCounts(): Promise<Record<EditorialStatus, number>> {
  const stories = await queryRecords<Story>(TABLES.stories, {});

  const counts = {} as Record<EditorialStatus, number>;
  const statuses: EditorialStatus[] = [
    'discovered', 'investigating', 'verification_required', 'verified',
    'content_ready', 'editor_review', 'approved', 'scheduled', 'published',
    'rejected', 'conflicted', 'stale', 'blocked',
  ];

  for (const s of statuses) counts[s] = 0;
  for (const story of stories) {
    counts[story.status] = (counts[story.status] ?? 0) + 1;
  }

  return counts;
}

export async function getRecentPublished(limit = 10): Promise<Story[]> {
  return queryRecords<Story>(TABLES.stories, { status: 'published' }, { limit, order: 'published_at' });
}

export async function getUrgentStories(): Promise<Story[]> {
  return queryRecords<Story>(TABLES.stories, { classification: 'urgent_review' }, { limit: 10 });
}
