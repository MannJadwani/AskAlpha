'use client';

import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, Tag, Share2, BookOpen, Check } from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import blogData from "@/data/blog-posts.json";
import { usePathname } from "next/navigation";

export default function BlogPostPage() {
  const pathname = usePathname();
  const slug = pathname.split('/').pop();
  const post = blogData.posts.find((p) => p.slug === slug);
  const [copied, setCopied] = useState(false);

  if (!post) {
    notFound();
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${post.slug}`;
    const title = post.title;
    const text = post.excerpt;

    // Try native sharing first
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.log('Error copying to clipboard:', error);
        // Final fallback: show URL in alert
        alert(`Share this URL: ${url}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-300">
      {/* Back to Blog */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article Header */}
      <article className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>
        )}

        {/* Article Meta */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime} min read</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Article Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-50 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Article Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="text-lg text-zinc-300 leading-relaxed mb-8">
            {post.excerpt}
          </div>
          
          {/* Full Article Content with Proper Markdown Rendering */}
          <div className="markdown-content text-zinc-300 leading-relaxed">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for different markdown elements
                h1: ({children}) => <h1 className="text-3xl font-bold text-zinc-50 mt-8 mb-4">{children}</h1>,
                h2: ({children}) => <h2 className="text-2xl font-semibold text-zinc-50 mt-8 mb-4">{children}</h2>,
                h3: ({children}) => <h3 className="text-xl font-semibold text-zinc-50 mt-6 mb-3">{children}</h3>,
                h4: ({children}) => <h4 className="text-lg font-semibold text-zinc-50 mt-4 mb-2">{children}</h4>,
                h5: ({children}) => <h5 className="text-base font-semibold text-zinc-50 mt-4 mb-2">{children}</h5>,
                h6: ({children}) => <h6 className="text-sm font-semibold text-zinc-50 mt-4 mb-2">{children}</h6>,
                
                p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                
                strong: ({children}) => <strong className="text-zinc-50 font-semibold">{children}</strong>,
                em: ({children}) => <em className="text-zinc-200 italic">{children}</em>,
                
                ul: ({children}) => <ul className="list-disc list-inside space-y-2 ml-4 mb-4">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside space-y-2 ml-4 mb-4">{children}</ol>,
                li: ({children}) => <li className="leading-relaxed">{children}</li>,
                
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-blue-500/30 pl-4 py-2 my-4 bg-blue-500/10 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                
                code: ({children, className}) => {
                  const isInline = !className;
                  if (isInline) {
                    return <code className="bg-white/10 px-1 py-0.5 rounded text-sm font-mono text-blue-300">{children}</code>;
                  }
                  return (
                    <code className="block bg-white/10 p-4 rounded-lg text-sm font-mono text-blue-300 overflow-x-auto">
                      {children}
                    </code>
                  );
                },
                
                pre: ({children}) => (
                  <pre className="bg-white/10 p-4 rounded-lg overflow-x-auto mb-4">
                    {children}
                  </pre>
                ),
                
                a: ({href, children}) => (
                  <a href={href} className="text-blue-400 hover:text-blue-300 underline">
                    {children}
                  </a>
                ),
                
                hr: () => <hr className="border-white/10 my-8" />,
                
                table: ({children}) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border border-white/10 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                
                th: ({children}) => (
                  <th className="border border-white/10 px-4 py-2 text-left font-semibold text-zinc-50 bg-white/5">
                    {children}
                  </th>
                ),
                
                td: ({children}) => (
                  <td className="border border-white/10 px-4 py-2">
                    {children}
                  </td>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Author Info */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <div className="font-semibold text-zinc-50">{post.author}</div>
              <div className="text-sm text-zinc-400">AskAlpha Research Team</div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts - Only show if there are other posts */}
      {blogData.posts.length > 1 && (
        <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
          <h2 className="text-2xl font-semibold text-zinc-50 mb-6">Related Articles</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {blogData.posts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 2)
              .map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="group block rounded-xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition-all duration-300 hover:bg-white/10"
                >
                  <h3 className="text-lg font-semibold text-zinc-50 mb-2 group-hover:text-white transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="text-zinc-400 text-sm line-clamp-2">
                    {relatedPost.excerpt}
                  </p>
                  <div className="mt-4 text-xs text-zinc-500">
                    {new Date(relatedPost.publishedAt).toLocaleDateString()} • {relatedPost.readTime} min read
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
