'use client';

import { useState } from 'react';
import {
  ShoppingBag, DollarSign, TrendingUp, Package,
  Tag, Percent, Plus, Edit2, Trash2, Eye,
  ArrowUpRight, Loader2, AlertCircle,
} from 'lucide-react';

interface CommerceItem {
  id: string;
  storyTitle: string;
  productName: string;
  productType: 'affiliate' | 'editorial' | 'sponsored';
  price: string;
  originalPrice?: string;
  commission: string;
  platform: 'tokopedia' | 'shopee' | 'blibli' | 'lazada' | 'tiktokshop';
  status: 'draft' | 'linked' | 'published';
  clicks: number;
  conversions: number;
  revenue: string;
}

const COMMERCE_ITEMS: CommerceItem[] = [
  {
    id: 'c1',
    storyTitle: 'Grand Opening: Cafe Rooftop Garden di Kemang',
    productName: 'Voucher Diskon 20% — Kemang Rooftop Cafe',
    productType: 'editorial',
    price: 'Rp 0 (promo)',
    commission: '0%',
    platform: 'tiktokshop',
    status: 'linked',
    clicks: 342,
    conversions: 28,
    revenue: 'Rp 2.800.000',
  },
  {
    id: 'c2',
    storyTitle: 'BMKG Prediksi Cuaca Panas Depok Minggu Ini',
    productName: 'Sunscreen SPF 50+ — Rekomendasi Lokal',
    productType: 'affiliate',
    price: 'Rp 85.000',
    originalPrice: 'Rp 120.000',
    commission: '15%',
    platform: 'shopee',
    status: 'published',
    clicks: 1204,
    conversions: 67,
    revenue: 'Rp 8.505.000',
  },
  {
    id: 'c3',
    storyTitle: 'MRT Fase 2 Mencapai Progress 45%',
    productName: 'MRT Jakarta Commuter Card — Edisi Spesial',
    productType: 'editorial',
    price: 'Rp 50.000',
    commission: '0%',
    platform: 'tokopedia',
    status: 'draft',
    clicks: 0,
    conversions: 0,
    revenue: 'Rp 0',
  },
];

const PLATFORM_COLORS: Record<string, string> = {
  tokopedia: '#03a856',
  shopee: '#f59e0b',
  blibli: '#1977f3',
  lazada: '#0f62f2',
  tiktokshop: '#1e293b',
};

const TYPE_META = {
  affiliate: { label: 'Affiliate', color: '#f59e0b', bg: '#fef3c7' },
  editorial: { label: 'Editorial', color: '#3b82f6', bg: '#dbeafe' },
  sponsored: { label: 'Sponsored', color: '#8b5cf6', bg: '#ede9fe' },
};

export default function CommercePage() {
  const [filter, setFilter] = useState<'all' | 'draft' | 'linked' | 'published'>('all');

  const filtered = COMMERCE_ITEMS.filter(i => filter === 'all' || i.status === filter);
  const totalRevenue = COMMERCE_ITEMS.reduce((sum, i) => {
    const num = parseInt(i.revenue.replace(/[^0-9]/g, ''), 10) || 0;
    return sum + num;
  }, 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Commerce</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
            Rekomendasi produk & affiliate dari article &middot; Revenue transparan
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={15} />
          Tambah Produk
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 20,
        fontSize: 12,
        color: '#78350f',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Semua rekomendasi produk di HaloDepok menggunakan label transparan: <strong>Editorial</strong> (produk pilihan redaksi), <strong>Affiliate</strong> (komisi), atau <strong>Sponsored</strong> (iklan). Tidak ada rekomendasi tersembunyi.
        </span>
      </div>

      {/* Revenue Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {([
          { label: 'Total Revenue', value: `Rp ${totalRevenue.toLocaleString('id-ID')}`, icon: DollarSign, color: '#22c55e' },
          { label: 'Total Klik', value: COMMERCE_ITEMS.reduce((s, i) => s + i.clicks, 0).toLocaleString(), icon: Eye, color: '#3b82f6' },
          { label: 'Konversi', value: COMMERCE_ITEMS.reduce((s, i) => s + i.conversions, 0).toLocaleString(), icon: TrendingUp, color: '#f59e0b' },
          { label: 'Produk Aktif', value: COMMERCE_ITEMS.filter(i => i.status !== 'draft').length.toString(), icon: Package, color: '#8b5cf6' },
        ] as const).map(stat => (
          <div key={stat.label} style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <stat.icon size={13} color={stat.color} />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{stat.label}</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['all', 'draft', 'linked', 'published'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', border: '1px solid',
              borderColor: filter === f ? 'hsl(0 72% 50%)' : '#e2e8f0',
              background: filter === f ? 'hsl(0 72% 50%)' : 'white',
              color: filter === f ? 'white' : '#64748b',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Item List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(item => {
          const tm = TYPE_META[item.productType];
          const platformColor = PLATFORM_COLORS[item.platform] ?? '#64748b';
          return (
            <div
              key={item.id}
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Platform Icon */}
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: platformColor + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <ShoppingBag size={15} color={platformColor} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Top Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#64748b',
                      background: '#f1f5f9', padding: '2px 8px', borderRadius: 4,
                      textTransform: 'capitalize',
                    }}>
                      {item.platform}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: tm.color,
                      background: tm.bg, padding: '2px 8px', borderRadius: 4,
                    }}>
                      {tm.label}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color:
                        item.status === 'published' ? '#22c55e' :
                        item.status === 'linked' ? '#f59e0b' : '#94a3b8',
                      background:
                        item.status === 'published' ? '#dcfce7' :
                        item.status === 'linked' ? '#fef3c7' : '#f1f5f9',
                      padding: '2px 8px', borderRadius: 4,
                    }}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                    {item.originalPrice && (
                      <span style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through' }}>
                        {item.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Source */}
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>
                    Article: {item.storyTitle}
                  </p>

                  {/* Product */}
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
                    {item.productName}
                  </p>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{item.price}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Komisi: {item.commission}</span>
                    {item.status === 'published' && (
                      <>
                        <span style={{ fontSize: 11, color: '#64748b' }}>👁 {item.clicks}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>🛒 {item.conversions}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>{item.revenue}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn-ghost" style={{ padding: '6px 8px' }}>
                    <Edit2 size={13} />
                  </button>
                  <button className="btn-ghost" style={{ padding: '6px 8px' }}>
                    <Trash2 size={13} color="#ef4444" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <ShoppingBag size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Tidak ada produk</p>
            <p style={{ fontSize: 12 }}>Produk commerce akan muncul saat article memiliki rekomendasi produk</p>
          </div>
        )}
      </div>
    </div>
  );
}
