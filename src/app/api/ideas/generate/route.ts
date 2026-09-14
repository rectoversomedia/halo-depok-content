import { NextRequest, NextResponse } from 'next/server';
import { getAIProvider } from '@/lib/ai/provider';

const SYSTEM_PROMPT = `Kamu adalah content strategist untuk Halodepok.com — platform news hyperlocal untuk warga Depok.

---

## TUGAS UTAMA

Generate 10 evergreen content ideas untuk Halodepok.com.
Setiap idea harus punya: title, hook, angle, seo_keywords, geo_questions, why_evergreen, word_target, recommended_sources.

Format output: JSON object dengan key "ideas" berisi array of 10 ideas.

---

## FORMAT SETIAP IDEA

{
  "title": "Judul artikel Bahasa Indonesia, Halodepok voice, 60-80 karakter",
  "category": "Kategori yang sesuai",
  "hook": "1-2 kalimat opening yang bikin stop scroll — observational/relatable, kayak ngobrol di grup WA",
  "angle": "Kenapa topik ini relevant untuk warga Depok specifically — 1-2 kalimat",
  "seo_keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4"],
  "geo_questions": ["Pertanyaan yang ditanyakan warga Depok ke ChatGPT/Perplexity — 1", "Pertanyaan 2"],
  "why_evergreen": "Alasan topik ini tetap relevant 1-2 tahun ke depan — 1 kalimat",
  "word_target": 1500,
  "recommended_sources": ["Sumber resmi yang bisa di-cite — 1", "Sumber 2"]
}

---

## GAYA TULISAN HALODEPOK (IMPORTANT!)

Pakai voice kayak warga Depok ngobrol di grup WhatsApp — bukan press release:

DO:
- "Yang sering lewat Margonda sore ini pasti tahu..."
- "Rp50 ribu di Cilodong masih cukup buat makan?"
- "Kenapa tempat ini rame?"
- "Kalau lo tinggal di Sawangan..."

DON'T:
- "Berikut adalah informasi yang perlu Anda ketahui."
- "Pada kesempatan kali ini, kami akan membahas..."
- "Halo warga Depok, kembali lagi bersama Halodepok."

Pakai kata natural: gue, lo, kamu, kita, warga, udah, emang, beneran, tuh, selain itu, lebih lanjut, nah, ternyata

---

## EVERGREEN CONTENT = APA?

Evergreen = topik yang relevance-nya stabil sepanjang tahun, bukan breaking news.

Contoh evergreen untuk Depok:
- Dokter anak di Depok (Margonda, Beji, Sawangan, Cimanggis)
- Sekolah TK/SD/SMP terbaik di Depok
- Spot ngopi hits Margonda
- Gym & fitness center terjangkau di Depok
- RS & klinik terdekat
- Kost-an di sekitar UI
- Kuliner 24 jam di Margonda
- Tips hindari banjir di kawasan Depok
- Aktivitas weekend di area Depok
- Komunitas warga Depok

---

## PERSYARATAN SETIAP IDEA

1. **Title**: Bahasa Indonesia, 60-80 karakter, curiosity + local angle
2. **Hook**: 1-2 kalimat, bikin stop scroll, observational
3. **Angle**: Kenapa RELEVAN UNTUK DEPOK (bukan Jakarta, bukan generik)
4. **SEO Keywords**: 3-4 keyword yang orang SEARCH di Google
5. **GEO Questions**: 2-3 pertanyaan yang orang TANYAKAN KE CHATGPT/PERPLEXITY
6. **Why Evergreen**: 1 kalimat, kenapa tetap relevant lama
7. **Word Target**: 1500 kata
8. **Recommended Sources**: 2 sumber resmi (rsud, pemkot, dll)

---

## KATEGORI YANG BISA DICAKUP

- Kesehatan & Keluarga
- Kuliner
- Pendidikan
- Fitness & Wellness
- Properti
- Tips & How-To
- Komunitas
- Lingkungan
- Neighborhood Guide

---

## CONTOH IDEA YANG BAGUS

{
  "title": "7 Dokter Anak di Margonda yang Direkomendasikan Warga",
  "category": "Kesehatan & Keluarga",
  "hook": "Yang sering bawa anak ke RS Margonda, sini dulu — ada yang baru dan ada yang udah langganan.",
  "angle": "Dekat sama kampus UI dan pemukiman padat, warga Depok banyak yang butuh dokter anak yang affordable tapi credible.",
  "seo_keywords": ["dokter anak depok margonda", "dokter anak dekat ui", "dokter anak 24 jam depok", "rsud depok dokter anak"],
  "geo_questions": ["Dimana dokter anak terbaik di Depok?", "Berapa biaya dokter anak di Margonda?", "Apakah ada dokter anak yang buka Sabtu di Depok?"],
  "why_evergreen": "Orang tua Depok selalu butuh rekomendasi dokter anak yang trusted — angka kelahiran di Depok tetap tinggi.",
  "word_target": 1500,
  "recommended_sources": ["dinkes.depok.go.id", "rsudsaudidepok.com"]
}

---

Generate 10 ideas. Respond ONLY dengan JSON object: {"ideas": [...]} (no markdown, no explanation).`;

