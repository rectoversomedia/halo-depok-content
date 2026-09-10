import { getAIProvider } from '@/lib/ai/provider';
import { insertRecord, updateRecord, queryRecords, TABLES } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Story, CommerceOpportunity, Merchant, ProductRecommendation, AffiliateLink } from '@/types';

// ============================================================
// HALODEPOK CONTENT FACTORY — Commerce Engine
// ============================================================

// CRITICAL: Commerce must NEVER distort editorial truth
// Order: Editorial Value → Verification → Content → Commerce Opportunity
// NEVER: Commission → News

const RELEVANT_PRODUCT_CATEGORIES: Record<string, string[]> = {
  weather: ['rain gear', 'umbrella', 'raincoat', 'waterproof bag', 'rubber boots'],
  flood: ['water pump', 'sandbags', 'rubber boots', 'waterproof storage', 'emergency kit'],
  traffic: ['traffic app', 'navigation', 'snack for commute', 'coffee subscription'],
  fire: ['fire extinguisher', 'emergency blanket', 'first aid kit', 'smoke detector'],
  accident: ['insurance', 'legal consultation'],
  'new cafe': ['coffee beans', 'café gift card', 'coffee subscription', 'brunch guide'],
  'new restaurant': ['food delivery', 'restaurant gift card', 'food guide'],
  'new business': ['local discovery', 'directory listing'],
  event: ['tickets', 'event guide', 'merchandise'],
  infrastructure: ['home services', 'contractor referral'],
  health: ['medicine', 'health insurance', 'clinic finder'],
};

export async function identifyCommerceOpportunity(story: Story): Promise<CommerceOpportunity | null> {
  const ai = getAIProvider();
  const brief = story.editorial_brief;

  const text = `${story.title ?? ''} ${brief?.what_happened ?? ''} ${brief?.why_it_matters ?? ''}`.toLowerCase();

  // Detect relevant category
  let detectedCategory = 'other';
  for (const [category, keywords] of Object.entries(RELEVANT_PRODUCT_CATEGORIES)) {
    if (keywords.some((kw) => text.includes(kw))) {
      detectedCategory = category;
      break;
    }
  }

  const prompt = `Identify legitimate, helpful commerce opportunities related to this story for HaloDepok readers.

Story: ${brief?.what_happened ?? story.title ?? ''}
Why it matters: ${brief?.why_it_matters ?? ''}
What residents should know: ${brief?.what_residents_should_know ?? ''}
Detected category: ${detectedCategory}

RULES:
- ONLY recommend if genuinely helpful to residents
- NEVER fabricate product availability or pricing
- NEVER let commerce influence editorial decisions
- If no legitimate opportunity exists, return "no_opportunity"
- Be specific to Depok / Depok when possible

Respond with JSON:
{
  "has_opportunity": true,
  "opportunity_type": "product | merchant | service | event | guide | affiliate | local_discovery",
  "title": "helpful recommendation title",
  "description": "why this is relevant to residents (1 sentence)",
  "products": [
    {
      "name": "product name",
      "category": "category",
      "price_range": "IDR X-Yjt if known, null if unknown",
      "merchant_id": null,
      "affiliate_link": null,
      "tracking_url": null,
      "relevance_score": 0-100
    }
  ],
  "affiliate_links": [],
  "recommendation_strength": "strong | moderate | weak | none",
  "editorial_rationale": "why this recommendation genuinely helps readers"
}`;

  try {
    const result = await ai.structuredGenerate<{
      has_opportunity: boolean;
      opportunity_type?: string;
      title?: string;
      description?: string;
      products?: ProductRecommendation[];
      affiliate_links?: AffiliateLink[];
      recommendation_strength?: string;
      editorial_rationale?: string;
    }>(prompt, { temperature: 0.3, maxTokens: 1024 });

    if (!result.has_opportunity || result.recommendation_strength === 'none') {
      return null;
    }

    const opportunity: Partial<CommerceOpportunity> = {
      id: generateId('comm'),
      story_id: story.id,
      article_id: null,
      opportunity_type: (result.opportunity_type as CommerceOpportunity['opportunity_type']) ?? 'affiliate',
      relevance_score: result.products?.[0]?.relevance_score ?? 50,
      commercial_type: 'editorial',
      title: result.title ?? 'Local Recommendation',
      description: result.description ?? null,
      merchant_id: null,
      products: result.products ?? [],
      affiliate_links: result.affiliate_links ?? [],
      recommendation_strength: (result.recommendation_strength as CommerceOpportunity['recommendation_strength']) ?? 'weak',
      editorial_rationale: result.editorial_rationale ?? 'Relevant to story topic.',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return insertRecord<CommerceOpportunity>(TABLES.commerce_opportunities, opportunity);
  } catch (err) {
    console.error('Commerce identification failed:', err);
    return null;
  }
}

export async function getOpportunitiesByStory(storyId: string): Promise<CommerceOpportunity[]> {
  return queryRecords<CommerceOpportunity>(TABLES.commerce_opportunities, { story_id: storyId });
}

export async function approveCommerceOpportunity(id: string): Promise<CommerceOpportunity> {
  return updateRecord<CommerceOpportunity>(TABLES.commerce_opportunities, id, {
    status: 'approved',
    updated_at: new Date().toISOString(),
  });
}

export async function rejectCommerceOpportunity(id: string): Promise<CommerceOpportunity> {
  return updateRecord<CommerceOpportunity>(TABLES.commerce_opportunities, id, {
    status: 'rejected',
    updated_at: new Date().toISOString(),
  });
}

// Merchant management
export async function getMerchants(filters?: { category?: string; affiliate_status?: boolean }): Promise<Merchant[]> {
  return queryRecords<Merchant>(TABLES.merchants, filters as Record<string, unknown>);
}

export async function createMerchant(data: Partial<Merchant>): Promise<Merchant> {
  const merchant: Partial<Merchant> = {
    ...data,
    id: generateId('merch'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return insertRecord<Merchant>(TABLES.merchants, merchant);
}
