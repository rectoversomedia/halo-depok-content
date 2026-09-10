import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'all';

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('citizen_reports')
    .select(`*, locations (id, name, type)`)
    .order('submitted_at', { ascending: false })
    .limit(100);

  if (status !== 'all') {
    query = query.eq('moderation_status', status);
  }

  const { data: reports, error } = await query;

  if (error) {
    return NextResponse.json({ reports: [], error: error.message }, { status: 500 });
  }

  const enriched = (reports ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    text: r.text ?? '',
    location_text: r.location_text ?? '',
    location: r.locations ? {
      id: (r.locations as Record<string, unknown>).id,
      name: (r.locations as Record<string, unknown>).name,
    } : null,
    category: r.category,
    media: r.media,
    submitted_at: r.submitted_at,
    moderation_status: r.moderation_status,
    moderation_notes: r.moderation_notes,
    confidence: r.confidence,
    story_signal: r.story_signal,
    metadata: r.metadata ?? {},
  }));

  return NextResponse.json({ reports: enriched, total: enriched.length });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, moderation_status, moderation_notes } = body;

  if (!id || !moderation_status) {
    return NextResponse.json({ error: 'id and moderation_status required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('citizen_reports')
    .update({ moderation_status, moderation_notes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
