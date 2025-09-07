// app/sitemap.ts
import type { MetadataRoute } from "next";
import blogData from "@/data/blog-posts.json";

const CANONICAL_HOST = "https://www.askalpha.tech"; // choose one host and stick to it

function normalizeSite(input?: string): string {
  if (!input) return CANONICAL_HOST;
  // force apex -> www
  if (input === "https://askalpha.tech") return CANONICAL_HOST;
  // enforce https
  return input.replace(/^http:\/\//, "https://");
}

const SITE = normalizeSite(process.env.NEXT_PUBLIC_SITE_URL);

/** Absolute URL helper */
function abs(path: string) {
  if (!path) return SITE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Safe date fallback */
function safeDate(...candidates: (string | number | Date | undefined)[]): Date {
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  // 1) Core pages (edit to match your site)
  const basePages: MetadataRoute.Sitemap = [
    { url: abs("/"),               lastModified: new Date(), changeFrequency: "daily",   priority: 1 },
    { url: abs("/blog"),           lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: abs("/pricing"),        lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/recommendation"), lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: abs("/terms"),          lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: abs("/privacy"),        lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: abs("/disclaimer"),     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  // 2) Blog posts (exclude drafts; prefer updatedAt > publishedAt)
  const blogPages: MetadataRoute.Sitemap = (blogData.posts as any[])
    .filter(p => !p?.draft)
    .map(p => ({
      url: abs(`/blog/${p.slug}`),
      lastModified: safeDate(p.updatedAt, p.publishedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  // 3) De-duplicate just in case
  const seen = new Set<string>();
  const all = [...basePages, ...blogPages].filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  return all;
}
