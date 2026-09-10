import { z } from 'zod';

// ============================================================
// JAKSELNEWS CONTENT FACTORY — Job System
// ============================================================

export const JobPayloadSchemas = {
  ingest_source: z.object({
    sourceId: z.string().uuid(),
    forceRefresh: z.boolean().default(false),
  }),
  run_agent: z.object({
    agentId: z.string(),
    storyId: z.string().uuid().optional(),
    payload: z.record(z.unknown()),
    priority: z.number().int().default(0),
  }),
  generate_article: z.object({
    storyId: z.string().uuid(),
    options: z.record(z.unknown()).optional(),
  }),
  generate_social: z.object({
    storyId: z.string().uuid(),
    format: z.enum(['tiktok', 'instagram_carousel', 'instagram_reel', 'youtube_short', 'x_post']),
    options: z.record(z.unknown()).optional(),
  }),
  publish_content: z.object({
    contentId: z.string().uuid(),
    contentType: z.string(),
    provider: z.enum(['wordpress', 'website', 'social']),
    scheduledAt: z.string().datetime().optional(),
  }),
  verify_claims: z.object({
    storyId: z.string().uuid(),
  }),
  run_analytics: z.object({
    contentId: z.string().uuid().optional(),
    periodStart: z.string().datetime(),
    periodEnd: z.string().datetime(),
  }),
  send_notification: z.object({
    type: z.enum(['story_created', 'verification_needed', 'content_ready', 'published', 'error']),
    storyId: z.string().uuid().optional(),
    message: z.string(),
  }),
  moderate_citizen_report: z.object({
    reportId: z.string().uuid(),
    action: z.enum(['approve', 'reject']),
  }),
} as const;

export type JobType = keyof typeof JobPayloadSchemas;

export interface JobDefinition {
  type: JobType;
  payload: z.infer<(typeof JobPayloadSchemas)[JobType]>;
  priority?: number;
  scheduledAt?: Date;
  idempotencyKey?: string;
  maxAttempts?: number;
  timeoutMs?: number;
}

export interface JobHandler<T = unknown> {
  execute(payload: T): Promise<void>;
  onError(error: Error, payload: T, attempt: number): Promise<void>;
  onSuccess(payload: T, result: unknown): Promise<void>;
}

// In-memory job queue for development
// In production, replace with BullMQ / pg-boss / etc.
class InMemoryJobQueue {
  private queue: Map<string, JobDefinition & { id: string; status: string; createdAt: Date }> = new Map();
  private processing = new Set<string>();

  async enqueue(job: JobDefinition): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.queue.set(id, {
      ...job,
      id,
      status: 'queued',
      createdAt: new Date(),
    });
    return id;
  }

  async dequeue(limit = 10): Promise<Array<JobDefinition & { id: string; status: string; createdAt: Date }>> {
    const jobs: Array<JobDefinition & { id: string; status: string; createdAt: Date }> = [];
    for (const [id, job] of this.queue.entries()) {
      if (job.status === 'queued' && !this.processing.has(id) && jobs.length < limit) {
        job.status = 'processing';
        this.processing.add(id);
        jobs.push(job);
      }
    }
    return jobs;
  }

  async complete(id: string) {
    this.queue.delete(id);
    this.processing.delete(id);
  }

  async fail(id: string, error: string) {
    const job = this.queue.get(id);
    if (job) {
      job.status = 'failed';
      this.processing.delete(id);
    }
  }

  async retry(id: string) {
    const job = this.queue.get(id);
    if (job) {
      job.status = 'queued';
      this.processing.delete(id);
    }
  }

  getStatus(id: string) {
    return this.queue.get(id)?.status ?? null;
  }

  async list(limit = 100): Promise<Array<JobDefinition & { id: string; status: string; createdAt: Date }>> {
    return Array.from(this.queue.values()).slice(0, limit);
  }
}

export const jobQueue = new InMemoryJobQueue();

// Simple async job runner
export async function runJob<T>(handler: JobHandler<T>, definition: JobDefinition): Promise<void> {
  const { type, payload: rawPayload, maxAttempts = 3, timeoutMs = 300_000 } = definition;
  const schema = JobPayloadSchemas[type as JobType];
  if (!schema) throw new Error(`Unknown job type: ${type}`);

  const payload = schema.parse(rawPayload) as T;
  const startTime = Date.now();

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Job timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    await Promise.race([handler.execute(payload), timeoutPromise]);
    await handler.onSuccess(payload, undefined);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await handler.onError(err, payload, 1);
    throw err;
  }
}
