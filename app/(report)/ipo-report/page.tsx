'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { useAuth } from '@/context/AuthContext';
import { useReports } from '@/context/ReportContext';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ExclamationCircleIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  ScaleIcon,
  ShieldExclamationIcon,
  NewspaperIcon,
  CheckBadgeIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

type Verdict = 'SUBSCRIBE' | 'AVOID' | 'HIGH-RISK SUBSCRIBE' | 'LONG-TERM SUBSCRIBE';
type ValuationView = 'CHEAP' | 'FAIR' | 'EXPENSIVE';

interface IpoReport {
  verdict: Verdict;
  valuation_view: ValuationView;
  symbol: string;
  screener_symbol?: string;
  last_updated: string;
  sources?: string[];
  sections: { key: string; title: string; content: string }[];
}

// Section icons mapping
const sectionIcons: Record<string, React.ReactNode> = {
  snapshot: <SparklesIcon className="h-6 w-6" />,
  business_overview: <BuildingOffice2Icon className="h-6 w-6" />,
  financials: <ChartBarIcon className="h-6 w-6" />,
  derived_metrics: <ScaleIcon className="h-6 w-6" />,
  ipo_structure: <CurrencyRupeeIcon className="h-6 w-6" />,
  valuation: <ChartBarIcon className="h-6 w-6" />,
  risks: <ShieldExclamationIcon className="h-6 w-6" />,
  promoters_management: <UserGroupIcon className="h-6 w-6" />,
  sentiment: <NewspaperIcon className="h-6 w-6" />,
  final_verdict: <CheckBadgeIcon className="h-6 w-6" />,
};

// Research steps for progress indicator
const researchSteps = [
  { key: 'business', label: 'Business & Industry Context' },
  { key: 'financials', label: 'Financial Performance' },
  { key: 'risks', label: 'Risk Factors' },
  { key: 'structure', label: 'IPO Structure' },
  { key: 'management', label: 'Promoters & Management' },
  { key: 'valuation', label: 'Valuation Analysis' },
  { key: 'sentiment', label: 'Market Sentiment & GMP' },
  { key: 'synthesis', label: 'Report Synthesis' },
];

