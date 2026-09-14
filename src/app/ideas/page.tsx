'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight, Copy, Check, Zap } from 'lucide-react';

interface Idea {
  id: string;
  category: string;
  title: string;
  description: string;
  geoKeywords: string[];
  sampleKeywords: string[];
}

const ALL_IDEAS: Idea[] = [
  {
    id: 'dokter-anak',
    category: 'Kesehatan & Keluarga',
    title: 'Dokter Anak di Depok',
    description: 'Daftar lengkap dokter anak terbaik di sekitar Antasari, Margonda, Beji, Sawangan. Lengkap dengan jam praktik, nomor telepon, dan review dari warga.',
    geoKeywords: ['dokter anak depok', 'dokter anak margonda', 'dokter anak antasari', 'klinik anak depok'],
    sampleKeywords: ['dokter anak depok rekom', 'dokter anak margonda 24 jam', 'dokter anak depok dekat'],
  },
  {
    id: 'cafe-depok',
    category: 'Kuliner',
    title: 'Spot Ngopi Hits di Depok',
    description: 'Dari kopi susu Rp15rb sampe specialty coffee, dari vibes industrial-garden sampe minimalist. Daftar cafe yang lagi rame dan worth it buat nongkrong.',
    geoKeywords: ['cafe depok', 'coffee shop depok', 'cafe margonda', 'cafe antasari', 'cafe kemang'],
    sampleKeywords: ['cafe depok aesthetic', 'cafe depok murah', 'coffee shop margonda', 'cafe 24 jam depok'],
  },
  {
    id: 'sekolah-depok',
    category: 'Pendidikan',
    title: 'Sekolah & Jenjang Pendidikan di Depok',
    description: 'Guide lengkap TK, SD, SMP, SMA di sekitar Margonda, Kemang, Beji. Dari negeri-negeri, plus opsi internasional dan homeschool.',
    geoKeywords: ['sekolah depok', 'sd depok', 'smp depok', 'sma depok', 'sekolah depok margonda'],
    sampleKeywords: ['sekolah bagus di depok', 'sd negeri depok', 'sma favorit depok', 'sekolah internasional depok'],
  },
  {
    id: 'gym-depok',
    category: 'Fitness & Wellness',
    title: 'Gym & Fitness Center di Depok',
    description: 'Dari budget gym Rp150rb/bulan sampe premium fitness center dengan pool. Complete guide gym di Antasari, TB Simatupang, Margonda, Kemang.',
    geoKeywords: ['gym depok', 'fitness center depok', 'gym antasari', 'gym margonda', 'fitness depok'],
    sampleKeywords: ['gym murah depok', 'fitness center depok', 'gym 24 jam depok', 'gym dengan pool depok'],
  },
  {
    id: 'klinik-kecantikan',
    category: 'Lifestyle',
    title: 'Klinik Kecantikan & Skincare di Depok',
    description: 'Rekomendasi klinik kecantikan, dermatolog, dan skincare clinic di sekitar Kemang, Antasari, Cipete, Margonda. Treatment info, harga estimate, dan review.',
    geoKeywords: ['klinik kecantikan depok', 'dermatolog depok', 'skincare clinic kemang', 'beauty clinic antasari'],
    sampleKeywords: ['klinik kecantikan depok rekom', 'dermatolog depok', 'facial depok', 'skincare clinic margonda'],
  },
  {
    id: 'taman-anak',
    category: 'Kesehatan & Keluarga',
    title: 'Taman & Tempat Main Anak di Depok',
    description: 'Taman kota, playground, indoor playground, sampe tempat wisata keluarga yang oke buat weekend. Complete guide buat warga yang bingung bawa anak kemana.',
    geoKeywords: ['taman depok', 'tempat main anak depok', 'indoor playground depok', 'taman kota depok'],
    sampleKeywords: ['taman anak depok', 'playground depok', 'tempat main anak margonda', 'weekend keluarga depok'],
  },
  {
    id: 'servis-mobil',
    category: 'Tips & How-To',
    title: 'Bengkel & Servis Mobil Terpercaya di Depok',
    description: 'Bengkel resmi dan umum, dari service ringan sampe overhaul. Termasuk rekomendasi montir yang jujur dan tempat yang gak markup parah.',
    geoKeywords: ['bengkel depok', 'servis mobil depok', 'bengkel mobil depok', 'montir depok', 'bengkel margonda'],
    sampleKeywords: ['bengkel depok rekom', 'servis mobil margonda', 'bengkel jujur depok', 'montir mobil depok'],
  },
  {
    id: 'pasar-malam',
    category: 'Kuliner',
    title: 'Pasar Malam & Street Food Hits di Depok',
    description: 'Dari jajanan Rp5rb sampe dinner Rp50rb. Guide pasar malam, food street, dan night market yang lagi rame di kawasan.',
    geoKeywords: ['pasar malam depok', 'street food depok', 'kuliner malam depok', 'food street depok', 'night market depok'],
    sampleKeywords: ['pasar malam margonda', 'street food depok', 'kuliner malam depok', 'night market depok'],
  },
  {
    id: 'kursus-ekskul',
    category: 'Pendidikan',
    title: 'Kursus & Ekskul Anak di Depok',
    description: 'Bimbel, les musik, les bahasa, swimming, robotics — dari yang murah sampe premium. Guide comparison buat ortu yang milih.',
    geoKeywords: ['les privat depok', 'bimbel depok', 'kursus anak depok', 'les musik depok', 'ekskul depok'],
    sampleKeywords: ['bimbel depok murah', 'les privat depok', 'kursus anak margonda', 'bimbel sbmptn depok'],
  },
  {
    id: 'padel-tenis',
    category: 'Fitness & Wellness',
    title: 'Lapangan Padel & Tenis di Depok',
    description: 'Complete guide lapangan padel dan tenis. Dari Rp49rb/hour sampe premium. Termasuk review, rating Google, dan tips booking.',
    geoKeywords: ['lapangan padel depok', 'padel depok', 'court padel depok', 'tennis depok', 'lapangan tennis depok'],
    sampleKeywords: ['padel depok murah', 'book court padel depok', 'padel margonda', 'tennis club depok'],
  },
];

