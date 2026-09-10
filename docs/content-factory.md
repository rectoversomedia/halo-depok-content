# Content Factory

## Overview

The Content Factory generates a full content package from a verified story. One story → multiple formats.

## Content Package

For each verified story, the system generates:

1. **Article** — Full news article in Indonesian (400-800 words)
2. **TikTok** — Hook + visual plan + voiceover script (30s)
3. **Instagram Carousel** — 5-7 slides with infographic
4. **X Post** — 280-character summary post

## Article Structure

```json
{
  "title": "Headline (max 100 chars, Indonesian)",
  "dek": "One-sentence hook below headline",
  "summary": "2-3 sentence TLDR",
  "body": "Full article with H2 sections",
  "key_facts": ["verified fact 1", "fact 2"],
  "timeline": [{"time": "when", "event": "what", "source": "who"}],
  "faq": [{"question": "q", "answer": "a"}],
  "sources_section": "Attribution paragraph"
}
```

## TikTok Format (No Human Face Required)

Allowed visual types:
- Photo slideshow
- Kinetic typography
- Map video with text
- Infographic animation
- AI voice / TTS narration
- Licensed footage
- Official media

TikTok structure:
```
0-2s:  HOOK
2-6s:  WHAT HAPPENED
6-12s: WHERE (map if possible)
12-20s: WHY IT MATTERS
20-30s: WHAT YOU SHOULD KNOW
30-35s: CTA
```

## Critical Rules

1. **NEVER fabricate** quotes, statistics, eyewitness accounts, or official statements
2. **ALWAYS attribute** — Every claim needs a source
3. **Label visual sources** — real/citizen/official/licensed/ai_generated
4. **Never optimize for virality** at the expense of accuracy

## Generation Flow

```
Story (verified)
  → generateArticle() → Article
  → generateTikTokContent() → SocialContent (tiktok)
  → generateInstagramCarousel() → SocialContent (instagram_carousel)
  → generateXPost() → SocialContent (x_post)
  → All enter editor review queue
```

## Regeneration

Each content component can be regenerated independently:
- Regenerate headline only
- Regenerate body paragraph only
- Regenerate TikTok hook only
- etc.

This avoids regenerating an entire package when only one element needs change.

## Version Control

Every content item tracks:
- `version` number (auto-increment)
- `generated_by` (agent name)
- `prompt_version` (for traceability)
- `human_editor_id` (if edited)

All versions are preserved. Rollback is supported.
