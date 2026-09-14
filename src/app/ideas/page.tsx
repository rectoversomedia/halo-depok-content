'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight, Search, TrendingUp, Copy, Check, ExternalLink } from 'lucide-react';

interface Idea {
  id: string;
  category: string;
  color: string;
  title: string;
  description: string;
  whyStrong: string;
  geoKeywords: string[];
  sampleKeywords: string[];
}

const IDEAS: Idea[] = [
  {
    id: 'dokter-anak',
    category: 'Kesehatan',
    color: '#ef4444',
    title: 'Dokter Anak di Depok — Rekomendasi & Tips',
    description: 'Daftar lengkap dokter anak terbaik di sekitar Antasari, Margonda, Beji, Sawangan. Lengkap dengan jam praktik, nomor telepon, dan review dari warga.',
    whyStrong: 'Orang tua muda di Depok actively search untuk "dokter anak terdekat" dan "dokter anak reco". Topic ini consistently tinggi impresi dan bisa diperkuat dengan Google Business optimization.',
    geoKeywords: ['dokter anak depok', 'dokter anak antasari', 'dokter anak margonda', 'dokter anak Beji', 'dokter anak Sawangan', 'klinik anak depok', 'rs depok'],
    sampleKeywords: ['dokter anak depok rekom', 'dokter anak margonda 24 jam', 'dokter anak jakarta selatan dekat depok'],
  },
  {
    id: 'sekolah-depok',
    category: 'Pendidikan',
    color: '#f59e0b',
    title: 'Sekolah & Jenjang Pendidikan di Depok',
    description: 'Guide lengkap TK, SD, SMP, SMA di sekitar Margonda, Kemang, Beji. Dari negeri到negeri, plus opsi internasional dan homeschool.',
    whyStrong: 'Orang tua search "sekolah di depok", "sekolah bagus depok", "sd bagus depok". Guide comparison like this outperforms single-school pages karena satisfy multiple search intent.',
    geoKeywords: ['sekolah depok', 'sd depok', 'smp depok', 'sma depok', 'sekolah depok margonda', 'sekolah jakarta selatan dekat depok'],
    sampleKeywords: ['sekolah bagus di depok', 'sd negeri depok', 'sma favorit depok', 'sekolah internasional depok'],
  },
  {
    id: 'cafe-depok',
    category: 'Kuliner',
    color: '#22c55e',
    title: 'Cafe & Coffee Shop Hits di Jaksel & Depok',
    description: 'Dari kopi susu Rp15rb sampai specialty coffee, dari vibes industrial到garden. Daftar cafe yang lagi rame dan worth it buat nongkrong.',
    whyStrong: 'Kuliner Jaksel adalah highest search volume category di kawasan. "Cafe depok", "cafe jaksel", "coffee shop jakarta selatan" — consistent monthly search. Strong UGC (user generated content) synergy.',
    geoKeywords: ['cafe depok', 'coffee shop depok', 'cafe jaksel', 'cafe margonda', 'cafe antasari', 'cafe kemang', 'coffee shop jakarta selatan'],
    sampleKeywords: ['cafe depok aesthetic', 'cafe depok murah', 'cafe jaksel vibes', 'coffee shop margonda', 'cafe 24 jam depok'],
  },
  {
    id: 'klinik-kecantikan',
    category: 'Beauty',
    color: '#ec4899',
    title: 'Klinik Kecantikan & Skincare di Jaksel & Depok',
    description: 'Rekomendasi klinik kecantikan, dermatolog, dan skincare clinic di sekitar Kemang, Antasari, Cipete, Margonda. Treatment info, harga estimate, dan review.',
    whyStrong: '"Klinik kecantikan depok" dan "skincare clinic jaksel" high commercial intent — user udah siap booking. Strong affiliate dan partnership potential.',
    geoKeywords: ['klinik kecantikan depok', 'klinik kecantikan jaksel', 'dermatolog depok', 'skincare clinic kemang', 'beauty clinic antasari'],
    sampleKeywords: ['klinik kecantikan depok rekom', 'dermatolog jaksel', 'facial depok', 'skincare clinic margonda'],
  },
  {
    id: 'fitnes-gym',
    category: 'Olahraga',
    color: '#3b82f6',
    title: 'Gym & Fitness Center di Jaksel & Depok',
    description: 'Dari budget gym Rp150rb/bulan sampai premium fitness center dengan pool. Complete guide gym di Antasari, TB Simatupang, Margonda, Kemang.',
    whyStrong: '"Gym terdekat", "fitness center depok", " gym jaksel" high intent. Strong recurring revenue potential (membership partnerships).',
    geoKeywords: ['gym depok', 'fitness center depok', 'gym jaksel', 'gym antasari', 'gym margonda', 'fitness jaksel', 'tempat gym dekat depok'],
    sampleKeywords: ['gym murah depok', 'fitness center jaksel', 'gym 24 jam depok', 'gym dengan pool jaksel'],
  },
  {
    id: 'servis-mobil',
    category: 'Otomotif',
    color: '#64748b',
    title: 'Bengkel & Servis Mobil Terpercaya di Depok',
    description: 'Bengkel resmi dan umum, dari service ringan到overhaul. Termasuk rekomendasi montir yang jujur dan tempat yang gak markup parah.',
    whyStrong: 'High intent search, car owners actively mencari bengkel terpercaya. Strong local SEO karena location-specific. UGC dari pengalaman nyata warga.',
    geoKeywords: ['bengkel depok', 'servis mobil depok', 'bengkel mobil jaksel', 'montir depok', 'bengkel antasari', 'bengkel margonda'],
    sampleKeywords: ['bengkel depok rekom', 'servis mobil margonda', 'bengkel jujur depok', 'montir mobil jaksel'],
  },
  {
    id: 'klinik-gigi',
    category: 'Kesehatan',
    color: '#06b6d4',
    title: 'Dokter Gigi & Klinik Gigi di Jaksel & Depok',
    description: 'Scaling, tambal, behel, sampai veneer. Rekomendasi dokter gigi dengan harga reasonable dan tempat yang gak bikin nunggu 3 jam.',
    whyStrong: 'Dental services high commercial intent. "Dokter gigi depok" dan "klinik gigi jaksel" consistent searches. Strong local pack ranking potential.',
    geoKeywords: ['dokter gigi depok', 'klinik gigi jaksel', 'dokter gigi margonda', 'behel depok', 'dokter gigi antasari', ' Veneer depok'],
    sampleKeywords: ['dokter gigi depok murah', 'klinik gigi jaksel rekom', 'scaling depok', 'behel jaksel'],
  },
  {
    id: 'taman-hiburan',
    category: 'Family',
    color: '#8b5cf6',
    title: 'Taman & Tempat Main Anak di Jaksel & Depok',
    description: 'Taman kota, playground, indoor playground, sampai tempat wisata keluarga yang oke buat weekend. Complete guide buat warga yang bingung bawa anak kemana.',
    whyStrong: '"Tempat main anak depok", "taman anak jaksel" high volume, especially weekend. Strong family demographic targeting. Consistent evergreen traffic.',
    geoKeywords: ['taman depok', 'tempat main anak depok', 'indoor playground jaksel', 'taman kota jakarta selatan', 'weekend depok keluarga'],
    sampleKeywords: ['taman anak depok', 'playground jaksel', 'tempat main anak margonda', 'weekend keluarga depok'],
  },
  {
    id: 'kursus-ekskul',
    category: 'Pendidikan',
    color: '#f97316',
    title: 'Kursus & Ekskul Anak di Jaksel & Depok',
    description: 'Bimbel, les musik, les bahasa, swimming, robotics — dari yang murah sampai premium. Guide comparison buat ortu yang milih.',
    whyStrong: 'Orang tua actively search kursus dan ekskul. "Les privat depok", "bimbel jaksel" high volume. Strong school-to-program referral traffic.',
    geoKeywords: ['les privat depok', 'bimbel jaksel', 'kursus anak depok', 'les musik depok', 'ekskul depok', 'bimbel margonda'],
    sampleKeywords: ['bimbel depok murah', 'les privat jaksel', 'kursus anak margonda', 'bimbel sbmptn depok'],
  },
  {
    id: 'rumah-sakit',
    category: 'Kesehatan',
    color: '#dc2626',
    title: 'Rumah Sakit & Fasilitas Kesehatan di Jaksel & Depok',
    description: 'Daftar RS, klinik, dan IGD 24 jam di sekitar Antasari, Margonda, Beji, Kemang, Cipete. Info layanan, nomor telepon, dan estimasi biaya.',
    whyStrong: '"Rs depok", "igd 24 jam depok", "rumah sakit jaksel" emergency searches — highest trust needed. Strong local SEO + structured data opportunity.',
    geoKeywords: ['rumah sakit depok', 'igd depok', 'rs jaksel', 'klinik 24 jam depok', 'rumah sakit antasari', 'fasilitas kesehatan margonda'],
    sampleKeywords: ['rs depok 24 jam', 'igd terdekat depok', 'rumah sakit jakarta selatan', 'klinik margonda'],
  },
  {
    id: 'padel-tenis',
    category: 'Olahraga',
    color: '#16a34a',
    title: 'Lapangan Padel & Tenis di Jaksel & Depok',
    description: 'Complete guide lapangan padel dan tenis. Dari Rp49rb/hour sampai premium. Termasuk review, rating Google, dan tips booking.',
    whyStrong: 'Padel exploding di Jakarta dan Depok. "Lapangan padel depok", "padel jaksel" trending topic. Very low competition yet, strong first-mover advantage.',
    geoKeywords: ['lapangan padel depok', 'padel jaksel', 'padel jakarta selatan', 'court padel depok', 'tennis jaksel', 'lapangan tennis depok'],
    sampleKeywords: ['padel depok murah', 'book court padel jaksel', 'padel margonda', 'tennis club depok'],
  },
  {
    id: 'pasar-malam',
    category: 'Kuliner',
    color: '#ca8a04',
    title: 'Pasar Malam & Street Food Hits di Jaksel & Depok',
    description: 'Dari jajanan Rp5rb sampai dinner Rp50rb. Guide pasar malam, food street, dan night market yang lagi rame di kawasan.',
    whyStrong: '"Pasar malam depok", "street food jaksel" high UGC potential. TikTok, Instagram, dan Google Maps synergy strong. Evergreen + seasonal spikes.',
    geoKeywords: ['pasar malam depok', 'street food jaksel', 'kuliner malam depok', 'food street jakarta selatan', 'night market depok'],
    sampleKeywords: ['pasar malam margonda', 'street food depok', 'kuliner malam jaksel', 'night market depok'],
  },
];

