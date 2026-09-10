'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Radio, CheckCircle2, XCircle, AlertTriangle, Clock,
  MapPin, User, RefreshCw, Wifi, WifiOff, Plus, Loader2,
  Filter, ChevronRight,
} from 'lucide-react';

interface CitizenReport {
  id: string;
  text: string;
  location_text: string;
  location: { id: string; name: string } | null;
  category: string;
  media: Array<{ url: string; type: string }>;
  submitted_at: string;
  moderation_status: 'pending' | 'approved' | 'rejected';
  moderation_notes: string | null;
  confidence: number;
  story_signal: string | null;
  metadata: {
    reporter_name?: string;
    source?: string;
    [key: string]: unknown;
  };
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  flood:        { bg: '#dbeafe', text: '#1d4ed8' },
  traffic:      { bg: '#fef3c7', text: '#b45309' },
  fire:         { bg: '#fee2e2', text: '#dc2626' },
  accident:     { bg: '#fee2e2', text: '#dc2626' },
  public_safety:{ bg: '#fce7f3', text: '#be185d' },
  event:        { bg: '#dcfce7', text: '#15803d' },
  infrastructure:{ bg: '#f3e8ff', text: '#7c3aed' },
  business:     { bg: '#fef3c7', text: '#b45309' },
  weather:      { bg: '#e0f2fe', text: '#0369a1' },
  other:        { bg: '#f1f5f9', text: '#64748b' },
};

const STATUS_CONFIG = {
  pending:  { label: 'Pending', bg: '#fef3c7', text: '#92400e', icon: Clock },
  approved: { label: 'Approved', bg: '#dcfce7', text: '#166534', icon: CheckCircle2 },
  rejected: { label: 'Ditolak', bg: '#fee2e2', text: '#991b1b', icon: XCircle },
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return '—';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}d`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam`;
  return `${Math.floor(diff / 86400)} hari`;
}

export default function CitizensPage() {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchReports = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/citizen-reports?${params}`);
      const json = await res.json();
      if (res.ok) {
        setReports(json.reports ?? []);
        setLastFetched(new Date());
      } else {
        setError(json.error ?? 'Gagal memuat laporan');
      }
    } catch {
      setError('Tidak bisa connect ke database');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchReports(true); }, [fetchReports]);

  // Auto-refresh every 20s
  useEffect(() => {
    const interval = setInterval(() => fetchReports(false), 20000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    setUpdating(id);
    try {
      await fetch('/api/citizen-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, moderation_status: status }),
      });
      await fetchReports(false);
    } finally {
      setUpdating(null);
    }
  };

  const counts = reports.reduce((acc, r) => {
    acc[r.moderation_status] = (acc[r.moderation_status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px 0',
        borderBottom: '1px solid #f1f5f9',
        background: 'white',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sensor Warga</h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              {lastFetched ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wifi size={10} color="#22c55e" />
                  {reports.length} laporan &middot; {(counts['pending'] ?? 0)} perlu ditinjau
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <WifiOff size={10} color="#f59e0b" /> Memuat...
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => fetchReports(false)} className="btn-secondary" style={{ fontSize: 12 }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {([
            { key: 'all', label: `Semua (${reports.length})` },
            { key: 'pending', label: `Pending (${counts['pending'] ?? 0})` },
            { key: 'approved', label: `Approved (${counts['approved'] ?? 0})` },
            { key: 'rejected', label: `Ditolak (${counts['rejected'] ?? 0})` },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '8px 14px',
                fontSize: 12, fontWeight: filter === f.key ? 600 : 500,
                color: filter === f.key ? 'hsl(0 72% 50%)' : '#64748b',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${filter === f.key ? 'hsl(0 72% 50%)' : 'transparent'}`,
                cursor: 'pointer', marginBottom: -1,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
        {/* Info Banner */}
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          fontSize: 12, color: '#78350f', display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Sensor Warga</strong> menangkap laporan dari Twitter, Instagram DM, WhatsApp, dan form website.
            Approve yang valid untuk dibuat jadi story.
          </span>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: '#991b1b' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>Memuat laporan warga...</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Menghubungi Supabase</div>
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <Radio size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Belum ada laporan</div>
            <div style={{ fontSize: 12 }}>Laporan warga akan muncul di sini saat ada yang masuk</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.map(report => {
              const sc = STATUS_CONFIG[report.moderation_status];
              const cat = CATEGORY_COLORS[report.category] ?? { bg: '#f1f5f9', text: '#64748b' };
              const StatusIcon = sc.icon;
              return (
                <div
                  key={report.id}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '14px 18px',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Top Row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        borderRadius: 9999, padding: '2px 10px',
                        fontSize: 11, fontWeight: 600,
                        background: sc.bg, color: sc.text,
                      }}>
                        <StatusIcon size={10} /> {sc.label}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        background: cat.bg, color: cat.text,
                        padding: '2px 7px', borderRadius: 4,
                      }}>
                        {report.category.replace('_', ' ').toUpperCase()}
                      </span>
                      {report.confidence >= 80 && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: '#059669',
                          background: '#d1fae5', padding: '2px 7px', borderRadius: 4,
                        }}>
                          Confidence {report.confidence}%
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={10} /> {timeAgo(report.submitted_at)}
                    </span>
                  </div>

                  {/* Content */}
                  <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.6, margin: '0 0 8px' }}>
                    {report.text}
                  </p>

                  {/* Location & Meta */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: report.moderation_status === 'pending' ? 10 : 0 }}>
                    {report.location_text && (
                      <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MapPin size={10} /> {report.location_text}
                      </span>
                    )}
                    {report.metadata?.reporter_name && (
                      <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <User size={10} /> {String(report.metadata.reporter_name)}
                      </span>
                    )}
                    {report.metadata?.source && (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        via {String(report.metadata.source)}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {report.id.substring(0, 8)}...
                    </span>
                  </div>

                  {/* Actions */}
                  {report.moderation_status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="btn-primary"
                        style={{ fontSize: 12, padding: '7px 14px', background: '#22c55e' }}
                        onClick={() => handleModerate(report.id, 'approved')}
                        disabled={updating === report.id}
                      >
                        {updating === report.id
                          ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                          : <CheckCircle2 size={11} />
                        }
                        Approve &amp; Buat Story
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: '7px 14px' }}
                        onClick={() => handleModerate(report.id, 'rejected')}
                        disabled={updating === report.id}
                      >
                        <XCircle size={11} /> Tolak
                      </button>
                    </div>
                  )}

                  {report.moderation_status === 'approved' && report.story_signal && (
                    <Link
                      href={`/admin/article/${report.story_signal}`}
                      style={{
                        fontSize: 12, fontWeight: 600, color: '#3b82f6',
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      Lihat story <ChevronRight size={12} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
