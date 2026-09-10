'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText, Loader2, CheckCircle2, AlertCircle,
  RefreshCw, Copy, Eye, Code, Check, Wand2, ChevronDown, ChevronUp,
} from 'lucide-react';

const STEPS = [
  { n: 1, label: 'Input' },
  { n: 2, label: 'Generate' },
  { n: 3, label: 'Edit' },
  { n: 4, label: 'Copy' },
];

type Phase = 'idle' | 'loading' | 'done' | 'error';
type Tab = 'edit' | 'html';

function wordCount(text: string): number {
  return text.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function buildWPHtml(opts: {
  title: string; dek: string; body: string; sources: string;
  author: string; readTime: string; focusKeyword: string;
  metaDesc: string; slug: string; heroImageUrl: string | null;
}): string {
  const { title, dek, body, sources, author, readTime, focusKeyword, metaDesc, slug, heroImageUrl } = opts;
  const heroImg = heroImageUrl
    ? `<figure class="wp-block-image"><img src="${heroImageUrl}" alt="${focusKeyword}" class="wp-image-1" /></figure>\n`
    : '';
  return `<!-- SEO: keyword=${focusKeyword} | slug=${slug} | read=${readTime} -->
<!-- META: ${metaDesc} -->
<div class="depok-article" itemscope itemtype="https://schema.org/NewsArticle">
  <header>\n${heroImg}
    <h1 itemprop="headline">${title}</h1>
    <p class="dek">${dek}</p>
    <div class="meta">${author} &middot; <time>${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</time> &middot; ${readTime}</div>
  </header>
  <div itemprop="articleBody">\n${body.split('\n').map(l => l ? `  ${l}` : '').join('\n')}\n  </div>
  <footer>
    <hr/>
    <h2>Sources</h2>
    <p>${sources}</p>
  </footer>
</div>`;
}

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
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 2.5 + 0.8, vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
      opacity: Math.random() * 0.5 + 0.15, opacityDir: Math.random() > 0.5 ? 1 : -1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.opacity += p.opacityDir * 0.004;
        if (p.opacity > 0.7) p.opacityDir = -1;
        if (p.opacity < 0.06) p.opacityDir = 1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(8,145,178,${p.opacity})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

export default function CreateArticlePage() {
  const [inputMode, setInputMode] = useState<'url' | 'text' | 'keyword'>('url');
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [keyword, setKeyword] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [generated, setGenerated] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<Tab>('edit');
  const [bodyView, setBodyView] = useState<'html' | 'preview'>('preview');
  const [copied, setCopied] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDek, setEditDek] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editSources, setEditSources] = useState('');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [editFocusKeyword, setEditFocusKeyword] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [editAuthor] = useState('Tim HaloDepok');
  const [editReadTime, setEditReadTime] = useState('5 min');

  const wc = editBody ? wordCount(editBody) : 0;
  const wcPct = Math.min((wc / 1000) * 100, 100);
  const WORD_TARGET = 1000;
  const isSeoTitleOk = editSeoTitle.length <= 60;
  const isMetaDescOk = editMetaDesc.length <= 155;
  const currentStep = phase === 'idle' || phase === 'error' ? 1 : phase === 'loading' ? 2 : 3;

  const doGenerate = useCallback(async (signal: 'generate' | 'regenerate') => {
    if (inputMode === 'url' && !url.trim()) { setErrorMsg('Please enter a URL.'); return; }
    if (inputMode === 'text' && rawText.trim().length < 100) { setErrorMsg('Text must be at least 100 characters.'); return; }
    if (inputMode === 'keyword' && keyword.trim().length < 3) { setErrorMsg('Keyword must be at least 3 characters.'); return; }
    setErrorMsg('');
    setPhase('loading');
    setStatusText(signal === 'generate' ? 'Fetching & rewriting in Depok voice...' : 'Regenerating...');
    try {
      const res = await fetch('/api/article/rewrite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: inputMode === 'url' ? url.trim() : undefined, sourceText: inputMode === 'text' ? rawText.trim() : undefined, keyword: inputMode === 'keyword' ? keyword.trim() : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed.');
      setPhase('done');
      setGenerated(data.article);
      const art = data.article;
      setEditTitle(art.title ?? '');
      setEditDek(art.dek ?? '');
      setEditBody(art.body ?? '');
      setEditSources(art.sources_section ?? '');
      setEditSeoTitle(art.seo_title ?? art.title ?? '');
      setEditMetaDesc(art.meta_description ?? art.dek ?? '');
      setEditFocusKeyword(art.focus_keyword ?? '');
      setEditSlug(art.slug ?? '');
      setHeroImageUrl(art.hero_image_url ?? null);
      if (art.read_time_minutes) setEditReadTime(art.read_time_minutes);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setPhase('error');
    }
  }, [inputMode, url, rawText, keyword]);

  const handleSimpan = useCallback(() => {
    if (!generated) return;
    window.location.href = `/admin/article/${(generated as { storyId: string }).storyId}`;
  }, [generated]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildWPHtml({ title: editTitle, dek: editDek, body: editBody, sources: editSources, author: editAuthor, readTime: editReadTime, focusKeyword: editFocusKeyword, metaDesc: editMetaDesc, slug: editSlug, heroImageUrl })).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  }, [editTitle, editDek, editBody, editSources, editAuthor, editReadTime, editFocusKeyword, editMetaDesc, editSlug, heroImageUrl]);

  const wpHtml = buildWPHtml({ title: editTitle, dek: editDek, body: editBody, sources: editSources, author: editAuthor, readTime: editReadTime, focusKeyword: editFocusKeyword, metaDesc: editMetaDesc, slug: editSlug, heroImageUrl });

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'DM Sans', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>
      <ParticleCanvas />
      <div style={{ position: 'fixed', top: '-15%', right: '-8%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,116,144,0.06) 0%, transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '40%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(8,145,178,0.05) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Sticky Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 32px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid #f0f0f0' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/logo.png" alt="HaloDepok" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
        </Link>
      </header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#f5f5f5', border: '1.5px solid #e5e7eb', borderRadius: 9999, padding: '4px 6px' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  padding: '5px 16px', borderRadius: 9999, fontSize: 12, fontWeight: 700,
                  background: currentStep === s.n ? '#0891b2' : currentStep > s.n ? 'rgba(8,145,178,0.12)' : 'transparent',
                  color: currentStep >= s.n ? 'white' : '#94a3b8',
                  transition: 'all 0.25s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {currentStep > s.n && <Check size={11} />}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: '#e5e7eb', margin: '0 2px' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* INPUT PHASE */}
        {(phase === 'idle' || phase === 'error') && (
          <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 24, padding: '40px 44px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)' }}>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Create Article</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 32px' }}>Paste URL, text, or keyword — rewrites it in HaloDepok style</p>

            {errorMsg && (
              <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#0891b2', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} /><span>{errorMsg}</span>
              </div>
            )}

            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#f5f5f5', border: '1.5px solid #e5e7eb', borderRadius: 14, padding: 4, width: 'fit-content' }}>
              {([{ key: 'url', label: 'Paste URL' }, { key: 'text', label: 'Paste Text' }, { key: 'keyword', label: 'Keyword' }] as const).map(opt => (
                <button key={opt.key} onClick={() => setInputMode(opt.key)} style={{
                  padding: '8px 22px', fontSize: 13, fontWeight: 600, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: inputMode === opt.key ? 'white' : 'transparent',
                  color: inputMode === opt.key ? '#0891b2' : '#64748b',
                  boxShadow: inputMode === opt.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s',
                }}>{opt.label}</button>
              ))}
            </div>

            {inputMode === 'url' ? (
              <div style={{ marginBottom: 20 }}>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://news.detik.com/..." onFocus={e => (e.target.style.borderColor = 'rgba(8,145,178,0.5)')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                  style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e5e7eb', borderRadius: 14, fontSize: 14, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' }} />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Fetches article from URL then rewrites in HaloDepok style.</p>
              </div>
            ) : inputMode === 'keyword' ? (
              <div style={{ marginBottom: 20 }}>
                <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g.: banjir kemang, cafe blok m, pembangunan tb simatupang..." onFocus={e => (e.target.style.borderColor = 'rgba(8,145,178,0.5)')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                  style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e5e7eb', borderRadius: 14, fontSize: 14, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' }} />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Generates a complete article from keyword — no source needed.</p>
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <textarea value={rawText} onChange={e => setRawText(e.target.value)} rows={9} placeholder="Paste article text here..." onFocus={e => (e.target.style.borderColor = 'rgba(8,145,178,0.5)')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                  style={{ width: '100%', padding: '14px 18px', border: '1.5px solid #e5e7eb', borderRadius: 14, fontSize: 14, color: '#0f172a', background: '#fafafa', outline: 'none', resize: 'vertical', lineHeight: 1.65, fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' }} />
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>{rawText.length.toLocaleString()} chars &middot; {wordCount(rawText).toLocaleString()} words</p>
              </div>
            )}

            <button onClick={() => doGenerate('generate')} style={{
              width: '100%', padding: '15px 24px', background: 'linear-gradient(135deg, #0891b2, #0e7490)',
              color: 'white', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 32px rgba(8,145,178,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(8,145,178,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(8,145,178,0.35)'; }}>
              <Wand2 size={18} /> Write Article
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
              {['E-E-A-T Compliant', '1000+ words', 'SEO Ready', 'WP HTML'].map(tag => (
                <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.02em' }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* LOADING */}
        {phase === 'loading' && (
          <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 24, padding: '72px 40px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #fee2e2' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#0891b2', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '3px solid #fee2e2' }} />
              <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '3px solid transparent', borderBottomColor: '#0e7490', animation: 'spin 1.2s linear infinite reverse' }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{statusText}</div>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>HaloDepok is crafting your article...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* DONE / EDITOR */}
        {phase === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Action Bar */}
            <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '12px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Article ready</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>&middot;</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{wc.toLocaleString()} words</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => doGenerate('regenerate')} style={{ background: '#f5f5f5', color: '#64748b', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
                <Link href="/" style={{ background: '#f5f5f5', color: '#64748b', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                  Home
                </Link>
                <button onClick={handleCopy} style={{ background: copied ? '#16a34a' : 'linear-gradient(135deg, #0891b2, #0e7490)', color: 'white', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: copied ? 'none' : '0 4px 16px rgba(8,145,178,0.35)', transition: 'all 0.2s' }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy WP HTML'}
                </button>
              </div>
            </div>

            {/* Hero Image */}
            {heroImageUrl && (
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #f0f0f0' }}>
                <img src={heroImageUrl} alt={editFocusKeyword} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />
              </div>
            )}

            {/* Headline Card */}
            <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 20, padding: '32px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)' }}>
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'inherit', lineHeight: 1.2, background: 'transparent', marginBottom: 10, letterSpacing: '-0.02em' }} placeholder="Headline..." />
              <input value={editDek} onChange={e => setEditDek(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, color: '#64748b', fontFamily: 'inherit', lineHeight: 1.5, background: 'transparent' }} placeholder="Dek..." />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Slug</label>
                  <input value={editSlug} onChange={e => setEditSlug(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Focus Keyword</label>
                  <input value={editFocusKeyword} onChange={e => setEditFocusKeyword(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>

            {/* Word Count */}
            <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Word Count</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: wc >= WORD_TARGET ? '#16a34a' : wc >= WORD_TARGET * 0.7 ? '#d97706' : '#0891b2' }}>
                  {wc.toLocaleString()} kata
                  {wc < WORD_TARGET && <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>/ min {WORD_TARGET.toLocaleString()}</span>}
                  {wc >= WORD_TARGET && <Check size={13} style={{ display: 'inline', marginLeft: 6 }} />}
                </span>
              </div>
              <div style={{ height: 5, background: '#f0f0f0', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ width: `${wcPct}%`, height: '100%', borderRadius: 9999, background: wc >= WORD_TARGET ? '#16a34a' : wc >= WORD_TARGET * 0.7 ? '#d97706' : 'linear-gradient(90deg, #0891b2, #0e7490)', transition: 'width 0.5s ease' }} />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, background: '#f5f5f5', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 4, width: 'fit-content' }}>
              {([{ key: 'edit', label: 'Edit', icon: <Eye size={12} /> }, { key: 'html', label: 'HTML', icon: <Code size={12} /> }] as const).map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 18px', fontSize: 12, fontWeight: 600, borderRadius: 10, cursor: 'pointer', background: tab === t.key ? 'white' : 'transparent', color: tab === t.key ? '#0891b2' : '#94a3b8', border: tab === t.key ? '1.5px solid #f0f0f0' : '1px solid transparent', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.06)' : 'none' }}>{t.icon}{t.label}</button>
              ))}
            </div>

            {/* Edit Tab */}
            {tab === 'edit' && (
              <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Body</span>
                  <div style={{ display: 'flex', gap: 0, background: '#f5f5f5', borderRadius: 8, padding: 3 }}>
                    {([['html', 'HTML'], ['preview', 'Preview']] as const).map(([v, label]) => (
                      <button key={v} onClick={() => setBodyView(v as 'html' | 'preview')} style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', background: bodyView === v ? 'white' : 'transparent', color: bodyView === v ? '#0891b2' : '#94a3b8', transition: 'all 0.2s', boxShadow: bodyView === v ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}>{label}</button>
                    ))}
                  </div>
                </div>
                {bodyView === 'html' ? (
                  <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={20} style={{ width: '100%', padding: '20px', border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent', resize: 'vertical', lineHeight: 1.75, fontFamily: "'Fira Code', 'Menlo', monospace", boxSizing: 'border-box' }} />
                ) : (
                  <div style={{ padding: '28px 36px' }}>
                    <style>{`
                      .prev-body h2 { font-size: 1.25em; font-weight: 700; color: #0f172a; margin: 24px 0 8px; padding-bottom: 6px; border-bottom: 2px solid #f0f0f0; }
                      .prev-body p { font-size: 15px; color: #374151; line-height: 1.8; margin: 0 0 14px; }
                      .prev-body blockquote { margin: 16px 0; padding: 12px 18px; background: rgba(8,145,178,0.06); border-left: 4px solid #0891b2; border-radius: 0 8px 8px 0; }
                      .prev-body blockquote p { font-style: italic; color: #64748b; margin: 0; }
                      .prev-body ul { padding-left: 22px; margin: 0 0 14px; }
                      .prev-body li { font-size: 15px; color: #374151; line-height: 1.7; margin-bottom: 5px; }
                      .prev-body strong { font-weight: 700; color: #0f172a; }
                    `}</style>
                    <div className="prev-body" dangerouslySetInnerHTML={{ __html: editBody }} />
                  </div>
                )}
              </div>
            )}

            {/* HTML Tab */}
            {tab === 'html' && (
              <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>WordPress HTML</span>
                  <button onClick={handleCopy} style={{ background: copied ? '#16a34a' : 'linear-gradient(135deg, #0891b2, #0e7490)', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied!' : 'Copy HTML'}
                  </button>
                </div>
                <div style={{ padding: '10px 20px', background: 'rgba(8,145,178,0.05)', borderBottom: '1px solid rgba(8,145,178,0.1)', fontSize: 12, color: '#0891b2' }}>
                  <strong>Guide:</strong> In WP admin &rarr; <strong>Text</strong> tab &rarr; paste below.
                </div>
                <textarea readOnly value={wpHtml} rows={18} style={{ width: '100%', padding: '16px 20px', border: 'none', outline: 'none', fontSize: 11.5, color: '#374151', background: 'transparent', fontFamily: "'Fira Code', 'Menlo', monospace", resize: 'none', lineHeight: 1.65, boxSizing: 'border-box' }} />
                <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[{ label: 'SEO Title', value: editSeoTitle, ok: isSeoTitleOk, limit: 60 }, { label: 'Meta Desc', value: editMetaDesc, ok: isMetaDescOk, limit: 155 }, { label: 'Keyword', value: editFocusKeyword }, { label: 'Slug', value: editSlug }].map(item => (
                      <div key={item.label} style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '8px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, wordBreak: 'break-all' }}>{item.value || '—'}</div>
                        {item.limit && <div style={{ fontSize: 10, color: item.ok ? '#16a34a' : '#0891b2', marginTop: 2, fontWeight: 600 }}>{item.value.length}/{item.limit} {item.ok ? '✓' : '✗'}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEO Accordion */}
            <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <button onClick={() => setSeoOpen(o => !o)} style={{ width: '100%', padding: '14px 20px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>SEO & Metadata</span>
                {seoOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
              </button>
              {seoOpen && (
                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>SEO Title <span style={{ color: '#94a3b8', fontWeight: 400 }}>(max 60)</span></span>
                      <span style={{ fontSize: 11, color: isSeoTitleOk ? '#16a34a' : '#0891b2', fontWeight: 600 }}>{editSeoTitle.length}/60 {isSeoTitleOk ? '✓' : '✗'}</span>
                    </div>
                    <input value={editSeoTitle} onChange={e => setEditSeoTitle(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${isSeoTitleOk ? '#e5e7eb' : 'rgba(8,145,178,0.4)'}`, borderRadius: 12, fontSize: 13, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    <div style={{ marginTop: 6, padding: '10px 12px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                      <div style={{ color: '#1d4ed8', fontSize: 13, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editSeoTitle || 'SEO Title...'}</div>
                      <div style={{ color: '#16a34a', fontSize: 11, marginBottom: 1 }}>halodepok.com/{editSlug || 'slug'}</div>
                      <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.4 }}>{editMetaDesc || 'Meta description...'}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Meta Description <span style={{ color: '#94a3b8', fontWeight: 400 }}>(max 155)</span></span>
                      <span style={{ fontSize: 11, color: isMetaDescOk ? '#16a34a' : '#0891b2', fontWeight: 600 }}>{editMetaDesc.length}/155 {isMetaDescOk ? '✓' : '✗'}</span>
                    </div>
                    <textarea value={editMetaDesc} onChange={e => setEditMetaDesc(e.target.value)} rows={2} style={{ width: '100%', padding: '10px 14px', border: `1.5px solid ${isMetaDescOk ? '#e5e7eb' : 'rgba(8,145,178,0.4)'}`, borderRadius: 12, fontSize: 13, color: '#0f172a', background: '#fafafa', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Focus Keyword</label>
                      <input value={editFocusKeyword} onChange={e => setEditFocusKeyword(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Slug</label>
                      <input value={editSlug} onChange={e => setEditSlug(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sources */}
            <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>Sources</label>
              <textarea value={editSources} onChange={e => setEditSources(e.target.value)} rows={3} style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, fontSize: 13, color: '#374151', background: '#fafafa', outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            {/* Key Facts */}
            {Array.isArray((generated as Record<string, unknown>)?.key_facts) && ((generated as { key_facts: string[] }).key_facts).length > 0 && (
              <div style={{ background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>Key Facts (E-E-A-T)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {((generated as { key_facts: string[] }).key_facts).map((fact, i) => (
                    <div key={i} style={{ background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.12)', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#374151', display: 'flex', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: '#0891b2', flexShrink: 0 }}>{i + 1}.</span>
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
