'use client';

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Search, Tag, X, Sun, Moon } from "lucide-react";
import blogData from "@/data/blog-posts.json";

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme from localStorage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem('blog-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Apply theme to body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-[#0a0c10]');
      document.body.classList.remove('bg-white');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-[#0a0c10]');
      document.body.classList.add('bg-white');
    }
    localStorage.setItem('blog-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Get all unique tags from posts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blogData.posts.forEach(post => {
      post.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, []);

  // Sort posts by publication date (newest first) and then filter
  const filteredPosts = useMemo(() => {
    // First sort by date (newest first)
    const sortedPosts = [...blogData.posts].sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Then filter based on search and tags
    return sortedPosts.filter(post => {
      // Search query filter
      const matchesSearch = searchQuery === "" || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Tags filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(selectedTag => post.tags.includes(selectedTag));

      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== "" || selectedTags.length > 0;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#0a0c10] text-zinc-300' 
        : 'bg-white text-gray-800'
    }`}>
      {/* Header with Theme Toggle */}
      <header className={`border-b transition-colors duration-300 ${
        isDarkMode 
          ? 'border-white/10 bg-[#0a0c10]/80 backdrop-blur-sm' 
          : 'border-gray-200 bg-white/80 backdrop-blur-sm'
      } sticky top-0 z-50`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-zinc-50' : 'text-gray-900'
              }`}
            >
              AskAlpha
            </Link>
            
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                isDarkMode 
                  ? 'bg-white/10 text-yellow-400 hover:bg-white/20' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center">
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-zinc-50' : 'text-gray-900'
          }`}>
            AI Stock Analysis Blog
          </h1>
          <p className={`text-lg sm:text-xl max-w-3xl mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            Expert insights on AI-powered stock analysis, market research, investment strategies, and the future of financial technology.
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-8">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative w-full max-w-md mx-auto">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
              isDarkMode ? 'text-zinc-400' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-400' 
                  : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  isDarkMode ? 'text-zinc-400 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className={`transition-colors duration-300 ${
                isDarkMode ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                Active filters:
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:text-blue-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="ml-1 hover:text-green-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={clearFilters}
                className={`underline transition-colors duration-300 ${
                  isDarkMode ? 'text-zinc-400 hover:text-zinc-300' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-lg border text-sm transition-all duration-300 ${
                  selectedTags.includes(tag)
                    ? "bg-blue-600 border-blue-500 text-white"
                    : isDarkMode
                      ? "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className={`text-center text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            {filteredPosts.length === 0 ? (
              <span>No articles found matching your criteria.</span>
            ) : (
              <span>
                Showing {filteredPosts.length} of {blogData.posts.length} articles
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-zinc-50' : 'text-gray-900'
            }`}>
              No articles found
            </h3>
            <p className={`mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <article
                key={post.slug}
                className={`group relative rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] ${
                  isDarkMode 
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                }`}
              >
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="mb-6 overflow-hidden rounded-xl">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Tags - Now Theme Aware */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors duration-300 ${
                        isDarkMode 
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                          : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className={`text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors duration-300 ${
                  isDarkMode ? 'text-zinc-50' : 'text-gray-900'
                }`}>
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>

                {/* Excerpt */}
                <p className={`text-sm leading-relaxed mb-4 line-clamp-3 transition-colors duration-300 ${
                  isDarkMode ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className={`flex items-center justify-between text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-zinc-500' : 'text-gray-500'
                }`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime} min read</span>
                  </div>
                </div>

                {/* Read More */}
                <div className={`mt-4 pt-4 border-t transition-colors duration-300 ${
                  isDarkMode ? 'border-white/10' : 'border-gray-200'
                }`}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors group-hover:gap-3"
                  >
                    Read more
                    <ArrowRight className="h-4 w-4 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter Signup */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <div className={`text-center rounded-2xl border p-8 transition-all duration-300 ${
          isDarkMode 
            ? 'border-white/10 bg-white/5' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <h2 className={`text-2xl font-semibold mb-3 transition-colors duration-300 ${
            isDarkMode ? 'text-zinc-50' : 'text-gray-900'
          }`}>
            Stay Updated with Market Insights
          </h2>
          <p className={`mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            Get the latest AI stock analysis insights and market research delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className={`flex-1 px-4 py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-white/5 border border-white/10 text-white placeholder:text-zinc-400' 
                  : 'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-500'
              }`}
            />
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
