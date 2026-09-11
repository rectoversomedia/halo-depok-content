'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { PenLine, Share2 } from 'lucide-react';

export default function AdminPage() {
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

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
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
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'DM Sans', system-ui, sans-serif", position: 'relative', overflow: 'hidden' }}>

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />

      {/* Bold gradient blobs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 65%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '50%', left: '-5%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '-5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Sticky Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px 32px',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(37,99,235,0.08)',
      }}>
        <img src="/logo.png" alt="HaloDepok" style={{ height: 108, width: 'auto', objectFit: 'contain' }} />
      </header>

      <div style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 69px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>

        <div style={{ textAlign: 'center', maxWidth: 720, width: '100%' }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>

            <Link href="/create" style={{
              flex: '1 1 280px', maxWidth: 340,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 22,
              padding: '40px 28px', textDecoration: 'none',
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
                width: 64, height: 64, borderRadius: 20,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                boxShadow: '0 10px 36px rgba(37,99,235,0.35)',
              }}>
                <PenLine size={28} color="white" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.01em' }}>Create Article</div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                URL, text, or keyword — Depok voice, 1000+ words
              </p>
            </Link>

            <Link href="/admin/social" style={{
              flex: '1 1 280px', maxWidth: 340,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'white', border: '1.5px solid #f0f0f0', borderRadius: 22,
              padding: '40px 28px', textDecoration: 'none',
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
                width: 64, height: 64, borderRadius: 20,
                background: 'linear-gradient(135deg, #1d9bf0, #0f78c4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                boxShadow: '0 10px 36px rgba(29,155,240,0.3)',
              }}>
                <Share2 size={28} color="white" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.01em' }}>Social Media</div>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                X, IG, FB, TikTok, Threads — copy & paste ready
              </p>
            </Link>

          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
