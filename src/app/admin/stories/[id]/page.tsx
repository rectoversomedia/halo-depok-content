'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, Clock, MapPin, Share2, Copy, Eye,
  FileText, Video, Instagram, Twitter, ChevronRight, Loader2,
  Zap, Shield, TrendingUp, AlertCircle,
} from 'lucide-react';

const STORY = {
  id: 's1',
  title: 'Banjir di Kemang Kembali Meluap Setelah Hujan Deras 3 Jam — 12 Titik Genangan Dilaporkan',
  summary: 'Hujan deras mengguyur Depok lebih dari 3 jam menyebabkan banjir di Kemang. Tinggi air 30-50cm di beberapa titik.',
  location: 'Kemang, Depok',
  status: 'content_ready',
  score: 87,
  sources: 3,
  time: '15 menit lalu',
  tags: ['Banjir', 'Kemang', 'Urgent'],
  published_at: null,
};

const ARTICLE = {
  headline: STORY.title,
  dek: STORY.summary,
  body: `Kemang, Depok — Hujan deras yang mengguyur kawasan Kemang dan sekitarnya selama lebih dari 3 jam pada sore hari menyebabkan banjir di sejumlah titik.

Berdasarkan laporan warga dan pantauan di lapangan, tinggi air di beberapa lokasi mencapai 30 hingga 50 centimeter, sehingga menyulitkan kendaraan kecil dan sepeda motor untuk melintas.

Titik-titik genangan dilaporkan muncul di sepanjang Jl. Kemang Raya, Jl. Ampera, serta kawasan sekitar Pasar Kemang. Air meluap dari saluran drainase yang tidak mampu menampung volume air hujan yang tinggi.

Warga setempat berharap Pemerintah Kota Depok segera menangani masalah drainase di kawasan tersebut agar kejadian serupa tidak terulang.`,
  sources: [
    'Warga Kemang via WhatsApp, 14:30 WIB',
    'Laporan Lapangan Tim HaloDepok, 15:00 WIB',
    'BMKG Jakarta — prakiraan cuaca cerah hingga malam',
  ],
};

const TIKTOK_SCRIPT = `[OPEN on water level rising in street]
[NARRATOR]:
"Banjir Kemang lagi. Sudah 3 jam hujan deras dan air mulai meluap. Tinggi air di sini sekitar 40cm. Jl. Kemang Raya, arah Ampera. Motor sulit lewat. Drainase lagi-lagi jadi masalah di Depok."

[ON SCREEN TEXT]:
"Kemang, Depok · 14:30 WIB"
"Bahaya! Motor hindari Jl. Kemang Raya"
"Tinggi air: 30-50cm"

[CLOSING]:
"Stay safe, warga Depok. Jangan paksakan kalau air udah tinggi."`;

const IG_CAROUSEL = [
  { slide: 1, headline: 'BANJIR KEMANG', body: 'Hujan deras 3+ jam picu genangan 30-50cm di Kemang. Jl. Kemang Raya & Ampera jadi titik parah.' },
  { slide: 2, headline: 'TITIK GENANGAN', body: '📍 Jl. Kemang Raya\n📍 Jl. Ampera\n📍 Pasar Kemang\nMotor & mobil kecil sulit lewat.' },
  { slide: 3, headline: 'APA YANG BISA DILAKUKAN?', body: '🚫 Hindari Jl. Kemang arah Ampera\n🌧️ Cuaca cerah diprediksi malam ini\n📞 Lapor 112 bila darurat\n💧 Drainase jadi masalah kronis Depok' },
];

const X_POST = `🚨 BANJIR KEMANG

Hujan deras 3+ jam picu banjir di Kemang Depok. Air 30-50cm di Jl. Kemang Raya & Ampera. Motor sulit lewat.

Warga diimbau hindari kawasan tersebut hingga air surut.

📍 Kemang, Depok · 14:30 WIB`;