export default function IpoReportPage() {
  const { creditsData } = useAuth();
  const { saveReport } = useReports();

  const [symbolInput, setSymbolInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'generating' | 'complete'>('input');
  const [report, setReport] = useState<IpoReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectionsHtml, setSectionsHtml] = useState<string[]>([]);
  const [hasSaved, setHasSaved] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  // Sanitize HTML to remove broken image tags (AI sometimes generates ![text] markdown)
  const sanitizeHtml = (html: string): string => {
    // Remove img tags with empty or broken src, or src that looks like markdown artifacts
    return html
      .replace(/<img[^>]*src=["']?(?:!|\[|$)[^"']*["']?[^>]*>/gi, '')
      .replace(/<img[^>]*alt=["']?([^"'<>]+)["']?[^>]*src=["']?["']?[^>]*>/gi, '$1')
      .replace(/<img[^>]*>/gi, (match) => {
        // Keep valid images, remove ones without proper src
        if (match.includes('src="http') || match.includes("src='http")) {
          return match;
        }
        // Extract alt text if present
        const altMatch = match.match(/alt=["']([^"']+)["']/);
        return altMatch ? altMatch[1] : '';
      });
  };

  // Simulate progress during generation
  useEffect(() => {
    if (currentStep !== 'generating') {
      setProgressStep(0);
      return;
    }
    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= researchSteps.length - 1) return prev;
        return prev + 1;
      });
    }, 3000); // Advance every 3 seconds
    return () => clearInterval(interval);
  }, [currentStep]);

  // Render sections
  useEffect(() => {
    if (!report) {
      setSectionsHtml([]);
      return;
    }
    const doParse = async () => {
      const htmls = await Promise.all(
        report.sections.map(async (sec) => {
          try {
            const html = await marked.parse(sec.content);
            const sanitized = DOMPurify.sanitize(html);
            // Remove broken image tags from AI-generated markdown
            return sanitizeHtml(sanitized);
          } catch {
            return sanitizeHtml(DOMPurify.sanitize(sec.content));
          }
        })
      );
      setSectionsHtml(htmls);
    };
    doParse();
  }, [report]);

  // Save for logged in users
  useEffect(() => {
    if (!report || hasSaved) return;
    const sectionsPayload = report.sections.map((s, idx) => ({
      SectionName: `${idx + 1}. ${s.title}`,
      InformationNeeded: '',
      DetailedContent: s.content,
      parsedContent: sectionsHtml[idx] || s.content,
    }));
    const combinedMarkdown = report.sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n');
    saveReport({
      companyName: `IPO: ${report.symbol}`,
      htmlContent: combinedMarkdown,
      sections: sectionsPayload,
      sources: report.sources,
    }).finally(() => setHasSaved(true));
  }, [report, sectionsHtml, hasSaved, saveReport]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;

    setIsGenerating(true);
    setError(null);
    setReport(null);
    setSectionsHtml([]);
    setCurrentStep('generating');
    setHasSaved(false);
    setProgressStep(0);

    try {
      const res = await fetch('/api/generate-ipo-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbolInput.trim() }),
      });
      if (!res.ok) {
        const ed = await res.json().catch(() => ({}));
        throw new Error(ed.error || 'Failed to generate IPO report');
      }
      const data = await res.json();
      if (!data?.success || !data?.data) throw new Error('Invalid response');
      setReport(data.data as IpoReport);
      setCurrentStep('complete');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate IPO report');
      setCurrentStep('input');
    } finally {
      setIsGenerating(false);
    }
  };

  const getVerdictColor = (verdict: Verdict) => {
    switch (verdict) {
      case 'SUBSCRIBE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'AVOID':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH-RISK SUBSCRIBE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LONG-TERM SUBSCRIBE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getValuationColor = (view: ValuationView) => {
    switch (view) {
      case 'CHEAP':
        return 'text-emerald-400';
      case 'FAIR':
        return 'text-blue-400';
      case 'EXPENSIVE':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="items-center justify-center w-full flex flex-col">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">IPO Research Report</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive AI-driven IPO analysis for the Indian market. Covers business fundamentals, financials, valuation, risks, and market sentiment.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-6">
          {Number(creditsData) === 0 ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-red-800 dark:text-red-200 mb-0.5">You're out of credits</div>
                <div className="text-red-700 dark:text-red-300">Upgrade to continue generating reports.</div>
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
                <div className="font-semibold text-amber-900 dark:text-amber-200 mb-0.5">Low credits</div>
                <div className="text-amber-800 dark:text-amber-300">Remaining: {creditsData}. Consider upgrading for more.</div>
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

        <div className="w-full">
          {currentStep === 'input' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border border-border bg-card backdrop-blur p-8 shadow-2xl max-w-2xl mx-auto ${
                Number(creditsData) === 0 ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="relative">
                  <label htmlFor="symbol" className="block text-sm font-semibold text-foreground mb-3">
                    IPO Company Name
                  </label>
                  <input
                    id="symbol"
                    type="text"
                    value={symbolInput}
                    onChange={(e) => setSymbolInput(e.target.value)}
                    placeholder="e.g., Tata Technologies, Bajaj Housing Finance"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground text-lg"
                    disabled={isGenerating || Number(creditsData) === 0}
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter the company name or NSE/BSE symbol of the IPO you want to analyze
                  </p>
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
                  Generate IPO Report
                </ShinyButton>
              </form>

              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">What's included in the report:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    <span>Business Overview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    <span>Financial Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    <span>Valuation vs Peers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    <span>Risk Assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    <span>GMP & Sentiment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                    <span>Investment Verdict</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'generating' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card backdrop-blur p-8 shadow-2xl max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <div className="mb-6">
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Analyzing {symbolInput}...</h3>
                <p className="text-muted-foreground">
                  Running comprehensive IPO analysis pipeline. This may take 1-2 minutes.
                </p>
              </div>

              <div className="space-y-3">
                {researchSteps.map((step, idx) => (
                  <div
                    key={step.key}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      idx < progressStep
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : idx === progressStep
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-zinc-500/5 text-muted-foreground'
                    }`}
                  >
                    {idx < progressStep ? (
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    ) : idx === progressStep ? (
                      <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-zinc-600" />
                    )}
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 'complete' && report && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">{report.symbol}</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Report generated on{' '}
                  {new Date(report.last_updated).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Verdict Card */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-2">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Investment Verdict</div>
                      <div
                        className={`inline-flex px-4 py-2 rounded-lg text-xl font-bold border ${getVerdictColor(
                          report.verdict
                        )}`}
                      >
                        {report.verdict}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Valuation View</div>
                      <div className={`text-xl font-semibold ${getValuationColor(report.valuation_view)}`}>
                        {report.valuation_view}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Report */}
              <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-border bg-card/50">
                  <h3 className="text-xl font-semibold text-foreground">Complete IPO Analysis</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    10-section comprehensive research report
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {report.sections.map((section, idx) => (
                    <div key={section.key || idx} className="p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400">
                          {sectionIcons[section.key] || <ExclamationCircleIcon className="h-6 w-6" />}
                        </div>
                        <h4 className="text-xl md:text-2xl font-semibold text-foreground">{section.title}</h4>
                      </div>
                      <div
                        className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90 prose-table:text-sm prose-th:bg-zinc-800/50 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-border prose-th:border prose-th:border-border"
                        dangerouslySetInnerHTML={{
                          __html: sectionsHtml[idx] || DOMPurify.sanitize(section.content),
                        }}
                      />
                    </div>
                  ))}
                </div>

                {report.sources && report.sources.length > 0 && (
                  <div className="p-6 md:p-8 border-t border-border bg-card/50">
                    <button
                      onClick={() => setSourcesExpanded(!sourcesExpanded)}
                      className="w-full flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-muted-foreground" />
                        <h4 className="text-lg font-semibold text-foreground">
                          Sources & References
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          ({report.sources.length})
                        </span>
                      </div>
                      <div className="p-1 rounded-lg group-hover:bg-zinc-800/50 transition-colors">
                        {sourcesExpanded ? (
                          <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    
                    <motion.div
                      initial={false}
                      animate={{
                        height: sourcesExpanded ? 'auto' : 0,
                        opacity: sourcesExpanded ? 1 : 0,
                      }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                        {report.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 hover:underline block truncate"
                          >
                            {src}
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4">
                <ShinyButton
                  onClick={() => {
                    setCurrentStep('input');
                    setReport(null);
                    setSectionsHtml([]);
                    setHasSaved(false);
                    setSymbolInput('');
                  }}
                  className="px-6 py-3 !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
                >
                  Analyze Another IPO
                </ShinyButton>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
