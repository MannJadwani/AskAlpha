'use client';

import { useState } from 'react';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { motion } from 'framer-motion';
import { GitCompare, TrendingUp, TrendingDown, Minus, Plus, X, BarChart3, DollarSign, Percent } from 'lucide-react';
import ComingSoon from '@/components/ui/coming-soon';

export default function ComparePage() {
  const [companies, setCompanies] = useState<string[]>(['', '']);
  const [compareType, setCompareType] = useState<'stocks' | 'sectors'>('stocks');

  const addCompany = () => {
    if (companies.length < 4) {
      setCompanies([...companies, '']);
    }
  };

  const removeCompany = (index: number) => {
    if (companies.length > 2) {
      setCompanies(companies.filter((_, i) => i !== index));
    }
  };

  const comparisonMetrics = [
    { name: 'Market Cap', icon: <DollarSign className="h-4 w-4" /> },
    { name: 'P/E Ratio', icon: <Percent className="h-4 w-4" /> },
    { name: 'Revenue Growth', icon: <TrendingUp className="h-4 w-4" /> },
    { name: 'Profit Margin', icon: <Percent className="h-4 w-4" /> },
    { name: 'ROE', icon: <Percent className="h-4 w-4" /> },
    { name: 'Debt to Equity', icon: <BarChart3 className="h-4 w-4" /> },
    { name: '52W Performance', icon: <TrendingUp className="h-4 w-4" /> },
    { name: 'Dividend Yield', icon: <Percent className="h-4 w-4" /> },
  ];

  return (
    <ComingSoon>
      <div className="items-center justify-center w-full flex flex-col">
        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Compare Stocks
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Compare multiple stocks side-by-side with AI-powered insights to make informed investment decisions.
            </p>
          </div>

          <div className="max-w-6xl mx-auto space-y-8">
            {/* Compare Type Toggle */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setCompareType('stocks')}
                className={`px-4 py-2 rounded-lg text-sm ring-1 transition-colors ${
                  compareType === 'stocks'
                    ? 'bg-black text-white ring-black/20 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10'
                    : 'bg-transparent text-muted-foreground ring-border hover:bg-white/5'
                }`}
              >
                Compare Stocks
              </button>
              <button
                onClick={() => setCompareType('sectors')}
                className={`px-4 py-2 rounded-lg text-sm ring-1 transition-colors ${
                  compareType === 'sectors'
                    ? 'bg-black text-white ring-black/20 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10'
                    : 'bg-transparent text-muted-foreground ring-border hover:bg-white/5'
                }`}
              >
                Compare Sectors
              </button>
            </div>

            {/* Company Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Select Companies to Compare
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {companies.map((company, index) => (
                  <div key={index} className="relative">
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => {
                        const newCompanies = [...companies];
                        newCompanies[index] = e.target.value;
                        setCompanies(newCompanies);
                      }}
                      placeholder={`Company ${index + 1}`}
                      className="w-full px-4 py-3 pr-10 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground text-sm"
                    />
                    {companies.length > 2 && (
                      <button
                        onClick={() => removeCompany(index)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {companies.length < 4 && (
                  <button
                    onClick={addCompany}
                    className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10 text-sm flex items-center gap-2 text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Company (up to 4)
                  </button>
                )}
                <div className="flex-1"></div>
                <ShinyButton className="px-6 py-3 !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10">
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare Now
                </ShinyButton>
              </div>
            </motion.div>

            {/* Comparison Table Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">Side-by-Side Comparison</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Metric</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">Company 1</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">Company 2</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">Company 3</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">Company 4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonMetrics.map((metric, idx) => (
                      <tr key={idx} className="border-b border-border last:border-0">
                        <td className="py-3 px-4 text-sm text-foreground flex items-center gap-2">
                          {metric.icon}
                          {metric.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm text-muted-foreground">--</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm text-muted-foreground">--</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm text-muted-foreground">--</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm text-muted-foreground">--</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Visual Comparison Charts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">Visual Comparison</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mock Chart 1 */}
                <div className="rounded-xl border border-border bg-muted/30 p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Comparison</h3>
                  <div className="h-48 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Chart will appear here</p>
                    </div>
                  </div>
                </div>

                {/* Mock Chart 2 */}
                <div className="rounded-xl border border-border bg-muted/30 p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Performance Comparison</h3>
                  <div className="h-48 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Chart will appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI-Powered Insights
              </h2>
              
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">Best Value Pick</h3>
                      <p className="text-sm text-muted-foreground">
                        AI will identify which company offers the best value based on comprehensive analysis.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">Relative Strengths</h3>
                      <p className="text-sm text-muted-foreground">
                        Understand each company's competitive advantages and where they excel.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingDown className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">Risk Comparison</h3>
                      <p className="text-sm text-muted-foreground">
                        Compare risk profiles and identify the safest investment option.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">Comparison Features</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-500 text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Real-time Data</h3>
                    <p className="text-xs text-muted-foreground">Live market data and financial metrics</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-500 text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Multi-metric Analysis</h3>
                    <p className="text-xs text-muted-foreground">Compare 20+ financial metrics</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-500 text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Visual Charts</h3>
                    <p className="text-xs text-muted-foreground">Interactive comparison visualizations</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-500 text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">AI Recommendations</h3>
                    <p className="text-xs text-muted-foreground">Smart insights on best picks</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-500 text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Export Reports</h3>
                    <p className="text-xs text-muted-foreground">Download comparison as PDF</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-500 text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Save Comparisons</h3>
                    <p className="text-xs text-muted-foreground">Track your analysis over time</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </ComingSoon>
  );
}

