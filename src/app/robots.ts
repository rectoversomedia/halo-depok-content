import type { MetadataRoute } from 'next';

// Public-facing robots.txt — admin is blocked
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/admin/',
      },
    ],
    sitemap: 'https://halodepok.com/sitemap.xml',
  };
}
