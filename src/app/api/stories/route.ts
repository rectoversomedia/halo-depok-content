import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('stories')
    .select(`
      id, title, summary, status, classification,
      importance_score, locality_score, novelty_score, urgency_score,
      first_seen_at, last_updated_at, published_at,
      location_id,
      locations (id, name, type),
      articles (
        id, title, dek, summary, body, sources_section,
        status, generated_by, created_at, updated_at
      )
    `)
    .order('last_updated_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
  }

  const { data: stories, error } = await query;

  if (error) {
    console.error('[API /api/stories] Supabase error:', error);
    return NextResponse.json({ stories: [], error: error.message }, { status: 500 });
  }

  // Also get article counts per story
  const storyIds = (stories ?? []).map((s: Record<string, unknown>) => s.id as string);

  let articleCountMap: Record<string, number> = {};
  let socialCountMap: Record<string, number> = {};

  if (storyIds.length > 0) {
    const [articlesRes, socialRes] = await Promise.all([
      supabase.from('articles').select('story_id').in('story_id', storyIds),
      supabase.from('social_contents').select('story_id').in('story_id', storyIds),
    ]);

    if (!articlesRes.error && articlesRes.data) {
      articleCountMap = articlesRes.data.reduce((acc: Record<string, number>, a: { story_id: string }) => {
        acc[a.story_id] = (acc[a.story_id] ?? 0) + 1;
        return acc;
      }, {});
    }

    if (!socialRes.error && socialRes.data) {
      socialCountMap = socialRes.data.reduce((acc: Record<string, number>, s: { story_id: string }) => {
        acc[s.story_id] = (acc[s.story_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  const enriched = (stories ?? []).map((story: Record<string, unknown>) => {
    const location = story['locations'] as Record<string, unknown> | null;
    const articles = story['articles'] as Record<string, unknown>[] | null;
    const primaryArticle = Array.isArray(articles) ? articles[0] : null;

    return {
      id: story['id'],
      title: story['title'] ?? 'Tanpa judul',
      summary: story['summary'] ?? '',
      status: story['status'] ?? 'discovered',
      classification: story['classification'] ?? 'monitor',
      importance_score: story['importance_score'] ?? 0,
      locality_score: story['locality_score'] ?? 0,
      novelty_score: story['novelty_score'] ?? 0,
      urgency_score: story['urgency_score'] ?? 0,
      first_seen_at: story['first_seen_at'],
      last_updated_at: story['last_updated_at'],
      published_at: story['published_at'],
      location: location ? {
        id: location['id'],
        name: location['name'],
        type: location['type'],
      } : null,
      article: primaryArticle ? {
        id: primaryArticle['id'],
        title: primaryArticle['title'],
        dek: primaryArticle['dek'],
        summary: primaryArticle['summary'],
        body: primaryArticle['body'],
        sources_section: primaryArticle['sources_section'],
        status: primaryArticle['status'],
        generated_by: primaryArticle['generated_by'],
        created_at: primaryArticle['created_at'],
        updated_at: primaryArticle['updated_at'],
        word_count: primaryArticle['body'] ? (primaryArticle['body'] as string).split(/\s+/).length : 0,
      } : null,
      article_count: articleCountMap[story['id'] as string] ?? 0,
      social_count: socialCountMap[story['id'] as string] ?? 0,
    };
  });

  return NextResponse.json({ stories: enriched, total: enriched.length });
}
