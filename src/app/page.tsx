'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { PenLine, Share2, Zap, MapPin, Globe, TrendingUp } from 'lucide-react';

const FEATURES = [
  { icon: Zap, label: 'AI-Powered', desc: 'Smart rewrite engine with E-E-A-T & Yoast SEO compliance' },
  { icon: MapPin, label: 'Hyperlocal', desc: 'Depok-specific voice — Kemang, Blok M, Tebet, and beyond' },
  { icon: Globe, label: 'Multi-Platform', desc: 'One article, endless social posts for X, IG, FB, TikTok' },
  { icon: TrendingUp, label: 'SEO Optimized', desc: 'Out-of-the-box compliant with Google\'s quality guidelines' },
];

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      opacityDir: Math.random() > 0.5 ? 1 : -1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacityDir * 0.004;
        if (p.opacity > 0.75) p.opacityDir = -1;
        if (p.opacity < 0.08) p.opacityDir = 1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37,99,235,${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", overflow: 'hidden', position: 'relative' }}>

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Bold gradient blobs */}
      <div style={{ position: 'fixed', top: '-15%', right: '-8%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '40%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '30%', right: '-5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Sticky Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px 32px',
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(37,99,235,0.08)',
        }}>
          <img src="/logo.png" alt="HaloDepok" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        </header>

        {/* Hero */}
        <section style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px 40px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)',
            borderRadius: 9999, padding: '6px 16px', marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Depok — Hyperlocal Newsroom</span>
          </div>

          <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: 16 }}>
            Hyperlocal Depok Newsroom
            <br />
            <span style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Built for Speed
            </span>
          </h1>

          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, lineHeight: 1.75, marginBottom: 40 }}>
            Paste a URL or keyword — get a full Depok article in seconds. SEO-optimized, WordPress-ready, social posts included.
          </p>

          {/* Cards side by side */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 780 }}>

            {/* Create Article */}
            <Link href="/create" style={{
              flex: '1 1 300px', maxWidth: 360,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 24,
              padding: '36px 28px', textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = 'rgba(37,99,235,0.4)';
                el.style.boxShadow = '0 8px 40px rgba(37,99,235,0.14)';
                el.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = '#f0f0f0';
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 68, height: 68, borderRadius: 22,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                boxShadow: '0 12px 40px rgba(37,99,235,0.35)',
              }}>
                <PenLine size={30} color="white" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>Create Article</div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, marginBottom: 18 }}>
                URL, text, or keyword — AI rewrites it in Depok voice, 1000+ words, SEO-ready
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['Yoast SEO', 'E-E-A-T', 'GEO'].map(tag => (
                  <span key={tag} style={{
                    fontSize: 11, fontWeight: 700, color: '#2563eb',
                    background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)',
                    padding: '4px 12px', borderRadius: 9999, letterSpacing: '0.03em',
                  }}>{tag}</span>
                ))}
              </div>
            </Link>

            {/* Social Media */}
            <Link href="/admin/social" style={{
              flex: '1 1 300px', maxWidth: 360,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 24,
              padding: '36px 28px', textDecoration: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = 'rgba(29,155,240,0.4)';
                el.style.boxShadow = '0 8px 40px rgba(29,155,240,0.14)';
                el.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = '#f0f0f0';
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 68, height: 68, borderRadius: 22,
                background: 'linear-gradient(135deg, #1d9bf0, #0f78c4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                boxShadow: '0 12px 40px rgba(29,155,240,0.3)',
              }}>
                <Share2 size={30} color="white" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>Social Media</div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, marginBottom: 18 }}>
                Generate AI-powered posts for X, Instagram, Facebook, TikTok & Threads — copy & paste ready
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['X / Twitter', 'Instagram', 'TikTok', 'Facebook', 'Threads'].map(tag => (
                  <span key={tag} style={{
                    fontSize: 11, fontWeight: 700, color: '#1d9bf0',
                    background: 'rgba(29,155,240,0.07)', border: '1px solid rgba(29,155,240,0.15)',
                    padding: '4px 12px', borderRadius: 9999,
                  }}>{tag}</span>
                ))}
              </div>
            </Link>

          </div>
        </section>

        {/* Features */}
        <section style={{ width: '100%', padding: '8px 24px 72px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{
                  background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 16, padding: '18px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="#2563eb" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '20px 24px 32px', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0 }}>
            HaloDepok Content Factory &mdash; Depok, Indonesia
          </p>
        </footer>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
