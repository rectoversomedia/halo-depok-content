import { getAIProvider } from '@/lib/ai/provider';
import { insertRecord, updateRecord, queryRecords, TABLES } from '@/lib/db';
import { generateId, hashIp } from '@/lib/utils';
import type { CitizenReport, CitizenReportCategory, RawItemMedia } from '@/types';

// ============================================================
// JAKSELNEWS CONTENT FACTORY — Sensor Warga (Citizen Reporting)
// ============================================================

const REPORT_CATEGORIES: CitizenReportCategory[] = [
  'traffic', 'flood', 'fire', 'accident', 'public_safety',
  'event', 'infrastructure', 'business', 'weather', 'other',
];

export async function submitCitizenReport(data: {
  text?: string;
  media?: RawItemMedia[];
  locationText?: string;
  coordinates?: [number, number];
  reporterIp?: string;
}): Promise<CitizenReport> {
  const ai = getAIProvider();

  // Classify the report
  let category: CitizenReportCategory = 'other';
  let confidence = 0;

  if (data.text) {
    try {
      const result = await ai.classify(data.text, REPORT_CATEGORIES, { temperature: 0.1 });
      category = result.label as CitizenReportCategory;
      confidence = Math.round(result.confidence * 100);
    } catch {
      category = 'other';
      confidence = 0;
    }
  }

  const report: Partial<CitizenReport> = {
    id: generateId('citizen'),
    category,
    text: data.text ?? null,
    media: data.media ?? [],
    location_text: data.locationText ?? null,
    location_id: null,
    coordinates: data.coordinates ?? null,
    submitted_at: new Date().toISOString(),
    reporter_ip_hash: data.reporterIp ? hashIp(data.reporterIp, process.env.NEXTAUTH_SECRET ?? 'halodepok-salt') : null,
    moderation_status: 'pending',
    moderation_notes: null,
    story_signal: null,
    confidence,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return insertRecord<CitizenReport>(TABLES.citizen_reports, report);
}

export async function moderateReport(
  id: string,
  action: 'approve' | 'reject',
  notes?: string
): Promise<CitizenReport> {
  return updateRecord<CitizenReport>(TABLES.citizen_reports, id, {
    moderation_status: action === 'approve' ? 'approved' : 'rejected',
    moderation_notes: notes ?? null,
    updated_at: new Date().toISOString(),
  });
}

export async function getPendingReports(limit = 50): Promise<CitizenReport[]> {
  return queryRecords<CitizenReport>(TABLES.citizen_reports, { moderation_status: 'pending' }, { limit });
}

export async function getApprovedReports(storyId?: string): Promise<CitizenReport[]> {
  const filters: Record<string, unknown> = { moderation_status: 'approved' };
  if (storyId) filters['story_signal'] = storyId;
  return queryRecords<CitizenReport>(TABLES.citizen_reports, filters);
}

export async function linkReportToStory(reportId: string, storyId: string): Promise<CitizenReport> {
  return updateRecord<CitizenReport>(TABLES.citizen_reports, reportId, {
    story_signal: storyId,
    updated_at: new Date().toISOString(),
  });
}

export async function getReportsByCategory(): Promise<Record<CitizenReportCategory, number>> {
  const reports = await queryRecords<CitizenReport>(TABLES.citizen_reports, {});
  const counts = Object.fromEntries(REPORT_CATEGORIES.map((c) => [c, 0])) as Record<CitizenReportCategory, number>;
  for (const r of reports) {
    counts[r.category] = (counts[r.category] ?? 0) + 1;
  }
  return counts;
}
