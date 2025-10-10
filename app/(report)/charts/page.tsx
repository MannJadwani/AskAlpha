'use client';

import { useState } from 'react';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { motion } from 'framer-motion';
import { BarChart3, LineChart, PieChart, TrendingUp, Download, Settings } from 'lucide-react';
import ComingSoon from '@/components/ui/coming-soon';

export default function GenerateChartsPage() {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [dataInput, setDataInput] = useState('');

  const chartTypes = [
    { id: 'bar', name: 'Bar Chart', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'line', name: 'Line Chart', icon: <LineChart className="h-5 w-5" /> },
    { id: 'pie', name: 'Pie Chart', icon: <PieChart className="h-5 w-5" /> },
    { id: 'area', name: 'Area Chart', icon: <TrendingUp className="h-5 w-5" /> },
  ];

  return (
    <ComingSoon>
      <div className="items-center justify-center w-full flex flex-col">
        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Generate Charts
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Create beautiful, interactive financial charts from your data with AI-powered insights.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {/* Chart Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">Select Chart Type</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {chartTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setChartType(type.id as any)}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                      chartType === type.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-border hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className={`mb-3 ${chartType === type.id ? 'text-blue-500' : 'text-muted-foreground'}`}>
                      {type.icon}
                    </div>
                    <span className={`text-sm font-medium ${
                      chartType === type.id ? 'text-blue-500' : 'text-foreground'
                    }`}>
                      {type.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Data Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-6">Enter Your Data</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="data-input" className="block text-sm font-semibold text-foreground mb-3">
                    Data (CSV format or paste from Excel)
                  </label>
                  <textarea
                    id="data-input"
                    value={dataInput}
                    onChange={(e) => setDataInput(e.target.value)}
                    placeholder="Quarter, Revenue, Profit&#10;Q1 2024, 150000, 35000&#10;Q2 2024, 175000, 42000&#10;Q3 2024, 190000, 48000&#10;Q4 2024, 210000, 55000"
                    rows={10}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground font-mono text-sm"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enter data in CSV format. First row should be headers.
                  </p>
                </div>

                {/* Chart Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Chart Title
                    </label>
                    <input
                      type="text"
                      placeholder="Revenue & Profit Analysis"
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Color Scheme
                    </label>
                    <select className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground text-sm">
                      <option>Professional Blue</option>
                      <option>Vibrant Multi-color</option>
                      <option>Monochrome</option>
                      <option>Earth Tones</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Chart Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Chart Preview</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10 text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Customize
                  </button>
                  <button className="px-3 py-2 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10 text-sm flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Mock Chart Area */}
              <div className="w-full h-96 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    Your chart will appear here
                  </p>
                  <p className="text-muted-foreground text-xs mt-2">
                    Enter data above and click Generate to create your chart
                  </p>
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
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Trend Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    AI will analyze your data and provide insights about trends, patterns, and anomalies.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Get suggestions for better data visualization and chart improvements.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Forecasting</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered predictions based on historical data patterns.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <ShinyButton
                disabled={!dataInput.trim()}
                className="px-8 py-4 text-base !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Generate Chart
              </ShinyButton>
            </div>
          </div>
        </div>
      </div>
    </ComingSoon>
  );
}

