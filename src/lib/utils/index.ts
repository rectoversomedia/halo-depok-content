import CryptoJS from 'crypto-js';

// ============================================================
// JAKSELNEWS CONTENT FACTORY — Utility Functions
// ============================================================

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(prefix?: string): string {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function hashContent(content: string): string {
  return CryptoJS.SHA256(content).toString(CryptoJS.enc.Hex);
}

export function slugify(text: string, maxLength = 100): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, maxLength);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'relative') {
    const now = Date.now();
    const diff = now - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}d ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function estimateReadTime(text: string, wordsPerMinute = 200): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function calculateScore(weights: Record<string, number>, values: Record<string, number>): number {
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  if (totalWeight === 0) return 0;
  return Math.round(
    entries.reduce((sum, [k, w]) => sum + (values[k] ?? 0) * w, 0) / totalWeight
  );
}

export function classifyByScore(score: number, thresholds: { ignore: number; monitor: number; investigate: number; draft: number }): string {
  if (score >= thresholds.draft) return 'draft';
  if (score >= thresholds.investigate) return 'investigate';
  if (score >= thresholds.monitor) return 'monitor';
  return 'ignore';
}

export function maskIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length !== 4) return ip;
  return `${parts[0]}.${parts[1]}.xxx.xxx`;
}

export function hashIp(ip: string, salt: string): string {
  return CryptoJS.PBKDF2(ip, salt, { keySize: 256 / 32, iterations: 10000 }).toString(CryptoJS.enc.Hex);
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  return fn().catch((error) => {
    if (maxRetries <= 0) throw error;
    const delay = baseDelayMs * Math.pow(2, 3 - maxRetries);
    return new Promise((resolve) => setTimeout(() => resolve(retryWithBackoff(fn, maxRetries - 1, baseDelayMs)), delay));
  });
}

export function formatCurrency(amount: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function similarity(a: string, b: string): number {
  const aWords = new Set(a.toLowerCase().split(/\s+/));
  const bWords = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...aWords].filter((x) => bWords.has(x)));
  const union = new Set([...aWords, ...bWords]);
  return union.size === 0 ? 0 : Math.round((intersection.size / union.size) * 100);
}

export function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export const JAKSEL_LOCATIONS = {
  jakarta_selatan: {
    id: 'jakarta-selatan',
    name: 'Jakarta Selatan',
    type: 'city' as const,
    districts: [
      { id: 'kec-jagakarsa', name: 'Kecamatan Jagakarsa' },
      { id: 'kec-pasar-rebo', name: 'Kecamatan Pasar Rebo' },
      { id: 'kec-ciracas', name: 'Kecamatan Ciracas' },
      { id: 'kec Cipete', name: 'Kecamatan Cipete' },
      { id: 'kec-pancoran', name: 'Kecamatan Pancoran' },
      { id: 'kec-tebet', name: 'Kecamatan Tebet' },
      { id: 'kec-kebayoran-barat', name: 'Kecamatan Kebayoran Barat' },
      { id: 'kec-kebayoran-baru', name: 'Kecamatan Kebayoran Baru' },
      { id: 'kec-mampang-prapatan', name: 'Kecamatan Mampang Prapatan' },
      { id: 'kec-pesanggrahan', name: 'Kecamatan Pesanggrahan' },
      { id: 'kec-setia-budi', name: 'Kecamatan Setia Budi' },
      { id: 'kec-jakarta-selatan-timur', name: 'Kecamatan Jakarta Selatan Timur' },
    ],
    neighborhoods: [
      'Kemang', ' Blok M', 'Senayan', 'Sudirman', 'Kuningan', 'Mega Kuningan',
      'Cipete', 'Cilandak', 'Tebet', 'Kebayoran Baru', 'Kebayoran Lama',
      'Pondok Indah', 'Gandaria', 'Melawai', 'Gunawarman', 'Senopati',
      'Kemang Timur', 'Kemang Barat', 'Ragunan', 'Lebak Bulus', 'Cipete Utara',
      'Cipete Selatan', 'Ampera', 'Warung Buncit', 'Kalibata', 'Duren Tiga',
      'Kuningan Timur', 'Karet', 'Menteng', 'Pasar Minggu', 'Tanjung Barat',
    ],
  },
} as const;

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  discovered: { label: 'Discovered', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950', icon: '🔍' },
  investigating: { label: 'Investigating', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950', icon: '🔎' },
  verification_required: { label: 'Needs Verification', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', icon: '⚠️' },
  verified: { label: 'Verified', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', icon: '✅' },
  content_ready: { label: 'Content Ready', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', icon: '📝' },
  editor_review: { label: 'Editor Review', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950', icon: '👀' },
  approved: { label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', icon: '👍' },
  scheduled: { label: 'Scheduled', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950', icon: '📅' },
  published: { label: 'Published', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', icon: '🌐' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950', icon: '❌' },
  conflicted: { label: 'Conflicted', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950', icon: '⚡' },
  stale: { label: 'Stale', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', icon: '💤' },
  blocked: { label: 'Blocked', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-950', icon: '🚫' },
};

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-500', bg: 'bg-gray-50', icon: '📌' };
}
