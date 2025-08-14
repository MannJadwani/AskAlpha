import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://askalpha.tech';
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/sign-in', '/sign-up'] },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}


