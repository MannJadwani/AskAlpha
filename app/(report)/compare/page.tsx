'use client';

import { useState } from 'react';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3, AlertCircle, Loader2, Plus, X, Gauge, Target, Trophy, Info } from 'lucide-react';

interface CompanyMetrics {
  currentPrice: string;
  marketCap: string;
  pe: string;
  pb: string;
  roe: string;
  roce: string;
  debtToEquity: string;
  profitMargin: string;
  revenueGrowth: string;
  sector: string;
}

interface CompanyData {
  name: string;
  symbol: string;
  overview: string;
  metrics: CompanyMetrics;
  strengths: string[];
  weaknesses: string[];
  recentNews: string;
  analystRating: string;
  targetPrice: string;
}

interface ComparisonAnalysis {
  valuation: string;
  growth: string;
  profitability: string;
  risk: string;
  recommendation: string;
}

interface ComparisonData {
  companies: CompanyData[];
  comparison: ComparisonAnalysis;
}

export default function CompareStocksPage() {
  const [companyInputs, setCompanyInputs] = useState<string[]>(['', '']);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  // Sources removed per design; keeping API flexible but not rendering
  const [error, setError] = useState<string | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [benchmarkIndex, setBenchmarkIndex] = useState<number | null>(null);
  const [preset, setPreset] = useState<'balanced' | 'growth' | 'value'>('balanced');

  // Preset comparisons for fast starts
  const presets: string[][] = [
    ['Reliance Industries', 'TCS', 'Infosys'],
    ['Hindustan Unilever', 'ITC', 'Nestle India'],
    ['Apple', 'Microsoft', 'Alphabet (Google)']
  ];

  const addCompanyInput = () => {
    if (companyInputs.length < 4) {
      setCompanyInputs([...companyInputs, '']);
    }
  };

  const removeCompanyInput = (index: number) => {
    if (companyInputs.length > 2) {
      setCompanyInputs(companyInputs.filter((_, i) => i !== index));
    }
  };

  const updateCompanyInput = (index: number, value: string) => {
    const newInputs = [...companyInputs];
    newInputs[index] = value;
    setCompanyInputs(newInputs);
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validCompanies = companyInputs.filter(c => c.trim() !== '');
    
    if (validCompanies.length < 2) {
      setError('Please enter at least 2 company names');
      return;
    }

    setIsComparing(true);

    try {
      const response = await fetch('/api/compare-stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: validCompanies })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to compare stocks');
      }

      const data = await response.json();
      setComparisonData(data.comparison);
      setAsOf(data.timestamp || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsComparing(false);
    }
  };

  const getRatingColor = (rating: string) => {
    if (rating.toUpperCase().includes('BUY')) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (rating.toUpperCase().includes('SELL')) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (rating.toUpperCase().includes('HOLD')) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-muted-foreground bg-muted/10 border-border';
  };

  // Utility: parse number from a metric string like "₹1,234.56", "22.4x", "12.5%"
  const parseNumeric = (value?: string) => {
    if (!value) return Number.NaN;
    const cleaned = value.toString().replace(/[^0-9.+-]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : Number.NaN;
  };

  // Determine which company leads a given metric
  const metricPreference: Record<keyof CompanyMetrics, 'higher' | 'lower' | 'none'> = {
    currentPrice: 'none',
    marketCap: 'higher',
    pe: 'lower',
    pb: 'lower',
    roe: 'higher',
    roce: 'higher',
    debtToEquity: 'lower',
    profitMargin: 'higher',
    revenueGrowth: 'higher',
    sector: 'none'
  };

  const metricWeightsByPreset: Record<typeof preset, Partial<Record<keyof CompanyMetrics, number>>> = {
    balanced: { marketCap: 1, pe: 1, pb: 1, roe: 1, roce: 1, debtToEquity: 1, profitMargin: 1, revenueGrowth: 1 },
    growth:   { revenueGrowth: 2, roe: 1.5, roce: 1.5, profitMargin: 1.2, pe: 1, pb: 1, marketCap: 0.8, debtToEquity: 1 },
    value:    { pe: 2, pb: 1.5, roe: 1.5, roce: 1.5, profitMargin: 1.2, marketCap: 1, debtToEquity: 1.3, revenueGrowth: 0.8 },
  };

  const leaderIndexForMetric = (metricKey: keyof CompanyMetrics): number | null => {
    if (!comparisonData?.companies?.length) return null;
    const pref = metricPreference[metricKey];
    if (pref === 'none') return null;
    const values = comparisonData.companies.map(c => parseNumeric(c.metrics[metricKey]));
    let bestIdx = -1;
    for (let i = 0; i < values.length; i++) {
      if (!Number.isFinite(values[i])) continue;
      if (bestIdx === -1) bestIdx = i;
      else {
        if (pref === 'higher' && values[i] > values[bestIdx]) bestIdx = i;
        if (pref === 'lower' && values[i] < values[bestIdx]) bestIdx = i;
      }
    }
    return bestIdx === -1 ? null : bestIdx;
  };

  // Compute leader counts and a simple score for a "Best Pick" indicator
  const getLeaderCountsAndBest = () => {
    if (!comparisonData?.companies?.length) return { counts: [] as number[], bestIndex: null as number | null };
    const metricKeys = (Object.keys(metricPreference) as (keyof CompanyMetrics)[]).filter(k => metricPreference[k] !== 'none');
    const n = comparisonData.companies.length;
    const counts = new Array(n).fill(0);
    const scores = new Array(n).fill(0);
    const weights = metricWeightsByPreset[preset];

    for (const key of metricKeys) {
      const pref = metricPreference[key];
      const values = comparisonData.companies.map(c => parseNumeric(c.metrics[key]));
      const valid = values.filter(v => Number.isFinite(v));
      if (valid.length < 2) continue;
      const min = Math.min(...valid as number[]);
      const max = Math.max(...valid as number[]);
      if (min === max) continue;
      // leader
      let leader = -1;
      for (let i = 0; i < values.length; i++) {
        if (!Number.isFinite(values[i])) continue;
        if (leader === -1) leader = i;
        else {
          if (pref === 'higher' && values[i] > (values[leader] as number)) leader = i;
          if (pref === 'lower' && values[i] < (values[leader] as number)) leader = i;
        }
      }
      if (leader >= 0) counts[leader] += 1;
      // scores (normalized 0..1)
      const weight = (weights[key] ?? 1);
      for (let i = 0; i < values.length; i++) {
        if (!Number.isFinite(values[i])) continue;
        const v = values[i] as number;
        const norm = pref === 'higher' ? (v - min) / (max - min) : (max - v) / (max - min);
        scores[i] += norm * weight;
      }
    }
    let bestIndex: number | null = null;
    for (let i = 0; i < scores.length; i++) {
      if (bestIndex === null || scores[i] > (scores[bestIndex] as number)) bestIndex = i;
    }
    return { counts, bestIndex };
  };

  // Heatmap background style for metric cells
  const getHeatStyle = (metricKey: keyof CompanyMetrics, value: string | undefined) => {
    if (!comparisonData) return {} as React.CSSProperties;
    const pref = metricPreference[metricKey];
    if (pref === 'none') return {} as React.CSSProperties;
    const values = comparisonData.companies.map(c => parseNumeric(c.metrics[metricKey]));
    const valid = values.filter(v => Number.isFinite(v)) as number[];
    if (valid.length < 2) return {} as React.CSSProperties;
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const num = parseNumeric(value);
    if (!Number.isFinite(num) || min === max) return {} as React.CSSProperties;
    const better = pref === 'higher' ? (num - min) / (max - min) : (max - num) / (max - min);
    const alpha = Math.max(0.08, Math.min(0.28, better * 0.28));
    const color = `rgba(16, 185, 129, ${alpha.toFixed(3)})`; // emerald-500
    return { backgroundColor: color } as React.CSSProperties;
  };

  // Metric definitions for tooltips
  const metricDefs: { label: string; key: keyof CompanyMetrics; desc?: string }[] = [
    { label: 'Current Price', key: 'currentPrice', desc: 'Latest trading price. Not used for ranking.' },
    { label: 'Market Cap', key: 'marketCap', desc: 'Total company value (price × shares).' },
    { label: 'P/E Ratio', key: 'pe', desc: 'Price to Earnings: lower can indicate value, context matters.' },
    { label: 'P/B Ratio', key: 'pb', desc: 'Price to Book: lower can indicate value vs book equity.' },
    { label: 'ROE', key: 'roe', desc: 'Return on Equity: profitability on shareholder equity.' },
    { label: 'ROCE', key: 'roce', desc: 'Return on Capital Employed: efficiency of capital usage.' },
    { label: 'Debt/Equity', key: 'debtToEquity', desc: 'Leverage: lower is generally safer.' },
    { label: 'Profit Margin', key: 'profitMargin', desc: 'Net income as a % of revenue.' },
    { label: 'Revenue Growth', key: 'revenueGrowth', desc: 'YoY growth in revenue.' },
    { label: 'Sector', key: 'sector', desc: 'Industry classification.' },
  ];

  const clearAll = () => {
    setCompanyInputs(['', '']);
    setComparisonData(null);
    setError(null);
  };

  const applyPreset = (preset: string[]) => {
    setCompanyInputs(preset.slice(0, 4));
    setComparisonData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Compare Stocks
          </h1>
          <p className="text-muted-foreground text-lg">
            Compare multiple stocks side-by-side with AI-powered analysis and real-time data from Google Search
          </p>
          {asOf && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              As of {new Date(asOf).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          )}
        </motion.div>

        {/* Stepper */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card">
              <span className="h-6 w-6 inline-flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold">1</span>
              Select Companies
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isComparing ? 'border-purple-500/40 bg-purple-500/10 text-purple-300' : 'border-border bg-card text-muted-foreground'}`}>
              <span className={`h-6 w-6 inline-flex items-center justify-center rounded-full text-xs font-semibold ${isComparing ? 'bg-purple-500/20 text-purple-400' : 'bg-muted text-muted-foreground'}`}>2</span>
              Analyze
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${comparisonData ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-border bg-card text-muted-foreground'}`}>
              <span className={`h-6 w-6 inline-flex items-center justify-center rounded-full text-xs font-semibold ${comparisonData ? 'bg-cyan-500/20 text-cyan-400' : 'bg-muted text-muted-foreground'}`}>3</span>
              Compare
            </div>
          </div>
        </div>

        {/* Presets & Scoring Mode */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick presets:</span>
            {presets.map((p, i) => (
              <button
                key={i}
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-full border border-border text-xs hover:border-purple-500/40 hover:bg-purple-500/10 transition-colors"
              >
                {p.join(' vs ')}
              </button>
            ))}
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Scoring:</span>
              {(['balanced','growth','value'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setPreset(mode)}
                  className={`px-3 py-1.5 rounded-full border transition-colors ${preset === mode ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-border text-muted-foreground hover:border-cyan-500/30 hover:bg-cyan-500/5'}`}
                >
                  {mode[0].toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <form onSubmit={handleCompare} className="space-y-4">
            {companyInputs.map((company, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={company}
                  onChange={(e) => updateCompanyInput(index, e.target.value)}
                  placeholder={`Company ${index + 1} (e.g., Reliance Industries, TCS, Infosys)`}
                  className="flex-1 px-4 py-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                {companyInputs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCompanyInput(index)}
                    className="p-3 rounded-lg border border-border hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                  >
                    <X className="h-5 w-5 text-red-500" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex gap-2">
              {companyInputs.length < 4 && (
                <button
                  type="button"
                  onClick={addCompanyInput}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-white/5 transition-all text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Company
                </button>
              )}

              <ShinyButton
                type="submit"
                disabled={isComparing}
                className="flex-1 py-3"
              >
                {isComparing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Analyzing with Gemini AI...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Compare Stocks
                  </>
                )}
              </ShinyButton>

              <button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 transition-all text-sm"
              >
                Clear
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: Use official company names. You can mix Indian and US companies.
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-sm"
              >
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {error}
              </motion.div>
            )}
          </form>
        </motion.div>

        {/* Comparison Results */}
        <AnimatePresence mode="wait">
          {isComparing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Skeleton cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-6 rounded-xl border border-border bg-card/50 animate-pulse">
                    <div className="h-6 w-2/3 bg-muted rounded mb-4" />
                    <div className="space-y-2 mb-4">
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-4 w-5/6 bg-muted rounded" />
                      <div className="h-4 w-4/6 bg-muted rounded" />
                    </div>
                    <div className="h-20 w-full bg-muted/60 rounded" />
                  </div>
                ))}
              </div>

              {/* Skeleton table */}
              <div className="p-6 rounded-xl border border-border bg-card/50 animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-4" />
                <div className="h-40 w-full bg-muted/60 rounded" />
              </div>
            </motion.div>
          )}

          {comparisonData && !isComparing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Removed cards; using matrix below for side-by-side layout */}

              {/* Best Pick + Side-by-Side Comparison Matrix */}
              {(() => {
                const { counts, bestIndex } = getLeaderCountsAndBest();
                if (bestIndex === null) return null;
                const best = comparisonData.companies[bestIndex];
                return (
                  <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-6 w-6 text-emerald-400" />
                        <div>
                          <div className="text-sm text-muted-foreground">Best Pick</div>
                          <div className="text-xl font-semibold text-foreground">{best.name} <span className="text-xs text-muted-foreground">({best.symbol})</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {comparisonData.companies.map((c, i) => (
                          <span key={i} className={`px-2 py-1 rounded-full border ${i === bestIndex ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-border text-muted-foreground'}`}>
                            {c.name}: {counts[i] || 0} wins
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-x-auto"
              >
                <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                  <h3 className="text-2xl font-bold">Side-by-Side Comparison</h3>
                  {comparisonData.companies.length > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Benchmark:</span>
                      {comparisonData.companies.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setBenchmarkIndex(i === benchmarkIndex ? null : i)}
                          className={`px-3 py-1.5 rounded-full border transition-colors ${benchmarkIndex === i ? 'border-purple-500/40 bg-purple-500/10 text-purple-300' : 'border-border text-muted-foreground hover:border-purple-500/30 hover:bg-purple-500/5'}`}
                        >
                          {c.name}
                        </button>
                      ))}
                      {benchmarkIndex !== null && (
                        <span className="text-muted-foreground">(pinned)</span>
                      )}
                    </div>
                  )}
                </div>
                <table className="w-full align-top">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="sticky left-0 bg-card py-3 px-4 text-sm font-semibold w-44 border-r border-border z-10">Section</th>
                      {comparisonData.companies.map((company, i) => (
                        <th key={i} className="py-3 px-4 text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold">{company.name}</div>
                              <div className="text-xs text-muted-foreground">{company.symbol}</div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs border ${getRatingColor(company.analystRating)}`}>
                              {company.analystRating}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {/* Overview */}
                    <tr className="border-b border-border/50">
                      <td className="sticky left-0 bg-card py-4 px-4 text-muted-foreground font-medium border-r border-border z-10">Overview</td>
                      {comparisonData.companies.map((company, i) => (
                        <td key={i} className="py-4 px-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {company.overview}
                          </p>
                        </td>
                      ))}
                    </tr>

                    {/* Metrics */}
                    {metricDefs.map((metric) => (
                      <tr key={metric.key} className="border-b border-border/30">
                        <td className="sticky left-0 bg-card py-3 px-4 text-muted-foreground border-r border-border z-10">
                          <div className="flex items-center gap-2">
                            <span>{metric.label}</span>
                            {metric.desc && (
                              <span className="text-[10px] text-muted-foreground/80">{metric.desc}</span>
                            )}
                          </div>
                        </td>
                        {comparisonData.companies.map((company, i) => {
                          const leader = leaderIndexForMetric(metric.key as keyof CompanyMetrics);
                          const isLeader = leader !== null && i === leader;
                          const heat = getHeatStyle(metric.key as keyof CompanyMetrics, company.metrics[metric.key as keyof CompanyMetrics]);
                          const isBenchmark = benchmarkIndex === i;
                          return (
                            <td key={i} className={`py-3 px-4 ${isBenchmark ? 'bg-purple-500/5' : ''}`} style={heat}>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${isLeader ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'border-border'}`}>
                                {company.metrics[metric.key as keyof CompanyMetrics]}
                                {isLeader && <Trophy className="h-3.5 w-3.5" />}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Strengths */}
                    <tr className="border-b border-border/50">
                      <td className="sticky left-0 bg-card py-4 px-4 text-muted-foreground font-medium border-r border-border z-10">Strengths</td>
                      {comparisonData.companies.map((company, i) => (
                        <td key={i} className="py-4 px-4">
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {company.strengths.slice(0, 3).map((s, idx) => (
                              <li key={idx} className="leading-relaxed">• {s}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>

                    {/* Weaknesses */}
                    <tr>
                      <td className="sticky left-0 bg-card py-4 px-4 text-muted-foreground font-medium border-r border-border z-10">Weaknesses</td>
                      {comparisonData.companies.map((company, i) => (
                        <td key={i} className="py-4 px-4">
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {company.weaknesses.slice(0, 3).map((w, idx) => (
                              <li key={idx} className="leading-relaxed">• {w}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </motion.div>

              {/* AI Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-xl border border-border bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm"
              >
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-purple-400" />
                  Comparative Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-green-400 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Valuation
                    </h4>
                    <p className="text-sm text-muted-foreground">{comparisonData.comparison.valuation}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-blue-400 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Growth Prospects
                    </h4>
                    <p className="text-sm text-muted-foreground">{comparisonData.comparison.growth}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-yellow-400 flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      Profitability
                    </h4>
                    <p className="text-sm text-muted-foreground">{comparisonData.comparison.profitability}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-2 text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Risk Assessment
                    </h4>
                    <p className="text-sm text-muted-foreground">{comparisonData.comparison.risk}</p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                  <h4 className="text-lg font-semibold mb-2 text-purple-400 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Final Recommendation
                  </h4>
                  <p className="text-sm">{comparisonData.comparison.recommendation}</p>
                </div>
              </motion.div>

              {/* Sources intentionally omitted per design */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