const CATEGORIES = [
  'All Topics',
  'Kuliner',
  'Kesehatan & Keluarga',
  'Lifestyle',
  'Fitness & Wellness',
  'Lingkungan',
  'Tips & How-To',
  'Properti',
  'Komunitas',
];

function DotsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
        background: 'linear-gradient(180deg, #faf8ff 0%, #f5f3ff 100%)',
      }}
    />
  );
}

export default function IdeasPage() {
  const [activeCategory, setActiveCategory] = useState('All Topics');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = activeCategory === 'All Topics'
    ? ALL_IDEAS
    : ALL_IDEAS.filter(i => i.category === activeCategory);

  const copyKeyword = (kw: string, id: string) => {
    navigator.clipboard.writeText(kw).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Dots background */}
      <DotsCanvas />

      {/* Top gradient */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 320,
        background: 'linear-gradient(180deg, rgba(168,85,247,0.06) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '14px 32px',
          background: 'rgba(250,248,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168,85,247,0.08)',
        }}>
          <img src="/logo.png" alt="HaloDepok" style={{ height: 80, width: 'auto', objectFit: 'contain' }} />
        </header>

        {/* Hero */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 24px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 16,
          }}>
            Content Ideas
          </h1>
          <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 0, fontWeight: 500 }}>
            Evergreen ideas untuk HaloDepok — GEO & SEO strong
          </p>
        </div>

        {/* Evergreen explanation box */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 32px' }}>
          <div style={{
            background: '#fef9c3',
            border: '1px solid #fde047',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: '#facc15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1,
            }}>
              <Lightbulb size={18} color="white" />
            </div>
            <div>
              <p style={{ fontSize: 13, color: '#713f12', fontWeight: 700, margin: '0 0 4px' }}>
                Apa Itu Evergreen Content?
              </p>
              <p style={{ fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.65 }}>
                Topik yang relevance-nya stabil sepanjang tahun — bukan breaking news.
                Contoh: &ldquo;Dokter Anak di Depok&rdquo;, &ldquo;Spot Ngopi Margonda&rdquo;, &ldquo;Sekolah Favorit di Kemang&rdquo;.
                Rekomendasi ChatGPT & Gemini. Sering dicari warga. Traffic stabil.
              </p>
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 32px' }}>
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                fontSize: 13, fontWeight: 600,
                padding: '9px 20px',
                borderRadius: 9999,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: activeCategory === cat ? 'none' : '1.5px solid #e5e7eb',
                background: activeCategory === cat
                  ? 'linear-gradient(135deg, #a855f7, #7e22ce)'
                  : 'white',
                color: activeCategory === cat ? 'white' : '#64748b',
                boxShadow: activeCategory === cat
                  ? '0 4px 20px rgba(168,85,247,0.35)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(idea => (
              <div key={idea.id} style={{
                background: 'white',
                border: '1.5px solid #f0f0f0',
                borderRadius: 20,
                padding: '24px 26px 22px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(168,85,247,0.12)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#f0f0f0';
                }}
              >
                {/* Top row: category + generate */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#a855f7',
                    background: 'rgba(168,85,247,0.08)',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    letterSpacing: '0.03em',
                    border: '1px solid rgba(168,85,247,0.2)',
                  }}>
                    {idea.category}
                  </span>
                  <Link
                    href={`/create?keyword=${encodeURIComponent(idea.sampleKeywords[0])}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 12, fontWeight: 700, color: '#a855f7',
                      textDecoration: 'none',
                      padding: '6px 14px',
                      borderRadius: 9999,
                      background: 'rgba(168,85,247,0.07)',
                      border: '1px solid rgba(168,85,247,0.2)',
                      transition: 'all 0.2s',
                    }}
                  >
                    Generate <ArrowRight size={12} />
                  </Link>
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: 16, fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: 8,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}>
                  {idea.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: 13, color: '#64748b',
                  lineHeight: 1.7,
                  marginBottom: 14,
                }}>
                  {idea.description}
                </p>

                {/* Keywords */}
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}>
                    Keywords
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {idea.sampleKeywords.map((kw, i) => (
                      <button
                        key={i}
                        onClick={() => copyKeyword(kw, `${idea.id}-${i}`)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 12, padding: '5px 12px',
                          borderRadius: 9999,
                          background: copiedId === `${idea.id}-${i}`
                            ? 'rgba(34,197,94,0.1)'
                            : 'rgba(37,99,235,0.06)',
                          border: `1.5px solid ${copiedId === `${idea.id}-${i}` ? 'rgba(34,197,94,0.3)' : 'rgba(37,99,235,0.15)'}`,
                          color: copiedId === `${idea.id}-${i}` ? '#16a34a' : '#2563eb',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontWeight: 500,
                        }}
                      >
                        {copiedId === `${idea.id}-${i}` ? <Check size={11} /> : null}
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{
            textAlign: 'center',
            marginTop: 48,
            padding: '36px 32px',
            background: 'white',
            border: '1.5px solid #f0f0f0',
            borderRadius: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
            }}>
              <Zap size={22} color="white" />
            </div>
            <p style={{
              fontSize: 15, fontWeight: 700,
              color: '#0f172a',
              marginBottom: 6,
              letterSpacing: '-0.01em',
            }}>
              Generate Sekarang!
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
              Pilih topic di atas, klik Generate — atau ketik keyword sendiri di bawah.
            </p>
            <Link
              href="/create"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 36px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white',
                fontSize: 15, fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(249,115,22,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 12px 40px rgba(249,115,22,0.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px rgba(249,115,22,0.35)';
              }}
            >
              <Zap size={16} />
              Buka Content Factory
            </Link>
          </div>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