export default function StoryDetailPage() {
  const [activeTab, setActiveTab] = useState<'article' | 'factory' | 'claims' | 'history'>('article');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const tabs = [
    { key: 'article', label: 'Article', icon: FileText },
    { key: 'factory', label: 'Content Factory', icon: Zap },
    { key: 'claims', label: 'Claims', icon: Shield },
    { key: 'history', label: 'History', icon: Clock },
  ] as const;

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Back Nav */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/admin/stories" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', textDecoration: 'none' }}>
          <ArrowLeft size={14} />
          Kembali ke Stories
        </Link>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Story Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className={`status-label ${STORY.status}`}>
              <span className={`status-dot ${STORY.status}`} />
              Content Ready
            </span>
            {STORY.tags.map(tag => (
              <span key={tag} className={`tag ${tag.toLowerCase().includes('banjir') ? 'urgent' : tag.toLowerCase().includes('kemang') ? 'source' : 'source'}`}>
                {tag}
              </span>
            ))}
            <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={10} /> {STORY.location}
            </span>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.35 }}>
            {STORY.title}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {STORY.summary}
          </p>
        </div>

        {/* Score Bar */}
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={14} color="#64748b" />
            <span style={{ fontSize: 12, color: '#64748b' }}>AI Score</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 9999 }}>
              <div style={{
                width: `${STORY.score}%`,
                height: '100%',
                borderRadius: 9999,
                background: STORY.score >= 80 ? '#22c55e' : STORY.score >= 60 ? '#f59e0b' : '#ef4444',
              }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: STORY.score >= 80 ? '#22c55e' : STORY.score >= 60 ? '#f59e0b' : '#ef4444' }}>
              {STORY.score}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px', background: '#22c55e' }}>
              <CheckCircle2 size={12} />
              Publish Sekarang
            </button>
            <button className="btn-secondary" style={{ fontSize: 12 }}>
              <Eye size={12} />
              Preview
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.key ? 'hsl(0 72% 50%)' : 'transparent'}`,
                fontSize: 13, fontWeight: 500,
                color: activeTab === tab.key ? 'hsl(0 72% 50%)' : '#64748b',
                background: 'transparent',
                cursor: 'pointer',
                marginBottom: -1,
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'article' && (
          <div>
            {/* AI Article Editor */}
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>AI Article</h3>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Dihasilkan otomatis dari sumber & klaim</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-secondary" style={{ fontSize: 11 }}>
                    <Zap size={11} /> Regenerate
                  </button>
                  <button className="btn-secondary" style={{ fontSize: 11 }}>
                    <FileText size={11} /> Edit Manual
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Headline</label>
                  <input
                    defaultValue={ARTICLE.headline}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1px solid #e2e8f0', borderRadius: 8,
                      fontSize: 15, fontWeight: 600, color: '#0f172a',
                      outline: 'none', background: '#f8fafc',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Dek (Subtitle)</label>
                  <input
                    defaultValue={ARTICLE.dek}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1px solid #e2e8f0', borderRadius: 8,
                      fontSize: 13, color: '#475569',
                      outline: 'none', background: '#f8fafc',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Body</label>
                  <textarea
                    defaultValue={ARTICLE.body}
                    rows={10}
                    style={{
                      width: '100%', padding: '12px 14px',
                      border: '1px solid #e2e8f0', borderRadius: 8,
                      fontSize: 13, color: '#1e293b', lineHeight: 1.7,
                      outline: 'none', resize: 'vertical', background: '#f8fafc',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Sources</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {ARTICLE.sources.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#475569', padding: '4px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'factory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* TikTok */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={13} color="#1e293b" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>TikTok Script</h3>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>AI-generated · 30 detik</p>
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() => copy(TIKTOK_SCRIPT, 'tiktok')}
                >
                  {copied === 'tiktok' ? <CheckCircle2 size={11} color="#22c55e" /> : <Copy size={11} />}
                  {copied === 'tiktok' ? 'Disalin!' : 'Salin'}
                </button>
              </div>
              <pre style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '12px 14px',
                fontSize: 12, color: '#1e293b', lineHeight: 1.6,
                margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace',
              }}>
                {TIKTOK_SCRIPT}
              </pre>
            </div>

            {/* Instagram */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Instagram size={13} color="#be185d" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>Instagram Carousel</h3>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>AI-generated · {IG_CAROUSEL.length} slide</p>
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() => copy(IG_CAROUSEL.map(s => `Slide ${s.slide}: ${s.headline}\n${s.body}`).join('\n\n'), 'ig')}
                >
                  {copied === 'ig' ? <CheckCircle2 size={11} color="#22c55e" /> : <Copy size={11} />}
                  {copied === 'ig' ? 'Disalin!' : 'Salin'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {IG_CAROUSEL.map(slide => (
                  <div key={slide.slide} style={{
                    border: '1px solid #e2e8f0', borderRadius: 8, padding: 12,
                    background: '#f8fafc',
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 6, textTransform: 'uppercase' }}>
                      Slide {slide.slide}
                    </div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{slide.headline}</h4>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{slide.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* X/Twitter */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Twitter size={13} color="#1e293b" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>X / Twitter Post</h3>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>AI-generated · {X_POST.length}/280 karakter</p>
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11 }}
                  onClick={() => copy(X_POST, 'x')}
                >
                  {copied === 'x' ? <CheckCircle2 size={11} color="#22c55e" /> : <Copy size={11} />}
                  {copied === 'x' ? 'Disalin!' : 'Salin'}
                </button>
              </div>
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '12px 14px',
              }}>
                <p style={{ fontSize: 12, color: '#1e293b', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{X_POST}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'claims' && (
          <div>
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 12,
              color: '#1e40af',
            }}>
              <Shield size={13} style={{ display: 'inline', marginRight: 6 }} />
              <strong>Claims & Evidence</strong> — Setiap klaim harus didukung bukti dari sumber terverifikasi.
            </div>
            {[
              { claim: 'Tinggi air 30-50cm di Jl. Kemang Raya', source: 'Warga Kemang via WhatsApp', verified: true },
              { claim: 'Hujan deras selama 3+ jam', source: 'BMKG Jakarta — data observasi', verified: true },
              { claim: '12 titik genangan di Kemang', source: 'Laporan warga & tim lapangan', verified: false, note: 'Perlu konfirmasi jumlah pasti' },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'white', border: '1px solid #e2e8f0',
                borderRadius: 10, padding: '14px 16px', marginBottom: 8,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                {item.verified
                  ? <CheckCircle2 size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                  : <AlertCircle size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                }
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 3px' }}>{item.claim}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{item.source}</p>
                  {!item.verified && item.note && (
                    <p style={{ fontSize: 11, color: '#f59e0b', margin: '3px 0 0' }}>⚠ {item.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {[
              { time: 'Baru saja', action: 'Story masuk ke "Content Ready"', actor: 'AI System' },
              { time: '5 menit lalu', action: 'AI menggenerate Article, TikTok, IG, X post', actor: 'AI System' },
              { time: '10 menit lalu', action: 'AI me-verify klaim dari 3 sumber', actor: 'AI System' },
              { time: '15 menit lalu', action: 'Story di-discover dari Detik News RSS', actor: 'RSS Ingestion' },
            ].map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e2e8f0', border: '2px solid #cbd5e1' }} />
                  {i < 3 && <div style={{ width: 1, flex: 1, background: '#e2e8f0', marginTop: 4 }} />}
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>{h.action}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '0' }}>{h.actor} · {h.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
