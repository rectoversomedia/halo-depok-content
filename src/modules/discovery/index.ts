import { getAIProvider } from '@/lib/ai/provider';
import { queryRecords, insertRecord, TABLES } from '@/lib/db';
import { generateId, similarity } from '@/lib/utils';
import type { Story, RawItem, DiscoveryScore, StoryClassification } from '@/types';

// ============================================================
// HALODEPOK CONTENT FACTORY — Discovery Engine
// ============================================================

// --- Relevance Scoring ---

const HALODEPOK_KEYWORDS = [
  'kemang', 'blok m', 'senayan', 'kuningan', 'cipete', 'tebet', 'kebayoran',
  'pondok indah', 'gandaria', 'melawai', 'senopati', 'ragunan', 'lebak bulus',
  'ampera', 'warung buncit', 'kalibata', 'duren tiga', 'pasar minggu',
  'tanjung barat', 'cilandak', 'cipayung', 'jagakarsa', 'pasar rebo',
  'ciracas', 'mampang', 'pesanggrahan', 'setia budi', 'menteng',
  'jakarta selatan', 'depok', 'dki jakarta', 'jabotabek',
  'banjir', 'flood', 'macet', 'traffic', 'hujan', 'rain',
  'kemacetan', 'lalu lintas', 'kebakaran', 'fire', 'kecelakaan', 'accident',
];

const URGENT_KEYWORDS = [
  'darurat', 'emergency', 'urgent', 'breaking', 'now', 'evakuasi',
  'dead', 'died', 'killed', 'collapsed', 'rubble', 'explosion',
  'gempa', 'earthquake', 'tsunami', 'eruption', 'gunung meletus',
  'bencana', 'disaster', 'kebocoran gas', 'toxic', 'hazmat',
];

export function calculateRelevanceScore(item: RawItem): {
  locality: number;
  urgency: number;
  novelty: number;
  reach: number;
  commercial: number;
  overall: number;
} {
  const text = `${item.title ?? ''} ${item.raw_content}`.toLowerCase();

  // Locality: Depok mentions
  let locality = 0;
  for (const kw of HALODEPOK_KEYWORDS) {
    if (text.includes(kw)) locality += 10;
  }
  locality = Math.min(100, locality);

  // Urgency
  let urgency = 0;
  for (const kw of URGENT_KEYWORDS) {
    if (text.includes(kw)) urgency += 15;
  }
  if (item.published_at) {
    const age = Date.now() - new Date(item.published_at).getTime();
    if (age < 3600000) urgency += 20; // < 1 hour
    else if (age < 7200000) urgency += 10; // < 2 hours
  }
  urgency = Math.min(100, urgency);

  // Novelty (based on content hash uniqueness - placeholder)
  const novelty = 70; // AI agent refines this

  // Reach (based on source authority - placeholder)
  const reach = 50;

  // Commercial intent
  const commercialKeywords = ['promo', 'diskon', 'sale', 'grand opening', 'new cafe', 'restaurant', 'toko baru', 'grand opening'];
  let commercial = 0;
  for (const kw of commercialKeywords) {
    if (text.includes(kw)) commercial += 20;
  }
  commercial = Math.min(100, commercial);

  // Weights
  const overall = Math.round(
    locality * 0.35 +
    urgency * 0.20 +
    novelty * 0.15 +
    reach * 0.15 +
    commercial * 0.15
  );

  return { locality, urgency, novelty, reach, commercial, overall };
}

export function classifyStory(scores: ReturnType<typeof calculateRelevanceScore>): StoryClassification {
  if (scores.locality >= 30 || scores.urgency >= 50) {
    if (scores.overall >= 70) return 'urgent_review';
    if (scores.overall >= 50) return 'draft';
    return 'investigate';
  }
  if (scores.overall >= 40) return 'monitor';
  return 'ignore';
}

// --- AI-Assisted Relevance Agent ---