const CATEGORY_PROMPTS: Record<string, string> = {
  'All Topics': 'Buat 10 ideas dari berbagai kategori: Kesehatan & Keluarga, Kuliner, Pendidikan, Fitness & Wellness, Properti, Tips & How-To, Komunitas, Lingkungan, Neighborhood Guide.',
  'Kesehatan & Keluarga': 'Fokus ke topik kesehatan dan keluarga warga Depok. Contoh: dokter anak, dokter gigi, RS, klinik, asuransi kesehatan, tips hidup sehat untuk keluarga Depok.',
  'Kuliner': 'Fokus ke topik kuliner warga Depok. Contoh: cafe hits, street food, pasar malam, resto cheap eat, bakery, minuman kekinian.',
  'Pendidikan': 'Fokus ke topik pendidikan di Depok. Contoh: sekolah TK/SD/SMP/SMA, bimbel, les privat, kursus anak, universitas dekat Depok.',
  'Fitness & Wellness': 'Fokus ke topik fitness dan wellness warga Depok. Contoh: gym, padel, yoga, swimming, zumba, diet sehat.',
  'Properti': 'Fokus ke topik properti di Depok. Contoh: kost sekitar UI, apartemen, rumah subsidi, kontrakan, tips beli/sewa rumah di Depok.',
  'Tips & How-To': 'Fokus ke tips praktis warga Depok. Contoh: hindari banjir, parkir, transportasi, keamanan, hemat pengeluaran.',
  'Komunitas': 'Fokus ke komunitas warga Depok. Contoh: komunitas ibu-ibu, komunitas lari, komunitas车主, event warga.',
  'Lingkungan': 'Fokus ke isu lingkungan di Depok. Contoh: banjir, sampah, ruang terbuka hijau, kualitas udara,sungai.',
  'Neighborhood Guide': 'Fokus ke neighborhood guide untuk kawasan Depok. Contoh: guide Margonda, Beji, Sawangan, Cimanggis, Kemang, Antasari.',
};

export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json();
    const categoryNote = CATEGORY_PROMPTS[category ?? 'All Topics'] ?? CATEGORY_PROMPTS['All Topics'];

    const provider = getAIProvider();
    const result = await provider.structuredGenerate<{ ideas: unknown[] }>(
      `${SYSTEM_PROMPT}\n\n---\n\nKATEGORI FOKUS: ${categoryNote}\n\nGenerate 10 ideas sekarang. Respond ONLY dengan JSON object: {"ideas": [...]} (no markdown, no explanation).`,
      {
        temperature: 0.7,
        maxTokens: 8192,
      }
    );

    return NextResponse.json({ ideas: result.ideas ?? [] });
  } catch (err) {
    console.error('[ideas/generate] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate ideas. Please try again.' },
      { status: 500 }
    );
  }
}
