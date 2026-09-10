'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Loader2, Copy, Check, Wand2, AlertCircle,
  Twitter, Instagram, Facebook, Video, Hash,
} from 'lucide-react';

type Platform = 'twitter' | 'instagram' | 'facebook' | 'tiktok' | 'threads';
type Phase = 'idle' | 'loading' | 'done' | 'error';

const PLATFORMS: { key: Platform; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'twitter', label: 'X', icon: <Twitter size={14} />, color: '#1d9bf0' },
  { key: 'instagram', label: 'IG', icon: <Instagram size={14} />, color: '#e1306c' },
  { key: 'threads', label: 'Threads', icon: <Hash size={14} />, color: '#000000' },
  { key: 'facebook', label: 'FB', icon: <Facebook size={14} />, color: '#1877f2' },
  { key: 'tiktok', label: 'TikTok', icon: <Video size={14} />, color: '#ff0050' },
];

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
        ctx.fillStyle = `rgba(37,99,235,${p.opacity})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

interface Slide {
  slide_number: number;
  type: string;
  hook?: string;
  caption_copy?: string;
  hashtags?: string[];
  visual_idea?: string;
  cta?: string;
}

interface PostOutput {
  platform: string;
  headline?: string;
  slides: Slide[];
}

export default function SocialMediaPage() {
  const [articleUrl, setArticleUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['twitter', 'instagram']);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [posts, setPosts] = useState<PostOutput[] | null>(null);
  const [copiedSlide, setCopiedSlide] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const togglePlatform = (key: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const doGenerate = useCallback(async () => {
    if (!articleUrl.trim()) { setErrorMsg('Please enter a URL.'); return; }
    if (selectedPlatforms.length === 0) { setErrorMsg('Select at least one platform.'); return; }
    setErrorMsg('');
    setPhase('loading');
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: articleUrl.trim(),
          platforms: selectedPlatforms,
          location: 'Depok',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed.');
      setPosts(data.posts);
      setPhase('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setPhase('error');
    }
  }, [articleUrl, selectedPlatforms]);

  const copySlide = (slide: Slide) => {
    const text = `${slide.hook || ''}
