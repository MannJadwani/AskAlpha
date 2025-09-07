import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import blogData from '@/data/blog-posts.json';

const SITE = 'https://www.askalpha.tech';

function absolute(path: string): string {
  if (!path) return SITE;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function generateStaticParams() {
  return (blogData.posts as any[])
    .filter((post) => !post?.draft)
    .map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug } = params;
  const post = blogData.posts.find((p) => p.slug === slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  const canonical = `${SITE}/blog/${post.slug}`;
  const isDraft = Boolean((post as any).draft);
  const robotsIndex = isDraft ? false : true;
  const robotsFollow = isDraft ? false : true;
  const ogImages = post.featuredImage
    ? [{ url: absolute(post.featuredImage), width: 1200, height: 630, alt: post.title }]
    : [];

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    keywords: post.keywords,
    alternates: { canonical },
    robots: {
      index: robotsIndex,
      follow: robotsFollow,
      googleBot: { index: robotsIndex, follow: robotsFollow },
    },
    openGraph: {
      type: 'article',
      url: canonical,
      siteName: 'AskAlpha',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: ogImages,
      locale: 'en_US',
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.featuredImage ? [absolute(post.featuredImage)] : [],
    },
  };
}

export default function BlogPostPage({ params }: any) {
  const post = blogData.posts.find((p) => p.slug === params.slug);
  if (!post) {
    notFound();
  }

  const canonical = `${SITE}/blog/${post.slug}`;
  const isDraft = Boolean((post as any).draft);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.featuredImage ? absolute(post.featuredImage) : undefined,
    datePublished: post.publishedAt,
    dateModified: (post as any).updatedAt || post.publishedAt,
    author: { '@type': 'Person', name: post.author },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    url: canonical,
  } as const;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 prose prose-invert">
      <h1>{post.title}</h1>
      {post.excerpt && <p>{post.excerpt}</p>}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      {!isDraft && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </article>
  );
}
