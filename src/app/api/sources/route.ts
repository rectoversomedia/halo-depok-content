import { NextRequest, NextResponse } from 'next/server';
import { getAllSources, createSource, getActiveSources } from '@/modules/sources';
import type { SourceType, SourceCategory } from '@/types';

// GET /api/sources - List sources
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('active') === 'true';
  const type = searchParams.get('type') as SourceType | null;

  try {
    const sources = activeOnly
      ? await getActiveSources()
      : await getAllSources(type ? { type } : undefined);

    return NextResponse.json({ sources });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error }, { status: 500 });
  }
}

// POST /api/sources - Add new source
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const source = await createSource({
      name: body.name,
      url: body.url,
      type: body.type,
      category: body.category,
      geographic_scope: body.geographic_scope,
      authority_level: body.authority_level,
      reliability_score: body.reliability_score ?? 50,
      active: body.active ?? true,
      metadata: body.metadata ?? {},
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error }, { status: 500 });
  }
}
