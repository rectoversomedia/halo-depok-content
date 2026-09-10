import { NextRequest, NextResponse } from 'next/server';
import { ingestRSS } from '@/modules/ingestion';
import { getAllSources } from '@/modules/sources';

// GET /api/ingestion - Trigger source ingestion
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('sourceId');

  try {
    if (sourceId) {
      const { getSource } = await import('@/modules/sources');
      const source = await getSource(sourceId);
      if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 });

      const result = await ingestRSS(source);
      return NextResponse.json({ results: [result] });
    }

    // Ingest all active RSS/Atom sources
    const sources = await getAllSources({ active: true });
    const rssSources = sources.filter((s) => s.type === 'rss' || s.type === 'atom');

    const results = await Promise.allSettled(
      rssSources.map(async (source) => {
        const { ingestRSS: ingest } = await import('@/modules/ingestion');
        return ingest(source);
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      total: rssSources.length,
      successful,
      failed,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { error: (r as PromiseRejectedResult).reason?.message }
      ),
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error }, { status: 500 });
  }
}
