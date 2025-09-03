'use client';

import { useState, useEffect } from 'react';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PerplexityAnalysis {
  content: string;
  citations: string[];
}

interface Recommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice?: number;
  currentPrice?: number;
  reasoning: string;
  keyFactors: string[];
  risks: string[];
  timeHorizon: string;
}

interface RecommendationData {
  perplexityAnalysis: PerplexityAnalysis;
  recommendation: Recommendation;
  analysisTimestamp: string;
}

export default function RecommendationPage() {
  const { currentUser, fetchUser } = useAuth();
  const [companyInput, setCompanyInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'researching' | 'structuring' | 'complete'>('input');
  const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderedMarkdown, setRenderedMarkdown] = useState<string>('');
  const [mode, setMode] = useState<'stock' | 'ipo'>('stock');
  const [ipoInput, setIpoInput] = useState('');
  const [ipoMarkdown, setIpoMarkdown] = useState<string | null>(null);

  // Prefill from query string and auto-trigger
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const symbol = params.get('symbol');
    if (symbol && !companyInput) {
      setCompanyInput(symbol);
      // Auto-submit shortly after mount
      setTimeout(() => {
        const form = document.getElementById('recommendation-form');
        if (form) {
          (form as HTMLFormElement).requestSubmit();
        }
      }, 50);
    }
  }, []);

  useEffect(() => {
    console.log('Current User recomendation page:', currentUser);

  }, [currentUser])

  const usageDataUpdate = async () => {
    try {
      const res = await fetch(`/api/usage`, {
        method: 'POST',
        body: JSON.stringify({ userId: currentUser?.userId || currentUser?.user?.id, planId: currentUser?.id, email: currentUser?.user?.email, planName: currentUser?.plan }),
      });

      if (!res.ok) {
        throw new Error('creating/updating usage data failed');
      }

      const UpdateddataRes = await res.json();
      console.log('data updated/created successfully', UpdateddataRes);

    } catch (error: any) {
      console.error('Error creating/updating usage data:', error?.message);

    }
  }

  const updatePlanDetails = async () => {
    console.log('Updating plan details...');

    if (!currentUser) {
      console.log('No current plan selected for update');
      return;
    };

    await usageDataUpdate();
    const currentDate = new Date();

    let newMonthEndDate = new Date(currentUser?.monthenddate ? currentUser?.monthenddate : '');
    let newFrequency = Number(currentUser?.frequency);
    //if monthenddate < currentdate, then update monthenddate, and create new usage data
    if (newMonthEndDate < currentDate) {
      console.log('monthend expired updating monthenddate and updating usage data');
      
      const nextMonthDate = new Date(currentDate);
      nextMonthDate.setMonth(currentDate.getMonth() + 1);
      newMonthEndDate = nextMonthDate;
    } else {//if monthenddate > currentdate, then decrement frequency
      console.log('monthend not expired updating frequency');
      newFrequency = Number(currentUser?.frequency) - 1;
    }
    const PlanUserID = currentUser?.id;
    const { plan, frequency } = currentUser;

    console.log('Updating plan details for Plan Name:', plan, 'Frequency:', frequency, 'Plan ID:', PlanUserID, 'New Frequency:', newFrequency, "newMonthEndDate", newMonthEndDate);
    try {
      const res = await fetch(`/api/plan-details/${PlanUserID}`, {
        method: 'POST',
        body: JSON.stringify({ name: plan, monthly_limit: newFrequency, MonthEndDate:newMonthEndDate.toISOString() }),
      });

      if (!res.ok) {
        throw new Error('plan update failed');
      }

      const UpdateddataRes = await res.json();



      if (!res.ok) {
        throw new Error('Failed to update plan details');
      }

      console.log("database updated", UpdateddataRes);
      
      const updatedData = await fetchUser();
      console.log("Updated user data:", updatedData);

    } catch (error) {
      console.error('Error updating plan details:', error);

    }
  }

  // Effect to render markdown when recommendation data changes
  useEffect(() => {
    if (recommendationData?.perplexityAnalysis?.content) {
      const renderContent = async () => {
        try {
          const html = await marked.parse(recommendationData.perplexityAnalysis.content);
          setRenderedMarkdown(DOMPurify.sanitize(html));
        } catch (error) {
          console.error('Error parsing markdown:', error);
          setRenderedMarkdown(recommendationData.perplexityAnalysis.content);
        }
      };
      renderContent();
    }
  }, [recommendationData]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyInput.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setRecommendationData(null);
    setRenderedMarkdown('');
    setCurrentStep('researching');

    try {
      // Update step to structuring after a delay to simulate the research phase
      setTimeout(() => {
        if (isAnalyzing) {
          setCurrentStep('structuring');
        }
      }, 3000);

      const response = await fetch('/api/generate-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: companyInput.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate recommendation');
      }

      const data = await response.json();
      setRecommendationData(data);
      setCurrentStep('complete');
      await updatePlanDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the recommendation');
      setCurrentStep('input');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeIPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipoInput.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setIpoMarkdown(null);
    setCurrentStep('researching');
    try {
      setTimeout(() => {
        if (isAnalyzing) setCurrentStep('structuring');
      }, 2000);
      const res = await fetch('/api/generate-ipo-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipoName: ipoInput.trim() })
      });
      if (!res.ok) {
        const ed = await res.json();
        throw new Error(ed.error || 'Failed to analyze IPO');
      }
      const data = await res.json();
      const md = data?.analysis?.markdown || '';
      setIpoMarkdown(md);
      setCurrentStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error analyzing IPO');
      setCurrentStep('input');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationColor = (action: string) => {
    switch (action) {
      case 'BUY': return 'text-green-600 bg-green-50 border-green-200';
      case 'SELL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HOLD': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <ArrowTrendingUpIcon className="h-8 w-8" />;
      case 'SELL': return <ArrowTrendingDownIcon className="h-8 w-8" />;
      case 'HOLD': return <MinusIcon className="h-8 w-8" />;
      default: return <ChartBarIcon className="h-8 w-8" />;
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getProgressState = (phase: 'research' | 'analysis' | 'complete') => {
    if (phase === 'research') {
      return currentStep === 'researching' ? 'bg-blue-500 animate-pulse' :
        (currentStep === 'structuring' || currentStep === 'complete') ? 'bg-green-500' : 'bg-gray-300';
    }
    if (phase === 'analysis') {
      return currentStep === 'structuring' ? 'bg-blue-500 animate-pulse' :
        currentStep === 'complete' ? 'bg-green-500' : 'bg-gray-300';
    }
    if (phase === 'complete') {
      return currentStep === 'complete' ? 'bg-green-500' : 'bg-gray-300';
    }
    return 'bg-gray-300';
  };

  return (
    <div className="items-center justify-center w-full flex flex-col">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            AI Investment Recommendations
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get comprehensive investment analysis powered by Perplexity's real-time research and GPT's structured insights
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <button onClick={() => setMode('stock')} className={`px-3 py-1.5 rounded-lg text-sm ring-1 ${mode==='stock' ? 'bg-white/5 text-zinc-200 ring-white/10 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10' : 'bg-transparent text-zinc-600 ring-border hover:bg-white/5 dark:text-zinc-400 dark:ring-white/10'}`}>Stock</button>
          <button onClick={() => setMode('ipo')} className={`px-3 py-1.5 rounded-lg text-sm ring-1 ${mode==='ipo' ? 'bg-black text-white ring-black/20 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10' : 'bg-transparent text-zinc-600 ring-border hover:bg-white/5 dark:text-zinc-400 dark:ring-white/10'}`}>IPO</button>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Input Form */}
          {currentStep === 'input' && mode==='stock' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card backdrop-blur p-8 shadow-2xl"
            >
              <form id="recommendation-form" onSubmit={handleAnalyze} className="space-y-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-foreground mb-3">
                    Company Name or Ticker Symbol
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    placeholder="e.g., Apple, AAPL, Tesla, TSLA"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground text-lg"
                    disabled={isAnalyzing}
                  />
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
                  disabled={isAnalyzing || !companyInput.trim() || currentUser?.frequency === '0'}
                  className="w-full justify-center py-4 text-base !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
                >
                  Generate Investment Recommendation
                </ShinyButton>
              </form>

              {/* Feature highlights */}
              {/* <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg border border-white/10 bg-white/5">
                  <ChartBarIcon className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
                  <h3 className="font-semibold text-white">Real-time Analysis</h3>
                  <p className="text-sm text-zinc-400">Latest market data and news</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-white/10 bg-white/5">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                  <h3 className="font-semibold text-white">AI-Powered Insights</h3>
                  <p className="text-sm text-zinc-400">Advanced pattern recognition</p>
                </div>
                <div className="text-center p-4 rounded-lg border border-white/10 bg-white/5">
                  <ClockIcon className="h-8 w-8 text-fuchsia-300 mx-auto mb-2" />
                  <h3 className="font-semibold text-white">Quick Results</h3>
                  <p className="text-sm text-zinc-400">Comprehensive analysis in minutes</p>
                </div>
              </div> */}
            </motion.div>
          )}

          {currentStep === 'input' && mode==='ipo' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card backdrop-blur p-8 shadow-2xl">
              <form onSubmit={handleAnalyzeIPO} className="space-y-6">
                <div>
                  <label htmlFor="ipo" className="block text-sm font-semibold text-foreground mb-3">IPO name</label>
                  <input id="ipo" type="text" value={ipoInput} onChange={(e)=>setIpoInput(e.target.value)} placeholder="e.g., Tata Technologies IPO"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground text-lg" />
                </div>
                <ShinyButton type="submit" className="w-full justify-center py-4 text-base !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10">Analyze IPO</ShinyButton>
              </form>
            </motion.div>
          )}

          {/* Loading States */}
          {(currentStep === 'researching' || currentStep === 'structuring') && (
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
                  {currentStep === 'researching' ? 'Researching Company...' : 'Generating Recommendation...'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {currentStep === 'researching'
                    ? 'Analyzing real-time market data, financial reports, and recent news using Perplexity AI...'
                    : 'Structuring insights and generating investment recommendation using GPT-4...'
                  }
                </p>

                <div className="rounded-lg p-4 border border-border bg-card">
                  <div className="flex items-center justify-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${getProgressState('research')}`}></div>
                    <span className="text-sm font-medium">Research Phase</span>
                    <div className={`w-3 h-3 rounded-full ${getProgressState('analysis')}`}></div>
                    <span className="text-sm font-medium">Analysis Phase</span>
                    <div className={`w-3 h-3 rounded-full ${getProgressState('complete')}`}></div>
                    <span className="text-sm font-medium">Complete</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {currentStep === 'complete' && mode==='stock' && recommendationData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Recommendation Card */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className={`p-8 border-l-8 ${getRecommendationColor(recommendationData.recommendation.action).replace('text-', 'border-').replace('bg-', '').replace('border-', 'border-l-')}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${getRecommendationColor(recommendationData.recommendation.action)}`}>
                        {getRecommendationIcon(recommendationData.recommendation.action)}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-foreground">
                          {recommendationData.recommendation.action}
                        </h2>
                        <p className="text-muted-foreground">
                          Confidence: {recommendationData.recommendation.confidence}%
                        </p>
                      </div>
                    </div>
                    {recommendationData.recommendation.targetPrice ? (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Target Price</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatINR(recommendationData.recommendation.targetPrice)}
                        </p>
                        {recommendationData.recommendation.currentPrice && (
                           <p className="text-sm text-muted-foreground">
                            Current: {formatINR(recommendationData.recommendation.currentPrice)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Price Target</p>
                        <p className="text-lg font-medium text-muted-foreground">
                          Not Available
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Key Reasoning</h3>
                      <p className="text-foreground/90 leading-relaxed">
                        {recommendationData.recommendation.reasoning}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Time Horizon</h3>
                      <p className="text-foreground/90">
                        {recommendationData.recommendation.timeHorizon}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Factors */}
                <div className="px-8 py-6 border-t border-border bg-muted">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Key Factors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-emerald-300 mb-2">Supporting Factors</h4>
                      <ul className="space-y-1">
                        {recommendationData.recommendation.keyFactors.map((factor, index) => (
                            <li key={index} className="text-sm text-foreground/90 flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-rose-300 mb-2">Risk Factors</h4>
                      <ul className="space-y-1">
                        {recommendationData.recommendation.risks.map((risk, index) => (
                            <li key={index} className="text-sm text-foreground/90 flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
                <h3 className="text-xl font-semibold text-foreground mb-6">Detailed Analysis Report</h3>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div
                    className="text-foreground/90 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: renderedMarkdown
                    }}
                  />
                </div>

                {/* Citations */}
                {recommendationData.perplexityAnalysis.citations.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Sources</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recommendationData.perplexityAnalysis.citations.map((citation, index) => (
                        <a
                          key={index}
                          href={citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-cyan-300 hover:text-cyan-200 hover:underline block truncate"
                        >
                          {citation}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 text-xs text-muted-foreground">
                  Analysis generated on {new Date(recommendationData.analysisTimestamp).toLocaleString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <ShinyButton
                  onClick={() => {
                    setCurrentStep('input');
                    setRecommendationData(null);
                    setRenderedMarkdown('');
                    setCompanyInput('');
                  }}
                  className="px-6 py-3 !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
                >
                  Analyze Another Company
                </ShinyButton>
              </div>
            </motion.div>
          )}

          {currentStep === 'complete' && mode==='ipo' && ipoMarkdown && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div
                  className="text-foreground/90 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((() => { try { return marked.parse(ipoMarkdown) as string; } catch { return ipoMarkdown; } })()) }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
} 