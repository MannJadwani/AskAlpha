'use client';

import { useState, useEffect, useRef } from 'react';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { useAuth } from '../../../context/AuthContext';
import { useReports } from '../../../context/ReportContext';
import { motion } from 'framer-motion';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Download, Copy, Share2, Printer, BookOpen, ChevronLeft, ChevronRight, Maximize2, Minimize2, FileText } from 'lucide-react';

interface ReportData {
  symbol: string;
  screener_symbol: string;
  horizon_years: number;
  last_updated: string;
  verdict: 'BUY' | 'SELL' | 'HOLD';
  verdict_rationale: string;
  report_markdown: string;
  sources?: string[];
}

export default function ReportGenPage() {
  const { currentUser, fetchUser, creditsData } = useAuth();
  const { saveReport } = useReports();
  const [symbolInput, setSymbolInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'generating' | 'complete'>('input');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderedMarkdown, setRenderedMarkdown] = useState<string>('');
  const [sections, setSections] = useState<Array<{ title: string; html: string; raw: string }>>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const isDev = process.env.NODE_ENV === 'development';
  const [hasSaved, setHasSaved] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; name: string; exchange: string; label: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Prefill from query string and auto-trigger
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const symbol = params.get('symbol');
    if (symbol && !symbolInput) {
      setSymbolInput(symbol);
      setTimeout(() => {
        const form = document.getElementById('report-form');
        if (form) {
          (form as HTMLFormElement).requestSubmit();
        }
      }, 50);
    }
  }, []);

  // Split the report into per-section pages (defaults to one page if parsing fails)
  useEffect(() => {
    if (!reportData?.report_markdown) {
      setSections([]);
      setRenderedMarkdown('');
      setCurrentPage(0);
      return;
    }

    const md = reportData.report_markdown.replace(/\r\n/g, '\n').trim();
    // Split on lines that begin with a numbered heading like "1. Title"
    const rawSections = md.split(/\n(?=\d+\.\s+)/).filter(Boolean);

    const buildSections = async () => {
      try {
        const parsed = await Promise.all(
          rawSections.map(async (block) => {
            const lines = block.split('\n');
            const firstLine = lines[0] || '';
            const title = firstLine.replace(/^\d+\.\s*/, '').trim() || 'Section';
            const html = await marked.parse(block);
            return {
              title,
              raw: block,
              html: DOMPurify.sanitize(html),
            };
          })
        );

        if (parsed.length) {
          setSections(parsed);
          setCurrentPage(0);
          setRenderedMarkdown(parsed.map((p) => p.html).join('\n'));
          return;
        }
      } catch (error) {
        console.error('Error parsing markdown sections:', error);
      }

      // Fallback: single page
      try {
        const html = await marked.parse(md);
        setSections([{ title: 'Report', raw: md, html: DOMPurify.sanitize(html) }]);
        setRenderedMarkdown(DOMPurify.sanitize(html));
        setCurrentPage(0);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        setSections([{ title: 'Report', raw: md, html: md }]);
        setRenderedMarkdown(md);
        setCurrentPage(0);
      }
    };

    buildSections();
  }, [reportData]);

  // Keyboard navigation for sections
  useEffect(() => {
    if (currentStep !== 'complete' || sections.length <= 1) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'ArrowLeft' && currentPage > 0) {
        setCurrentPage(p => p - 1);
      } else if (e.key === 'ArrowRight' && currentPage < sections.length - 1) {
        setCurrentPage(p => p + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep, sections.length, currentPage]);

  // Persist generated report to DB/local storage via ReportContext
  // Use a ref to track if we've already saved this report to prevent duplicates
  const savedReportIdRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  
  useEffect(() => {
    if (!reportData || hasSaved || isSavingRef.current) return;
    
    // Wait for sections to be parsed before saving
    // This prevents saving twice - once when reportData is set, once when sections are parsed
    if (sections.length === 0) return;
    
    // Prevent saving the same report twice
    const reportId = `${reportData.symbol}-${reportData.last_updated}`;
    if (savedReportIdRef.current === reportId) return;
    
    isSavingRef.current = true;
    
    const structuredSections = sections.map((s) => ({
      SectionName: s.title,
      InformationNeeded: '',
      DetailedContent: s.raw,
      parsedContent: s.html,
    }));

    saveReport({
      companyName: reportData.symbol,
      htmlContent: reportData.report_markdown,
      sections: structuredSections,
      sources: reportData.sources || undefined,
    }).finally(() => {
      setHasSaved(true);
      savedReportIdRef.current = reportId;
      isSavingRef.current = false;
    });
  }, [reportData, sections.length, hasSaved, saveReport]);

  const handleCopyReport = async () => {
    if (!reportData) return;
    const text = reportData.report_markdown;
    try {
      await navigator.clipboard.writeText(text);
      // Show toast instead of alert
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-card border border-border rounded-lg px-4 py-2 shadow-lg z-50';
      toast.textContent = 'Report copied to clipboard!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopySection = async () => {
    if (sections.length > 0 && sections[currentPage]) {
      try {
        await navigator.clipboard.writeText(sections[currentPage].raw);
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-card border border-border rounded-lg px-4 py-2 shadow-lg z-50';
        toast.textContent = 'Section copied to clipboard!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const handleShare = async () => {
    if (!reportData) return;
    const shareData = {
      title: `${reportData.symbol} Research Report`,
      text: `Check out this research report for ${reportData.symbol}`,
      url: window.location.href,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy link
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleExport = async (format: 'text' | 'pdf') => {
    if (!reportData) return;
    
    if (format === 'text') {
      const blob = new Blob([reportData.report_markdown], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportData.symbol}_report.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf' && reportContentRef.current) {
      try {
        const { exportToPDF } = await import('@/lib/exportUtils');
        await exportToPDF(reportContentRef.current, `${reportData.symbol}_report.pdf`);
      } catch (error) {
        console.error('PDF export error:', error);
        alert('Failed to export PDF. Please try again.');
      }
    }
  };

  // Autocomplete effect for symbol search
  useEffect(() => {
    const q = symbolInput.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    const doFetch = async () => {
      try {
        const res = await fetch(`/api/instruments/search?q=${encodeURIComponent(q)}&limit=15`);
        const data = await res.json();
        setSuggestions(Array.isArray(data.items) ? data.items : []);
      } catch {}
      setIsSearching(false);
    };
    const t = setTimeout(doFetch, 200);
    return () => clearTimeout(t);
  }, [symbolInput]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;

    setIsGenerating(true);
    setError(null);
    setReportData(null);
    setRenderedMarkdown('');
    setCurrentStep('generating');
    setHasSaved(false);

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbolInput.trim(),
          horizon_years: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Extract sources from backend response if available
        const backendData = result.data;
        const sources = backendData.sources || backendData.citations || backendData.perplexityAnalysis?.citations || [];
        
        setReportData({
          ...backendData,
          sources: Array.isArray(sources) ? sources : [],
        });
        setCurrentStep('complete');
        // Update plan details if needed
        if (currentUser) {
          await updatePlanDetails();
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the report');
      setCurrentStep('input');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadDemoReport = async () => {
    const demoMarkdown = `
1. One-Page Investment Snapshot
- Verdict: BUY | Horizon: 3 years | Position: Core
- Wins: Strong market share; consistent ROE; clean balance sheet
- Risk: Input cost inflation; FX sensitivity
- Needs to go right: Margin resilience and steady volume growth

2. Segment & Unit Economics
- Consumer: 55% revenue, 18% EBIT margin
- B2B: 45% revenue, 12% EBIT margin
- Unit economics improving with scale in consumer

3. Variant Perception vs Market
- Market underappreciates pricing power; our view: margins are defensible

4. Risks & Mitigants
- Raw material volatility; mitigant: partial hedging and pricing pass-through

5. Catalysts & Triggers
- New product launches; margin uptick from mix; working capital release

6. Scenario & Sensitivity Analysis
- Bull: +20% EPS CAGR; Base: +14%; Bear: +8%

7. Accounting Quality & Forensic Checks
- Clean auditor history; no aggressive capitalization detected

8. Shareholding, Flows & Liquidity Deep Dive
- FII: 22%; DII: 15%; Promoter: 48%; Healthy liquidity

9. ESG & Reputation / Controversy Check
- No major controversies; improving disclosures

10. Peer Benchmarking Dashboard
- Peer A: P/E 28x, ROE 18%
- Peer B: P/E 24x, ROE 15%
- Company: P/E 22x, ROE 17%

11. Ongoing KPI Tracker / “What to Watch”
- Volume growth, gross margin, working capital days, FX impact
    `.trim();

    setReportData({
      symbol: symbolInput.trim() || 'DEMO',
      screener_symbol: (symbolInput.trim() || 'DEMO').toUpperCase(),
      horizon_years: 5,
      last_updated: new Date().toISOString(),
      verdict: 'BUY',
      verdict_rationale: 'Margin resilience, strong cash flows, and reasonable valuation versus peers.',
      report_markdown: demoMarkdown,
      sources: ['https://www.screener.in', 'https://www.nseindia.com'],
    });
    setError(null);
    setCurrentStep('complete');
    setHasSaved(false);
  };

  const updatePlanDetails = async () => {
    if (!currentUser) return;

    try {
      const res = await fetch(`/api/usage`, {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser?.userId || currentUser?.user?.id,
          planId: currentUser?.id,
          email: currentUser?.user?.email,
          planName: currentUser?.plan,
        }),
      });

      if (res.ok) {
        const currentDate = new Date();
        let newMonthEndDate = new Date(currentUser?.monthenddate ? currentUser?.monthenddate : '');
        let newFrequency = Number(currentUser?.frequency);

        if (newMonthEndDate < currentDate) {
          const nextMonthDate = new Date(currentDate);
          nextMonthDate.setMonth(currentDate.getMonth() + 1);
          newMonthEndDate = nextMonthDate;
        } else {
          newFrequency = Number(currentUser?.frequency) - 1;
        }

        const PlanUserID = currentUser?.id;
        const { plan, frequency } = currentUser;

        await fetch(`/api/plan-details/${PlanUserID}`, {
          method: 'POST',
          body: JSON.stringify({
            name: plan,
            monthly_limit: newFrequency,
            MonthEndDate: newMonthEndDate.toISOString(),
          }),
        });

        await fetchUser();
      }
    } catch (error) {
      console.error('Error updating plan details:', error);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'BUY':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'SELL':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HOLD':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'BUY':
        return <ArrowTrendingUpIcon className="h-8 w-8" />;
      case 'SELL':
        return <ArrowTrendingDownIcon className="h-8 w-8" />;
      case 'HOLD':
        return <MinusIcon className="h-8 w-8" />;
      default:
        return <ChartBarIcon className="h-8 w-8" />;
    }
  };


  return (
    <div className="items-center justify-center w-full flex flex-col">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Equity Research Report Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Generate comprehensive 11-section equity research reports with AI-powered analysis.
          </p>
        </div>

        {/* Credits status banner */}
        <div className="max-w-3xl mx-auto mb-6">
          {Number(creditsData) === 0 ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-red-800 dark:text-red-200 mb-0.5">
                  You're out of credits
                </div>
                <div className="text-red-700 dark:text-red-300">
                  Upgrade to continue generating reports.
                </div>
              </div>
              <a
                href="/pricing"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-black text-white dark:bg-white/5 dark:text-zinc-200 ring-1 ring-black/20 dark:ring-white/10"
              >
                Go Pro
              </a>
            </div>
          ) : Number(creditsData) <= 2 ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-amber-900 dark:text-amber-200 mb-0.5">
                  Low credits
                </div>
                <div className="text-amber-800 dark:text-amber-300">
                  Remaining: {creditsData}. Consider upgrading for more.
                </div>
              </div>
              <a
                href="/pricing"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-black text-white dark:bg-white/5 dark:text-zinc-200 ring-1 ring-black/20 dark:ring-white/10"
              >
                Go Pro
              </a>
            </div>
          ) : null}
        </div>

        {/* Main Content */}
        <div className="w-full">
          {/* Input Form */}
          {currentStep === 'input' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border border-border bg-card backdrop-blur p-8 shadow-2xl ${
                Number(creditsData) === 0 ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <form id="report-form" onSubmit={handleGenerate} className="space-y-6">
                <div className="relative">
                  <label htmlFor="symbol" className="block text-sm font-semibold text-foreground mb-3">
                    Stock Symbol or Ticker
                  </label>
                  <input
                    id="symbol"
                    type="text"
                    value={symbolInput}
                    onChange={(e) => setSymbolInput(e.target.value)}
                    placeholder="e.g., RELIANCE, HDFCBANK, INFY"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground text-lg"
                    disabled={isGenerating || Number(creditsData) === 0}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-border bg-card shadow-xl">
                      {suggestions.map((s, idx) => (
                        <button
                          type="button"
                          key={`${s.symbol}-${s.exchange}-${idx}`}
                          onClick={() => {
                            setSymbolInput(s.symbol);
                            setSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-border last:border-0 transition-colors"
                        >
                          <div className="font-medium text-foreground">{s.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {s.name || s.exchange} ({s.exchange})
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>


                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <ShinyButton
                  type="submit"
                  disabled={isGenerating || !symbolInput.trim() || Number(creditsData) === 0}
                  className="w-full justify-center py-4 text-base !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
                >
                  Generate Research Report
                </ShinyButton>

                {isDev && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={loadDemoReport}
                      className="mt-3 text-xs px-3 py-2 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10"
                    >
                      Load demo report (dev mode)
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          )}

          {/* Loading States */}
          {currentStep === 'generating' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card backdrop-blur p-8 shadow-2xl"
            >
              <div className="text-center">
                <div className="mb-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <ChartBarIcon className="absolute inset-0 w-8 h-8 text-blue-600 m-auto" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Generating Research Report...
                </h3>
                <p className="text-muted-foreground mb-6">
                  Scraping financial data, analyzing metrics, and generating comprehensive 11-section research report. This may take a minute...
                </p>

                <div className="rounded-lg p-4 border border-border bg-card">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-sm font-medium">Processing</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {currentStep === 'complete' && reportData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Company Name Header */}
              <div className="text-center mb-6">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  {reportData.symbol}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Report generated on {new Date(reportData.last_updated).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {reportData.screener_symbol !== reportData.symbol && (
                    <span className="ml-2">(Screener: {reportData.screener_symbol})</span>
                  )}
                </p>
                
                {/* Quick Stats */}
                <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                  <div className="px-3 py-1.5 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Sections: </span>
                    <span className="font-semibold text-foreground">{sections.length || 1}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-muted">
                    <span className="text-muted-foreground">Horizon: </span>
                    <span className="font-semibold text-foreground">{reportData.horizon_years} years</span>
                  </div>
                  {hasSaved && (
                    <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="text-green-400 text-xs">✓ Saved</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Verdict Card */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${getVerdictColor(reportData.verdict)}`}>
                        {getVerdictIcon(reportData.verdict)}
                      </div>
                      <div className="flex flex-col">
                        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                          {reportData.verdict}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Investment Horizon: 5 years
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold tracking-wide text-foreground mb-2">
                      Verdict Rationale
                    </h3>
                    <p className="text-foreground/90 leading-relaxed text-sm">
                      {reportData.verdict_rationale}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex items-center justify-between gap-2 p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm sticky top-4 z-10 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTOC(!showTOC)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-card transition-colors text-sm"
                    title="Table of Contents"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Sections</span>
                  </button>
                  {sections.length > 1 && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>{currentPage + 1}/{sections.length}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyReport}
                    className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
                    title="Copy Full Report"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {sections.length > 1 && (
                    <button
                      onClick={handleCopySection}
                      className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
                      title="Copy Current Section"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        const menu = document.getElementById('export-menu-report');
                        menu?.classList.toggle('hidden');
                      }}
                      className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
                      title="Export"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <div id="export-menu-report" className="hidden absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-20">
                      <button
                        onClick={() => {
                          handleExport('text');
                          document.getElementById('export-menu-report')?.classList.add('hidden');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted rounded-t-lg text-sm"
                      >
                        Export as Text
                      </button>
                      <button
                        onClick={() => {
                          handleExport('pdf');
                          document.getElementById('export-menu-report')?.classList.add('hidden');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted rounded-b-lg text-sm"
                      >
                        Export as PDF
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
                    title="Share Report"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
                    title="Print"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-2 rounded-lg border border-border hover:bg-card transition-colors"
                    title="Full Screen"
                  >
                    {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Table of Contents Sidebar */}
              {showTOC && sections.length > 1 && (
                <div className="mb-4 p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">Table of Contents</h4>
                    <button
                      onClick={() => setShowTOC(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {sections.map((section, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentPage(idx);
                          setShowTOC(false);
                        }}
                        className={`text-left px-3 py-2 rounded-lg border transition-colors text-sm ${
                          currentPage === idx
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border hover:bg-card'
                        }`}
                      >
                        <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                        {section.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Content */}
              <div 
                ref={reportContentRef}
                className={`rounded-2xl border border-border bg-card p-8 shadow-2xl ${isFullScreen ? 'fixed inset-4 z-50 overflow-auto' : ''}`}
              >
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Full Research Report</h3>
                  {sections.length > 1 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Section {currentPage + 1} of {sections.length}</span>
                      <span className="text-foreground font-medium">
                        · {sections[currentPage]?.title || ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Section Navigation */}
                {sections.length > 1 && (
                  <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-border">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>
                    
                    {/* Section Progress Dots */}
                    <div className="flex items-center gap-1">
                      {sections.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            currentPage === idx
                              ? 'bg-primary w-6'
                              : 'bg-muted-foreground hover:bg-foreground/50'
                          }`}
                          title={sections[idx].title}
                        />
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(sections.length - 1, p + 1))}
                      disabled={currentPage >= sections.length - 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {sections.length > 0 ? (
                    <div
                      className="text-foreground/90 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sections[Math.min(currentPage, sections.length - 1)].html }}
                    />
                  ) : (
                    <div
                      className="text-foreground/90 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
                    />
                  )}
                </div>

                {/* Sources */}
                {reportData.sources && reportData.sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {reportData.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline px-2 py-1 rounded bg-muted"
                        >
                          {new URL(source).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyboard hint */}
                {sections.length > 1 && (
                  <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground text-center">
                    💡 Use ← → arrow keys to navigate sections
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 flex-wrap">
                <ShinyButton
                  onClick={() => {
                    setCurrentStep('input');
                    setReportData(null);
                    setRenderedMarkdown('');
                    setSections([]);
                    setCurrentPage(0);
                    setSymbolInput('');
                    setShowTOC(false);
                    setIsFullScreen(false);
                    setHasSaved(false);
                    savedReportIdRef.current = null;
                    isSavingRef.current = false;
                  }}
                  className="px-6 py-3 !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
                >
                  Generate Another Report
                </ShinyButton>
                {hasSaved && (
                  <a
                    href="/my-reports"
                    className="px-6 py-3 rounded-lg border border-border hover:bg-card transition-colors flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View in My Reports
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

