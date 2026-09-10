'use client';

import { BarChart3, TrendingUp, Newspaper, Users, Eye, Clock } from 'lucide-react';

const METRICS = [
  { label: 'Stories Published', value: '47', change: '+12%', icon: Newspaper, color: 'bg-indigo-500', up: true },
  { label: 'Total Views', value: '12.4K', change: '+8%', icon: Eye, color: 'bg-blue-500', up: true },
  { label: 'Avg Read Time', value: '3.2m', change: '+0.4m', icon: Clock, color: 'bg-emerald-500', up: true },
  { label: 'Warga Reports', value: '89', change: '+23%', icon: Users, color: 'bg-purple-500', up: true },
];

const TOP_STORIES = [
  { title: 'Banjir di Kemang kembali meluap', views: '2.1K', engagement: 85, publishedAt: '2h ago' },
  { title: 'MRT Fase 2 progress 45% — target 2027', views: '1.8K', engagement: 78, publishedAt: '5h ago' },
  { title: 'Grand opening rooftop garden cafe Kemang', views: '1.4K', engagement: 92, publishedAt: '1d ago' },
  { title: 'Macet parah Bundaran HI arah Blok M', views: '1.1K', engagement: 71, publishedAt: '1d ago' },
];

const TRAFFIC_SOURCES = [
  { source: 'Google Discover', visits: 4200, pct: 34 },
  { source: 'Direct', visits: 3100, pct: 25 },
  { source: 'Social (TikTok/IG)', visits: 2800, pct: 23 },
  { source: 'WhatsApp', visits: 1300, pct: 10 },
  { source: 'Other', visits: 900, pct: 8 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Performa konten dan engagement warga Depok</p>
      </div>

      {/* Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METRICS.map(({ label, value, change, icon: Icon, color, up }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${color}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
            <p className={`mt-2 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-600'}`}>
              {change} dari minggu lalu
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Stories */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            Top Stories
          </h3>
          <div className="space-y-3">
            {TOP_STORIES.map((story, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{story.title}</p>
                    <p className="text-xs text-muted-foreground">{story.views} views · {story.publishedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${story.engagement}%` }} />
                  </div>
                  <span className="text-xs font-medium">{story.engagement}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Traffic Sources
          </h3>
          <div className="space-y-3">
            {TRAFFIC_SOURCES.map(({ source, visits, pct }) => (
              <div key={source}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{source}</span>
                  <span className="font-medium">{visits.toLocaleString()} <span className="text-muted-foreground">({pct}%)</span></span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-dashed p-3">
            <p className="text-xs text-muted-foreground">
              📊 Data analytics lanjutan (GA4, real-time users) akan terintegrasi setelah setup Google Analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
