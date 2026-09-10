'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, CheckCircle2, XCircle, ExternalLink, Loader2, Rss } from 'lucide-react';

interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  category: string;
  reliability_score: number;
  active: boolean;
  last_fetched_at: string | null;
}

// Semua RSS feed media Indonesia (gratis)
const DEFAULT_SOURCES: Omit<Source, 'id' | 'last_fetched_at'>[] = [
  // Government & Official
  { name: 'BNPB Indonesia', url: 'https://bnpb.go.id/feed', type: 'rss', category: 'government', reliability_score: 95, active: true },
  { name: 'DKI Jakarta', url: 'https://www.jakarta.go.id/rss', type: 'rss', category: 'government', reliability_score: 92, active: true },
  { name: 'BMKG Jakarta', url: 'https://www.bmkg.go.id/rss/jakarta.xml', type: 'rss', category: 'weather', reliability_score: 98, active: true },
  { name: 'Dishub DKI Jakarta', url: 'https://dishub.jakarta.go.id/feed', type: 'rss', category: 'traffic', reliability_score: 88, active: true },

  // Nasional
  { name: 'Detik News', url: 'https://news.detik.com/feed', type: 'rss', category: 'media', reliability_score: 85, active: true },
  { name: 'Kompas News', url: 'https://news.kompas.com/rss', type: 'rss', category: 'media', reliability_score: 90, active: true },
  { name: 'Tribun News Jakarta', url: 'https://jakarta.tribunnews.com/rss', type: 'rss', category: 'media', reliability_score: 80, active: true },
  { name: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/nasional/rss', type: 'rss', category: 'media', reliability_score: 88, active: true },
  { name: 'CNBC Indonesia', url: 'https://www.cnbcindonesia.com/news.rss', type: 'rss', category: 'media', reliability_score: 85, active: true },
  { name: 'Tempo News', url: 'https://nasional.tempo.co/rss', type: 'rss', category: 'media', reliability_score: 92, active: true },
  { name: 'Media Indonesia', url: 'https://www.mediaindonesia.com/feed', type: 'rss', category: 'media', reliability_score: 82, active: true },
  { name: 'Republika', url: 'https://www.republika.co.id/rss', type: 'rss', category: 'media', reliability_score: 84, active: true },
  { name: 'SINDO News', url: 'https://news.sindonews.com/rss', type: 'rss', category: 'media', reliability_score: 78, active: true },
  { name: 'Jawa Pos', url: 'https://www.jawapos.com/feed/', type: 'rss', category: 'media', reliability_score: 83, active: true },
  { name: 'Antara News Jakarta', url: 'https://www.antaranews.com/rss/aktual/tag/32', type: 'rss', category: 'media', reliability_score: 90, active: true },
  { name: 'JPNN', url: 'https://www.jpnn.com/rss', type: 'rss', category: 'media', reliability_score: 76, active: true },
  { name: 'Okezone News', url: 'https://news.okezone.com/rss', type: 'rss', category: 'media', reliability_score: 77, active: true },
  { name: 'Kontan', url: 'https://nasional.kontan.co.id/rss', type: 'rss', category: 'media', reliability_score: 80, active: true },
  { name: 'Bisnis Indonesia', url: 'https://bisnis.tempo.co/rss', type: 'rss', category: 'media', reliability_score: 85, active: true },

  // Jakarta Specific
  { name: 'Jakarta News - All', url: 'https://www.tempo.co/baik/indeks/20/jakarta', type: 'rss', category: 'local', reliability_score: 87, active: true },
  { name: 'Jakartakita.com', url: 'https://www.jakartakita.com/feed/', type: 'rss', category: 'local', reliability_score: 75, active: true },
  { name: 'Jakarta Herald', url: 'https://www.jakartaherald.com/feed/', type: 'rss', category: 'local', reliability_score: 70, active: true },
  { name: 'Warta Kota', url: 'https://wartakota.tribunnews.com/rss', type: 'rss', category: 'local', reliability_score: 78, active: true },
  { name: 'Pos Kota Jakarta', url: 'https://poskota.co.id/feed', type: 'rss', category: 'local', reliability_score: 72, active: true },

  // Traffic & Weather
  { name: 'Traffic Jakarta CCTV', url: 'https://www.bmkg.go.id/rss/jakarta.xml', type: 'rss', category: 'traffic', reliability_score: 95, active: true },
  { name: 'Weather Jakarta - AccuWeather', url: 'https://www.accuweather.com/en/id/jakarta/142817/weather-rss/142817', type: 'rss', category: 'weather', reliability_score: 88, active: true },

  // Entertainment & Lifestyle
  { name: 'Tribun Style', url: 'https://style.tribunnews.com/rss', type: 'rss', category: 'lifestyle', reliability_score: 74, active: true },
  { name: 'Kompas Lifestyle', url: 'https://lifestyle.kompas.com/rss', type: 'rss', category: 'lifestyle', reliability_score: 85, active: true },

  // Finance
  { name: 'Kompas Economia', url: 'https://ekonomi.kompas.com/rss', type: 'rss', category: 'finance', reliability_score: 86, active: true },
  { name: 'Detik Finance', url: 'https://finance.detik.com/rss', type: 'rss', category: 'finance', reliability_score: 83, active: true },

  // Sports
  { name: 'Detik Sport', url: 'https://sport.detik.com/rss', type: 'rss', category: 'sports', reliability_score: 80, active: true },
  { name: 'Kompas Sport', url: 'https://sport.kompas.com/rss', type: 'rss', category: 'sports', reliability_score: 82, active: true },

  // Tech
  { name: 'Detik inet', url: 'https://inet.detik.com/rss', type: 'rss', category: 'tech', reliability_score: 78, active: true },
  { name: 'Kompas Tekno', url: 'https://techno.kompas.com/rss', type: 'rss', category: 'tech', reliability_score: 80, active: true },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  government: { bg: '#fce7f3', text: '#be185d' },
  media: { bg: '#dbeafe', text: '#1d4ed8' },
  local: { bg: '#dcfce7', text: '#15803d' },
  weather: { bg: '#e0f2fe', text: '#0369a1' },
  traffic: { bg: '#fef3c7', text: '#b45309' },
  lifestyle: { bg: '#fce7f3', text: '#9d174d' },
  finance: { bg: '#f0fdf4', text: '#166534' },
  sports: { bg: '#eff6ff', text: '#1e40af' },
  tech: { bg: '#f5f3ff', text: '#6d28d9' },
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [fetching, setFetching] = useState<string | null>(null);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources');
      const data = await res.json();
      const dbSources: Source[] = data.sources ?? [];
      // Merge DB sources with defaults, DB wins
      const merged = DEFAULT_SOURCES.map(def => {
        const db = dbSources.find(s => s.url === def.url);
        return db ? { ...def, ...db, last_fetched_at: db.last_fetched_at } : { ...def, id: def.url, last_fetched_at: null };
      });
      setSources(merged);
    } catch {
      setSources(DEFAULT_SOURCES.map((s, i) => ({ ...s, id: s.url, last_fetched_at: null })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSources(); }, []);

  const handleFetch = async (sourceId: string) => {
    setFetching(sourceId);
    try {
      await fetch(`/api/ingestion?sourceId=${sourceId}`, { method: 'POST' });
      await fetchSources();
    } finally {
      setFetching(null);
    }
  };

  const filtered = sources.filter(s => {
    if (filter === 'active') return s.active;
    if (filter === 'inactive') return !s.active;
    if (filter === 'gov') return s.category === 'government';
    if (filter === 'media') return s.category === 'media';
    if (filter === 'local') return s.category === 'local';
    if (filter === 'traffic') return s.category === 'traffic';
    if (filter === 'weather') return s.category === 'weather';
    return true;
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sources</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
            {sources.length} RSS feeds Indonesia · AI auto-fetch setiap beberapa menit
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={15} />
          Tambah Source
        </button>
      </div>

      {/* Info */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '14px 16px',
        marginBottom: 20,
        fontSize: 12,
        color: '#475569',
        lineHeight: 1.6,
      }}>
        <strong style={{ color: '#1e293b' }}>Sources</strong> adalah RSS feeds dari media dan website resmi Indonesia.
        AI akan otomatis scan feeds ini untuk menemukan story baru yang relevan untuk Depok.
        Story yang ditemukan masuk ke <strong style={{ color: '#1e293b' }}>Story Inbox</strong> sebagai "Discovered".
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {[
          { key: 'all', label: `Semua (${sources.length})` },
          { key: 'government', label: 'Government' },
          { key: 'media', label: 'Media' },
          { key: 'local', label: 'Jakarta' },
          { key: 'traffic', label: 'Traffic' },
          { key: 'weather', label: 'Cuaca' },
          { key: 'active', label: 'Aktif' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filter === f.key ? 'hsl(0 72% 50%)' : '#e2e8f0',
              background: filter === f.key ? 'hsl(0 72% 50%)' : 'white',
              color: filter === f.key ? 'white' : '#64748b',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Source List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '32px', color: '#94a3b8' }}>
          <Loader2 size={16} className="animate-spin" />
          <span style={{ fontSize: 13 }}>Memuat sources...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(source => {
            const cat = CATEGORY_COLORS[source.category] ?? { bg: '#f1f5f9', text: '#64748b' };
            return (
              <div
                key={source.id}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  background: '#fff1f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Rss size={14} color="#ef4444" />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{source.name}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      background: cat.bg,
                      color: cat.text,
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}>
                      {source.category.toUpperCase()}
                    </span>
                    {source.active ? (
                      <CheckCircle2 size={11} color="#22c55e" />
                    ) : (
                      <XCircle size={11} color="#ef4444" />
                    )}
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 10,
                      color: '#94a3b8',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    {source.url}
                    <ExternalLink size={9} />
                  </a>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{source.reliability_score}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>score</div>
                </div>

                {/* Fetch */}
                <button
                  onClick={() => handleFetch(source.id)}
                  disabled={fetching === source.id || !source.active}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#64748b',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {fetching === source.id ? (
                    <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <RefreshCw size={11} />
                  )}
                  Fetch
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
