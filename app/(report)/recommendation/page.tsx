'use client';

import { useState, useEffect, useRef } from 'react';
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
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { TrendingUp, IndianRupee, Percent, BarChart3, LineChart, Gauge, Activity, Landmark, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, LineChart as RLineChart, Line, CartesianGrid, Cell, Legend, ComposedChart, Area } from 'recharts';

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
  structuredAnalysis?: { sections: { key: string; title: string; content: string }[]; kpis?: { label: string; value: string }[]; revenues_5yr?: { year: string; inr: number }[]; profits_5yr?: { year: string; inr: number }[]; revenue_unit?: string; profit_unit?: string } | null;
}

export default function RecommendationPage() {
  const { currentUser, fetchUser, creditsData } = useAuth();
  const [companyInput, setCompanyInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'researching' | 'structuring' | 'complete'>('input');
  const [recommendationData, setRecommendationData] = useState<RecommendationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderedMarkdown, setRenderedMarkdown] = useState<string>('');
  const [mode, setMode] = useState<'stock' | 'ipo'>('stock');
  const [ipoInput, setIpoInput] = useState('');
  const [ipoMarkdown, setIpoMarkdown] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [showDetailed, setShowDetailed] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';
  const [highlightAsk, setHighlightAsk] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; name: string; exchange: string; label: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  const revenuePalette = ['#22c55e', '#06b6d4', '#8b5cf6', '#3b82f6', '#f43f5e'];
  const profitStroke = '#8b5cf6';
  const renderValueTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number | string; name?: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      const v = payload[0]?.value as number | string;
      const name = payload[0]?.name as string;
      const num = typeof v === 'string' ? Number(v) : v;
      
      // Format with commas and appropriate decimals
      const formattedValue = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(num));
      
      return (
        <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-lg">
          <div className="font-medium text-foreground mb-1">{label}</div>
          <div className="text-foreground/90 font-semibold">{name}: ₹{formattedValue}</div>
        </div>
      );
    }
    return null;
  };

  const buildDemoData = (name: string): RecommendationData => {
    const demoMarkdown = `# ${name || 'Demo Company'} Analysis\n\n- Strong brand presence in core markets\n- Stable margins with potential upside\n- Risks: regulatory changes, input cost volatility`;
    return {
      perplexityAnalysis: {
        content: demoMarkdown,
        citations: ['https://screener.in', 'https://www.nseindia.com']
      },
      recommendation: {
        action: 'HOLD',
        confidence: 72,
        targetPrice: undefined,
        currentPrice: undefined,
        reasoning: 'Balanced risk-reward given current valuation and industry outlook.',
        keyFactors: [
          'Consistent revenue growth',
          'Healthy cash flows',
          'Diversified product mix',
        ],
        risks: [
          'Commodity price fluctuations',
          'Competitive intensity',
        ],
        timeHorizon: '6-12 months'
      },
      analysisTimestamp: new Date().toISOString(),
      structuredAnalysis: {
        revenues_5yr: [
          { year: String(new Date().getFullYear() - 4), inr: 98000 },
          { year: String(new Date().getFullYear() - 3), inr: 110500 },
          { year: String(new Date().getFullYear() - 2), inr: 124300 },
          { year: String(new Date().getFullYear() - 1), inr: 141200 },
          { year: String(new Date().getFullYear()), inr: 153900 },
        ],
        profits_5yr: [
          { year: String(new Date().getFullYear() - 4), inr: 8200 },
          { year: String(new Date().getFullYear() - 3), inr: 9300 },
          { year: String(new Date().getFullYear() - 2), inr: 10450 },
          { year: String(new Date().getFullYear() - 1), inr: 11800 },
          { year: String(new Date().getFullYear()), inr: 12650 },
        ],
        revenue_unit: 'Crores',
        profit_unit: 'Crores',
        kpis: [
          { label: 'Revenue (TTM, INR)', value: '₹1,29,801 Cr' },
          { label: 'Profit Margin', value: '10.4%' },
          { label: 'EBIT Margin', value: '17.1%' },
          { label: 'EPS (TTM)', value: '₹60.23' },
          { label: 'Return on Equity (ROE)', value: '8.0%' },
          { label: 'Return on Capital Employed (ROCE)', value: '8.7%' },
          { label: 'Book Value / Share', value: '₹746.08' },
          { label: 'P/E', value: '22.4x' },
        ],
        sections: [
          { key: 'financial_performance', title: 'Financial Performance', content: '- Revenue growth steady\n- Margins stable' },
          { key: 'valuation', title: 'Valuation & Multiples', content: '- P/E in line with peers\n- EV/EBITDA fair' },
          { key: 'fundamentals', title: 'Business Fundamentals & Moat', content: '- Strong distribution\n- Brand moat' },
          { key: 'news_events', title: 'Recent News & Events', content: '- Q4 results inline\n- Capex announced' },
          { key: 'industry_trends', title: 'Industry & Trends', content: '- Demand resilient\n- Input cost easing' },
          { key: 'risks', title: 'Risks', content: '- Regulation\n- Competition' },
          { key: 'outlook', title: 'Outlook & Catalysts', content: '- Margin improvement\n- Market share gains' },
        ]
      }
    };
  };

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

  // Reset view when switching between Stock and IPO tabs
  useEffect(() => {
    setCurrentStep('input');
    setError(null);
    setRecommendationData(null);
    setRenderedMarkdown('');
    setIpoMarkdown(null);
    setIsAnalyzing(false);
    setChatOpen(false);
    setMessages([]);
  }, [mode]);

  // Briefly highlight the Ask Follow-up button after report generation
  useEffect(() => {
    if (currentStep === 'complete' && recommendationData && mode === 'stock') {
      setHighlightAsk(true);
      const t = setTimeout(() => setHighlightAsk(false), 2500);
      return () => clearTimeout(t);
    }
  }, [currentStep, recommendationData, mode]);

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

  // Autocomplete effect for stock search
  useEffect(() => {
    if (mode !== 'stock') {
      setSuggestions([]);
      return;
    }
    const q = companyInput.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
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
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [companyInput, mode]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyInput.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setRecommendationData(null);
    setRenderedMarkdown('');
    setCurrentStep('researching');

    try {
      // Step 1: Get company data from Perplexity
      console.log('Step 1: Fetching company research...');
      const researchResponse = await fetch('/api/company-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: companyInput.trim() }),
      });

      if (!researchResponse.ok) {
        const errorData = await researchResponse.json();
        throw new Error(errorData.error || 'Failed to fetch company research');
      }

      const researchData = await researchResponse.json();
      console.log('Step 1 complete: Research data received');

      // Step 2: Get revenue and profit charts data
      console.log('Step 2: Fetching financial data...');
      setCurrentStep('structuring');
      
      let financialData = null;
      try {
        const finRes = await fetch('/api/company-financials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName: companyInput.trim() })
        });
        if (finRes.ok) {
          financialData = await finRes.json();
          console.log('Step 2 complete: Financial data received');
        }
      } catch (finErr) {
        console.warn('Financial data fetch failed, continuing without it:', finErr);
      }

      // Step 3: Structure both data when generating recommendations
      console.log('Step 3: Structuring recommendation...');
      const structureResponse = await fetch('/api/structure-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          companyName: companyInput.trim(),
          research: researchData.research,
          financials: financialData 
        }),
      });

      if (!structureResponse.ok) {
        const errorData = await structureResponse.json();
        throw new Error(errorData.error || 'Failed to structure recommendation');
      }

      const structuredData = await structureResponse.json();
      console.log('Step 3 complete: Recommendation structured');

      // Combine all data for display
      const combinedData = {
        perplexityAnalysis: {
          content: researchData.research,
          citations: researchData.citations || []
        },
        recommendation: structuredData.recommendation,
        analysisTimestamp: structuredData.timestamp,
        structuredAnalysis: {
          ...(structuredData.structuredAnalysis || { sections: [] }),
          revenues_5yr: financialData?.revenues_5yr,
          profits_5yr: financialData?.profits_5yr,
          revenue_unit: financialData?.revenue_unit,
          profit_unit: financialData?.profit_unit,
          kpis: structuredData.structuredAnalysis?.kpis
        }
      };

      setRecommendationData(combinedData);
      setCurrentStep('complete');
      await updatePlanDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the recommendation');
      setCurrentStep('input');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !recommendationData) return;
    const question = chatInput.trim();
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setChatInput('');
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await fetch('/api/recommendation-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: {
            companyName: companyInput,
            ...recommendationData
          }
        })
      });
      if (!res.ok) {
        const ed = await res.json();
        throw new Error(ed.error || 'Failed to get answer');
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer as string }]);
    } catch (err: any) {
      setChatError(err?.message || 'Failed to get answer');
    } finally {
      setChatLoading(false);
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

  const getActionBorderClasses = (action: string) => {
    switch (action) {
      case 'BUY':
        return '';
      case 'SELL':
        return '';
      case 'HOLD':
        return '';
      default:
        return 'border-l-8 border-l-zinc-300/60';
    }
  };

  const getKpiStyle = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('revenue') || l.includes('sales') || l.includes('market cap') || l.includes('price')) {
      return 'bg-emerald-50/60 dark:bg-emerald-900/25 border-emerald-200/70 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200';
    }
    if (l.includes('p/e') || l.includes('valuation') || l.includes('pe ')) {
      return 'bg-cyan-50/60 dark:bg-cyan-900/25 border-cyan-200/70 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200';
    }
    if (l.includes('margin') || l.includes('ebit') || l.includes('ebitda')) {
      return 'bg-violet-50/60 dark:bg-violet-900/25 border-violet-200/70 dark:border-violet-800 text-violet-900 dark:text-violet-200';
    }
    if (l.includes('%') || l.includes('growth') || l.includes('roe') || l.includes('roce')) {
      return 'bg-blue-50/60 dark:bg-blue-900/25 border-blue-200/70 dark:border-blue-800 text-blue-900 dark:text-blue-200';
    }
    return 'bg-muted/50 border-border text-foreground';
  };

  const getKpiIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('price') || l.includes('revenue') || l.includes('market cap')) return <IndianRupee className="h-4 w-4" />;
    if (l.includes('margin') || l.includes('%') || l.includes('growth')) return <Percent className="h-4 w-4" />;
    if (l.includes('p/e') || l.includes('pe ')) return <Gauge className="h-4 w-4" />;
    if (l.includes('eps')) return <Activity className="h-4 w-4" />;
    if (l.includes('valuation')) return <BarChart3 className="h-4 w-4" />;
    if (l.includes('roe') || l.includes('roce')) return <LineChart className="h-4 w-4" />;
    if (l.includes('debt') || l.includes('balance')) return <Landmark className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const getSectionIcon = (keyOrTitle: string) => {
    const k = keyOrTitle.toLowerCase();
    if (k.includes('financial')) return <BarChart3 className="h-4 w-4" />;
    if (k.includes('valuation') || k.includes('multiple')) return <Gauge className="h-4 w-4" />;
    if (k.includes('fundamental') || k.includes('moat') || k.includes('business')) return <Landmark className="h-4 w-4" />;
    if (k.includes('news') || k.includes('event')) return <Activity className="h-4 w-4" />;
    if (k.includes('industry') || k.includes('trend')) return <LineChart className="h-4 w-4" />;
    if (k.includes('risk')) return <AlertTriangle className="h-4 w-4" />;
    if (k.includes('outlook') || k.includes('catalyst')) return <TrendingUp className="h-4 w-4" />;
    return <BarChart3 className="h-4 w-4" />;
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
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            AI Investment Recommendations
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Enter company name or ticker symbol to get investment recommendations.
          </p>
        </div>

        {/* Credits status banner */}
        <div className="max-w-3xl mx-auto mb-6">
          {Number(creditsData) === 0 ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-red-800 dark:text-red-200 mb-0.5">You’re out of credits</div>
                <div className="text-red-700 dark:text-red-300">Upgrade to continue generating analyses.</div>
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

        {/* Mode Toggle */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <button onClick={() => setMode('stock')} className={`px-3 py-1.5 rounded-lg text-sm ring-1 ${mode==='stock' ? 'bg-white/5 text-zinc-200 ring-white/10 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10' : 'bg-transparent text-zinc-600 ring-border hover:bg-white/5 dark:text-zinc-400 dark:ring-white/10'}`}>Stock</button>
          <button onClick={() => setMode('ipo')} className={`px-3 py-1.5 rounded-lg text-sm ring-1 ${mode==='ipo' ? 'bg-black text-white ring-black/20 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10' : 'bg-transparent text-zinc-600 ring-border hover:bg-white/5 dark:text-zinc-400 dark:ring-white/10'}`}>IPO</button>
        </div>

        {/* Main Content */}
        <div className="w-full">
          {/* Input Form */}
          {currentStep === 'input' && mode==='stock' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border border-border bg-card backdrop-blur p-8 shadow-2xl ${Number(creditsData) === 0 ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <form id="recommendation-form" onSubmit={handleAnalyze} className="space-y-6">
                <div className="relative">
                  <label htmlFor="company" className="block text-sm font-semibold text-foreground mb-3">
                    Company Name or Ticker Symbol
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    placeholder="e.g., Apple, AAPL, Tesla, TSLA, INFY, RELIANCE"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground text-lg"
                    disabled={isAnalyzing || Number(creditsData) === 0}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-border bg-card shadow-xl">
                      {suggestions.map((s, idx) => (
                        <button
                          type="button"
                          key={`${s.symbol}-${s.exchange}-${idx}`}
                          onClick={() => {
                            setCompanyInput(s.symbol);
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
                  disabled={isAnalyzing || !companyInput.trim() || Number(creditsData) === 0}
                  className="w-full justify-center py-4 text-base !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10"
                >
                  Generate Investment Recommendation
                </ShinyButton>
                {isDev && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setRecommendationData(buildDemoData(companyInput || 'Demo Company'));
                        setCurrentStep('complete');
                      }}
                      className="mt-3 text-xs px-3 py-2 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10"
                    >
                      Load demo report (dev mode)
                    </button>
                  </div>
                )}
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
                    ? 'Analyzing real-time market data, financial reports, and recent news...'
                    : 'Structuring insights and generating investment recommendation...'
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
              {/* Company Name Header */}
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  {companyInput}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Analysis generated on {new Date(recommendationData.analysisTimestamp).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Recommendation + KPI Row */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className={`p-8 ${getActionBorderClasses(recommendationData.recommendation.action)}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${getRecommendationColor(recommendationData.recommendation.action)}`}>
                        {getRecommendationIcon(recommendationData.recommendation.action)}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                            {recommendationData.recommendation.action}
                          </h2>
                          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground/80">
                            Confidence {recommendationData.recommendation.confidence}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">Based on recent research and structured analysis</p>
                      </div>
                    </div>
                    {recommendationData.recommendation.targetPrice ? (
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Target Price</p>
                        <p className="text-2xl font-semibold text-foreground">
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
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Price Target</p>
                        <p className="text-lg font-medium text-muted-foreground">
                          Not Available
                        </p>
                      </div>
                    )}
                  </div>
 
                  {/* KPI Row: show if structured has kpis */}
                  {recommendationData.structuredAnalysis?.kpis?.length === 8 && (
                    <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-6 mb-6">
                      {(() => {
                        const list = recommendationData.structuredAnalysis?.kpis || [];
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {list.map((item, idx) => {
                              const label = item.label;
                              const value = item.value;
                              return (
                                <div key={`kpi-${idx}`} className={`flex items-start gap-3 p-4 ${idx % 2 === 1 ? 'sm:border-l sm:border-border' : ''} ${idx >= 2 ? 'sm:border-t sm:border-border' : ''} ${idx % 4 !== 0 ? 'lg:border-l lg:border-border' : ''} ${idx >= 4 ? 'lg:border-t lg:border-border' : ''}`}>
                                  <div className="w-10 h-10 rounded-full bg-muted ring-1 ring-border flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-foreground/80">{getKpiIcon(label)}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm text-muted-foreground mb-1 whitespace-normal break-words">{label}</div>
                                    <div className="text-2xl sm:text-3xl font-semibold text-foreground leading-tight whitespace-normal break-words">{value}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-base font-semibold tracking-wide text-foreground mb-2">Key Reasoning</h3>
                      <p className="text-foreground/90 leading-relaxed text-sm">
                        {recommendationData.recommendation.reasoning}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold tracking-wide text-foreground mb-2">Time Horizon</h3>
                      <p className="text-foreground/90 text-sm">
                        {recommendationData.recommendation.timeHorizon}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Factors */}
                <div className="px-8 py-6 border-t border-border bg-muted">
                  <h3 className="text-base font-semibold tracking-wide text-foreground mb-3">Key Factors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-foreground/70 mb-2">Supporting Factors</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recommendationData.recommendation.keyFactors.map((factor, index) => (
                          <div key={index} className="flex items-start gap-2 rounded-lg border border-border bg-card/50 p-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-foreground/90 leading-snug">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-foreground/70 mb-2">Risk Factors</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recommendationData.recommendation.risks.map((risk, index) => (
                          <div key={index} className="flex items-start gap-2 rounded-lg border border-border bg-card/50 p-3">
                            <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-foreground/90 leading-snug">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
                {/* Revenue and Profit Charts - Commented Out */}
                {/* {(recommendationData.structuredAnalysis?.revenues_5yr?.length === 5 || recommendationData.structuredAnalysis?.profits_5yr?.length === 5) && (
                  <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendationData.structuredAnalysis?.revenues_5yr?.length === 5 && (
                      <div>
                        <h3 className="text-base font-semibold tracking-wide text-foreground mb-3">
                          Revenue (Last 5 Years) {recommendationData.structuredAnalysis?.revenue_unit && `- ₹ in ${recommendationData.structuredAnalysis.revenue_unit}`}
                        </h3>
                        <div className="h-56 rounded-xl border border-border bg-card/50 p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={recommendationData.structuredAnalysis.revenues_5yr}>
                              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                              <XAxis dataKey="year" tick={{ fontSize: 11 }} tickMargin={8} />
                              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number): string => `${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)}`} />
                              <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} />
                              <RTooltip content={renderValueTooltip as any} />
                              <Bar dataKey="inr" name={`Revenue (₹ ${recommendationData.structuredAnalysis?.revenue_unit || 'INR'})`} radius={[6,6,0,0]}> 
                                {recommendationData.structuredAnalysis.revenues_5yr.map((_, i) => (
                                  <Cell key={`c-${i}`} fill={revenuePalette[i % revenuePalette.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    {recommendationData.structuredAnalysis?.profits_5yr?.length === 5 && (
                      <div>
                        <h3 className="text-base font-semibold tracking-wide text-foreground mb-3">
                          Profit (Last 5 Years) {recommendationData.structuredAnalysis?.profit_unit && `- ₹ in ${recommendationData.structuredAnalysis.profit_unit}`}
                        </h3>
                        <div className="h-56 rounded-xl border border-border bg-card/50 p-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={recommendationData.structuredAnalysis.profits_5yr}>
                              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                              <XAxis dataKey="year" tick={{ fontSize: 11 }} tickMargin={8} />
                              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number): string => `${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)}`} />
                              <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} />
                              <RTooltip content={renderValueTooltip as any} />
                              <Area type="monotone" dataKey="inr" name={`Profit (₹ ${recommendationData.structuredAnalysis?.profit_unit || 'INR'})`} stroke={profitStroke} fill={profitStroke} fillOpacity={0.15} strokeWidth={2} />
                              <Line type="monotone" dataKey="inr" stroke={profitStroke} strokeWidth={2} dot={{ r: 3 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )} */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-xl font-semibold text-foreground">Detailed Analysis</h3>
                  <button
                    onClick={() => setShowDetailed(v => !v)}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10"
                  >
                    {showDetailed ? 'Hide detailed analysis' : 'Read detailed analysis'}
                  </button>
                </div>

                {!showDetailed ? (
                  recommendationData.structuredAnalysis?.sections?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {recommendationData.structuredAnalysis.sections.filter(s => s.key !== 'kpis').map((sec, idx) => {
                        const html = (() => { try { return DOMPurify.sanitize(marked.parse(sec.content) as string); } catch { return DOMPurify.sanitize(sec.content); } })();
                        return (
                          <div key={sec.key + idx} className="rounded-2xl border border-border bg-card/60 p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-muted ring-1 ring-border flex items-center justify-center flex-shrink-0">
                                {getSectionIcon(sec.key || sec.title)}
                              </div>
                              <h4 className="text-base font-semibold text-foreground truncate">{sec.title}</h4>
                            </div>
                            <div className="prose dark:prose-invert max-w-none">
                              <div
                                className="text-foreground/90 leading-relaxed text-sm"
                                dangerouslySetInnerHTML={{ __html: html }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      <div
                        className="text-foreground/90 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
                      />
                    </div>
                  )
                ) : (
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div
                      className="text-foreground/90 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
                    />
                  </div>
                )}

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

              {chatOpen && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Follow-up Q&A</h3>
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {messages.length === 0 && (
                      <div className="text-sm text-muted-foreground">Ask about specific metrics, risks, valuation, or price targets.</div>
                    )}
                    {messages.map((m, idx) => (
                      <div key={idx} className={m.role === 'user' ? 'text-foreground' : 'text-foreground'}>
                        <div className={`rounded-xl px-4 py-3 border ${m.role === 'user' ? 'bg-muted/50 border-border' : 'bg-white/5 border-white/10'}`}>
                          <div className="text-xs mb-1 opacity-70">{m.role === 'user' ? 'You' : 'Assistant'}</div>
                          <div dangerouslySetInnerHTML={{ __html: (() => { try { return DOMPurify.sanitize(marked.parse(m.content) as string); } catch { return DOMPurify.sanitize(m.content); } })() }} />
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="text-sm text-muted-foreground">Thinking…</div>
                    )}
                    {chatError && (
                      <div className="text-sm text-red-500">{chatError}</div>
                    )}
                  </div>
                  <form onSubmit={handleAskFollowup} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask a follow-up question…"
                      className={`flex-1 px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground ${Number(creditsData) === 0 ? 'opacity-60' : ''}`}
                      disabled={chatLoading || Number(creditsData) === 0}
                    />
                    <ShinyButton type="submit" disabled={chatLoading || !chatInput.trim() || Number(creditsData) === 0} className="px-6 py-3 !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10">
                      Send
                    </ShinyButton>
                  </form>
                  {Number(creditsData) === 0 && (
                    <div className="mt-2 text-xs text-red-500">Out of credits. Upgrade to continue asking questions.</div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Floating Ask Follow-up Button */}
          {currentStep === 'complete' && mode==='stock' && recommendationData && (
            <>
              <div className="fixed bottom-6 right-6 z-40" style={{ paddingRight: 'env(safe-area-inset-right)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="relative inline-block">
                  <div className={`glow-border ${highlightAsk ? 'active' : ''}`} />
                  <button
                    onClick={() => setChatOpen((v) => !v)}
                    aria-label={chatOpen ? 'Hide Q&A' : 'Ask follow-up questions'}
                    disabled={Number(creditsData) === 0}
                    className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-xl ring-1 transition-opacity
                      ${chatOpen ? 'opacity-100' : 'opacity-95 hover:opacity-100'}
                      ${Number(creditsData) === 0 ? 'opacity-60 pointer-events-none' : ''}
                      bg-black text-white ring-black/20 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10`}
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">{chatOpen ? 'Hide Q&A' : 'Ask follow-up'}</span>
                  </button>
                </div>
              </div>

              {/* Floating Chat Panel */}
              <AnimatePresence>
                {chatOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-20 right-6 z-40 w-[min(92vw,420px)] rounded-2xl border border-border bg-card shadow-2xl"
                    style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
                  >
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div className="text-sm font-semibold">Follow-up Q&A</div>
                      <button onClick={() => setChatOpen(false)} className="text-xs px-2 py-1 rounded-md border border-border hover:bg-white/5 dark:hover:bg-white/10">Close</button>
                    </div>
                    <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                      {messages.length === 0 && (
                        <div className="text-sm text-muted-foreground">Ask about specific metrics, risks, valuation, or price targets.</div>
                      )}
                      {messages.map((m, idx) => (
                        <div key={idx} className={m.role === 'user' ? 'text-foreground' : 'text-foreground'}>
                          <div className={`rounded-xl px-4 py-3 border ${m.role === 'user' ? 'bg-muted/50 border-border' : 'bg-white/5 border-white/10'}`}>
                            <div className="text-xs mb-1 opacity-70">{m.role === 'user' ? 'You' : 'Assistant'}</div>
                            <div dangerouslySetInnerHTML={{ __html: (() => { try { return DOMPurify.sanitize(marked.parse(m.content) as string); } catch { return DOMPurify.sanitize(m.content); } })() }} />
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="text-sm text-muted-foreground">Thinking…</div>
                      )}
                      {chatError && (
                        <div className="text-sm text-red-500">{chatError}</div>
                      )}
                    </div>
                    <form onSubmit={handleAskFollowup} className="p-4 border-t border-border flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask a follow-up question…"
                        className={`flex-1 px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground ${Number(creditsData) === 0 ? 'opacity-60' : ''}`}
                        disabled={chatLoading || Number(creditsData) === 0}
                      />
                      <ShinyButton type="submit" disabled={chatLoading || !chatInput.trim() || Number(creditsData) === 0} className="px-6 py-3 !bg-black !text-white !ring-black/20 dark:!bg-white/5 dark:!text-zinc-200 dark:!ring-white/10">
                        Send
                      </ShinyButton>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
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