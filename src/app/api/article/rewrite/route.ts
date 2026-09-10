import { NextRequest, NextResponse } from 'next/server';
import { scrapePage } from '@/modules/ingestion';
import { rewriteArticle } from '@/modules/content/rewriter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceUrl, sourceText, keyword, sourceTitle, location, category } = body;

    if (!sourceUrl && !sourceText && !keyword) {
      return NextResponse.json(
        { error: 'Harap isi URL, teks, atau kata kunci article.' },
        { status: 400 }
      );
    }

    let text = sourceText ?? '';
    let title = sourceTitle ?? '';

    // If URL is provided, scrape it first
    if (sourceUrl) {
      try {
        const scraped = await scrapePage(sourceUrl);
        text = scraped.content ?? scraped.title ?? '';
        if (!title && scraped.title) title = scraped.title;
        if (!text) {
          return NextResponse.json(
            { error: 'Tidak bisa mengambil konten dari URL tersebut.' },
            { status: 422 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Gagal fetch URL. Pastikan URL benar dan bisa diakses.' },
          { status: 422 }
        );
      }
    }

    // Keyword-only mode: AI will generate from keyword
    if (!text && keyword) {
      text = `[GENERATE FROM KEYWORD: ${keyword}]`;
    }

    if (text && text.length < 100 && !keyword) {
      return NextResponse.json(
        { error: 'Teks terlalu pendek. Minimal 100 karakter.' },
        { status: 400 }
      );
    }

    // Rewrite with AI
    const { article, storyId } = await rewriteArticle({
      sourceText: text,
      sourceUrl,
      sourceTitle: title,
      location,
      category,
    });

    return NextResponse.json({ article, storyId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/article/rewrite]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