${slide.caption_copy || ''}
${(slide.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSlide(`${slide.slide_number}`);
      setTimeout(() => setCopiedSlide(null), 2000);
    });
  };

  const copyAll = () => {
    if (!posts) return;
    const text = posts.map(p => {
      return `【${p.platform.toUpperCase()} — ${p.headline || ''}】

${p.slides.map((s, i) => `— Slide ${i + 1} [${s.type || ''}] —
${s.hook || ''}
${s.caption_copy || ''}
${(s.hashtags || []).join(' ')}`).join('\n\n')}`;
    }).join('\n\n' + '═'.repeat(40) + '\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    });
  };

  const platName = (key: string) =>
    key === 'twitter' ? 'X / Twitter' : key === 'instagram' ? 'Instagram' : key === 'threads' ? 'Threads' : key === 'facebook' ? 'Facebook' : 'TikTok';

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'DM Sans', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>
      <ParticleCanvas />
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.06) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Sticky Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 32px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="HaloDepok" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
        </Link>
      </header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* INPUT */}
        {(phase === 'idle' || phase === 'error') && (
          <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 24, padding: '40px 44px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Social Media</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 32px' }}>AI generates slide-based content from your article</p>

            {errorMsg && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#2563eb', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} /><span>{errorMsg}</span>
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, letterSpacing: '0.02em' }}>Article URL</label>
              <input type="url" value={articleUrl} onChange={e => setArticleUrl(e.target.value)} placeholder="https://halodepok.com/banjir-kemang-depok"
                onFocus={e => (e.target.style.borderColor = 'rgba(37,99,235,0.5)')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e5e7eb', borderRadius: 14, fontSize: 14, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' }} />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>Platforms</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {PLATFORMS.map(p => {
                  const active = selectedPlatforms.includes(p.key);
                  return (
                    <button key={p.key} onClick={() => togglePlatform(p.key)} style={{
                      padding: '9px 20px', borderRadius: 9999, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: active ? p.color : '#f5f5f5',
                      color: active ? 'white' : '#64748b',
                      border: active ? 'none' : '1.5px solid #e5e7eb',
                      boxShadow: active ? `0 4px 16px ${p.color}44` : 'none',
                      transition: 'all 0.2s',
                    }}>
                      {p.icon} {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={doGenerate} style={{
              width: '100%', padding: '15px 24px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 32px rgba(37,99,235,0.35)', transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.35)'; }}>
              <Wand2 size={18} /> Generate Slides
            </button>
          </div>
        )}

        {/* LOADING */}
        {phase === 'loading' && (
          <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 24, padding: '72px 40px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #fee2e2' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '3px solid #fee2e2' }} />
              <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '3px solid transparent', borderBottomColor: '#1d4ed8', animation: 'spin 1.2s linear infinite reverse' }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Generating content slides...</div>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>AI is crafting hooks, copy & visual ideas per platform</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* RESULTS */}
        {phase === 'done' && posts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => doGenerate()} style={{ padding: '8px 16px', background: '#f5f5f5', color: '#64748b', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wand2 size={12} /> Regenerate
                </button>
                <button onClick={copyAll} style={{ padding: '8px 18px', background: copiedAll ? '#16a34a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: copiedAll ? 'none' : '0 4px 16px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}>
                  {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                  {copiedAll ? 'Copied!' : 'Copy All'}
                </button>
              </div>
            </div>

            {posts.map((post) => {
              const plat = PLATFORMS.find(p => p.key === post.platform);
              const color = plat?.color ?? '#2563eb';
              return (
                <div key={post.platform} style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color }}>{plat?.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{platName(post.platform)}</div>
                        {post.headline && <div style={{ fontSize: 11, color: '#94a3b8' }}>{post.headline}</div>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', background: '#f5f5f5', padding: '4px 10px', borderRadius: 9999, fontWeight: 600 }}>
                      {post.slides.length} slides
                    </div>
                  </div>

                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {post.slides.map((slide, i) => (
                      <div key={slide.slide_number} style={{ background: '#fafafa', border: '1.5px solid #f0f0f0', borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#2563eb', background: 'rgba(37,99,235,0.08)', padding: '2px 8px', borderRadius: 9999, letterSpacing: '0.05em' }}>
                              SLIDE {i + 1}
                            </span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{slide.type}</span>
                          </div>
                          <button onClick={() => copySlide(slide)} style={{
                            padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            background: copiedSlide === `${slide.slide_number}` ? '#16a34a' : `${color}15`,
                            color: copiedSlide === `${slide.slide_number}` ? 'white' : color,
                            display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s',
                          }}>
                            {copiedSlide === `${slide.slide_number}` ? <Check size={11} /> : <Copy size={11} />}
                            {copiedSlide === `${slide.slide_number}` ? 'Copied' : 'Copy'}
                          </button>
                        </div>

                        {slide.hook && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Hook</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#2563eb', lineHeight: 1.3 }}>{slide.hook}</div>
                          </div>
                        )}

                        {slide.caption_copy && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Caption</div>
                            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{slide.caption_copy}</div>
                          </div>
                        )}

                        {slide.visual_idea && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Visual Idea</div>
                            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.55, fontStyle: 'italic' }}>{slide.visual_idea}</div>
                          </div>
                        )}

                        {slide.cta && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>CTA</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color }}>{slide.cta}</div>
                          </div>
                        )}

                        {slide.hashtags && slide.hashtags.length > 0 && (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Hashtags</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {slide.hashtags.map(tag => (
                                <span key={tag} style={{ fontSize: 11, color: '#2563eb', background: 'rgba(37,99,235,0.07)', padding: '3px 10px', borderRadius: 9999, fontWeight: 600 }}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
