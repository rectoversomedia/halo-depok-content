// Rewrite engine: URL/text → HaloDepok article
import { getAIProvider } from '@/lib/ai/provider';
import { insertRecord, TABLES } from '@/lib/db';
import { generateId, slugify } from '@/lib/utils';
import type { Article } from '@/types';

export interface RewriteInput {
  sourceText: string;
  sourceUrl?: string;
  sourceTitle?: string;
  keyword?: string;
  location?: string;
  category?: string;
}

// — Pexels image fetch —
// topic: hasil dari pexels_query AI (sudah spesifik)
// appendDepok: true kalau artikelnya tentang Depok/lokal (berita jalan, banjir, cafe, dll)
//Kalau topik umum kayak "padel", "yoga", "crypto" — jangan di-append Depok context
async function fetchPexelsImage(topic: string, appendDepok = false): Promise<string | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  const query = appendDepok ? `${topic} jakarta indonesia` : topic;

  // Try primary query first
  const tryFetch = async (q: string): Promise<string | null> => {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=8&orientation=landscape`,
        { headers: { Authorization: key }, next: { revalidate: 0 } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.photos?.length > 0) {
        // Pick a random photo from top 4 for variety
        const photo = data.photos[Math.floor(Math.random() * Math.min(4, data.photos.length))];
        return photo.src.large;
      }
    } catch { /* ignore */ }
    return null;
  };

  // Try with topic first
  let url = await tryFetch(query);
  // If Depok context appended and failed, retry without location
  if (!url && appendDepok) {
    url = await tryFetch(topic);
  }
  // If still no result, retry with broader terms
  if (!url) {
    url = await tryFetch(`${topic.split(' ')[0]} sport jakarta`);
  }

  return url;
}

// — Unsplash (free, no API key) —
function unsplashUrl(query: string, width = 900): string {
  const q = encodeURIComponent(query.replace(/\s+/g, ','));
  return `https://source.unsplash.com/${width}x600/?${q}`;
}

// — Replace PEXELS_PLACEHOLDER:query in HTML body with real URLs —
function replaceImagePlaceholders(html: string, imageMap: Map<string, string>): string {
  return html.replace(/<img\s+src="PEXELS_PLACEHOLDER:([^"]+)"/gi, (_match, query: string) => {
    const url = imageMap.get(query.trim().toLowerCase());
    if (url) return `<img src="${url}"`;
    // Fallback: use Unsplash free URL
    return `<img src="${unsplashUrl(query.trim())}"`;
  });
}

