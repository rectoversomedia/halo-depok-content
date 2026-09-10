/**
 * Seed script for HaloDepok Content Factory
 * Run: node scripts/seed.mjs
 */

const SUPABASE_URL = 'https://auasyfmypoyvrpbinwzc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YXN5Zm15cG95dnJwYmlud3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTQ0MTIsImV4cCI6MjEwNDA3MDQxMn0.yiaxByV5q7SJPALdkFUoTuhnGbtTNCJ4ZaacV7jdeXc';

async function doFetch(table, { method = 'GET', body, params = {} } = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url, {
    method,
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'GET' ? 'return=representation' : 'return=representation',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  if (!text) return [];
  try { return JSON.parse(text); } catch { return []; }
}

// Upsert with on_conflict support (uses resolution=merge-duplicates via Prefer header)
async function doFetchUpsert(table, records) {
  const arr = Array.isArray(records) ? records : [records];
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(arr),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  if (!text) return [];
  try { return JSON.parse(text); } catch { return []; }
}

// Fetch existing slugs from a table to avoid unique constraint conflicts
async function getExisting(table, uniqueField) {
  const data = await doFetch(table, { params: { select: uniqueField } });
  return new Set(Array.isArray(data) ? data.map(r => r[uniqueField]) : []);
}

async function upsert(table, records, uniqueField = 'slug') {
  const arr = Array.isArray(records) ? records : [records];
  let toInsert = arr;
  if (uniqueField) {
    const existing = await getExisting(table, uniqueField);
    toInsert = arr.filter(r => !existing.has(r[uniqueField]));
    if (toInsert.length === 0) {
      console.log(`  ℹ ${table}: all ${arr.length} already exist, skipping`);
      return [];
    }
    if (toInsert.length < arr.length) {
      console.log(`  ℹ ${table}: ${arr.length - toInsert.length} already exist, inserting ${toInsert.length} new`);
    }
  }
  return doFetch(table, { method: 'POST', body: toInsert });
}

async function seed() {
  const now = new Date();
  const ts = (mins) => new Date(now.getTime() - mins * 60000).toISOString();

  console.log('🌱 Seeding HaloDepok database...\n');

  // --- Locations ---
  const locations = await upsert('locations', [
    { name: 'Depok', slug: 'jakarta-selatan', type: 'city', parent_id: null, metadata: {} },
    { name: 'Kemang', slug: 'kemang', type: 'district', parent_id: null, metadata: {} },
    { name: 'Kebayoran Baru', slug: 'kebayoran-baru', type: 'district', parent_id: null, metadata: {} },
    { name: 'Blok M', slug: 'blok-m', type: 'neighborhood', parent_id: null, metadata: {} },
    { name: 'Senayan', slug: 'senayan', type: 'district', parent_id: null, metadata: {} },
    { name: 'Pasar Minggu', slug: 'pasar-minggu', type: 'district', parent_id: null, metadata: {} },
    { name: 'Cipete', slug: 'cipete', type: 'district', parent_id: null, metadata: {} },
    { name: 'Ampera', slug: 'ampera', type: 'neighborhood', parent_id: null, metadata: {} },
    { name: 'Lebak Bulus', slug: 'lebak-bulus', type: 'neighborhood', parent_id: null, metadata: {} },
    { name: 'Radio Dalam', slug: 'radio-dalam', type: 'neighborhood', parent_id: null, metadata: {} },
  ]);
  console.log('  ✓ Locations:', locations.length);

  const loc = (name) => locations.find(l => l.name === name)?.id ?? null;

  // --- Sources ---
  const sources = await upsert('sources', [
    { name: 'Detik News', url: 'https://news.detik.com/feed', type: 'rss', category: 'media', reliability_score: 85, active: true, metadata: {} },
    { name: 'Kompas News', url: 'https://news.kompas.com/rss', type: 'rss', category: 'media', reliability_score: 90, active: true, metadata: {} },
    { name: 'Tribun News Jakarta', url: 'https://jakarta.tribunnews.com/rss', type: 'rss', category: 'media', reliability_score: 80, active: true, metadata: {} },
    { name: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/nasional/rss', type: 'rss', category: 'media', reliability_score: 88, active: true, metadata: {} },
    { name: 'BNPB Indonesia', url: 'https://bnpb.go.id/feed', type: 'rss', category: 'government', reliability_score: 95, active: true, metadata: {} },
    { name: 'BMKG Jakarta', url: 'https://www.bmkg.go.id/rss/jakarta.xml', type: 'rss', category: 'government', reliability_score: 98, active: true, metadata: {} },
    { name: 'Tempo News', url: 'https://nasional.tempo.co/rss', type: 'rss', category: 'media', reliability_score: 92, active: true, metadata: {} },
    { name: 'Antara News', url: 'https://www.antaranews.com/rss', type: 'rss', category: 'media', reliability_score: 90, active: true, metadata: {} },
  ], 'url');
  console.log('  ✓ Sources:', sources.length);

  // --- Stories ---
  const stories = await doFetchUpsert('stories', [
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Banjir di Kemang Kembali Meluap Setelah Hujan Deras 3 Jam — 12 Titik Genangan Dilaporkan',
      summary: 'Hujan deras mengguyur Depok lebih dari 3 jam menyebabkan banjir di Kemang. Tinggi air 30-50cm di beberapa titik.',
      status: 'content_ready',
      classification: 'urgent_review',
      importance_score: 88, locality_score: 95, novelty_score: 72, urgency_score: 90, risk_score: 75, commercial_score: 30,
      location_id: loc('Kemang'),
      first_seen_at: ts(15), last_updated_at: ts(5), published_at: null,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Macet Parah di Bundaran HI Arah Blok M Akibat Proyek Drainase — Alternate Route Disarankan',
      summary: 'Kemacetan parah terjadi di Bundaran HI arah Blok M akibat proyek drainase yang sedang berlangsung.',
      status: 'editor_review',
      classification: 'investigate',
      importance_score: 72, locality_score: 88, novelty_score: 65, urgency_score: 68, risk_score: 40, commercial_score: 20,
      location_id: loc('Senayan'),
      first_seen_at: ts(32), last_updated_at: ts(20), published_at: null,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'MRT Fase 2 Mencapai Progress 45% — Target Rampung 2027, Termasuk Stasiun Blok M',
      summary: 'Proyek MRT Fase 2 sudah 45% progress. Target rampung 2027 dengan stasiun Blok M dan Antasari.',
      status: 'published',
      classification: 'monitor',
      importance_score: 91, locality_score: 90, novelty_score: 55, urgency_score: 30, risk_score: 10, commercial_score: 50,
      location_id: loc('Blok M'),
      first_seen_at: ts(180), last_updated_at: ts(60), published_at: ts(60),
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      title: 'Grand Opening: Cafe Rooftop Garden di Kemang Mulai Besok — Warga Lokal Dirikan',
      summary: 'Cafe baru dengan konsep rooftop garden dan tanaman hijau grand opening besok di Jl. Kemang Raya.',
      status: 'verified',
      classification: 'draft',
      importance_score: 65, locality_score: 85, novelty_score: 80, urgency_score: 20, risk_score: 5, commercial_score: 85,
      location_id: loc('Kemang'),
      first_seen_at: ts(60), last_updated_at: ts(45), published_at: null,
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      title: 'Dinas LH Depok Klaim Kualitas Udara Membaik Setelah Hujan Deras — PM2.5 Turun Signifikan',
      summary: 'PM2.5 turun dari 45 menjadi 18 µg/m³ setelah hujan deras mengguyur Depok Senin sore.',
      status: 'investigating',
      classification: 'investigate',
      importance_score: 58, locality_score: 92, novelty_score: 70, urgency_score: 45, risk_score: 55, commercial_score: 10,
      location_id: loc('Depok'),
      first_seen_at: ts(120), last_updated_at: ts(60), published_at: null,
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      title: 'Pasaraya Grande Launches Kampanye Belanja Lokal — 50 Tenant Depok Berpartisipasi',
      summary: 'Pasaraya Grande Kebayoran launches кампанию untuk mendukung merchant lokal Depok dengan diskon hingga 40%.',
      status: 'published',
      classification: 'monitor',
      importance_score: 70, locality_score: 88, novelty_score: 60, urgency_score: 35, risk_score: 5, commercial_score: 90,
      location_id: loc('Kebayoran Baru'),
      first_seen_at: ts(300), last_updated_at: ts(240), published_at: ts(240),
    },
    {
      id: '77777777-7777-7777-7777-777777777777',
      title: 'Proyek Normalisasi Kali Pesanggrahan Dimulai Minggu Ini — Warga Harap Bisa Atasi Banjir',
      summary: 'Dinas SDA DKI Jakarta memulai proyek normalisasi Kali Pesanggrahan sepanjang 2.3km di Kebayoran Lama.',
      status: 'discovered',
      classification: 'investigate',
      importance_score: 75, locality_score: 85, novelty_score: 88, urgency_score: 55, risk_score: 50, commercial_score: 15,
      location_id: loc('Kebayoran Baru'),
      first_seen_at: ts(240), last_updated_at: ts(240), published_at: null,
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      title: 'Warga Ampera Keluhkan Drainase Tersumbat — Air Masuk Rumah Saat Hujan',
      summary: '12 rumah di Gang Melati, Jl. Ampera, kena genangan air hujan selama 2 jam karena saluran drainase tersumbat.',
      status: 'content_ready',
      classification: 'urgent_review',
      importance_score: 82, locality_score: 98, novelty_score: 75, urgency_score: 85, risk_score: 65, commercial_score: 20,
      location_id: loc('Pasar Minggu'),
      first_seen_at: ts(50), last_updated_at: ts(10), published_at: null,
    },
  ], null);
  console.log('  ✓ Stories:', stories.length);

  const story = (id) => stories.find(s => s.id === id)?.id ?? id;

  // --- Articles ---
  const articles = await doFetchUpsert('articles', [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      story_id: story('11111111-1111-1111-1111-111111111111'),
      title: 'Banjir di Kemang Kembali Meluap Setelah Hujan Deras 3 Jam — 12 Titik Genangan Dilaporkan',
      dek: 'Hujan deras 3+ jam picu banjir di Kemang. 12 titik genangan. Drainase bermasalah kronis.',
      summary: 'Hujan deras mengguyur Kemang lebih dari 3 jam. Tinggi air 30-50cm.',
      body: `Kemang, Depok — Hujan deras yang mengguyur kawasan Kemang dan sekitarnya selama lebih dari tiga jam pada Senin sore (7/9) menyebabkan banjir di sejumlah titik. Berdasarkan laporan warga dan pantauan langsung tim HaloDepok di lapangan, tinggi air di beberapa lokasi mencapai 30 hingga 50 centimeter, sehingga menyulitkan kendaraan kecil dan sepeda motor untuk melintas.

Titik-titik genangan dilaporkan muncul di sepanjang Jl. Kemang Raya (depan Pasar Kemang), Jl. Ampera (pertigaan arah Pasar Minggu), serta kawasan dalam perumahan Kemang Village dan Kemang Island. Air meluap dari saluran drainase yang tidak mampu menampung volume air hujan yang tinggi dalam waktu singkat.

## Lokasi Terdampak dan Kondisi di Lapangan

Kawasan Kemang, yang secara administratif masuk wilayah Kelurahan Kemang, Kecamatan Kebayoran Baru, Depok, merupakan salah satu area yang rawan banjir saat curah hujan tinggi. Ini bukan kali pertama warga setempat mengalami banjir di titik yang sama.

"Warga sudah sampaikan berkali-kali ke lurah dan camat bahwa drainase di sini perlu dinormalisasi," kata Andi Setiawan (42), warga Jl. Kemang Raya, kepada tim HaloDepok. "Tapi sampai sekarang belum ada perbaikan yang signifikan."

Pada pantauan pukul 14.45 WIB, air di badan jalan Jl. Kemang Raya sudah mulai surut setelah sebelumnya menutup separuh jalur. Namun di area sekitar saluran drainase di Gang Melati (samping Pasar Kemang), genangan masih cukup tinggi untuk menghalangi mobil kecil.

## Drainase: Masalah Akar yang Belum Teratasi

HaloDepok telah melaporkan masalah drainase di kawasan Kemang sejak 2021. Berdasarkan data dari Suku Dinas Sumber Daya Air (SDA) DKI Jakarta, saluran drainase di Jl. Kemang Raya memiliki kapasitas yang hanya mampu menangani curah hujan maksimal 50mm per hari. Pada Senin sore, curah hujan yang tercatat di Stasiun BMKG Lebak Bulus mencapai 78mm dalam tiga jam.

Hal ini menunjukkan bahwa infrastruktur drainase di kawasan tersebut sudah tidak mampu lagi menangani intensitas hujan yang semakin meningkat akibat perubahan iklim dan Urbanisasi yang padat di Depok.

## Respons Cepat Warga dan Komunitas

Saat banjir terjadi, sejumlah warga dan pemilik toko di sepanjang Jl. Kemang Raya mengambil inisiatif sendiri untuk membantu kelancaran lalu lintas. Beberapa warga menempatkan papan peringatan di titik genangan, sementara pemilik warung menyiapkan air mineral untuk pengemudi yang terkendala.

Komunitas motor besar yang biasa berkumpul di area Kemang juga turut membantu menghaluskan lalu lintas di pertigaan Ampera, tempat genangan paling parah terjadi.

## Upaya Pemerintah dan Potensi Solusi

HaloDepok telah menghubungi pihak Kelurahan Kemang dan Kecamatan Kebayoran Baru untuk konfirmasi. Warga berharap pemerintah kota segera menurunkan tim untuk memeriksa kondisi drainase dan melakukan pengerukan lumpur yang menutupi saluran.

LaporJakarta, aplikasi pelaporan warga yang terintegrasi dengan pemerintah kota, mencatat 14 laporan terkait genangan air di kawasan Kemang dalam tiga bulan terakhir. Dari jumlah tersebut, 8 laporan berstatus "dalam penanganan" dan 6 lainnya "menunggu anggaran."

## Prakiraan Cuaca dan Imbauan BMKG

BMKG Jakarta dalam prakiraannya untuk Senin malam menyebutkan bahwa cuaca cerah hingga berawan diprakirakan terjadi setelah hujan deras berhenti. Namun BMKG juga mengingatkan warga Depok untuk tetap waspada terhadap potensi banjir bandang di area langganan.

## Dampak Ekonomi terhadap Pedagang Lokal

Banjir di Kemang tidak hanya mengganggu mobilitas warga, tetapi juga berdampak langsung pada aktivitas perdagangan di kawasan tersebut. Pasar Kemang mengalami penurunan kunjungan signifikan selama banjir berlangsung.

## Fakta dan Angka Penting

- Durasi hujan deras: 3+ jam
- Curah hujan (BMKG Lebak Bulus): 78mm/3 jam
- Jumlah titik genangan: 12 titik (laporan warga)
- Tinggi air: 30-50cm
- Warga terdampak: Sekitar 2.000+ rumah tangga
- Kapasitas drainase: 50mm/hari (design spec)

HaloDepok akan terus memantau perkembangan situasi dan memperbarui berita ini sesuai kebutuhan. Warga yang memiliki informasi tambahan dapat menghubungi tim HaloDepok via WhatsApp.`,
      sources_section: '• Warga Kemang via WhatsApp, 14:30 WIB\n• Pantauan Langsung Tim HaloDepok, 14:45–15:15 WIB\n• BMKG Jakarta — Data Curah Hujan Stasiun Lebak Bulus\n• Dinas SDA DKI Jakarta — Data Kapasitas Drainase 2019-2024',
      status: 'draft',
      generated_by: 'AI Content Factory',
      prompt_version: 'v1',
      created_at: ts(5), updated_at: ts(5),
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      story_id: story('22222222-2222-2222-2222-222222222222'),
      title: 'Macet Parah di Bundaran HI Arah Blok M Akibat Proyek Drainase',
      dek: 'Proyek drainase Bundaran HI picu kemacetan parah arah Blok M.',
      summary: 'Kemacetan parah di Bundaran HI arah Blok M akibat proyek drainase.',
      body: `Senayan, Depok — Proyek drainase yang sedang dikerjakan di kawasan Bundaran HI sejak seminggu lalu menyebabkan kemacetan parah di jalur arah Blok M pada jam sibuk Senin pagi.

Proyek ini merupakan bagian dari program normalisasi saluran air di kawasan Senayan dan Kebayoran yang digelontorkan oleh Dinas SDA DKI Jakarta dengan anggaran sebesar Rp 8,2 miliar.

Menurut saksi mata di lokasi, kemacetan mulai terasa sejak pukul 07.00 WIB dan baru mulai melancar setelah pukul 09.30 WIB. Panjang antrean kendaraan mencapai sekitar 1,5 kilometer.

Alternate route yang disarankan oleh pihak Dishub DKI Jakarta adalah melalui Jl. Sudirman ke arah Semanggi, lalu belok kanan ke Jl. Patal Senayan, atau via Jl. Pattimura.

HaloDepok telah menghubungi pihak Dishub DKI Jakarta untuk konfirmasi dan akan memperbarui berita ini.`,
      sources_section: '• Saksi mata di lokasi\n• Dinas SDA DKI Jakarta\n• Dishub DKI Jakarta',
      status: 'draft',
      generated_by: 'AI Content Factory',
      prompt_version: 'v1',
      created_at: ts(20), updated_at: ts(20),
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      story_id: story('33333333-3333-3333-3333-333333333333'),
      title: 'MRT Fase 2 Mencapai Progress 45% — Target Rampung 2027',
      dek: 'MRT Fase 2 progress 45%, target rampung 2027. Stasiun Blok M included.',
      summary: 'MRT Jakarta Fase 2 reaches 45% progress, target completion 2027.',
      body: `Jakarta — Proyek Mass Rapid Transit (MRT) Jakarta Fase 2 mengalami kemajuan signifikan dengan progress konstruksi yang sudah mencapai 45% hingga akhir Agustus 2026.

Fase 2 ini akan menghubungkan Bundaran HI dengan Kota Tua melalui 11 stasiun baru, termasuk stasiun Blok M dan Antasari yang sangat ditunggu warga Depok.

PT MRT Jakarta (Perseroda) menargetkan seluruh konstruksi Fase 2 rampung pada akhir 2027, sehingga bisa beroperasi penuh pada 2028. Investasi total untuk Fase 2 ini mencapai Rp 26,6 triliun.

Stasiun Blok M akan terintegrasi dengan terminal bus Blok M dan menjadi salah satu simpul transportasi terbesar di Depok, menghubungkan penumpang dari Lebak Bulus, Antasari, dan Blok M dalam satu titik transit terpadu.`,
      sources_section: '• PT MRT Jakarta (Perseroda)\n• Dinas Perhubungan DKI Jakarta\n• Wawancara Fidrianus, Direktur Utama PT MRT Jakarta',
      status: 'published',
      generated_by: 'AI Content Factory',
      prompt_version: 'v1',
      created_at: ts(60), updated_at: ts(60),
    },
  ], 'id');
  console.log('  ✓ Articles:', articles.length);

  // --- Social Contents ---
  const socials = await upsert('social_contents', [
    {
      story_id: story('11111111-1111-1111-1111-111111111111'),
      article_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      format: 'tiktok',
      body: `[OPEN on aerial shot of Jl. Kemang Raya with water level rising]\n\n[NARRATOR]: "Banjir Kemang lagi. Sudah tiga jam hujan deras mengguyur Depok. Air di Jl. Kemang Raya — depan Pasar Kemang — sudah 40 centimeter. Motor sulit lewat. Titik paling parah di pertigaan Ampera."\n\n[NARRATOR]: "Drainase di sini emang jadi masalah kronis. Warga udah bilang berkali-kali. Tapi sampai sekarang belum ada perbaikan berarti."\n\n[ON SCREEN TEXT]: "KEMANG, HALODEPOK · SENIN SIANG"\n"Tinggi air: 30-50cm"\n"12 titik genangan"\n"HaloDepok — Hyperlocal News Depok"\n\n[CLOSING]: "Stay safe, warga Depok. Jangan paksakan kalau air udah di atas roda. Info terbaru di halodepok.id."`,
      status: 'draft',
      generated_by: 'AI Content Factory',
      prompt_version: 'v1',
    },
    {
      story_id: story('11111111-1111-1111-1111-111111111111'),
      article_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      format: 'instagram_carousel',
      body: `Slide 1: 🚨 BANJIR KEMANG\n\nHujan deras 3+ jam picu genangan 30-50cm di Kemang, Depok.\n\nSlide 2: 📍 TITIK GENANGAN\n\nJl. Kemang Raya · Jl. Ampera · Kemang Village\nTotal: 12 titik genangan\n\nSlide 3: 🗺 ALTERNATE ROUTE\n\nHindari Jl. Kemang arah Ampera.\nGunakan: Jl. Radio Dalam / Jl. Warung Buncit / Jl. Cipete Raya\n\nSlide 4: 💧 PENYEBAB\n\nDrainase Kemang tidak mampu tampung volume hujan (78mm/3 jam). Kapasitas: 50mm/hari.\n\nSlide 5: ✅ APA YANG BISA DILAKUKAN\n\n🚫 Hindari Jl. Kemang arah Ampera\n📱 Laporkan via Jakartan\n🌧 Monitor BMKG\n📰 halodepok.id`,
      status: 'draft',
      generated_by: 'AI Content Factory',
      prompt_version: 'v1',
    },
    {
      story_id: story('11111111-1111-1111-1111-111111111111'),
      article_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      format: 'x_post',
      body: `🚨 BANJIR KEMANG, HALODEPOK\n\nHujan deras 3+ jam picu banjir di Kemang. Air 30-50cm di Jl. Kemang Raya & Ampera. 12 titik genangan.\n\n⚠ Motor sulit lewat. Alternate route: Jl. Radio Dalam / Jl. Warung Buncit.\n\n💧 Drainase Kemang bermasalah kronis.\n\n📍 Kemang, Depok · halodepok.id`,
      status: 'published',
      generated_by: 'AI Content Factory',
      prompt_version: 'v1',
    },
    {
      story_id: story('33333333-3333-3333-3333-333333333333'),
      article_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      format: 'x_post',
      body: `🚇 MRT FASE 2\n\nProgress 45%! Target rampung 2027.\n\nStasiun baru: Blok M & Antasari.\nDepok makin dekat dengan transportasi massal.\n\n📍 Depok · halodepok.id`,
      status: 'published',
      generated_by: 'AI Content Factory',
      prompt_version: 'v1',
    },
  ], 'id');
  console.log('  ✓ Social contents:', socials.length);

  // --- Claims ---
  const claims = await upsert('claims', [
    { story_id: story('11111111-1111-1111-1111-111111111111'), claim_text: 'Tinggi air 30–50cm di Jl. Kemang Raya', claim_type: 'fact', confidence: 92, verification_status: 'verified', evidence_count: 2 },
    { story_id: story('11111111-1111-1111-1111-111111111111'), claim_text: 'Hujan deras 3+ jam mengguyur Depok', claim_type: 'event', confidence: 95, verification_status: 'verified', evidence_count: 3 },
    { story_id: story('11111111-1111-1111-1111-111111111111'), claim_text: '12 titik genangan di Kemang', claim_type: 'fact', confidence: 78, verification_status: 'partially_verified', evidence_count: 1 },
    { story_id: story('11111111-1111-1111-1111-111111111111'), claim_text: 'Curah hujan 78mm/3 jam (BMKG)', claim_type: 'fact', confidence: 98, verification_status: 'verified', evidence_count: 1 },
  ], 'id');
  console.log('  ✓ Claims:', claims.length);

  // --- SEO ---
  const seo = await upsert('seo_metadata', [
    { content_id: story('11111111-1111-1111-1111-111111111111'), content_type: 'story', seo_title: 'Banjir Kemang Hari Ini: 12 Titik Genangan, Air 30-50cm', meta_description: 'Banjir melanda Kemang Depok setelah hujan deras 3 jam. 12 titik genangan, tinggi air 30-50cm. Alternate route dan info lengkap.', slug: 'banjir-kemang-depok-2026', keywords: ['banjir kemang','banjir depok','banjir jakarta selatan','genangan kemang','drainase kemang'] },
  ], 'content_id');
  console.log('  ✓ SEO records:', seo.length);

  // --- E-E-A-T ---
  const eeat = await upsert('eeat_scores', [
    { content_id: story('11111111-1111-1111-1111-111111111111'), experience_score: 85, expertise_score: 80, authoritativeness_score: 78, trustworthiness_score: 88, overall_score: 83, recommendations: ['Tambah kutipan langsung dari warga', 'Verifikasi jumlah pasti titik genangan'] },
  ], 'content_id');
  console.log('  ✓ E-E-A-T scores:', eeat.length);

  // --- Citizen Reports ---
  const citizens = await upsert('citizen_reports', [
    { category: 'flood', text: 'Ada genangan air besar di perempatan Jl. Ampera arah Pasar Minggu. Tinggi air ~30cm, motor sulit lewat. Drainase tersumbat dedaunan.', location_text: 'Jl. Ampera, Pasar Minggu, Depok', location_id: loc('Ampera'), moderation_status: 'pending', confidence: 82, moderation_notes: null, submitted_at: ts(10), metadata: { reporter_name: 'Andi S.', source: 'Twitter' } },
    { category: 'infrastructure', text: 'Lampu jalan mati di sepanjang Jl. Radio Dalam Raya sudah 3 hari. Sangat gelap malam hari, terasa tidak aman untuk pejalan kaki.', location_text: 'Jl. Radio Dalam Raya, Depok', location_id: loc('Radio Dalam'), moderation_status: 'pending', confidence: 90, moderation_notes: null, submitted_at: ts(25), metadata: { reporter_name: 'Ratna W.', source: 'Instagram DM' } },
    { category: 'traffic', text: 'Macet parah di Bundaran HI arah Blok M sudah 1 jam. Proyek drainase memakan badan jalan.', location_text: 'Bundaran HI, Depok', location_id: loc('Senayan'), moderation_status: 'approved', confidence: 95, moderation_notes: null, submitted_at: ts(40), metadata: { reporter_name: 'Budi L.', source: 'WhatsApp' } },
    { category: 'event', text: 'Pohon tumbang menutup setengah badan Jl. Kebayoran Baru setelah hujan deras semalam. Pihak terkait sudah ditangani.', location_text: 'Jl. Kebayoran Baru, Depok', location_id: loc('Kebayoran Baru'), moderation_status: 'rejected', confidence: 60, moderation_notes: 'Sudah ditangani, tidak perlu dipublish', submitted_at: ts(180), metadata: { reporter_name: 'Dedi K.', source: 'Form Website' } },
  ], 'id');
  console.log('  ✓ Citizen reports:', citizens.length);

  console.log('\n✅ Seed complete!');
  console.log(`   ${stories.length} stories  |  ${articles.length} articles  |  ${socials.length} social  |  ${citizens.length} citizen reports`);
  console.log(`   Live at: https://halodepok-content-factory-ah7c0ua1h-rectoverso-media.vercel.app/admin/article`);
}

seed().catch(e => {
  console.error('\n❌ Seed failed:', e.message);
  process.exit(1);
});
