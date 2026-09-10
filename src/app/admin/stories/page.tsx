'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, ArrowRight, ExternalLink, CheckCircle2, Clock } from 'lucide-react';

// ============================================================
// STORIES — Fokus utama bikin konten
// Flow: Discovered → Investigasi → Verifikasi → Verified → Content Ready → Editor Review → Publish
// ============================================================

const STORIES = [
  {
    id: 's1',
    title: 'Banjir di Kemang kembali meluap setelah hujan deras 3 jam — 12 titik genangan dilaporkan',
    summary: 'Hujan deras mengguyur Depok lebih dari 3 jam menyebabkan banjir di Kemang. Tinggi air 30-50cm di beberapa titik.',
    status: 'content_ready',
    score: 87,
    location: 'Kemang',
    sources: 3,
    time: '15 menit lalu',
    tags: ['Banjir', 'Kemang', 'Urgent'],
    hasArticle: true,
    hasTikTok: true,
    hasInstagram: true,
    hasX: true,
  },
  {
    id: 's2',
    title: 'Macet parah di Bundaran HI arah Blok M akibat proyek drainase — alternate route disarankan',
    summary: 'Kemacetan parah terjadi di Bundaran HI arah Blok M akibat proyek drainase yang sedang berlangsung.',
    status: 'editor_review',
    score: 72,
    location: 'Senayan',
    sources: 2,
    time: '32 menit lalu',
    tags: ['Lalu Lintas'],
    hasArticle: true,
    hasTikTok: true,
    hasInstagram: false,
    hasX: true,
  },
  {
    id: 's3',
    title: 'Grand opening: Cafe rooftop garden di Kemang mulai besok — warga lokal dirikan',
    summary: 'Cafe baru dengan konsep rooftop garden dan tanaman hijau grand opening besok di Jl. Kemang Raya.',
    status: 'verified',
    score: 65,
    location: 'Kemang',
    sources: 1,
    time: '1 jam lalu',
    tags: ['Bisnis'],
    hasArticle: false,
    hasTikTok: false,
    hasInstagram: false,
    hasX: false,
  },
  {
    id: 's4',
    title: 'Dinas LH Depok klaim kualitas udara membaik setelah hujan deras — PM2.5 turun signifikan',
    summary: 'PM2.5 turun dari 45 menjadi 18 µg/m³ setelah hujan deras mengguyur Depok.',
    status: 'investigating',
    score: 58,
    location: 'Depok',
    sources: 1,
    time: '2 jam lalu',
    tags: ['Lingkungan'],
    hasArticle: false,
    hasTikTok: false,
    hasInstagram: false,
    hasX: false,
  },
  {
    id: 's5',
    title: 'MRT Fase 2 mencapai progress 45% — target rampung 2027, termasuk stasiun Blok M',
    summary: 'Proyek MRT Fase 2 reaches 45% progress. Target rampung 2027 dengan stasiun Blok M dan Antasari.',
    status: 'discovered',
    score: 91,
    location: 'Blok M',
    sources: 2,
    time: '3 jam lalu',
    tags: ['Transportasi', 'MRT'],
    hasArticle: false,
    hasTikTok: false,
    hasInstagram: false,
    hasX: false,
  },
];

const STATUS_META: Record<string, { label: string }> = {
  discovered:           { label: 'Discovered' },
  investigating:        { label: 'Investigasi' },
  verification_required: { label: 'Verifikasi' },
  verified:             { label: 'Verified' },
  content_ready:        { label: 'Content Ready' },
  editor_review:        { label: 'Editor Review' },
  approved:             { label: 'Approved' },
  scheduled:            { label: 'Scheduled' },
  published:            { label: 'Published' },
  rejected:             { label: 'Ditolak' },
};

const WORKFLOW_ORDER = [
  { key: 'discovered', label: 'Discovered' },
  { key: 'investigating', label: 'Investigasi' },
  { key: 'verification_required', label: 'Verifikasi' },
  { key: 'verified', label: 'Verified' },
  { key: 'content_ready', label: 'Content Ready' },
  { key: 'editor_review', label: 'Editor Review' },
  { key: 'published', label: 'Published' },
];

