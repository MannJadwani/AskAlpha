import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Force canonical host to www
  const site = 'https://www.askalpha.tech';
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}


