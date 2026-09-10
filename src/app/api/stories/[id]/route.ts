import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabaseAdmin();
  const { id } = params;

  const [storyRes, articlesRes, socialRes, claimsRes] = await Promise.all([
    supabase
      .from('stories')
      .select(`*, locations (id, name, type, parent_id)`)
      .eq('id', id)
      .single(),
    supabase
      .from('articles')
      .select(`*`)
      .eq('story_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('social_contents')
      .select(`*`)
      .eq('story_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('claims')
      .select(`*`)
      .eq('story_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (storyRes.error) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  const story = storyRes.data;
  const articles = articlesRes.data ?? [];
  const socials = socialRes.data ?? [];
  const claims = claimsRes.data ?? [];

  // Fetch evidence for each claim
  const claimIds = claims.map((c: { id: string }) => c.id);
  let evidenceMap: Record<string, unknown[]> = {};
  if (claimIds.length > 0) {
    const evidenceRes = await supabase
      .from('evidence')
      .select(`*, sources (id, name, url)`)
      .in('claim_id', claimIds);
    if (!evidenceRes.error && evidenceRes.data) {
      evidenceRes.data.forEach((e: Record<string, unknown>) => {
        const cid = e.claim_id as string;
        if (!evidenceMap[cid]) evidenceMap[cid] = [];
        evidenceMap[cid].push(e);
      });
    }
  }

  // SEO metadata
  const seoRes = await supabase
    .from('seo_metadata')
    .select(`*`)
    .eq('content_id', id)
    .single();

  // E-E-A-T scores
  const eeatRes = await supabase
    .from('eeat_scores')
    .select(`*`)
    .eq('content_id', id)
    .single();

  // GEO metadata
  const geoRes = await supabase
    .from('geo_metadata')
    .select(`*`)
    .eq('content_id', id)
    .single();

  const primaryArticle = articles[0] ?? null;

  return NextResponse.json({
    story,
    article: primaryArticle,
    articles,
    socials,
    claims: claims.map((c: Record<string, unknown>) => ({
      ...c,
      evidence: evidenceMap[c.id as string] ?? [],
    })),
    seo: seoRes.data ?? null,
    eeat: eeatRes.data ?? null,
    geo: geoRes.data ?? null,
  });
}