// — Extract all PEXELS_PLACEHOLDER queries from HTML —
function extractPlaceholderQueries(html: string): string[] {
  const queries: string[] = [];
  const regex = /PEXELS_PLACEHOLDER:([^"]+)/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    queries.push(match[1].trim());
  }
  return [...new Set(queries)];
}

export async function rewriteArticle(input: RewriteInput): Promise<{
  article: Article;
  storyId: string;
}> {
  const ai = getAIProvider();

  const locationLabel = input.location
    ? `Lokasi: ${input.location}, Depok`
    : 'Lokasi: Depok';

  const sourceLine = input.keyword
    ? `KEYWORD MODE: Buat article dari kata kunci "${input.keyword}"`
    : input.sourceUrl
    ? `Sumber: ${input.sourceUrl}`
    : 'Sumber: teks yang diberikan';

  const categoryLabel = input.category
    ? `Kategori: ${input.category}`
    : '';

  const prompt = `ROLE: Lo adalah warga Depok yang nulis untuk warga Depok lain. Lo bukan jurnalis. Lo bukan media. Lo bukan AI. Lo kayak teman lo yang sehari-hari nongkrong di sekitaran Depo, yang tau semua jalan tikungnya, yang tau tempat yang baru rame, yang tau tempat yang overrated.

KONTEN INI BUKAN ARTIKEL BERITA. INI KAYAK LO NGOBROL DI GRUP WHATSAPP — ngasih infouseful ke temen yang juga warga Depok.

═══════════════════════════════════════════
SUARA (VOICE) — CORRECTION
═══════════════════════════════════════════
Jakselnews terasa kayak: polished, corporate, "bestie", vibes, literally, terlalu clean.
HaloDepok terasa kayak: apa adanya, jujur, sedikit sinis, kadang brutal, kadang kocak, tapi tetap informatif.

BEDA NYA:
Jakselnews: "Berikut 5 tempat ngopi cozy di Cipete yang wajib lo coba! Cozy banget dan aesthetic abis!"
HaloDepok: "Tiap minggu morning jogger di situ rame. Tempatnya oke, kopinya standar. Tapi kalau lo mau yang serious working, mending ke lain."

Jakselnews: "Pengalaman yang increíble banget! Highly recommend untuk quality time bersama pasangan!"
HaloDepok: "Tempatnya oke buat nongkrong santai. Kalau mau ajak client meeting, maybe kurang. Tapi buat nongkrong sama temen, pass."

LOKALITAS:
- Pakai nama jalan spesifik, kawasan, landmark yang warga Depok kenal
- Ngarah ke Antasari, Beji, Sawangan, Cinangka, Bojonggede, Cilebut, dll
- Jangan generalisir "Jakarta". Depok punya identitas sendiri.

═══════════════════════════════════════════
STRUKTUR ARTIKEL
═══════════════════════════════════════════
WAJIB PAKAI STRUKTUR INI:

1. HOOK (1 paragraph)
Langsung mulai dengan sesuatu yang bikin orang berhenti scroll. Observasi spesifik yang bikin pembaca bilang "ih iya juga" atau "serius sih?". Jangan basi.

2. CONTEXT (1-2 paragraph)
Kasih konteks. Kenapa ini penting buat warga Depok. Jangan cuma deskripsi tempat/berita doang.

3. DETAIL LENGKAP (sesuai topik)
- Kalau LIST/REKOMENDASI: tiap item WAJIB ada:
  * Nama lengkap tempat
  * Alamat spesifik (Jalan + Kawasan + Depok)
  * Link Google Maps / Google Rating (jika ada)
  * Jam operasional
  * Estimasi harga / range harga
  * Nomor telepon / WhatsApp (jika ada)
  * Catatan jujur: worth it atau nggak, untuk siapa, kapan best time visit

- Kalau BERITA: fokus ke kronologi, dampak ke warga, sumber resmi

4. LOCAL ANGLE (1-2 paragraph)
Kenapa ini relevan khusus buat warga Depok. Apa bedanya sama kawasan lain. Apa yang bikin warga harus peduli.

5. CLOSING (1-2 kalimat aja)
Jangan kesimpulan formal. Closing kayak lo ngobrol terakhir di grup:
- "Semoga help ya. Yang udah pernah ke sini, gimana pengalaman lo?"
- "Nah itu dia. Yang lain mau nambahin?"
- "Semoga weekend lo seru. Nanti kabarin ya kalau udah coba!"

═══════════════════════════════════════════
JANGAN PERNAH ADA
═══════════════════════════════════════════
❌ "Kesimpulan" atau "Penutup" sebagai heading/section
❌ "Berdasarkan penjelasan di atas"
❌ "Demikian informasi yang dapat kami sampaikan"
❌ "Berikut adalah..." sebagai opening
❌ Kesimpulan yang nge-rangkum seluruh artikel
❌ Bullets yang berfungsi sebagai "summary" di akhir
❌ Kalimat penutup yang kayak press release

═══════════════════════════════════════════
DETAIL LENGKAP — LIST/DAFTAR
═══════════════════════════════════════════
Kalau ini list tempat/venue/rekomendasi, setiap item HARUS SEKOMPLIT INI:

<h2>[Nama Tempat]</h2>
<p><strong>Alamat:</strong> [Jalan lengkap, Kawasan, Depok]</p>
<p><strong>Google Maps:</strong> <a href="[link google maps]" target="_blank">Buka di Maps</a> (Rating: ⭐ [X.X] dari [X] ulasan)</p>
<p><strong>Jam Operasional:</strong> [Senin-Jumat: XX:00-XX:00, Sabtu-Minggu: XX:00-XX:00]</p>
<p><strong>Harga:</strong> Mulai dari Rp[XXX.XXX] - Rp[XXX.XXX]</p>
<p><strong>Kontak:</strong> [Nomor telepon / WhatsApp]</p>
<p>[Paragraf deskripsi jujur — bukan promotional copy. Apa yang oke, apa yang kurang, untuk siapa ini cocok, kapan best time dateng. Gunakan bahasa natural HaloDepok.]</p>

═══════════════════════════════════════════
PERSYARATAN BODY
═══════════════════════════════════════════
- MINIMAL 1200 KATA. Body yang kurang dari 1000 kata = GAGAL dan harus di-regenerate.
- Rata-rata kalimat: 8-15 kata. Jangan panjang-panjang.
- SETIAP paragraph HARUS pakai minimal 1 transition word: "lalu", "nah", "yang bikin", "ternyata", "selain itu", "terus", "paling", "masalahnya", "untungnya", "gimana", "nah gitu"
- VARY sentence starters. Jangan paragraph paragraph mulai sama "Tempat ini...", "Lokasinya...", "Harganya..."
- Focus keyword harus muncul: di paragraph pertama, minimal 1 H2, 3-5x natural di body
- Outbound links ke minimal 2-3 sumber resmi (bmkg.go.id, jakarta.go.id, google.com/maps, dll)

═══════════════════════════════════════════
SEO & META
═══════════════════════════════════════════
- SEO Title: maks 55 karakter, mulai dengan focus keyword
- Meta Description: maks 150 karakter, mengandung keyword + hook yang bikin klik
- Slug: url-friendly, huruf kecil, strip, mengandung keyword
- Body: minimal 1200 kata, LEDE (paragraph pertama) langsung jawab pertanyaan utama
- Key Facts: 3-5 fakta konkret dan verified (nama, angka, lokasi spesifik, jam)

═══════════════════════════════════════════
GEO — Generative Engine Optimization
(Biar direkomendasikan di ChatGPT, Perplexity, Gemini, AI Search)
═══════════════════════════════════════════
- Paragraph pertama = jawaban langsung. LEDE harus menjawab "apa", "di mana", "untuk siapa"
- Definisi jelas di paragraph 1-2 untuk istilah/konsep
- <ul>/<ol> untuk list biar AI gampang parse
- Closing sentence yang bisa berdiri sendiri sebagai answer summary
- Source citations yang jelas: <a href="URL resmi" target="_blank">Nama Sumber</a>

═══════════════════════════════════════════
E-E-A-T COMPLIANCE (WAJIB)
═══════════════════════════════════════════
EXPERIENCE: Kalau ada warga bicara, sebut nama, kawasan, pekerjaan (contoh: "Kata Bang Aan, 34, ojek online yang nagal di Antasari..."). Kalau tidak ada kutipan asli, tulis "Berdasarkan informasi yang kami terima..." — JANGAN fabrikasi.
EXPERTISE: Pakai data resmi dari sumber kredibel (BMKG, Pemrov DKI, BNPB, Kepolisian, DLLAJ, google.com/maps).
AUTHORITATIVENESS: Sumber dengan nama lengkap & Jabatan (contoh: "Kepala Suku Dinas Pekerjaan Umum Depok, Budi Santoso, dikonfirmasi via telepon...").
TRUSTWORTHINESS: JANGAN ngarang fakta, angka, kutipan, lokasi, jam operasional. Cek ulang sebelum nulis.

═══════════════════════════════════════════
WORDPRESS HTML FORMAT
═══════════════════════════════════════════
- <h2>Section Heading</h2> untuk sub-judul
- <p>Paragraph dengan <strong>bold</strong> untuk emphasis
- <table> WAJIB kalau ada data list/tabel
- <ul><li>Bullet untuk tips/langkah</li></ul>
- <ol><li>Numbered untuk langkah urut</li></ol>
- <blockquote><p>"Kutipan langsung"</p><cite>— Nama, Kawasan, (usia), pekerjaan</cite></blockquote>
- JANGAN pakai <img>, <figure> di dalam body — reserved untuk hero image
- TIDAK ADA section "Kesimpulan" atau "Penutup"

═══════════════════════════════════════════
JSON OUTPUT — RESPOND WITH THIS EXACT FORMAT
═══════════════════════════════════════════
Respond ONLY with valid JSON (no markdown, no code fences). Setiap field WAJIB ada:

{
  "title": "headline HaloDepok: singkat, curiosity, local, jujur, maks 100 karakter. Contoh: '6 Lapangan Padel di Depok, Dari Rp49 Ribu' atau 'Kenapa Tempat Ini Tiba-Tiba Ramai?'",
  "dek": "hook maks 200 karakter yang bikin orang klik — kasar, jujur, relatable",
  "summary": "2-3 kalimat TLDR dalam Bahasa Indonesia — kasar dan jujur, bukan corporate",
  "seo_title": "SEO title maks 55 karakter, WAJIB mulai dengan focus keyword",
  "meta_description": "meta description maks 150 karakter, mengandung keyword + hook klik yang jujur",
  "focus_keyword": "1 focus keyword spesifik dalam Bahasa Indonesia",
  "slug": "url-friendly slug, huruf kecil, strip, mengandung keyword",
  "body": "FULL HTML body. MINIMAL 1200 KATA. STRUKTUR: (1) HOOK paragraph pertama yang bikin berhenti scroll; (2) CONTEXT 1-2 paragraph; (3) DETAIL LENGKAP — kalau list harus ada Alamat, Google Maps/Rating, Jam Operasional, Harga, Kontak; (4) LOCAL ANGLE; (5) CLOSING 1-2 kalimat doang. SETIAP paragraph minimal 1 transition word, kalimat maks 20 kata, vary sentence starters, focus keyword di paragraph pertama + H2 + 3-5x natural, outbound links ke sumber resmi, TIDAK ADA 'Kesimpulan' atau 'Penutup'. Body kurang dari 1000 kata = GAGAL.",
  "pexels_query": "1-3 kata kunci visual untuk gambar hero article",
  "key_facts": ["fakta konkret #1 (nama/angka/lokasi)", "fakta konkret #2 (data verified)", "fakta konkret #3 (sumber resmi)", "fakta konkret #4 (alamat/jam/harga)", "fakta konkret #5"],
  "timeline": [{"time": "jam WIB / tanggal", "event": "kejadian", "source": "sumber resmi"}],
  "faq": [{"question": "pertanyaan warga Depok yang spesifik dan jujur?", "answer": "jawaban pendek 20-40 kata dulu, baru penjelasan panjang"}],
  "sources_section": "Atribusi sumber resmi dengan nama lengkap & jabatan (contoh: 'Kepala Suku Dinas Pekerjaan Umum Depok, Budi Santoso, dikonfirmasi via telepon...')",
  "author": "Tim HaloDepok",
  "read_time_minutes": "estimasi waktu baca dalam menit"
}

${input.keyword ? `

═══════════════════════════════════════════
TUGAS KHUSUS: KEYWORD MODE
═══════════════════════════════════════════
Judul/Topik: "${input.keyword}"

Buat article feature/listicle dari topik "${input.keyword}" dalam gaya HaloDepok di atas.

Karena ini keyword-only (tanpa source text), lo HARUS:
1. Mulai dengan HOOK paragraph yang relatable/personal
2. Cari angle yang spesifik dan aktual buat warga Depok
3. Tulis seolah-olah lo udah riset dan wawancara sumber terkait
4. Sertakan fakta yang realistic dan verifiable tentang Depok
5. Pakai nama kawasan, jalan, landmark Depok yang spesifik
6. Focus keyword = "${input.keyword}"
7. Tulis minimal 1200 kata
8. JANGAN ada "Kesimpulan" atau "Penutup"` : input.sourceText}

${locationLabel}
${sourceLine}
${categoryLabel}
`;

  const result = await ai.structuredGenerate<{
    title: string;
    dek: string;
    summary: string;
    seo_title: string;
    meta_description: string;
    focus_keyword: string;
    slug: string;
    body: string;
    pexels_query: string;
    key_facts: string[];
    timeline: { time: string; event: string; source?: string }[];
    faq: { question: string; answer: string }[];
    sources_section: string;
    author: string;
    read_time_minutes: string;
  }>(prompt, { temperature: 0.5, maxTokens: 16384 });

  // — Fetch hero image from Pexels —
  // Auto-detect if topic is Depok/lokal: if keyword contains Depok locations, append jakarta context
  const depokTerms = ['depok', 'jakarta selatan', 'kemang', 'blok m', 'kebayoran', 'cipete', 'tebet', 'cilandak', 'pasar minggu', 'lebak bulus', 'antasari', 'hr rasuna said', 'tb simatupang', 'sungai', 'banjir', 'macet', 'lalu lintas', 'cafe', 'coffee', 'restoran', 'makan', 'kuliner'];
  const topicLower = (result.focus_keyword ?? result.title ?? '').toLowerCase();
  const isDepokTopic = depokTerms.some(t => topicLower.includes(t));
  let heroImageUrl: string | null = null;
  if (result.pexels_query) {
    heroImageUrl = await fetchPexelsImage(result.pexels_query, isDepokTopic);
  }

  // — Replace image placeholders in body with real URLs (hero only, strip body images) —
  let bodyHtml = result.body ?? '';

  // Safety: strip any <img> or <figure> tags the AI might still produce in body
  bodyHtml = bodyHtml
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<img\b[^>]*>/gi, '');

  // Safety: strip "Kesimpulan" or "Penutup" sections that violate HaloDepok rules
  bodyHtml = bodyHtml
    .replace(/<h[1-6][^>]*>\s*(Kesimpulan|Penutup|Kesimpulan Umum|Kesimpulan Akhir)\s*<\/[h1-6]>[\s\S]*?$/gim, '')
    .replace(/<h[1-6][^>]*>\s*Kesimpulan[\s\S]*?<\/h[1-6]>[\s\S]*?/gim, '')
    .replace(/<h[1-6][^>]*>\s*Penutup[\s\S]*?<\/h[1-6]>[\s\S]*?/gim, '');

  // Create a story first so article can reference it
  const storyId = generateId();
  const slug = result.slug ? slugify(result.slug) : slugify(result.title);

  await insertRecord(TABLES.stories, {
    id: storyId,
    title: result.title,
    summary: result.summary,
    status: 'content_ready',
    classification: 'draft',
    importance_score: 70,
    locality_score: 90,
    novelty_score: 70,
    urgency_score: 60,
    risk_score: 0,
    commercial_score: 0,
    location_id: null,
    first_seen_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
  });

  const article = await insertRecord<Article>(TABLES.articles, {
    id: generateId(),
    story_id: storyId,
    title: result.title,
    dek: result.dek,
    summary: result.summary,
    body: bodyHtml,
    key_facts: result.key_facts ?? [],
    timeline: result.timeline ?? [],
    faq: result.faq ?? [],
    sources_section: result.sources_section ?? (input.sourceUrl ? `Sumber: ${input.sourceUrl}` : ''),
    slug,
    status: 'draft',
    version: 1,
    generated_by: 'rewrite-agent',
    prompt_version: 'v5-halodepok-fullstyle',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    article: {
      ...article,
      seo_title: result.seo_title,
      meta_description: result.meta_description,
      focus_keyword: result.focus_keyword,
      hero_image_url: heroImageUrl,
      author: result.author,
      read_time_minutes: result.read_time_minutes,
    } as Article,
    storyId,
  };
}
