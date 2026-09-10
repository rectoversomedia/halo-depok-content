'use client';

import { useState } from 'react';
import { Settings, Key, Database, Globe, Shield, Bell, Save } from 'lucide-react';

const TABS = [
  { key: 'general', label: 'Umum', icon: Settings },
  { key: 'ai', label: 'AI & API', icon: Key },
  { key: 'publishing', label: 'Publishing', icon: Globe },
  { key: 'security', label: 'Keamanan', icon: Shield },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('general');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Konfigurasi HaloDepok Content Factory</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 space-y-0.5">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${tab === key ? 'bg-depok-red text-white' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {tab === 'general' && (
            <>
              <SettingsCard title="Informasi Platform" description="Pengaturan umum HaloDepok">
                <FormField label="Nama Platform" defaultValue="HaloDepok Content Factory" />
                <FormField label="Domain" defaultValue="https://halodepok.com" />
                <FormField label="Zona Waktu" defaultValue="Asia/Jakarta (GMT+7)" />
                <FormField label="Bahasa Default" defaultValue="Bahasa Indonesia" />
              </SettingsCard>
              <SettingsCard title="Lokasi" description="Cakupan area berita">
                <FormField label="Kota" defaultValue="Depok" />
                <FormField label="Kelurahan" defaultValue="Kemang, Blok M, Tebet, Cipete, Senayan..." />
              </SettingsCard>
            </>
          )}

          {tab === 'ai' && (
            <>
              <SettingsCard title="AI Provider" description="Konfigurasi koneksi AI">
                <FormField label="Provider" defaultValue="OpenAI" />
                <FormField label="Model" defaultValue="gpt-4o-mini" />
                <FormField label="Temperature Default" defaultValue="0.7" />
                <FormField label="Max Tokens" defaultValue="2048" />
                <div className="rounded border border-amber-200 bg-amber-50 p-3 dark:bg-amber-950/30">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ API key tersimpan di <code className="bg-amber-100 px-1 rounded">.env.local</code> — tidak ditampilkan di sini untuk keamanan.
                  </p>
                </div>
              </SettingsCard>
              <SettingsCard title="Agent Settings" description="Konfigurasi AI agents">
                <FormField label="Max Concurrent Runs" defaultValue="5" />
                <FormField label="Retry on Failure" defaultValue="3" />
                <FormField label="Timeout per Run" defaultValue="30s" />
              </SettingsCard>
            </>
          )}

          {tab === 'publishing' && (
            <>
              <SettingsCard title="WordPress" description="Konfigurasi publishing ke WordPress">
                <FormField label="WP API URL" defaultValue="https://api.halodepok.com" />
                <FormField label="WP Username" defaultValue="halodepok_admin" />
                <FormField label="Auto-Publish" defaultValue="false" type="checkbox" />
                <div className="rounded border border-dashed p-3">
                  <p className="text-xs text-muted-foreground">Password tersimpan di environment variable.</p>
                </div>
              </SettingsCard>
              <SettingsCard title="Social Media" description="Konfigurasi auto-posting">
                <FormField label="TikTok Auto-Post" defaultValue="false" type="checkbox" />
                <FormField label="Instagram Auto-Post" defaultValue="false" type="checkbox" />
                <FormField label="X (Twitter) Auto-Post" defaultValue="false" type="checkbox" />
              </SettingsCard>
            </>
          )}

          {tab === 'security' && (
            <>
              <SettingsCard title="Authentication" description="Pengaturan keamanan login">
                <FormField label="Require Login" defaultValue="true" type="checkbox" />
                <FormField label="Session Timeout" defaultValue="8 hours" />
                <FormField label="Two-Factor Auth" defaultValue="false" type="checkbox" />
              </SettingsCard>
              <SettingsCard title="Editorial Standards" description="Pengaturan standar keamanan konten">
                <FormField label="Block Unverified Claims" defaultValue="true" type="checkbox" />
                <FormField label="Require Human Approval" defaultValue="true" type="checkbox" />
                <FormField label="Max AI Confidence Threshold" defaultValue="80" />
              </SettingsCard>
            </>
          )}

          <button className="flex items-center gap-2 rounded-lg bg-depok-red px-6 py-2.5 text-sm font-medium text-white hover:bg-red-600">
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-4 text-xs text-muted-foreground">{description}</p>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function FormField({ label, defaultValue, type = 'text' }: { label: string; defaultValue: string; type?: string }) {
  if (type === 'checkbox') {
    return (
      <div className="flex items-center gap-3">
        <input type="checkbox" defaultChecked={defaultValue === 'true'} className="h-4 w-4 rounded border-gray-300" />
        <label className="text-sm">{label}</label>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      <label className="flex items-center text-sm text-muted-foreground">{label}</label>
      <input
        type="text"
        defaultValue={defaultValue}
        className="col-span-2 rounded-lg border bg-background px-3 py-1.5 text-sm"
      />
    </div>
  );
}
