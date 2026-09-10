'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, Clock, MapPin, Eye,
  FileText, Video, Instagram, Twitter, Copy,
  Zap, Shield, TrendingUp, User, Award, Globe,
  Edit2, Save, Loader2, RefreshCw, Wifi, WifiOff,
  Send, ExternalLink,
} from 'lucide-react';

interface StoryData {
  id: string;
  title: string;
  summary: string;
  status: string;
  classification: string;
  importance_score: number;
  locality_score: number;
  novelty_score: number;
  urgency_score: number;
  first_seen_at: string;
  last_updated_at: string;
  published_at: string | null;
  location: { id: string; name: string; type: string } | null;
  article: {
    id: string;
    title: string;
    dek: string;
    summary: string;
    body: string;
    sources_section: string;
    status: string;
    generated_by: string;
    created_at: string;
    updated_at: string;
    word_count: number;
  } | null;
  articles: Array<{
    id: string;
    title: string;
    dek: string;
    summary: string;
    body: string;
    sources_section: string;
    status: string;
    generated_by: string;
    created_at: string;
    updated_at: string;
  }>;
  socials: Array<{
    id: string;
    format: string;
    hook: string;
    caption: string;
    body: string;
    status: string;
    created_at: string;
  }>;
  claims: Array<{
    id: string;
    claim_text: string;
    claim_type: string;
    confidence: number;
    verification_status: string;
    evidence_count: number;
    evidence: Array<{
      id: string;
      evidence_text: string;
      relevance_score: number;
      sources: { id: string; name: string; url: string } | null;
    }>;
  }>;
  seo: {
    seo_title: string;
    meta_description: string;
    slug: string;
    keywords: string[];
  } | null;
  eeat: {
    experience_score: number;
    expertise_score: number;
    authoritativeness_score: number;
    trustworthiness_score: number;
    overall_score: number;
    recommendations: string[];
  } | null;
  geo: {
    tldr: string;
    key_facts: Record<string, unknown>;
    location_context: string;
    date_context: string;
    entities_list: string[];
    verified_claims: string[];
    uncertain_claims: string[];
  } | null;
}

const STATUS_META: Record<string, { label: string }> = {
  discovered:            { label: 'Discovered' },
  investigating:         { label: 'Investigasi' },
  verification_required: { label: 'Verifikasi' },
  verified:              { label: 'Verified' },
  content_ready:         { label: 'Content Ready' },
  editor_review:         { label: 'Editor Review' },
  approved:              { label: 'Approved' },
  scheduled:             { label: 'Scheduled' },
  published:             { label: 'Published' },
  rejected:              { label: 'Ditolak' },
};

