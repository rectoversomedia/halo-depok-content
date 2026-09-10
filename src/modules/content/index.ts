import { getAIProvider } from '@/lib/ai/provider';
import { updateRecord, insertRecord, queryRecords, TABLES } from '@/lib/db';
import { generateId, slugify, estimateReadTime } from '@/lib/utils';
import type { Story, Article, SocialContent, ContentFormat, VisualScene, VisualPlan, SEOMetadata, GEOMetadata, EEATScore, VisualSource } from '@/types';

// ============================================================
// HALODEPOK CONTENT FACTORY — Content Factory Engine
// ============================================================

// --- Article Generation ---

export async function generateArticle(story: Story): Promise<Article> {
  const ai = getAIProvider();

  const brief = story.editorial_brief;
  const content = `
Story Title: ${story.title ?? ''}
What Happened: ${brief?.what_happened ?? story.summary ?? ''}
Where: ${brief?.where ?? 'Depok'}
When: ${brief?.when ?? 'Unknown'}
Who: ${brief?.who ?? 'Unknown'}
Verified Facts: ${brief?.what_is_verified?.join('; ') ?? 'None yet'}
Uncertain: ${brief?.what_is_uncertain?.join('; ') ?? 'None'}
Why It Matters: ${brief?.why_it_matters ?? ''}
What Residents Should Know: ${brief?.what_residents_should_know ?? ''}
What Happens Next: ${brief?.what_happens_next ?? ''}
`.trim();

  const prompt = `You are the HaloDepok content editor. Generate a complete, factual news article in Indonesian for Depok residents.

STORY INTELLIGENCE:
${content}

RULES:
- Write in Indonesian (Bahasa Indonesia)
- Be factual. NEVER fabricate quotes, statistics, eyewitness accounts, or official statements.
- If something is unverified, say so clearly.
- Use plain, accessible language for general residents.
- Article should be 400-800 words.
- Include timeline if multiple events are involved.
- Include FAQ section if residents would have practical questions.
- Include source attribution section.

Respond with JSON:
{
  "title": "compelling, accurate headline in Indonesian (max 100 chars)",
  "dek": "one-sentence hook below headline (max 200 chars)",
  "summary": "2-3 sentence summary",
  "body": "full article body in Indonesian (markdown supported, H2 for sections)",
  "key_facts": ["verified fact 1", "verified fact 2"],
  "timeline": [{"time": "when", "event": "what happened", "source": "source if known"}],
  "faq": [{"question": "q", "answer": "a"}],
  "sources_section": "attribution paragraph"
}`;

  try {
    const result = await ai.structuredGenerate<{
      title: string;
      dek: string;
      summary: string;
      body: string;
      key_facts: string[];
      timeline: { time: string; event: string; source?: string }[];
      faq: { question: string; answer: string }[];
      sources_section: string;
    }>(prompt, { temperature: 0.5, maxTokens: 4096 });

    const slug = slugify(result.title, 100);
    const existing = await queryRecords<Article>(TABLES.articles, { story_id: story.id }, { limit: 1 });
    const existingArticle = existing[0];
    const version = existingArticle ? existingArticle.version + 1 : 1;

    const article: Partial<Article> = {
      id: existingArticle?.id ?? generateId('art'),
      story_id: story.id,
      title: result.title,
      dek: result.dek,
      summary: result.summary,
      body: result.body,
      key_facts: result.key_facts ?? [],
      timeline: result.timeline ?? [],
      faq: result.faq ?? [],
      sources_section: result.sources_section,
      update_timestamp: new Date().toISOString(),
      slug,
      status: 'draft',
      version,
      generated_by: 'article-agent',
      prompt_version: 'v1',
      human_editor_id: null,
      approved_by: null,
      created_at: existingArticle?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const saved = await insertRecord<Article>(TABLES.articles, article);
    await updateRecord<Story>(TABLES.stories, story.id, {
      status: 'content_ready',
      last_updated_at: new Date().toISOString(),
    });

    return saved;
  } catch (err) {
    console.error('Article generation failed:', err);
    throw err;
  }
}

// --- TikTok Content Generation ---

export async function generateTikTokContent(story: Story, article?: Article): Promise<SocialContent> {
  const ai = getAIProvider();
  const brief = story.editorial_brief;

  const prompt = `Generate TikTok content for this story. NO human face or voice is required.

Story: ${brief?.what_happened ?? story.title ?? ''}
Hook: ${brief?.what_residents_should_know ?? ''}
Location: ${brief?.where ?? 'Depok'}

FORMAT OPTIONS (no human face needed):
- Photo slideshow
- Kinetic typography
- Map video with text
- Infographic animation
- AI voice / text-to-speech
- Citizen footage (if available)

TikTok Structure (30-35 seconds total):
0-2s: HOOK (grab attention)
2-6s: WHAT HAPPENED
6-12s: WHERE (show on map if possible)
12-20s: WHY IT MATTERS
20-30s: WHAT YOU SHOULD KNOW
30-35s: CTA (follow halodepok, share, etc.)

Respond with JSON:
{
  "hook": "attention-grabbing opening line (max 15 words)",
  "caption": "full caption for TikTok (up to 150 chars)",
  "body": "hook + body narration script",
  "hashtags": ["#halodepok", "#jakarta", "#JakartaSelatan", "#berita", "#localnews"],
  "visual_direction": {
    "scenes": [
      {
        "order": 1,
        "start_time": 0,
        "duration_seconds": 3,
        "visual_type": "kinetic_typography | infographic | map | image",
        "visual_source": "ai_generated | official | licensed",
        "visual_description": "description of what should appear visually",
        "on_screen_text": "text overlay on screen",
        "narration": "voiceover/narration text for this scene",
        "transition": "cut | fade | slide",
        "source_attribution": "source name if applicable"
      }
    ],
    "total_duration_seconds": 30,
    "style": "informative | urgent | investigative | local"
  },
  "voiceover_script": "full narration script",
  "subtitle": "full subtitle text",
  "thumbnail_concept": "thumbnail description",
  "cta": "call to action at end",
  "duration_seconds": 30,
  "source_attributions": ["source names if applicable"]
}`;

  try {
    const result = await ai.structuredGenerate<{
      hook: string;
      caption: string;
      body: string;
      hashtags: string[];
      visual_direction: VisualPlan;
      voiceover_script: string;
      subtitle: string;
      thumbnail_concept: string;
      cta: string;
      duration_seconds: number;
      source_attributions: string[];
    }>(prompt, { temperature: 0.7, maxTokens: 2048 });

    const content: Partial<SocialContent> = {
      id: generateId('sc'),
      story_id: story.id,
      article_id: article?.id ?? null,
      format: 'tiktok',
      hook: result.hook,
      caption: result.caption,
      body: result.body,
      hashtags: result.hashtags ?? ['#halodepok', '#jakarta', '#JakartaSelatan'],
      visual_direction: result.visual_direction,
      voiceover_script: result.voiceover_script,
      subtitle: result.subtitle,
      thumbnail_concept: result.thumbnail_concept,
      cta: result.cta,
      duration_seconds: result.duration_seconds,
      source_attributions: result.source_attributions ?? [],
      status: 'draft',
      version: 1,
      generated_by: 'tiktok-agent',
      prompt_version: 'v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return insertRecord<SocialContent>(TABLES.social_contents, content);
  } catch (err) {
    console.error('TikTok generation failed:', err);
    throw err;
  }
}

// --- Instagram Carousel Generation ---

export async function generateInstagramCarousel(story: Story, article?: Article): Promise<SocialContent> {
  const ai = getAIProvider();
  const brief = story.editorial_brief;

  const prompt = `Generate Instagram carousel content for this story.

Story: ${brief?.what_happened ?? story.title ?? ''}
Key Facts: ${brief?.what_is_verified?.join(' | ') ?? ''}
Location: ${brief?.where ?? 'Depok'}
Timeline: ${brief?.what_happens_next ? `Next: ${brief.what_happens_next}` : ''}

Generate 5-7 carousel slides. Do NOT force 7 slides if the story doesn't need them.

Respond with JSON:
{
  "caption": "main caption (up to 200 chars)",
  "hashtags": ["#depok", "#jakarta", "#beritalokal"],
  "visual_direction": {
    "scenes": [
      {
        "order": 1,
        "start_time": 0,
        "duration_seconds": 0,
        "visual_type": "infographic | image | map",
        "visual_source": "ai_generated | official | licensed",
        "visual_description": "slide content description",
        "on_screen_text": "headline text for slide",
        "narration": null,
        "transition": null,
        "source_attribution": null
      }
    ],
    "total_duration_seconds": 0,
    "style": "clean | modern | informative"
  },
  "cta": "link in bio / swipe up CTA"
}`;

  try {
    const result = await ai.structuredGenerate<{
      caption: string;
      hashtags: string[];
      visual_direction: VisualPlan;
      cta: string;
    }>(prompt, { temperature: 0.6, maxTokens: 2048 });

    const content: Partial<SocialContent> = {
      id: generateId('sc'),
      story_id: story.id,
      article_id: article?.id ?? null,
      format: 'instagram_carousel',
      hook: result.visual_direction?.scenes?.[0]?.on_screen_text ?? null,
      caption: result.caption,
      hashtags: result.hashtags ?? ['#depok', '#jakarta', '#beritalokal'],
      visual_direction: result.visual_direction,
      cta: result.cta,
      source_attributions: [],
      status: 'draft',
      version: 1,
      generated_by: 'instagram-agent',
      prompt_version: 'v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return insertRecord<SocialContent>(TABLES.social_contents, content);
  } catch (err) {
    console.error('Instagram carousel generation failed:', err);
    throw err;
  }
}

// --- X (Twitter) Post Generation ---

export async function generateXPost(story: Story): Promise<SocialContent> {
  const ai = getAIProvider();
  const brief = story.editorial_brief;

  const prompt = `Generate a X (Twitter) post about this story. Max 280 characters.

Story: ${brief?.what_happened ?? story.title ?? ''}
Location: ${brief?.where ?? 'Depok'}
Residents should know: ${brief?.what_residents_should_know ?? ''}

Respond with JSON:
{
  "body": "post text (max 280 chars including spaces)",
  "caption": null,
  "hashtags": ["#DepokNews", "#JakartaSelatan"],
  "cta": null
}`;

  try {
    const result = await ai.structuredGenerate<{ body: string; hashtags: string[] }>(prompt, {
      temperature: 0.7,
      maxTokens: 256,
    });

    const content: Partial<SocialContent> = {
      id: generateId('sc'),
      story_id: story.id,
      article_id: null,
      format: 'x_post',
      body: result.body,
      hashtags: result.hashtags ?? ['#DepokNews', '#JakartaSelatan'],
      source_attributions: [],
      status: 'draft',
      version: 1,
      generated_by: 'x-agent',
      prompt_version: 'v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return insertRecord<SocialContent>(TABLES.social_contents, content);
  } catch (err) {
    console.error('X post generation failed:', err);
    throw err;
  }
}

// --- Full Content Package Generation ---

export async function generateFullContentPackage(story: Story): Promise<{
  article: Article;
  tiktok: SocialContent;
  instagram: SocialContent;
  xPost: SocialContent;
}> {
  // Generate article first (it's the source for social content)
  const article = await generateArticle(story);

  // Then generate social content in parallel
  const [tiktok, instagram, xPost] = await Promise.all([
    generateTikTokContent(story, article),
    generateInstagramCarousel(story, article),
    generateXPost(story),
  ]);

  return { article, tiktok, instagram, xPost };
}
