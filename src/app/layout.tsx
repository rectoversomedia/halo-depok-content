import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'HaloDepok — AI Content Factory',
    template: '%s | HaloDepok',
  },
  description: 'AI-Native Hyperlocal Intelligence, Content & Commerce Platform for Depok',
  keywords: ['Depok', 'Jakarta Selatan', 'local news', 'hyperlocal', 'AI newsroom', 'Depok Indonesia'],
  authors: [{ name: 'HaloDepok' }],
  creator: 'HaloDepok',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'HaloDepok',
  },
  robots: {
    index: false, // Admin is not public
    follow: false,
  },
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
