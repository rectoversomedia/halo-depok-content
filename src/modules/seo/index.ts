import { getAIProvider } from '@/lib/ai/provider';
import { insertRecord, updateRecord, queryRecords, TABLES } from '@/lib/db';
import { generateId, slugify } from '@/lib/utils';
import type { Article, SEOMetadata, GEOMetadata, EEATScore, Story, SafetyCheck, SafetyCheckResult, RiskLevel, SafetyCategory } from '@/types';

// ============================================================
// HALODEPOK CONTENT FACTORY — SEO Engine
// ============================================================

export async function generateSEO(article: Article, story: Story): Promise<SEOMetadata> {
  const ai = getAIProvider();

  const prompt = `Generate complete SEO metadata for this article.

Title: ${article.title}
Summary: ${article.summary ?? ''}
Key Facts: ${article.key_facts?.join(' | ') ?? ''}
Location: ${story.editorial_brief?.where ?? 'Depok'}

Respond with JSON:
{
  "seo_title": "title tag (max 60 chars, include location if natural)",
  "meta_description": "meta description (max 155 chars, compelling click bait without clickbait)",
  "slug": "url-friendly-slug",
  "h1": "h1 heading (can differ from title)",
  "h2_list": ["H2 heading 1", "H2 heading 2"],
  "canonical": null,
  "og_title": "OpenGraph title (max 95 chars)",
  "og_description": "OpenGraph description (max 125 chars)",
  "og_image": null,
  "alt_texts": {"image_key": "descriptive alt text"},
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "structured_data": {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "title",
    "locationCreated": {"@type": "Place", "name": "Depok"}
  }
}`;

  try {
    const result = await ai.structuredGenerate<Partial<SEOMetadata>>(prompt, {
      temperature: 0.3,
      maxTokens: 1024,
    });

    const existing = await queryRecords<SEOMetadata>(TABLES.seo_metadata, { content_id: article.id }, { limit: 1 });

    const seo: Partial<SEOMetadata> = {
      id: existing[0]?.id ?? generateId('seo'),
      content_id: article.id,
      content_type: 'article',
      seo_title: result.seo_title,
      meta_description: result.meta_description,
      slug: result.slug ?? slugify(article.title ?? '', 100),
      h1: result.h1,
      h2_list: result.h2_list ?? [],
      canonical: result.canonical,
      og_title: result.og_title,
      og_description: result.og_description,
      og_image: result.og_image,
      alt_texts: result.alt_texts ?? {},
      internal_links: [],
      external_links: [],
      structured_data: result.structured_data ?? {},
      keywords: result.keywords ?? [],
      created_at: existing[0]?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return insertRecord<SEOMetadata>(TABLES.seo_metadata, seo);
  } catch (err) {
    console.error('SEO generation failed:', err);
    throw err;
  }
}

// ============================================================
// HALODEPOK CONTENT FACTORY — GEO Engine
// ============================================================

export async function generateGEO(article: Article, story: Story): Promise<GEOMetadata> {
  const ai = getAIProvider();
  const brief = story.editorial_brief;

  const prompt = `Generate GEO-optimized structured data for this article. The goal is to make the content easily understood by AI answer engines and citation systems.

Article: ${article.title}
${article.summary ? `Summary: ${article.summary}` : ''}
${brief?.where ? `Location: ${brief.where}` : ''}
${brief?.what_is_verified?.length ? `Verified Facts: ${brief.what_is_verified.join(' | ')}` : ''}

Respond with JSON:
{
  "tldr": "1-2 sentence TLDR for AI citation",
  "key_facts": {"fact_key": "fact value"},
  "location_context": "Depok neighborhood context",
  "date_context": "when this was reported",
  "entities_list": ["entity names mentioned"],
  "verified_claims": ["claim 1", "claim 2"],
  "uncertain_claims": ["uncertain claim 1"],
  "source_references": ["source names"],
  "structured_answer": {
    "@context": "https://schema.org",
    "question": "what happened in Depok?",
    "answer": "1-2 sentence answer",
    "datePublished": "ISO date",
    "location": "Depok"
  }
}`;

  try {
    const result = await ai.structuredGenerate<Partial<GEOMetadata>>(prompt, {
      temperature: 0.2,
      maxTokens: 1024,
    });

    const geo: Partial<GEOMetadata> = {
      id: generateId('geo'),
      content_id: article.id,
      tldr: result.tldr ?? article.summary ?? null,
      key_facts: result.key_facts ?? {},
      location_context: result.location_context ?? brief?.where ?? null,
      date_context: result.date_context ?? brief?.when ?? null,
      entities_list: result.entities_list ?? [],
      verified_claims: result.verified_claims ?? article.key_facts ?? [],
      uncertain_claims: result.uncertain_claims ?? [],
      source_references: result.source_references ?? [],
      structured_answer: result.structured_answer ?? {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return insertRecord<GEOMetadata>(TABLES.geo_metadata, geo);
  } catch (err) {
    console.error('GEO generation failed:', err);
    throw err;
  }
}

// ============================================================
// HALODEPOK CONTENT FACTORY — E-E-A-T Engine
// ============================================================

export async function generateEEAT(article: Article, story: Story): Promise<EEATScore> {
  const ai = getAIProvider();

  const prompt = `Evaluate E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) for this article.

Article Title: ${article.title}
Sources Section: ${article.sources_section ?? 'None'}
Key Facts: ${article.key_facts?.join(' | ') ?? 'None'}
Body preview: ${(article.body ?? '').slice(0, 500)}

RULES:
- NEVER claim experience that didn't happen
- NEVER fabricate expertise or credentials
- NEVER claim authority not established by sources
- ONLY mark trust based on verifiable evidence

Respond with JSON:
{
  "experience_score": 0-100,
  "expertise_score": 0-100,
  "authoritativeness_score": 0-100,
  "trustworthiness_score": 0-100,
  "overall_score": 0-100,
  "missing_evidence": ["what would improve E-E-A-T"],
  "warnings": ["potential issues"],
  "recommendations": ["how to improve"]
}`;

  try {
    const result = await ai.structuredGenerate<{
      experience_score: number;
      expertise_score: number;
      authoritativeness_score: number;
      trustworthiness_score: number;
      overall_score: number;
      missing_evidence: string[];
      warnings: string[];
      recommendations: string[];
    }>(prompt, { temperature: 0.3, maxTokens: 1024 });

    const eeat: Partial<EEATScore> = {
      id: generateId('eeat'),
      content_id: article.id,
      experience_score: result.experience_score ?? 50,
      expertise_score: result.expertise_score ?? 50,
      authoritativeness_score: result.authoritativeness_score ?? 50,
      trustworthiness_score: result.trustworthiness_score ?? 50,
      overall_score: result.overall_score ?? 50,
      missing_evidence: result.missing_evidence ?? [],
      warnings: result.warnings ?? [],
      recommendations: result.recommendations ?? [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return insertRecord<EEATScore>(TABLES.eeat_scores, eeat);
  } catch (err) {
    console.error('E-E-A-T evaluation failed:', err);
    throw err;
  }
}

// ============================================================
// HALODEPOK CONTENT FACTORY — Safety / Red Team Engine
// ============================================================

const SAFETY_CATEGORIES = [
  'defamation',
  'privacy',
  'minor_protection',
  'crime_allegations',
  'political_allegations',
  'medical_claims',
  'financial_claims',
  'sensitive_personal_info',
  'unverified_accusations',
  'misleading_imagery',
  'fabricated_quotes',
  'fabricated_statistics',
  'ai_hallucinations',
] as const;

export async function runSafetyCheck(article: Article, story: Story): Promise<SafetyCheck> {
  const ai = getAIProvider();

  const prompt = `Run a red-team safety check on this article. Be critical and adversarial.

Title: ${article.title}
Body: ${(article.body ?? '').slice(0, 1000)}
Key Facts: ${article.key_facts?.join(' | ') ?? 'None'}
Summary: ${article.summary ?? 'None'}
Sources: ${article.sources_section ?? 'None'}

For each category, respond whether it PASSED, WARNED, or BLOCKED.

Respond with JSON:
{
  "checks": {
    "defamation": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "privacy": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "minor_protection": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "crime_allegations": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "political_allegations": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "medical_claims": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "financial_claims": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "sensitive_personal_info": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "unverified_accusations": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "misleading_imagery": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "fabricated_quotes": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "fabricated_statistics": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"},
    "ai_hallucinations": {"result": "pass|warn|block", "severity": "low|medium|high|critical", "details": "explanation"}
  },
  "overall_result": "pass|warn|block",
  "risk_level": "low|medium|high|critical",
  "warnings": ["list of warnings"],
  "conflicts": ["conflicts found"],
  "recommended_changes": ["specific changes needed"],
  "blocked_reason": "reason if blocked, null otherwise"
}`;

  try {
    const result = await ai.structuredGenerate<{
      checks: Record<string, { result: string; severity: string; details: string }>;
      overall_result: string;
      risk_level: string;
      warnings: string[];
      conflicts: string[];
      recommended_changes: string[];
      blocked_reason: string | null;
    }>(prompt, { temperature: 0.2, maxTokens: 2048 });

    const categories: SafetyCategory[] = Object.entries(result.checks ?? {}).map(([category, check]) => ({
      category,
      passed: check.result === 'pass',
      severity: check.severity as SafetyCategory['severity'],
      details: check.details,
    }));

    const hasBlock = categories.some((c) => c.severity === 'critical' && !c.passed);

    const check: SafetyCheck = {
      result: hasBlock ? 'block' : (result.overall_result as SafetyCheckResult) ?? 'pass',
      risk_level: (result.risk_level as RiskLevel) ?? 'low',
      categories,
      warnings: result.warnings ?? [],
      conflicts: result.conflicts ?? [],
      recommended_changes: result.recommended_changes ?? [],
      publish_block: hasBlock || result.overall_result === 'block',
      blocked_reason: hasBlock ? result.blocked_reason ?? 'Critical safety issue detected' : null,
    };

    // Update story risk score
    const riskScore = check.risk_level === 'critical' ? 100 : check.risk_level === 'high' ? 75 : check.risk_level === 'medium' ? 40 : 10;
    await updateRecord<Story>(TABLES.stories, story.id, { risk_score: riskScore });

    if (hasBlock) {
      await updateRecord<Story>(TABLES.stories, story.id, { status: 'blocked' });
    }

    return check;
  } catch (err) {
    console.error('Safety check failed:', err);
    return {
      result: 'warn',
      risk_level: 'medium',
      categories: [],
      warnings: ['Safety check encountered an error'],
      conflicts: [],
      recommended_changes: [],
      publish_block: false,
      blocked_reason: null,
    };
  }
}
