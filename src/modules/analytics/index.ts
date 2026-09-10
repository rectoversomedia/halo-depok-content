import { insertRecord, queryRecords, TABLES } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { AnalyticsEvent, ContentPerformance, ContentFormat } from '@/types';

// ============================================================
// HALODEPOK CONTENT FACTORY — Analytics Engine
// ============================================================

export async function trackEvent(data: {
  eventType: AnalyticsEvent['event_type'];
  contentId?: string;
  storyId?: string;
  format?: ContentFormat;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  userId?: string;
  ipHash?: string;
  userAgent?: string;
  referrer?: string;
}): Promise<void> {
  const event: Partial<AnalyticsEvent> = {
    id: generateId('evt'),
    event_type: data.eventType,
    content_id: data.contentId ?? null,
    story_id: data.storyId ?? null,
    format: data.format ?? null,
    metadata: data.metadata ?? {},
    session_id: data.sessionId ?? null,
    user_id: data.userId ?? null,
    ip_hash: data.ipHash ?? null,
    user_agent: data.userAgent ?? null,
    referrer: data.referrer ?? null,
    created_at: new Date().toISOString(),
  };

  await insertRecord<AnalyticsEvent>(TABLES.analytics_events, event);
}

export async function getContentPerformance(
  contentId?: string,
  periodStart?: string,
  periodEnd?: string
): Promise<ContentPerformance[]> {
  const filters: Record<string, unknown> = {};
  if (contentId) filters['content_id'] = contentId;
  if (periodStart) filters['period_start'] = periodStart;
  if (periodEnd) filters['period_end'] = periodEnd;
  return queryRecords<ContentPerformance>(TABLES.content_performance, filters);
}

export async function getTopPerformingContent(
  limit = 10,
  format?: ContentFormat
): Promise<ContentPerformance[]> {
  const filters: Record<string, unknown> = {};
  if (format) filters['format'] = format;

  const records = await queryRecords<ContentPerformance>(
    TABLES.content_performance,
    filters,
    { order: 'views', limit }
  );

  return records.sort((a, b) => b.views - a.views);
}

export async function getDashboardStats(): Promise<{
  storiesToday: number;
  publishedToday: number;
  pendingReview: number;
  verificationNeeded: number;
  commerceOpportunities: number;
  citizenReports: number;
  agentErrors: number;
}> {
  const [stories, commerce, citizens] = await Promise.all([
    queryRecords<{ status: string }>(TABLES.stories, {}),
    queryRecords<{ status: string }>(TABLES.commerce_opportunities, { status: 'pending' }),
    queryRecords<{ moderation_status: string }>(TABLES.citizen_reports, {}),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const storiesToday = stories.filter(
    (s) => s.status === 'published' && (s as unknown as { published_at?: string }).published_at?.startsWith(today)
  ).length;

  return {
    storiesToday,
    publishedToday: storiesToday,
    pendingReview: stories.filter((s) => s.status === 'editor_review').length,
    verificationNeeded: stories.filter((s) => s.status === 'verification_required' || s.status === 'investigating').length,
    commerceOpportunities: commerce.length,
    citizenReports: citizens.filter((c) => c.moderation_status === 'pending').length,
    agentErrors: 0, // TODO: track from agent_runs
  };
}

// Learning Engine - Strategic Recommendations
export async function generateContentStrategy(): Promise<{
  highPriority: Array<{ topic: string; reason: string; stories: number }>;
  community: Array<{ topic: string; reason: string; stories: number }>;
  explainer: Array<{ topic: string; reason: string }>;
  localDiscovery: Array<{ location: string; opportunities: number }>;
  commerce: Array<{ category: string; opportunity: string }>;
}> {
  const stories = await queryRecords<{
    title: string;
    status: string;
    commercial_score: number;
    locality_score: number;
  }>(TABLES.stories, { status: 'published' });

  // Analyze topic patterns
  const topicCounts: Record<string, number> = {};
  for (const s of stories) {
    const topic = s.title?.split(' ').slice(0, 3).join(' ') ?? 'Other';
    topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
  }

  const sortedTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([topic, count]) => ({ topic, count }));

  return {
    highPriority: sortedTopics.slice(0, 3).map(({ topic, count }) => ({
      topic,
      reason: 'High reader engagement and relevance to Depok residents',
      stories: count,
    })),
    community: [
      { topic: 'Community Events', reason: 'Builds local engagement and resident connection', stories: 2 },
      { topic: 'Infrastructure Updates', reason: 'Directly affects daily commute and quality of life', stories: 2 },
    ],
    explainer: [
      { topic: 'Local Government Process', reason: 'Residents often confused about local governance' },
      { topic: 'Flood Management Guide', reason: 'Seasonal concern with practical action items' },
    ],
    localDiscovery: [
      { location: 'Kemang', opportunities: 5 },
      { location: 'Blok M', opportunities: 4 },
      { location: 'Senayan', opportunities: 3 },
    ],
    commerce: [
      { category: 'Food & Beverage', opportunity: 'New restaurant openings drive high engagement' },
      { category: 'Services', opportunity: 'Home services have consistent demand' },
    ],
  };
}