export default function StoriesPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = STORIES.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.status === filter || (filter === 'pending' && ['discovered', 'investigating', 'verification_required', 'editor_review'].includes(s.status));
    return matchSearch && matchFilter;
  });

  const counts = STORIES.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Stories</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
            {STORIES.length} story · {STORIES.filter(s => ['discovered', 'investigating', 'verification_required', 'editor_review'].includes(s.status)).length} perlu action
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={15} />
          Story Baru
        </button>
      </div>

      {/* Workflow Bar */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '14px 20px',
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', margin: '0 0 10px', textTransform: 'uppercase' }}>
          Workflow Editorial
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {WORKFLOW_ORDER.map((step, i) => (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 4px',
                borderRadius: 8,
                background: counts[step.key] ? '#f8fafc' : 'transparent',
                border: counts[step.key] ? '1px solid #e2e8f0' : '1px solid transparent',
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>
                  {step.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                  {counts[step.key] ?? 0}
                </span>
              </div>
              {i < WORKFLOW_ORDER.length - 1 && (
                <ArrowRight size={12} style={{ color: '#cbd5e1', flexShrink: 0, margin: '0 2px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Cari story..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 32px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 13,
              outline: 'none',
              background: 'white',
              color: '#1e293b',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Perlu Action' },
            { key: 'content_ready', label: 'Content Ready' },
            { key: 'editor_review', label: 'Editor Review' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: filter === f.key ? 'hsl(0 72% 50%)' : '#e2e8f0',
                background: filter === f.key ? 'hsl(0 72% 50%)' : 'white',
                color: filter === f.key ? 'white' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Story List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(story => {
          const meta = STATUS_META[story.status] ?? { label: story.status };
          return (
            <Link
              key={story.id}
              href={`/admin/stories/${story.id}`}
              style={{
                display: 'block',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px 20px',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                {/* Left: Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Top row: status + tags + time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span className={`status-label ${story.status}`}>
                      <span className={`status-dot ${story.status}`} />
                      {meta.label}
                    </span>
                    {story.tags.map(tag => (
                      <span key={tag} className={`tag ${tag.toLowerCase().includes('lalu') || tag.toLowerCase().includes('tran') ? 'traffic' : tag.toLowerCase().includes('ling') ? 'weather' : tag.toLowerCase().includes('bisn') ? 'biz' : tag === 'Urgent' ? 'urgent' : 'source'}`}>
                        {tag}
                      </span>
                    ))}
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>
                      {story.time} · {story.sources} sources
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.4 }}>
                    {story.title}
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    {story.summary}
                  </p>

                  {/* Bottom: location + content factory */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{story.location}</span>
                    {story.hasArticle && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#3b82f6', background: '#dbeafe', padding: '1px 6px', borderRadius: 4 }}>
                        Article
                      </span>
                    )}
                    {story.hasTikTok && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>
                        TikTok
                      </span>
                    )}
                    {story.hasInstagram && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#be185d', background: '#fce7f3', padding: '1px 6px', borderRadius: 4 }}>
                        IG
                      </span>
                    )}
                    {story.hasX && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#1e293b', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>
                        X
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Score + Action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  {/* Score */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: story.score >= 80 ? '#22c55e' : story.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                      {story.score}
                    </div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>/ 100</div>
                  </div>

                  {/* CTA */}
                  {story.status === 'content_ready' && (
                    <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                      Publish <ArrowRight size={12} />
                    </button>
                  )}
                  {story.status === 'editor_review' && (
                    <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', background: '#22c55e' }}>
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  )}
                  {story.status !== 'content_ready' && story.status !== 'editor_review' && (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Review →</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Tidak ada story</p>
            <p style={{ fontSize: 12 }}>Story akan muncul di sini setelah AI discovery menemukan dari RSS sources</p>
          </div>
        )}
      </div>
    </div>
  );
}
