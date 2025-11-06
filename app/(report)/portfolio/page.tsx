'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, TrendingUp, AlertCircle, Download, Trash2, BarChart3 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  value?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

interface PortfolioAnalysis {
  holdings: PortfolioHolding[];
  totalValue: number;
  totalInvestment: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  insights: string;
  recommendations: string[];
  diversification: {
    sector: string;
    allocation: number;
  }[];
  riskScore: number;
  timestamp: string;
  companyAdvice?: Array<{
    symbol: string;
    name?: string;
    sector?: string;
    action?: 'BUY' | 'ADD' | 'HOLD' | 'TRIM' | 'SELL' | string;
    confidence?: number;
    summary?: string;
    rationale?: string[];
    targetPrice?: number;
    timeHorizon?: string;
    risks?: string[];
  }>;
}

export default function PortfolioAnalysisPage() {
  const { currentUser, creditsData } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');

  // One-by-one form state
  const [symbolQuery, setSymbolQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; name: string; exchange: string; label: string }>>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [avgPrice, setAvgPrice] = useState<string>('');
  const [holdingsForm, setHoldingsForm] = useState<PortfolioHolding[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = symbolQuery.trim();
    if (!q) { setSuggestions([]); return; }
    setIsSearching(true);
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const doFetch = async () => {
      try {
        const res = await fetch(`/api/instruments/search?q=${encodeURIComponent(q)}&limit=15`, { signal: controller.signal });
        const data = await res.json();
        setSuggestions(Array.isArray(data.items) ? data.items : []);
      } catch {}
      setIsSearching(false);
    };
    const t = setTimeout(doFetch, 200);
    return () => { clearTimeout(t); controller.abort(); };
  }, [symbolQuery]);

  const addHolding = () => {
    const symbol = (selectedSymbol || symbolQuery).trim().toUpperCase();
    const q = Number(quantity);
    const p = Number(avgPrice);
    if (!symbol || !q || !p || isNaN(q) || isNaN(p)) {
      setError('Please provide a valid symbol, quantity, and average price');
      return;
    }
    setHoldingsForm((prev) => [...prev, { symbol, quantity: q, avgPrice: p }]);
    setSelectedSymbol('');
    setSymbolQuery('');
    setQuantity('');
    setAvgPrice('');
    setSuggestions([]);
    setError(null);
  };

  const removeHolding = (idx: number) => {
    setHoldingsForm((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.xls', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const isValid = validTypes.includes(`.${fileExtension}`) || validTypes.includes(selectedFile.type);
      
      if (!isValid) {
        setError('Please upload a CSV or Excel file');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const fileExtension = droppedFile.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['csv', 'xlsx', 'xls'];
      
      if (fileExtension && validExtensions.includes(fileExtension)) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a CSV or Excel file');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file && uploadMethod === 'file') {
      setError('Please upload a portfolio file');
      return;
    }

    if (uploadMethod === 'manual' && holdingsForm.length === 0 && !manualInput.trim()) {
      setError('Please add at least one holding or paste manual data');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      
      if (uploadMethod === 'file' && file) {
        formData.append('file', file);
        formData.append('method', 'file');
      } else {
        const manualText = holdingsForm.length
          ? holdingsForm.map(h => `${h.symbol} ${h.quantity} ${h.avgPrice}`).join('\n')
          : manualInput;
        formData.append('portfolioData', manualText);
        formData.append('method', 'manual');
      }

      const response = await fetch('/api/analyze-portfolio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze portfolio');
      }

      const data = await response.json();
      setAnalysis(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing your portfolio');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setManualInput('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-500 bg-green-50 dark:bg-green-900/20';
    if (score < 60) return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-500 bg-red-50 dark:bg-red-900/20';
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Moderate Risk';
    return 'High Risk';
  };

  return (
    <div className="items-center justify-center w-full flex flex-col">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Portfolio Analysis
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Upload your portfolio and get AI-powered insights, risk analysis, and personalized recommendations.
          </p>
        </div>

        {/* Credits Banner */}
        <div className="max-w-3xl mx-auto mb-6">
          {Number(creditsData) === 0 ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-red-800 dark:text-red-200 mb-0.5">You're out of credits</div>
                <div className="text-red-700 dark:text-red-300">Upgrade to continue analyzing portfolios.</div>
              </div>
              <a href="/pricing" className="px-3 py-2 rounded-lg text-sm font-medium bg-black text-white dark:bg-white/5 dark:text-zinc-200 ring-1 ring-black/20 dark:ring-white/10">Go Pro</a>
            </div>
          ) : Number(creditsData) <= 2 ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-amber-900 dark:text-amber-200 mb-0.5">Low credits</div>
                <div className="text-amber-800 dark:text-amber-300">Remaining: {creditsData}. Consider upgrading for more.</div>
              </div>
              <a href="/pricing" className="px-3 py-2 rounded-lg text-sm font-medium bg-black text-white dark:bg-white/5 dark:text-zinc-200 ring-1 ring-black/20 dark:ring-white/10">Go Pro</a>
            </div>
          ) : null}
        </div>

        {/* Main Content */}
        {!analysis ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-3xl mx-auto rounded-2xl border border-border bg-card backdrop-blur p-8 shadow-2xl ${Number(creditsData) === 0 ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {/* Upload Method Toggle */}
            <div className="mb-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setUploadMethod('file')}
                className={`px-4 py-2 rounded-lg text-sm ring-1 transition-colors ${
                  uploadMethod === 'file'
                    ? 'bg-black text-white ring-black/20 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10'
                    : 'bg-transparent text-muted-foreground ring-border hover:bg-white/5'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setUploadMethod('manual')}
                className={`px-4 py-2 rounded-lg text-sm ring-1 transition-colors ${
                  uploadMethod === 'manual'
                    ? 'bg-black text-white ring-black/20 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10'
                    : 'bg-transparent text-muted-foreground ring-border hover:bg-white/5'
                }`}
              >
                Manual Entry
              </button>
            </div>

            {uploadMethod === 'file' ? (
              <>
                {/* File Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-ring transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={Number(creditsData) === 0}
                  />
                  
                  {file ? (
                    <div className="space-y-4">
                      <FileText className="h-16 w-16 text-green-500 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-sm text-red-500 hover:text-red-600 flex items-center gap-2 mx-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-16 w-16 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-foreground">
                          Drop your portfolio file here
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          or click to browse
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supports CSV and Excel files (.csv, .xlsx, .xls)
                      </p>
                    </div>
                  )}
                </div>

                {/* File Format Help */}
                <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Expected Format
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Your file should contain the following columns:
                  </p>
                  <div className="text-xs font-mono bg-card rounded p-3 border border-border">
                    <div className="grid grid-cols-4 gap-2 text-muted-foreground">
                      <span>Symbol</span>
                      <span>Quantity</span>
                      <span>Avg Price</span>
                      <span>Current Price (optional)</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Example: RELIANCE, 100, 2450.50, 2580.00
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Manual Entry Form (one-by-one with autocomplete) */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    <div className="md:col-span-5 relative">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Symbol</label>
                      <input
                        value={symbolQuery}
                        onChange={(e) => { setSymbolQuery(e.target.value); setSelectedSymbol(''); }}
                        placeholder="Type to search (e.g., INFY, RELIANCE, TCS)"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground text-sm"
                        disabled={Number(creditsData) === 0}
                      />
                      {suggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-border bg-card shadow-xl">
                          {suggestions.map((s, idx) => (
                            <button
                              type="button"
                              key={`${s.symbol}-${s.exchange}-${idx}`}
                              onClick={() => { setSelectedSymbol(s.symbol); setSymbolQuery(s.symbol); setSuggestions([]); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-white/5"
                            >
                              <span className="font-medium">{s.symbol}</span>
                              <span className="text-muted-foreground"> — {s.name || s.exchange} ({s.exchange})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity</label>
                      <input
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        type="number"
                        min="1"
                        placeholder="e.g., 100"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground text-sm"
                        disabled={Number(creditsData) === 0}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Avg Price</label>
                      <input
                        value={avgPrice}
                        onChange={(e) => setAvgPrice(e.target.value)}
                        type="number"
                        step="0.01"
                        placeholder="e.g., 2450.50"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground text-sm"
                        disabled={Number(creditsData) === 0}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <ShinyButton
                        onClick={addHolding}
                        className="w-full justify-center !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
                        disabled={Number(creditsData) === 0}
                      >
                        Add
                      </ShinyButton>
                    </div>
                  </div>

                  {holdingsForm.length > 0 && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-foreground">Holdings</div>
                        <div className="text-xs text-muted-foreground">{holdingsForm.length} added</div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-2 text-muted-foreground">Symbol</th>
                              <th className="text-right py-2 px-2 text-muted-foreground">Qty</th>
                              <th className="text-right py-2 px-2 text-muted-foreground">Avg Price</th>
                              <th className="text-right py-2 px-2 text-muted-foreground"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {holdingsForm.map((h, idx) => (
                              <tr key={`${h.symbol}-${idx}`} className="border-b border-border last:border-0">
                                <td className="py-2 px-2 font-medium text-foreground">{h.symbol}</td>
                                <td className="py-2 px-2 text-right text-foreground">{h.quantity}</td>
                                <td className="py-2 px-2 text-right text-foreground">{h.avgPrice}</td>
                                <td className="py-2 px-2 text-right">
                                  <button onClick={() => removeHolding(idx)} className="text-red-500 hover:text-red-600">
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Optional raw manual input */}
                  <div className="space-y-2">
                    <label htmlFor="manual-portfolio" className="block text-xs font-medium text-muted-foreground">
                      Or paste your portfolio (one per line)
                  </label>
                  <textarea
                    id="manual-portfolio"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                      placeholder="RELIANCE 100 2450.50\nTCS 50 3200.00\nINFY 75 1450.25"
                      rows={6}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground font-mono text-xs"
                    disabled={Number(creditsData) === 0}
                  />
                  </div>
                </div>
              </>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                    <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <div className="mt-8">
              <ShinyButton
                onClick={handleAnalyze}
                disabled={isAnalyzing || (uploadMethod === 'file' ? !file : holdingsForm.length === 0 && !manualInput.trim()) || Number(creditsData) === 0}
                className="w-full justify-center py-4 text-base !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing with Gemini AI...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Analyze Portfolio
                  </>
                )}
              </ShinyButton>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Portfolio Summary */}
              <div className="rounded-2xl border border-border bg-card p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Investment</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(analysis.totalInvestment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(analysis.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gain/Loss</p>
                    <p className={`text-2xl font-bold ${analysis.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(analysis.totalGainLoss)}
                      <span className="text-sm ml-2">
                        ({analysis.totalGainLossPercent >= 0 ? '+' : ''}{analysis.totalGainLossPercent.toFixed(2)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.riskScore)}`}>
                      {getRiskLabel(analysis.riskScore)} ({analysis.riskScore}/100)
                    </div>
                  </div>
                </div>
              </div>

              {/* Holdings Table */}
              <div className="rounded-2xl border border-border bg-card p-8">
                <h2 className="text-xl font-semibold text-foreground mb-6">Your Holdings</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Symbol</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Quantity</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Avg Price</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Current Price</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Value</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Gain/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.holdings.map((holding, idx) => (
                        <tr key={idx} className="border-b border-border last:border-0">
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{holding.symbol}</td>
                          <td className="py-3 px-4 text-sm text-right text-foreground">{holding.quantity}</td>
                          <td className="py-3 px-4 text-sm text-right text-foreground">{formatCurrency(holding.avgPrice)}</td>
                          <td className="py-3 px-4 text-sm text-right text-foreground">
                            {holding.currentPrice ? formatCurrency(holding.currentPrice) : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-foreground">
                            {holding.value ? formatCurrency(holding.value) : 'N/A'}
                          </td>
                          <td className={`py-3 px-4 text-sm text-right font-medium ${
                            holding.gainLoss && holding.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {holding.gainLoss ? (
                              <>
                                {formatCurrency(holding.gainLoss)}
                                <br />
                                <span className="text-xs">
                                  ({holding.gainLossPercent && holding.gainLossPercent >= 0 ? '+' : ''}
                                  {holding.gainLossPercent?.toFixed(2)}%)
                                </span>
                              </>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Insights */}
              <div className="rounded-2xl border border-border bg-card p-8">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Insights
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground/90">{analysis.insights}</p>
                </div>
              </div>

              {/* Per-Company Advice */}
              {Array.isArray(analysis.companyAdvice) && analysis.companyAdvice.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-8">
                  <h2 className="text-xl font-semibold text-foreground mb-6">Per-Company Advice</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analysis.companyAdvice.map((advice, idx) => (
                      <div key={idx} className="rounded-xl border border-border bg-muted/40 p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-semibold text-foreground">{advice.name || advice.symbol}</div>
                            <div className="text-xs text-muted-foreground">{advice.sector || advice.symbol}</div>
                          </div>
                          {advice.action && (
                            <span className={`px-2 py-1 rounded text-xs border ${
                              advice.action === 'BUY' || advice.action === 'ADD' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' :
                              advice.action === 'SELL' || advice.action === 'TRIM' ? 'text-red-300 border-red-500/30 bg-red-500/10' :
                              'text-yellow-300 border-yellow-500/30 bg-yellow-500/10'
                            }`}>
                              {advice.action}
                            </span>
                          )}
                        </div>
                        {typeof advice.confidence === 'number' && (
                          <div className="text-xs text-muted-foreground mb-2">Confidence: {advice.confidence}/100</div>
                        )}
                        {advice.summary && (
                          <p className="text-sm text-foreground/90 mb-3">{advice.summary}</p>
                        )}
                        {Array.isArray(advice.rationale) && advice.rationale.length > 0 && (
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                            {advice.rationale.slice(0, 4).map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-2">
                          {typeof advice.targetPrice === 'number' && (
                            <span className="px-2 py-1 rounded border border-border bg-background/50">Target: ₹{advice.targetPrice}</span>
                          )}
                          {advice.timeHorizon && (
                            <span className="px-2 py-1 rounded border border-border bg-background/50">Horizon: {advice.timeHorizon}</span>
                          )}
                        </div>
                        {Array.isArray(advice.risks) && advice.risks.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-medium text-foreground mb-1">Key Risks</div>
                            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                              {advice.risks.slice(0, 3).map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-8">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Recommendations</h2>
                  <div className="space-y-3">
                    {analysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-500 text-sm font-semibold">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-foreground/90">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <ShinyButton
                  onClick={handleReset}
                  className="px-6 py-3 !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
                >
                  Analyze Another Portfolio
                </ShinyButton>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

