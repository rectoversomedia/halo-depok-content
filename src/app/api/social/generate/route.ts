import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/provider';

export const dynamic = 'force-dynamic';

async function fetchArticle(url: string): Promise<{ title: string; body: string; dek?: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HaloDepokBot/1.0)' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
      html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'HaloDepok Article';
    const body = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 3000);

    return { title, body };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sourceUrl, platforms, location } = await req.json();

    if (!sourceUrl) {
      return NextResponse.json({ error: 'URL article diperlukan.' }, { status: 400 });
    }
    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu platform.' }, { status: 400 });
    }

    const article = await fetchArticle(sourceUrl);
    if (!article) {
      return NextResponse.json({ error: 'Tidak bisa mengambil article dari URL tersebut.' }, { status: 400 });
    }

    const ai = getAIProvider();
    const loc = location || 'Depok';
    const platformList = platforms.join(', ');

    const prompt = [
      'You are the HaloDepok social media strategist.',
      'HaloDepok is a LOCAL FRIEND who always knows what\'s happening in Depok.',
      'You write like a cool Depok warga — NOT a corporate brand account.',
      '',
      '=== HALODEPOK SOCIAL VOICE ===',
      '- Bahasa Indonesia gaul natural — kayak ngobrol sama temen',
      '- Pakai: gue, lo, kamu, kita, warga, kayak, tuh, udah, emang, beneran',
      '- Friendly, relatable, a little witty',
      '- Contoh bagus: "Yang sering lewat Antasari, sini dulu." / "Rp100 ribu di Senopati masih cukup buat makan?"',
      '- Contoh salah: "Berikut adalah 5 rekomendasi cafe yang dapat Anda kunjungi."',
      '- Credible — jangan fabrikasi fakta, hashtag, atau kutipan',
      '- NOT OVERLY ANAK HALODEPOK — jangan maksa "literally", "bestie", "guys", "vibes"',
      '',
      '=== SLIDE FORMAT (3 slides per platform) ===',
      'SLIDE 1 — HOOK: Hook bikin stop scroll, caption, visual idea, hashtags 3-5, CTA',
      'SLIDE 2 — CONTENT: Info pendukung, fakta warga, detail',
      'SLIDE 3 — CTA: Closing hook + call to action',
      '',
      '=== PLATFORM NOTES ===',
      'X/TWITTER: Max 280 chars, casual, urgency, Bahasa Indonesia',
      'INSTAGRAM: Bold hook line, engaging caption, emoji natural, Bahasa Indonesia gaul',
      'FACEBOOK: Caption lebih panjang, conversational, invite comments, Bahasa Indonesia',
      'TIKTOK: Script 2 detik pertama stop scroll, visual on screen, Bahasa Indonesia viral',
      'THREADS: Bold opening line, carousel-friendly, Bahasa Indonesia casual',
      '',
      '=== HASHTAG RULES ===',
      '3-5 per slide, mix Depok lokal + topik spesifik',
      'Depok tags: #Depok #JakartaSelatan #Kemang #BlokM #KebayoranBaru #Cipete #Tebet #Cilandak',
      '',
      '=== ARTICLE INFO ===',
      `Title: ${article.title}`,
      `Content: ${article.body.substring(0, 2500)}`,
      `Lokasi: ${loc}`,
      `Platform: ${platformList}`,
      '',
      'TUGAS:',
      `- Generate ${platforms.length} sets (1 per platform), masing-masing 3 slides`,
      '- Bahasa Indonesia HaloDepok style (gue/lo/kamu, natural, witty tapi credible)',
      '- Semua factual — berdasarkan artikel, jangan fabrikasi',
      '- Visual idea = spesifik, bukan generik',
      '',
      'Respond ONLY with valid JSON (no markdown, no explanation). Return an array of platform objects.',
    ].join('\n');

    const raw = await ai.structuredGenerate<unknown>(prompt, { temperature: 0.8, maxTokens: 8192 });

    const findArray = (obj: unknown): unknown[] | null => {
      if (Array.isArray(obj)) return obj;
      if (obj && typeof obj === 'object') {
        for (const value of Object.values(obj as Record<string, unknown>)) {
          const found = findArray(value);
          if (found && found.length > 0) return found;
        }
      }
      return null;
    };

    const result = findArray(raw) ?? [];

    return NextResponse.json({ posts: result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/social/generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
