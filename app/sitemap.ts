import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://askalpha.tech';
  const now = new Date();
  return [
    { url: `${site}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${site}/recommendation`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${site}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site}/company-report`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
  ];
}