export async function scoreWithAI(item: RawItem): Promise<DiscoveryScore> {
  const basic = calculateRelevanceScore(item);

  const ai = getAIProvider();
  const prompt = `Analyze this news item for HaloDepok (hyperlocal Depok news).

Title: ${item.title ?? '(no title)'}
Content preview: ${(item.raw_content ?? '').slice(0, 500)}

Evaluate and respond with JSON:
{
  "relevance_score": 0-100 (how relevant is this to Depok residents),
  "locality_score": 0-100 (how specifically Depok is involved),
  "novelty_score": 0-100 (how new/unusual is this information),
  "urgency_score": 0-100 (how time-sensitive is this),
  "potential_reach_score": 0-100 (how many people might care),
  "commercial_intent_score": 0-100 (is there a legitimate commerce angle),
  "classification": "ignore" | "monitor" | "investigate" | "draft" | "urgent_review",
  "reasoning": "brief explanation"
}`;

  try {
    const result = await ai.structuredGenerate<DiscoveryScore & { reasoning?: string }>(prompt, {
      temperature: 0.3,
      maxTokens: 512,
    });

    return {
      relevance_score: result.relevance_score ?? basic.overall,
      locality_score: result.locality_score ?? basic.locality,
      novelty_score: result.novelty_score ?? basic.novelty,
      urgency_score: result.urgency_score ?? basic.urgency,
      potential_reach_score: result.potential_reach_score ?? basic.reach,
      commercial_intent_score: result.commercial_intent_score ?? basic.commercial,
      overall_score: Math.round(
        (result.relevance_score ?? basic.overall) * 0.35 +
        (result.urgency_score ?? basic.urgency) * 0.20 +
        (result.novelty_score ?? basic.novelty) * 0.15 +
        (result.potential_reach_score ?? basic.reach) * 0.15 +
        (result.commercial_intent_score ?? basic.commercial) * 0.15
      ),
      classification: result.classification ?? classifyStory(basic),
    };
  } catch {
    return {
      relevance_score: basic.overall,
      locality_score: basic.locality,
      novelty_score: basic.novelty,
      urgency_score: basic.urgency,
      potential_reach_score: basic.reach,
      commercial_intent_score: basic.commercial,
      overall_score: basic.overall,
      classification: classifyStory(basic),
    };
  }
}

// --- Story Deduplication / Clustering ---

export async function findSimilarStories(
  title: string,
  content: string,
  excludeId?: string
): Promise<Array<{ storyId: string; similarity: number; matchReasons: string[] }>> {
  const filters: Record<string, unknown> = {};
  if (excludeId) filters['id'] = excludeId;

  const stories = await queryRecords<Story>(TABLES.stories, filters);

  const results: Array<{ storyId: string; similarity: number; matchReasons: string[] }> = [];

  for (const story of stories) {
    const storyText = `${story.title ?? ''} ${story.summary ?? ''}`;
    const score = similarity(title, storyText);
    const contentScore = similarity(content, story.summary ?? '');

    const reasons: string[] = [];
    if (score > 60) reasons.push('title_similarity');
    if (contentScore > 50) reasons.push('content_similarity');

    const avgSimilarity = Math.round((score + contentScore) / 2);
    if (avgSimilarity >= 40) {
      results.push({ storyId: story.id, similarity: avgSimilarity, matchReasons: reasons });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}

// --- Create Discovery Item / Story ---

export async function createStoryFromRawItem(
  item: RawItem,
  scores: DiscoveryScore
): Promise<Story> {
  const story: Partial<Story> = {
    id: generateId('story'),
    title: item.title,
    summary: (item.raw_content ?? '').slice(0, 500),
    status: scores.classification === 'ignore' ? 'discovered' :
      scores.classification === 'urgent_review' ? 'investigating' : 'discovered',
    classification: scores.classification,
    importance_score: scores.relevance_score,
    locality_score: scores.locality_score,
    novelty_score: scores.novelty_score,
    urgency_score: scores.urgency_score,
    risk_score: 0,
    commercial_score: scores.commercial_intent_score,
    location_id: null,
    editorial_brief: null,
    first_seen_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
    published_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return insertRecord<Story>(TABLES.stories, story);
}

// --- Process all raw items for discovery ---

export async function processRawItemsForDiscovery(): Promise<{
  processed: number;
  storiesCreated: number;
  ignored: number;
}> {
  const items = await queryRecords<RawItem>(TABLES.raw_items, {}, { limit: 100, order: 'retrieved_at' });

  let storiesCreated = 0;
  let ignored = 0;

  for (const item of items) {
    const scores = await scoreWithAI(item);
    const classification = scores.classification;

    if (classification === 'ignore') {
      ignored++;
      continue;
    }

    await createStoryFromRawItem(item, scores);
    storiesCreated++;
  }

  return { processed: items.length, storiesCreated, ignored };
}