function wordCount(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'article' | 'factory' | 'claims' | 'history'>('article');
  const [copied, setCopied] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [articleBody, setArticleBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stories/${id}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
          setArticleBody(json.article?.body ?? '');
        } else {
          setError(json.error ?? 'Article tidak ditemukan');
        }
      } catch {
        setError('Tidak bisa memuat article. Cek koneksi internet.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>Memuat dari Supabase...</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>{id}</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
        <WifiOff size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Gagal memuat</div>
        <div style={{ fontSize: 12 }}>{error ?? 'Article tidak ditemukan'}</div>
        <Link href="/admin/article" style={{ marginTop: 16, fontSize: 12, color: '#3b82f6' }}>
          ← Kembali ke Article
        </Link>
      </div>
    );
  }

  const story = data;
  const article = data.article;
  const sm = STATUS_META[story.status] ?? { label: story.status };

  // Build social content from DB or fallback
  const tiktok = data.socials.find(s => s.format === 'tiktok');
  const instagram = data.socials.find(s => s.format === 'instagram_carousel');
  const xPost = data.socials.find(s => s.format === 'x_post');

  const tiktokBody = tiktok?.body ?? article?.body
    ? `[OPEN on scene]\n\n[NARRATOR]: "${(article?.body ?? '').substring(0, 200)}..."\n\n[CLOSING]: "Stay safe, warga Depok."`
    : 'TikTok script akan di-generate otomatis saat article ready.';

  const igBody = instagram?.body ?? `Slide 1: ${story.title}\n\nSlide 2: ${story.summary}\n\nSlide 3: Lokasi: ${story.location?.name ?? 'Depok'}`;

  const xBody = xPost?.body ?? `🚨 ${story.title}\n\n${story.summary}\n\n📍 ${story.location?.name ?? 'Depok'}`;

  const verifClaims = data.claims.filter(c => ['verified', 'partially_verified'].includes(c.verification_status));
  const unverifClaims = data.claims.filter(c => c.verification_status === 'unverified');

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Back Nav */}
      <div style={{
        padding: '14px 28px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <Link href="/admin/article" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', textDecoration: 'none' }}>
          <ArrowLeft size={14} />
          Kembali ke Article
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wifi size={10} color="#22c55e" /> Live
          </span>
          {isEditing ? (
            <button className="btn-primary" style={{ fontSize: 11, padding: '6px 12px', background: '#22c55e' }} onClick={() => setIsEditing(false)}>
              <Save size={11} /> Simpan
            </button>
          ) : (
            <button className="btn-secondary" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => setIsEditing(true)}>
              <Edit2 size={11} /> Edit
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* Story Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className={`status-label ${story.status}`}>
              <span className={`status-dot ${story.status}`} />
              {sm.label}
            </span>
            {story.location && (
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={10} /> {story.location.name}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} /> {new Date(story.last_updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
            {article?.generated_by && (
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={10} color="#3b82f6" /> {article.generated_by}
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.3 }}>
            {story.title || 'Tanpa judul'}
          </h1>
          {story.summary && (
            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
              {story.summary}
            </p>
          )}
        </div>

        {/* Score & Action Bar */}
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 20,
          marginBottom: 16, flexWrap: 'wrap',
        }}>
          {/* Score Bars */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flex: 1 }}>
            {[
              { label: 'Importance', value: story.importance_score },
              { label: 'Locality', value: story.locality_score },
              { label: 'Novelty', value: story.novelty_score },
              { label: 'Urgency', value: story.urgency_score },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{s.label}</span>
                <div style={{ width: 50, height: 5, background: '#f1f5f9', borderRadius: 9999 }}>
                  <div style={{
                    width: `${s.value}%`, height: '100%', borderRadius: 9999,
                    background: s.value >= 70 ? '#22c55e' : s.value >= 40 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* E-E-A-T Quick View */}
          {data.eeat && (
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'E', value: data.eeat.experience_score },
                { label: 'X', value: data.eeat.expertise_score },
                { label: 'A', value: data.eeat.authoritativeness_score },
                { label: 'T', value: data.eeat.trustworthiness_score },
              ].map(e => (
                <div key={e.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{e.value}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{e.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-primary" style={{ fontSize: 12, padding: '7px 14px', background: '#22c55e' }}>
              <CheckCircle2 size={12} /> Publish
            </button>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }}>
              <Eye size={12} /> Preview
            </button>
            <button className="btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }}>
              <RefreshCw size={12} /> AI Re-score
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
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
                background: 'transparent', cursor: 'pointer', marginBottom: -1,
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Article */}
        {activeTab === 'article' && (
          <div>
            {/* Article Info Banner */}
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '12px 16px', marginBottom: 16,
              fontSize: 12, color: '#64748b', display: 'flex', gap: 20, flexWrap: 'wrap',
            }}>
              <span><strong>Word count:</strong> {wordCount(article?.body ?? '').toLocaleString('id-ID')} kata</span>
              {data.geo?.location_context && <span><strong>Lokasi:</strong> {data.geo.location_context}</span>}
              {data.geo?.date_context && <span><strong>Waktu:</strong> {data.geo.date_context}</span>}
              {data.seo?.keywords && (data.seo.keywords as string[]).length > 0 && <span><strong>Keywords:</strong> {(data.seo.keywords as string[]).slice(0, 5).join(', ')}</span>}
            </div>

            {article ? (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>Article Content</h3>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                      Min 1000 kata &middot; {wordCount(article.body ?? '') >= 1000 ? '✓' : `${wordCount(article.body ?? '')}/1000`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-secondary" style={{ fontSize: 11 }}>
                      <Zap size={11} /> Regenerate
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Headline (H1)
                    </label>
                    <input
                      value={article.title}
                      disabled={!isEditing}
                      style={{
                        width: '100%', padding: '10px 14px',
                        border: '1px solid #e2e8f0', borderRadius: 8,
                        fontSize: 16, fontWeight: 700, color: '#0f172a',
                        outline: 'none', background: isEditing ? 'white' : '#f8fafc',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Dek (Subtitle)
                    </label>
                    <input
                      value={article.dek ?? ''}
                      disabled={!isEditing}
                      style={{
                        width: '100%', padding: '10px 14px',
                        border: '1px solid #e2e8f0', borderRadius: 8,
                        fontSize: 13, color: '#475569',
                        outline: 'none', background: isEditing ? 'white' : '#f8fafc',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Body ({wordCount(article.body ?? '')} kata)
                    </label>
                    <textarea
                      value={isEditing ? articleBody : article.body ?? ''}
                      onChange={e => setArticleBody(e.target.value)}
                      disabled={!isEditing}
                      rows={24}
                      style={{
                        width: '100%', padding: '12px 14px',
                        border: '1px solid #e2e8f0', borderRadius: 8,
                        fontSize: 13, color: '#1e293b', lineHeight: 1.8,
                        outline: 'none', resize: 'vertical',
                        background: isEditing ? 'white' : '#f8fafc',
                        fontFamily: 'Georgia, serif',
                      }}
                    />
                    <div style={{
                      fontSize: 11, marginTop: 4,
                      color: wordCount(articleBody || (article.body ?? '')) >= 1000 ? '#22c55e' : '#f59e0b',
                    }}>
                      {wordCount(articleBody || (article.body ?? ''))}/{'1000'} kata target
                      {wordCount(articleBody || (article.body ?? '')) >= 1000 ? ' ✓' : ' — perlu ditambah'}
                    </div>
                  </div>

                  {article.sources_section && (
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                        Sources
                      </label>
                      <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                        {article.sources_section}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'white', border: '1px solid #e2e8f0',
                borderRadius: 12, padding: '40px 24px', textAlign: 'center',
              }}>
                <FileText size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Belum ada article</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
                  AI akan generate article saat story masuk ke status "Content Ready"
                </div>
                <button className="btn-primary" style={{ fontSize: 12 }}>
                  <Zap size={11} /> Generate Article Sekarang
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Content Factory */}
        {activeTab === 'factory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { platform: 'tiktok', label: 'TikTok', icon: Video, color: '#1e293b', bg: '#f1f5f9', body: tiktokBody },
              { platform: 'instagram', label: 'Instagram Carousel', icon: Instagram, color: '#be185d', bg: '#fce7f3', body: igBody },
              { platform: 'x', label: 'X / Twitter', icon: Twitter, color: '#1e293b', bg: '#f1f5f9', body: xBody },
            ].map(p => (
              <div key={p.platform} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p.icon size={16} color={p.color} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0 }}>{p.label}</h3>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        {p.platform === 'x' ? `${xBody.length}/280 karakter` : 'AI-generated'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-secondary" style={{ fontSize: 11 }}><Zap size={11} /> Regenerate</button>
                    <button className="btn-secondary" style={{ fontSize: 11 }} onClick={() => copy(p.body, p.platform)}>
                      {copied === p.platform
                        ? <><CheckCircle2 size={11} color="#22c55e" /> Disalin!</>
                        : <><Copy size={11} /> Salin</>
                      }
                    </button>
                    <button className="btn-primary" style={{ fontSize: 11, padding: '6px 12px', background: p.color }}>
                      <Send size={11} /> Publish
                    </button>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, color: '#1e293b', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Claims */}
        {activeTab === 'claims' && (
          <div>
            {data.claims.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                <Shield size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Belum ada klaim</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Klaim akan muncul saat AI memproses article</div>
              </div>
            ) : (
              <>
                {verifClaims.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Verified ({verifClaims.length})
                    </div>
                    {verifClaims.map(c => (
                      <div key={c.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', gap: 10 }}>
                        <CheckCircle2 size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 3px' }}>{c.claim_text}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                            Confidence: {c.confidence}% &middot; Evidence: {c.evidence_count}
                            {c.evidence.length > 0 && ` · Source: ${c.evidence[0].sources?.name ?? 'Unknown'}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {unverifClaims.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 }}>
                      Perlu Verifikasi ({unverifClaims.length})
                    </div>
                    {unverifClaims.map(c => (
                      <div key={c.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', gap: 10 }}>
                        <Shield size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 3px' }}>{c.claim_text}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Confidence: {c.confidence}%</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
              Log aktivitas story ini dari pertama kali di-discover
            </div>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 20px' }}>
              {[
                { time: story.last_updated_at, action: `Status terakhir: ${sm.label}`, actor: 'System', icon: Clock },
                { time: story.first_seen_at, action: 'Story di-discover dari RSS source', actor: 'RSS Ingestion', icon: Zap },
                ...(article ? [{ time: article.created_at, action: 'Article di-generate oleh AI', actor: article.generated_by, icon: FileText }] : []),
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 16 : 0, position: 'relative' }}>
                  {i < 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0', border: '2px solid #cbd5e1' }} />
                      {i === 0 && <div style={{ width: 1, flex: 1, background: '#e2e8f0', marginTop: 4 }} />}
                    </div>
                  )}
                  <div style={{ flex: 1, paddingBottom: 16, paddingLeft: i === 2 ? 0 : 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: '0 0 2px' }}>{h.action}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                      {h.actor} &middot; {new Date(h.time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
