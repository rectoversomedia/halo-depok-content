'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Lightbulb, ArrowRight, Copy, Check, Zap, RefreshCw, Sparkles } from 'lucide-react';

interface Idea {
  id?: string;
  category: string;
  title: string;
  hook: string;
  angle: string;
  seo_keywords: string[];
  geo_questions: string[];
  why_evergreen: string;
  word_target: number;
  recommended_sources: string[];
}

const CATEGORIES = [
  'All Topics',
  'Kesehatan & Keluarga',
  'Kuliner',
  'Pendidikan',
  'Fitness & Wellness',
  'Properti',
  'Tips & How-To',
  'Komunitas',
  'Lingkungan',
  'Neighborhood Guide',
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
  const [aiIdeas, setAiIdeas] = useState<Idea[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const filtered = activeCategory === 'All Topics'
    ? aiIdeas ?? []
    : (aiIdeas ?? []).filter(i => i.category.toLowerCase().includes(activeCategory.toLowerCase()) || activeCategory === 'All Topics');

  const copyKeyword = (kw: string, id: string) => {
    navigator.clipboard.writeText(kw).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const generateIdeas = async () => {
    setIsGenerating(true);
    setAiIdeas([]);
    try {
      const res = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiIdeas(data.ideas ?? []);
    } catch {
      alert('Gagal generate ideas. Coba lagi ya.');
    } finally {
      setIsGenerating(false);
    }
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
          padding: '10px 32px',
          background: 'rgba(250,248,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168,85,247,0.08)',
        }}>
          <img src="/logo.png" alt="HaloDepok" style={{ height: 52, width: 'auto', objectFit: 'contain' }} />
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

        {/* AI Generator Section */}
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 32px' }}>
          <div style={{
            background: 'white',
            border: '1.5px solid rgba(168,85,247,0.2)',
            borderRadius: 20,
            padding: '28px 32px',
            textAlign: 'center',
            boxShadow: '0 2px 16px rgba(168,85,247,0.08)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
            }}>
              <Sparkles size={22} color="white" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.01em' }}>
              AI Content Strategy Generator
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
              AI generate 10 evergreen content ideas baru untuk HaloDepok. Pilih kategori dulu, terus klik Generate.
            </p>

            {/* Category selector for AI */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '7px 16px',
                  borderRadius: 9999,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: activeCategory === cat ? 'none' : '1.5px solid #e5e7eb',
                  background: activeCategory === cat
                    ? 'linear-gradient(135deg, #a855f7, #7e22ce)'
                    : 'white',
                  color: activeCategory === cat ? 'white' : '#64748b',
                  boxShadow: activeCategory === cat ? '0 4px 16px rgba(168,85,247,0.3)' : 'none',
                }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={generateIdeas}
                disabled={isGenerating}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '13px 32px',
                  borderRadius: 9999,
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white',
                  fontSize: 14, fontWeight: 700,
                  border: 'none',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 24px rgba(249,115,22,0.35)',
                  transition: 'all 0.2s',
                  opacity: isGenerating ? 0.7 : 1,
                }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Generate 10 Evergreen Ideas
                  </>
                )}
              </button>

              {aiIdeas && aiIdeas.length > 0 && (
                <button
                  onClick={() => { setAiIdeas(null); setShowAIGenerator(false); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '13px 24px',
                    borderRadius: 9999,
                    background: 'white',
                    color: '#64748b',
                    fontSize: 14, fontWeight: 600,
                    border: '1.5px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AI Generated Ideas */}
        {aiIdeas && aiIdeas.length > 0 && (
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {aiIdeas.length} Ideas Generated
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                    fontSize: 12, fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: activeCategory === cat ? 'none' : '1.5px solid #e5e7eb',
                    background: activeCategory === cat
                      ? 'linear-gradient(135deg, #a855f7, #7e22ce)'
                      : 'white',
                    color: activeCategory === cat ? 'white' : '#64748b',
                    boxShadow: activeCategory === cat ? '0 4px 16px rgba(168,85,247,0.3)' : 'none',
                  }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: 16,
            }}>
              {filtered.map((idea, idx) => (
                <div key={idx} style={{
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
                  {/* Top row */}
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
                      href={`/create?keyword=${encodeURIComponent(idea.seo_keywords?.[0] ?? idea.title)}`}
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
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                    {idea.title}
                  </h3>

                  {/* Hook */}
                  {idea.hook && (
                    <p style={{ fontSize: 13, color: '#7c3aed', fontStyle: 'italic', lineHeight: 1.65, marginBottom: 8 }}>
                      {idea.hook}
                    </p>
                  )}

                  {/* Angle */}
                  {idea.angle && (
                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.65, marginBottom: 10 }}>
                      {idea.angle}
                    </p>
                  )}

                  {/* SEO Keywords */}
                  {idea.seo_keywords && idea.seo_keywords.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        SEO Keywords
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {idea.seo_keywords.slice(0, 4).map((kw, i) => (
                          <button key={i} onClick={() => copyKeyword(kw, `${idx}-kw-${i}`)} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, padding: '4px 10px',
                            borderRadius: 9999,
                            background: copiedId === `${idx}-kw-${i}` ? 'rgba(34,197,94,0.1)' : 'rgba(37,99,235,0.06)',
                            border: `1.5px solid ${copiedId === `${idx}-kw-${i}` ? 'rgba(34,197,94,0.3)' : 'rgba(37,99,235,0.15)'}`,
                            color: copiedId === `${idx}-kw-${i}` ? '#16a34a' : '#2563eb',
                            cursor: 'pointer', fontWeight: 500,
                          }}>
                            {copiedId === `${idx}-kw-${i}` ? <Check size={10} /> : null}
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GEO Questions */}
                  {idea.geo_questions && idea.geo_questions.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        GEO Questions
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {idea.geo_questions.slice(0, 3).map((q, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ color: '#a855f7', fontWeight: 700, flexShrink: 0 }}>Q.</span>
                            <span>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Why Evergreen + Sources */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {idea.why_evergreen && (
                      <span style={{ fontSize: 11, color: '#16a34a', background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.15)', padding: '3px 10px', borderRadius: 9999, fontWeight: 500 }}>
                        Evergreen
                      </span>
                    )}
                    {idea.word_target && (
                      <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(100,116,139,0.07)', border: '1px solid rgba(100,116,139,0.15)', padding: '3px 10px', borderRadius: 9999, fontWeight: 500 }}>
                        ~{idea.word_target} kata
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA after AI generation */}
            <div style={{
              textAlign: 'center',
              marginTop: 40,
              padding: '32px',
              background: 'white',
              border: '1.5px solid #f0f0f0',
              borderRadius: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Suka dengan hasilnya?
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
                Generate lagi dengan kategori berbeda, atau langsung generate article.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={generateIdeas} disabled={isGenerating} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 9999,
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 24px rgba(249,115,22,0.3)',
                  opacity: isGenerating ? 0.7 : 1,
                }}>
                  {isGenerating ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><RefreshCw size={14} /> Generate Ulang</>}
                </button>
                <Link href="/create" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 9999,
                  background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 6px 24px rgba(168,85,247,0.3)',
                }}>
                  <Zap size={14} />
                  Buka Content Factory
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA — default state */}
        {!aiIdeas && (
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
            <div style={{
              textAlign: 'center',
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
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.01em' }}>
                Generate Sekarang!
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>
                Pilih kategori di atas, klik Generate — atau ketik keyword sendiri di bawah.
              </p>
              <Link href="/create" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 36px',
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: 'white',
                fontSize: 15, fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 8px 32px rgba(249,115,22,0.35)',
              }}>
                <Zap size={16} />
                Buka Content Factory
              </Link>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { margin: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
