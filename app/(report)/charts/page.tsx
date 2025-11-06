'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { Search, Rocket, Loader2 } from 'lucide-react';

export default function Charts2Page() {
  const [query, setQuery] = useState('last five years revenue of Reliance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeHtml, setIframeHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => iframeHtml ?? undefined, [iframeHtml]);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setIframeHtml(null);
    try {
      const res = await fetch('/api/charts2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const html: string = data?.html || '';
      // Minimal sanitization guard; iframe sandbox handles isolation
      if (!html || html.length < 50 || !/<html[\s>]/i.test(html)) {
        throw new Error('Invalid HTML returned');
      }
      setIframeHtml(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate chart');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="items-center justify-center w-full flex flex-col">
      <div className="mx-auto max-w-6xl px-6 py-10 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Generate Charts
            </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Ask for a specific data series (e.g., "last five years revenue of Reliance").
            We retrieve data and render a chart as isolated HTML shown below.
            </p>
          </div>

        <form onSubmit={onGenerate} className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <label className="block text-sm font-semibold text-foreground mb-2">Your request</label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., last five years revenue of Reliance"
                className="w-full pl-9 pr-3 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>
            <ShinyButton
              disabled={loading || !query.trim()}
              className="px-5 py-3 text-sm !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
              Generate
            </ShinyButton>
                    </div>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-4 md:p-6 mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">Chart Preview</h2>
                </div>
          <div className="w-full">
                <iframe
              ref={iframeRef}
              title="Generated Chart"
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-[520px] rounded-lg border border-border bg-white"
              srcDoc={srcDoc}
                />
            {!iframeHtml && (
              <div className="w-full h-[520px] -mt-[520px] rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                <div className="text-center px-4">
                  <p className="text-muted-foreground text-sm">
                    Your chart will appear here after generation
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        </div>
      </div>
  );
}

