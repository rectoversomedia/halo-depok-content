import { insertRecord, queryRecords, TABLES } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { AuditLog } from '@/types';

// ============================================================
// JAKSELNEWS CONTENT FACTORY — Audit System
// ============================================================

export async function logAuditEvent(data: {
  userId?: string;
  action: string;
  objectType: string;
  objectId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const log: Partial<AuditLog> = {
    id: generateId('audit'),
    user_id: data.userId ?? null,
    action: data.action,
    object_type: data.objectType,
    object_id: data.objectId ?? null,
    previous_state: data.previousState ?? null,
    new_state: data.newState ?? null,
    ip_address: data.ipAddress ?? null,
    user_agent: data.userAgent ?? null,
    metadata: data.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  await insertRecord<AuditLog>(TABLES.audit_logs, log);
}

export async function getAuditLogs(filters?: {
  userId?: string;
  objectType?: string;
  objectId?: string;
  action?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  return queryRecords<AuditLog>(TABLES.audit_logs, filters as Record<string, unknown>, {
    order: 'created_at',
    limit: filters?.limit ?? 100,
  });
}

// Pre-defined audit actions
export const AUDIT_ACTIONS = {
  STORY_CREATED: 'story.created',
  STORY_STATUS_CHANGED: 'story.status_changed',
  STORY_APPROVED: 'story.approved',
  STORY_REJECTED: 'story.rejected',
  STORY_PUBLISHED: 'story.published',
  ARTICLE_GENERATED: 'article.generated',
  ARTICLE_EDITED: 'article.edited',
  ARTICLE_APPROVED: 'article.approved',
  CONTENT_PUBLISHED: 'content.published',
  CLAIM_VERIFIED: 'claim.verified',
  CLAIM_CONTRADICTED: 'claim.contradicted',
  CITIZEN_REPORT_APPROVED: 'citizen_report.approved',
  CITIZEN_REPORT_REJECTED: 'citizen_report.rejected',
  COMMERCE_APPROVED: 'commerce.approved',
  COMMERCE_REJECTED: 'commerce.rejected',
  SOURCE_CREATED: 'source.created',
  SOURCE_UPDATED: 'source.updated',
  SOURCE_DELETED: 'source.deleted',
  AGENT_RUN: 'agent.run',
  USER_LOGIN: 'user.login',
  USER_CREATED: 'user.created',
  SETTINGS_CHANGED: 'settings.changed',
} as const;