const CATEGORIES = ['Semua', 'Kesehatan', 'Pendidikan', 'Kuliner', 'Beauty', 'Olahraga', 'Otomotif', 'Family'];

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 2.5 + 0.8, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.3 + 0.1, opacityDir: Math.random() > 0.5 ? 1 : -1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.opacity += p.opacityDir * 0.004;
        if (p.opacity > 0.45) p.opacityDir = -1;
        if (p.opacity < 0.04) p.opacityDir = 1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,85,247,${p.opacity})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

export default function IdeasPage() {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = activeCategory === 'Semua'
    ? IDEAS
    : IDEAS.filter(i => i.category === activeCategory);

  const copyKeyword = (kw: string, id: string) => {
    navigator.clipboard.writeText(kw).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'DM Sans', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>
      <ParticleCanvas />
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(126,34,206,0.08) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Sticky Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 32px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="HaloDepok" style={{ height: 108, width: 'auto', objectFit: 'contain' }} />
        </Link>
      </header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 9999, padding: '6px 16px', marginBottom: 20 }}>
            <Lightbulb size={14} color="#a855f7" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Evergreen & Trending Content</span>
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 12 }}>
            Content Ideas — Jaksel & Depok
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
            Topic evergreen dengan GEO & SEO terkuat untuk warga Jaksel dan Depok. Klik untuk copy keyword, langsung generate article.
          </p>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 9999,
              border: activeCategory === cat ? 'none' : '1.5px solid #e5e7eb',
              background: activeCategory === cat ? 'linear-gradient(135deg, #a855f7, #7e22ce)' : 'white',
              color: activeCategory === cat ? 'white' : '#64748b',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: activeCategory === cat ? '0 4px 20px rgba(168,85,247,0.3)' : 'none',
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Ideas Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
          {filtered.map(idea => (
            <div key={idea.id} style={{
              background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 20,
              padding: '28px 28px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column', gap: 0,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'white',
                    background: idea.color, padding: '3px 10px', borderRadius: 9999, letterSpacing: '0.03em',
                  }}>
                    {idea.category}
                  </span>
                </div>
                <Link href={`/create?keyword=${encodeURIComponent(idea.sampleKeywords[0])}`} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, color: '#a855f7',
                  textDecoration: 'none', padding: '6px 14px', borderRadius: 9999,
                  background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.14)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(168,85,247,0.07)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  Generate <ArrowRight size={13} />
                </Link>
              </div>

              {/* Title */}
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                {idea.title}
              </h3>

              {/* Description */}
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 14 }}>
                {idea.description}
              </p>

              {/* Why Strong */}
              <div style={{
                background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <TrendingUp size={13} color="#a855f7" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Why Strong</span>
                </div>
                <p style={{ fontSize: 12, color: '#7c3aed', lineHeight: 1.6, margin: 0 }}>{idea.whyStrong}</p>
              </div>

              {/* Keywords */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Search size={13} color="#64748b" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Keywords</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {idea.sampleKeywords.map((kw, i) => (
                    <button key={i} onClick={() => copyKeyword(kw, `${idea.id}-${i}`)} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 12, padding: '5px 12px', borderRadius: 9999,
                      background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)',
                      color: '#2563eb', cursor: 'pointer', transition: 'all 0.15s',
                      fontWeight: 500,
                    }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.12)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.06)';
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
        <div style={{ textAlign: 'center', marginTop: 60, padding: '40px 32px', background: 'linear-gradient(135deg, rgba(168,85,247,0.06), rgba(126,34,206,0.04))', borderRadius: 24, border: '1.5px solid rgba(168,85,247,0.15)' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>
            Punya Ide Topic Baru?
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Tambahin keyword apapun dan langsung generate article dalam gaya HaloDepok.
          </p>
          <Link href="/create" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px', borderRadius: 9999,
            background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
            color: 'white', fontSize: 14, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(168,85,247,0.35)',
          }}>
            <Lightbulb size={16} />
            Buka Content Factory
          </Link>
        </div>

      </div>
    </div>
  );
}
