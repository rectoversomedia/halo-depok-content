import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import { hashContent, generateId } from '@/lib/utils';
import { insertRecord, batchInsert, queryRecords, TABLES } from '@/lib/db';
import { markSourceFetched, getSource } from '@/modules/sources';
import type { RawItem, Source } from '@/types';

// ============================================================
// HALODEPOK CONTENT FACTORY — Ingestion Engine
// ============================================================

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
});

export const IngestResultSchema = z.object({
  sourceId: z.string().uuid(),
  itemsProcessed: z.number(),
  itemsNew: z.number(),
  itemsDuplicate: z.number(),
  errors: z.array(z.string()),
  startedAt: z.string(),
  completedAt: z.string(),
  durationMs: z.number(),
});

export type IngestResult = z.infer<typeof IngestResultSchema>;

interface ParsedItem {
  title: string | null;
  url: string | null;
  canonicalUrl: string | null;
  rawContent: string;
  publishedAt: string | null;
  media: RawItem['media'];
  externalId: string | null;
}

// --- RSS / Atom Ingestion ---

export async function ingestRSS(source: Source): Promise<IngestResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  let itemsNew = 0;
  let itemsDuplicate = 0;

  try {
    const feed = await parser.parseURL(source.url);
    const items: Partial<RawItem>[] = [];

    for (const rawItem of feed.items) {
      const parsed = parseRSSItem(rawItem as unknown as Record<string, unknown>);
      if (!parsed) continue;

      const contentHash = hashContent(parsed.rawContent + (parsed.title ?? '') + (parsed.publishedAt ?? ''));

      const existing = await queryRecords<RawItem>(TABLES.raw_items, {
        source_id: source.id,
        content_hash: contentHash,
      }, { limit: 1 });

      if (existing.length > 0) {
        itemsDuplicate++;
        continue;
      }

      const rawRecord: Partial<RawItem> = {
        id: generateId('raw'),
        source_id: source.id,
        external_id: parsed.externalId,
        url: parsed.url,
        canonical_url: parsed.canonicalUrl,
        title: parsed.title,
        raw_content: parsed.rawContent,
        published_at: parsed.publishedAt,
        retrieved_at: new Date().toISOString(),
        media: parsed.media,
        metadata: {},
        content_hash: contentHash,
        created_at: new Date().toISOString(),
      };

      items.push(rawRecord);
      itemsNew++;
    }

    if (items.length > 0) {
      await batchInsert<RawItem>(TABLES.raw_items, items);
    }

    await markSourceFetched(source.id, true);
    return {
      sourceId: source.id,
      itemsProcessed: itemsNew + itemsDuplicate,
      itemsNew,
      itemsDuplicate,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - new Date(startedAt).getTime(),
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    errors.push(error);
    await markSourceFetched(source.id, false, error);
    return {
      sourceId: source.id,
      itemsProcessed: 0,
      itemsNew: 0,
      itemsDuplicate: 0,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - new Date(startedAt).getTime(),
    };
  }
}

function parseRSSItem(item: Record<string, unknown>): ParsedItem | null {
  const raw = item as Record<string, unknown>;
  const title = (raw.title as string | undefined) ?? null;
  const url = (raw.link as string | undefined) ?? null;
  const publishedAt = (raw.isoDate as string | undefined) ?? (raw.pubDate as string | undefined) ?? null;

  let rawContent = (raw.contentSnippet as string | undefined) ?? (raw.content as string | undefined) ?? '';
  if (typeof raw.content === 'string') {
    const $ = cheerio.load(raw.content);
    rawContent = $('body').text().trim() || rawContent;
  }

  const media: RawItem['media'] = [];

  if (raw.enclosure && typeof raw.enclosure === 'object') {
    const enc = raw.enclosure as Record<string, unknown>;
    if (enc.url) {
      media.push({
        type: typeof enc.type === 'string' && enc.type.startsWith('video') ? 'video' : 'image',
        url: String(enc.url),
      });
    }
  }

  if (raw.mediaContent) {
    const mc = Array.isArray(raw.mediaContent) ? raw.mediaContent : [raw.mediaContent];
    for (const m of mc) {
      if (typeof m === 'object' && m !== null && 'url' in m) {
        media.push({ type: 'image', url: String((m as Record<string, unknown>).url) });
      }
    }
  }

  return {
    title,
    url,
    canonicalUrl: url,
    rawContent: rawContent.slice(0, 50000),
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
    media,
    externalId: (raw.guid as string | undefined) ?? url,
  };
}

// --- Web Scraper (for HTML pages) ---

export async function scrapePage(url: string): Promise<{ title: string | null; content: string; url: string }> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'HaloDepok Content Factory/1.0 (+https://halodepok.com)' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);

  const html = await response.text();
  const $ = cheerio.load(html);

  $('script, style, nav, header, footer, aside, .ads, .advertisement, .social-share').remove();

  const title = $('h1').first().text().trim() || $('title').text().trim() || null;
  const content = $('article, .content, .post-content, .entry-content, main').text().trim()
    || $('body').text().trim();

  return { title, content: content.slice(0, 50000), url };
}

// --- Deduplication ---

export async function checkDuplicate(
  sourceId: string,
  contentHash: string
): Promise<{ isDuplicate: boolean; existingId: string | null }> {
  const existing = await queryRecords<RawItem>(TABLES.raw_items, {
    source_id: sourceId,
    content_hash: contentHash,
  }, { limit: 1 });

  return {
    isDuplicate: existing.length > 0,
    existingId: existing[0]?.id ?? null,
  };
}

// --- Batch Ingestion ---

export async function ingestAllActiveSources(): Promise<IngestResult[]> {
  const { queryRecords } = await import('@/lib/db');
  const sources = await queryRecords<Source>(TABLES.sources, { active: true });

  const results: IngestResult[] = [];
  for (const source of sources) {
    if (source.type === 'rss' || source.type === 'atom') {
      const result = await ingestRSS(source);
      results.push(result);
    }
    // API, Webhook, Manual handled separately
  }

  return results;
}

// --- Store Raw Item (manual / citizen) ---

export async function storeRawItem(data: {
  sourceId: string;
  title?: string;
  rawContent: string;
  url?: string;
  publishedAt?: string;
  media?: RawItem['media'];
  metadata?: Record<string, unknown>;
}): Promise<RawItem> {
  const contentHash = hashContent(data.rawContent + (data.title ?? ''));

  const item: Partial<RawItem> = {
    id: generateId('raw'),
    source_id: data.sourceId,
    external_id: null,
    url: data.url ?? null,
    canonical_url: data.url ?? null,
    title: data.title ?? null,
    raw_content: data.rawContent,
    published_at: data.publishedAt ? new Date(data.publishedAt).toISOString() : null,
    retrieved_at: new Date().toISOString(),
    media: data.media ?? [],
    metadata: data.metadata ?? {},
    content_hash: contentHash,
    created_at: new Date().toISOString(),
  };

  return insertRecord<RawItem>(TABLES.raw_items, item);
}
