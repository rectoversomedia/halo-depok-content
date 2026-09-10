import { getAIProvider } from '@/lib/ai/provider';
import { updateRecord, insertRecord, queryRecords, TABLES } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { Story, Claim, Evidence, EditorialBrief, VerificationStatus } from '@/types';

// ============================================================
// HALODEPOK CONTENT FACTORY — Claims & Verification Engine
// ============================================================

// --- Claim Extraction ---

export async function extractClaimsFromStory(story: Story): Promise<Claim[]> {
  const ai = getAIProvider();
  const content = story.summary ?? '';

  const prompt = `Extract factual claims from this news story. Each claim should be atomic (single verifiable fact).

Story: ${content}
Title: ${story.title ?? 'Unknown'}

Respond with JSON:
{
  "claims": [
    {
      "claim_text": "the factual claim (in Indonesian or English, specific and verifiable)",
      "claim_type": "fact | statement | event | prediction | opinion | rumor",
      "confidence": 0-100,
      "first_observed_at": "ISO date"
    }
  ]
}`;

  try {
    const result = await ai.structuredGenerate<{ claims: Partial<Claim>[] }>(prompt, {
      temperature: 0.2,
      maxTokens: 2048,
    });

    const claims: Claim[] = [];
    for (const c of result.claims ?? []) {
      const claim: Partial<Claim> = {
        id: generateId('claim'),
        story_id: story.id,
        claim_text: c.claim_text ?? '',
        claim_type: c.claim_type ?? 'fact',
        confidence: c.confidence ?? 50,
        verification_status: 'unverified',
        evidence_count: 0,
        contradiction_count: 0,
        first_observed_at: c.first_observed_at ?? new Date().toISOString(),
        last_verified_at: null,
        stale_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const saved = await insertRecord<Claim>(TABLES.claims, claim);
      claims.push(saved);
    }

    return claims;
  } catch (err) {
    console.error('Failed to extract claims:', err);
    return [];
  }
}

// --- Evidence Gathering ---

export async function gatherEvidence(claim: Claim, rawItems: Story['id'] extends string ? string[] : string[]): Promise<Evidence[]> {
  const ai = getAIProvider();

  const prompt = `Assess evidence for this claim:

Claim: "${claim.claim_text}"
Claim Type: ${claim.claim_type}

For each raw item, evaluate if it supports, contradicts, or is irrelevant to this claim.

Respond with JSON:
{
  "evidence": [
    {
      "evidence_text": "relevant excerpt from the source",
      "relevance_score": 0-100,
      "confidence": 0-100,
      "assessment": "supports | contradicts | neutral"
    }
  ]
}`;

  try {
    const result = await ai.structuredGenerate<{
      evidence: Array<{
        evidence_text: string;
        relevance_score: number;
        confidence: number;
        assessment: string;
      }>;
    }>(prompt, { temperature: 0.3, maxTokens: 2048 });

    const evidences: Evidence[] = [];
    for (const ev of result.evidence ?? []) {
      const evidence: Partial<Evidence> = {
        id: generateId('ev'),
        claim_id: claim.id,
        source_id: 'system', // TODO: link to actual source
        raw_item_id: null,
        evidence_text: ev.evidence_text,
        observed_at: new Date().toISOString(),
        relevance_score: ev.relevance_score ?? 50,
        confidence: ev.confidence ?? 50,
        created_at: new Date().toISOString(),
      };
      const saved = await insertRecord<Evidence>(TABLES.evidence, evidence);
      evidences.push(saved);
    }

    // Update claim evidence count
    await updateRecord<Claim>(TABLES.claims, claim.id, {
      evidence_count: evidences.length,
      updated_at: new Date().toISOString(),
    });

    return evidences;
  } catch (err) {
    console.error('Failed to gather evidence:', err);
    return [];
  }
}

// --- Verification ---

export async function verifyClaim(claim: Claim): Promise<{
  status: VerificationStatus;
  confidence: number;
  details: Record<string, unknown>;
}> {
  const evidences = await queryRecords<Evidence>(TABLES.evidence, { claim_id: claim.id });

  if (evidences.length === 0) {
    return {
      status: 'unverified',
      confidence: 0,
      details: { reason: 'No evidence available' },
    };
  }

  const supportingEvidence = evidences.filter((e) => e.relevance_score >= 70);
  const contradictingEvidence = evidences.filter((e) =>
    e.evidence_text.toLowerCase().includes('tidak') ||
    e.evidence_text.toLowerCase().includes('not') ||
    e.evidence_text.toLowerCase().includes('false')
  );

  const avgConfidence = Math.round(
    evidences.reduce((sum, e) => sum + e.confidence * (e.relevance_score / 100), 0) / evidences.length
  );

  let status: VerificationStatus = 'unverified';

  if (contradictingEvidence.length > 0 && supportingEvidence.length === 0) {
    status = 'contradicted';
  } else if (supportingEvidence.length >= 2 && avgConfidence >= 70) {
    status = 'verified';
  } else if (supportingEvidence.length >= 1 || avgConfidence >= 40) {
    status = 'partially_verified';
  } else if (avgConfidence < 20) {
    status = 'needs_human_review';
  }

  await updateRecord<Claim>(TABLES.claims, claim.id, {
    verification_status: status,
    confidence: avgConfidence,
    last_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    status,
    confidence: avgConfidence,
    details: {
      supportingCount: supportingEvidence.length,
      contradictingCount: contradictingEvidence.length,
      totalEvidence: evidences.length,
    },
  };
}

// --- Full Verification Pipeline for Story ---

export async function verifyStory(storyId: string): Promise<{
  claimsProcessed: number;
  verified: number;
  partiallyVerified: number;
  contradicted: number;
  unverified: number;
}> {
  const claims = await queryRecords<Claim>(TABLES.claims, { story_id: storyId });

  let verified = 0;
  let partiallyVerified = 0;
  let contradicted = 0;
  let unverified = 0;

  for (const claim of claims) {
    const result = await verifyClaim(claim);
    switch (result.status) {
      case 'verified': verified++; break;
      case 'partially_verified': partiallyVerified++; break;
      case 'contradicted': contradicted++; break;
      default: unverified++;
    }
  }

  // Update story status
  const newStatus =
    contradicted > 0 ? 'conflicted' :
    verified > 0 && unverified === 0 ? 'verified' :
    unverified === claims.length ? 'verification_required' : 'investigating';

  await updateRecord<Story>(TABLES.stories, storyId, {
    status: newStatus,
    last_updated_at: new Date().toISOString(),
  });

  return { claimsProcessed: claims.length, verified, partiallyVerified, contradicted, unverified };
}

// --- Editorial Brief Generation ---

export async function generateEditorialBrief(story: Story, claims: Claim[]): Promise<EditorialBrief> {
  const ai = getAIProvider();

  const verifiedClaims = claims.filter((c) => c.verification_status === 'verified' || c.verification_status === 'partially_verified');
  const unverifiedClaims = claims.filter((c) => c.verification_status === 'unverified' || c.verification_status === 'needs_human_review');

  const prompt = `Generate an editorial brief for this story. Be factual and precise.

Title: ${story.title ?? ''}
Summary: ${story.summary ?? ''}

Verified claims (${verifiedClaims.length}):
${verifiedClaims.map((c) => `• ${c.claim_text} (${c.verification_status})`).join('\n')}

Unverified claims (${unverifiedClaims.length}):
${unverifiedClaims.map((c) => `• ${c.claim_text}`).join('\n')}

Respond with JSON:
{
  "what_happened": "concise summary of verified facts",
  "where": "specific location (Depok area)",
  "when": "timeframe or date if known",
  "who": "people or organizations involved",
  "what_is_verified": ["list of verified facts"],
  "what_is_uncertain": ["what is still unverified or unclear"],
  "why_it_matters": "why Depok residents should care",
  "what_residents_should_know": "practical takeaways for local residents",
  "what_happens_next": "likely follow-up or ongoing developments"
}`;

  try {
    const brief = await ai.structuredGenerate<EditorialBrief>(prompt, {
      temperature: 0.4,
      maxTokens: 2048,
    });

    await updateRecord<Story>(TABLES.stories, story.id, {
      title: brief.what_happened.slice(0, 200),
      summary: brief.what_happened,
      editorial_brief: brief,
      status: 'verified',
      last_updated_at: new Date().toISOString(),
    });

    return brief;
  } catch (err) {
    console.error('Failed to generate editorial brief:', err);
    return {
      what_happened: story.title ?? 'Unable to generate brief',
      where: 'Depok',
      when: 'Unknown',
      who: 'Unknown',
      what_is_verified: [],
      what_is_uncertain: [],
      why_it_matters: 'Story requires manual review',
      what_residents_should_know: 'Check for updates.',
      what_happens_next: 'Under investigation.',
    };
  }
}
