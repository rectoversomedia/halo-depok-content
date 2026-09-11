'use client';

import Link from 'next/link';
import { PenLine, Share2, ArrowRight } from 'lucide-react';

export default function AdminArticlePage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#fafafa',
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 440, width: '100%' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <img src="/logo.png" alt="HaloDepok" style={{ height: 120, width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/create" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 22px', background: 'white',
            border: '1.5px solid #f0f0f0', borderRadius: 16,
            textDecoration: 'none', color: '#1a1a2e',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PenLine size={18} color="white" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Create Article</div>
                <div style={{ fontSize: 12, color: '#c0c0c0' }}>URL, text, or keyword — HaloDepok article</div>
              </div>
            </div>
            <ArrowRight size={16} color="#c0c0c0" />
          </Link>

          <Link href="/admin/social" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 22px', background: 'white',
            border: '1.5px solid #f0f0f0', borderRadius: 16,
            textDecoration: 'none', color: '#1a1a2e',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: '#1d9bf0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Share2 size={18} color="white" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Social Media</div>
                <div style={{ fontSize: 12, color: '#c0c0c0' }}>Generate posts for X, IG, FB, TikTok</div>
              </div>
            </div>
            <ArrowRight size={16} color="#c0c0c0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
