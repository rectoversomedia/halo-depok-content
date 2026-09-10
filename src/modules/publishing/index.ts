import { updateRecord, insertRecord, queryRecords, TABLES } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Story, Article, PublishingJob, PublishStatus, SocialContent } from '@/types';

// ============================================================
// JAKSELNEWS CONTENT FACTORY — Publishing Engine
// ============================================================

// Abstract Publisher Interface
export interface Publisher {
  readonly name: string;
  publish(content: Article | SocialContent, metadata: PublishMetadata): Promise<PublishResult>;
  update(externalId: string, content: Article | SocialContent): Promise<void>;
  unpublish(externalId: string): Promise<void>;
}

export interface PublishMetadata {
  slug?: string;
  category?: string;
  tags?: string[];
  author?: string;
  featuredImage?: string;
  seoTitle?: string;
  metaDescription?: string;
  canonical?: string;
  structuredData?: Record<string, unknown>;
  scheduledAt?: Date;
  socialFormat?: string;
}

export interface PublishResult {
  success: boolean;
  externalId?: string;
  publishedUrl?: string;
  errors: string[];
  warnings: string[];
}

// --- WordPress Publisher ---

export class WordPressPublisher implements Publisher {
  readonly name = 'wordpress';

  private baseUrl: string;
  private username: string;
  private appPassword: string;

  constructor() {
    this.baseUrl = process.env.WP_API_URL ?? '';
    this.username = process.env.WP_USERNAME ?? '';
    this.appPassword = process.env.WP_APP_PASSWORD ?? '';
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    const url = `${this.baseUrl}/wp-json/wp/v2/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.username}:${this.appPassword}`).toString('base64')}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async publish(content: Article, metadata: PublishMetadata): Promise<PublishResult> {
    const isDraft = metadata.scheduledAt ? true : false;

    const body: Record<string, unknown> = {
      title: content.title,
      content: content.body ?? '',
      excerpt: content.dek ?? content.summary ?? '',
      slug: metadata.slug ?? content.slug,
      status: isDraft ? 'future' : 'publish',
      date: metadata.scheduledAt?.toISOString(),
      categories: [],
      tags: metadata.tags ?? [],
      author: 1,
      featured_media: 0,
      meta: {
        seo_title: metadata.seoTitle,
        meta_description: metadata.metaDescription,
        _genesis_schema: metadata.structuredData ? JSON.stringify(metadata.structuredData) : '',
      },
    };

    try {
      const result = await this.request('posts', { method: 'POST', body: JSON.stringify(body) }) as { id: number; link: string };
      return {
        success: true,
        externalId: String(result.id),
        publishedUrl: result.link,
        errors: [],
        warnings: [],
      };
    } catch (err) {
      return {
        success: false,
        errors: [(err as Error).message],
        warnings: [],
      };
    }
  }

  async update(externalId: string, content: Article): Promise<void> {
    await this.request(`posts/${externalId}`, {
      method: 'POST',
      body: JSON.stringify({
        title: content.title,
        content: content.body ?? '',
        excerpt: content.dek ?? content.summary ?? '',
        status: 'publish',
      }),
    });
  }

  async unpublish(externalId: string): Promise<void> {
    await this.request(`posts/${externalId}`, {
      method: 'POST',
      body: JSON.stringify({ status: 'draft' }),
    });
  }
}

// --- Mock Publisher (for dev/CI) ---

export class MockPublisher implements Publisher {
  readonly name = 'mock';

  async publish(content: Article | SocialContent, metadata: PublishMetadata): Promise<PublishResult> {
    await new Promise((r) => setTimeout(r, 500));
    return {
      success: true,
      externalId: `mock_${Date.now()}`,
      publishedUrl: `https://mock.halodepok.com/${metadata.slug ?? 'post'}`,
      errors: [],
      warnings: ['Mock publisher - no actual publication'],
    };
  }

  async update(_externalId: string, _content: Article | SocialContent): Promise<void> {
    // no-op
  }

  async unpublish(_externalId: string): Promise<void> {
    // no-op
  }
}

// --- Publishing Service ---

export async function createPublishingJob(
  contentId: string,
  contentType: 'article' | 'social',
  provider: string,
  scheduledAt?: Date,
  idempotencyKey?: string
): Promise<PublishingJob> {
  const job: Partial<PublishingJob> = {
    id: generateId('pub'),
    content_id: contentId,
    content_type: contentType === 'article' ? 'article' : 'x_post',
    status: 'draft',
    provider: (provider as PublishingJob['provider']) ?? 'wordpress',
    provider_id: null,
    scheduled_at: scheduledAt?.toISOString() ?? null,
    published_at: null,
    errors: [],
    retry_count: 0,
    idempotency_key: idempotencyKey ?? `${contentType}_${contentId}_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return insertRecord<PublishingJob>(TABLES.publishing_jobs, job);
}

export async function publishArticle(
  article: Article,
  story: Story,
  options?: { scheduledAt?: Date; forceRepublish?: boolean }
): Promise<PublishResult> {
  const publisher = process.env.USE_MOCK_PUBLISHER === 'true'
    ? new MockPublisher()
    : new WordPressPublisher();

  const metadata: PublishMetadata = {
    slug: article.slug ?? undefined,
    seoTitle: story.title ?? undefined,
    metaDescription: article.summary ?? undefined,
    scheduledAt: options?.scheduledAt,
    structuredData: {},
  };

  const result = await publisher.publish(article, metadata);

  // Record the job
  const pubProvider = publisher.name === 'wordpress' ? 'wordpress' : 'website';
  await insertRecord<PublishingJob>(TABLES.publishing_jobs, {
    id: generateId('pub'),
    content_id: article.id,
    content_type: 'article',
    status: result.success ? 'published' : 'failed',
    provider: pubProvider,
    provider_id: result.externalId ?? undefined,
    scheduled_at: options?.scheduledAt?.toISOString() ?? undefined,
    published_at: result.success ? new Date().toISOString() : undefined,
    errors: result.errors,
    retry_count: 0,
    idempotency_key: `article_${article.id}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (result.success) {
    await updateRecord<Article>(TABLES.articles, article.id, { status: 'published' });
    await updateRecord<Story>(TABLES.stories, story.id, {
      status: 'published',
      published_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
    });
  }

  return result;
}

export async function getPublishingJobs(filters?: { status?: PublishStatus }): Promise<PublishingJob[]> {
  return queryRecords<PublishingJob>(TABLES.publishing_jobs, filters as Record<string, unknown>);
}
