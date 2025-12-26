'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Loader2, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { ShinyButton } from '@/components/magicui/shiny-button';

interface Stock {
  symbol: string;
  name: string;
  price: string;
  change: string;
  marketCap: string;
  sector: string;
  reason: string;
}

interface LiveQuote {
  symbol: string;
  ltp: number | null;
  day_change_perc: number | null;
}

export default function TopStocksPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cached, setCached] = useState(false);
  const [liveQuotes, setLiveQuotes] = useState<Map<string, LiveQuote>>(new Map());
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const isDev = process.env.NODE_ENV === 'development';

  const fetchTopStocks = async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Add forceRefresh query parameter only in dev mode
      const url = forceRefresh && isDev 
        ? '/api/top-stocks?forceRefresh=true'
        : '/api/top-stocks';
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch top stocks');
      }

      const data = await response.json();
      setStocks(data.data || []);
      setDate(data.date || null);
      setSources(data.sources || []);
      setCached(data.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchLivePrices = async (symbols: string[]) => {
    if (symbols.length === 0) return;
    
    setIsLoadingPrices(true);
    try {
      const response = await fetch('/api/trade/quotes-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols }),
      });

      if (response.ok) {
        const data = await response.json();
        const quotesMap = new Map<string, LiveQuote>();
        
        if (data.quotes && Array.isArray(data.quotes)) {
          data.quotes.forEach((quote: LiveQuote) => {
            quotesMap.set(quote.symbol, quote);
          });
        }
        
        setLiveQuotes(quotesMap);
        setLastPriceUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching live prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  useEffect(() => {
    fetchTopStocks();
  }, []);

  // Fetch live prices when stocks are loaded
  useEffect(() => {
    if (stocks.length > 0) {
      const symbols = stocks.map(s => s.symbol);
      fetchLivePrices(symbols);
    }
  }, [stocks]);

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    if (stocks.length === 0) return;
    
    const interval = setInterval(() => {
      const symbols = stocks.map(s => s.symbol);
      fetchLivePrices(symbols);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [stocks]);

  const parseChange = (change: string): { value: number; isPositive: boolean } => {
    const cleaned = change.replace(/[^0-9.+-]/g, '');
    const num = parseFloat(cleaned);
    return {
      value: isNaN(num) ? 0 : num,
      isPositive: change.includes('+') || (!change.includes('-') && num > 0),
    };
  };

  const formatPrice = (price: number | null): string => {
    if (price === null || isNaN(price)) return 'N/A';
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatChangePercent = (change: number | null): string => {
    if (change === null || isNaN(change)) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getDisplayPrice = (stock: Stock): string => {
    const liveQuote = liveQuotes.get(stock.symbol);
    if (liveQuote && liveQuote.ltp !== null && liveQuote.ltp !== undefined) {
      return formatPrice(liveQuote.ltp);
    }
    return stock.price;
  };

  const getDisplayChange = (stock: Stock): { value: string; isPositive: boolean } => {
    const liveQuote = liveQuotes.get(stock.symbol);
    if (liveQuote && liveQuote.day_change_perc !== null && liveQuote.day_change_perc !== undefined) {
      const changeStr = formatChangePercent(liveQuote.day_change_perc);
      return {
        value: changeStr,
        isPositive: liveQuote.day_change_perc >= 0,
      };
    }
    const changeData = parseChange(stock.change);
    return {
      value: stock.change,
      isPositive: changeData.isPositive,
    };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="items-center justify-center w-full flex flex-col min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Top Stocks Today
              </h1>
              {lastPriceUpdate && (
                <p className="text-sm text-muted-foreground">
                  Prices updated: {lastPriceUpdate.toLocaleTimeString()}
                  {isLoadingPrices && <span className="ml-2">(Updating...)</span>}
                </p>
              )}
            </div>
            {isDev && (
              <button
                onClick={() => fetchTopStocks(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Force refresh (dev mode only)"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Fetching top stocks...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 mb-6"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-400 mb-1">Error</h3>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
            <button
              onClick={() => fetchTopStocks(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Stocks Grid */}
        {!isLoading && !error && stocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {stocks.map((stock, index) => {
              const displayChange = getDisplayChange(stock);
              const displayPrice = getDisplayPrice(stock);
              const liveQuote = liveQuotes.get(stock.symbol);
              const hasLivePrice = liveQuote !== undefined && liveQuote.ltp !== null && liveQuote.ltp !== undefined;
              
              const handleStockClick = () => {
                router.push(`/report-gen?symbol=${encodeURIComponent(stock.symbol)}`);
              };
              
              return (
                <motion.div
                  key={`${stock.symbol}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={handleStockClick}
                  className="rounded-xl border border-border bg-card p-6 hover:bg-card/80 hover:border-ring cursor-pointer transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {stock.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{stock.symbol}</p>
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                        displayChange.isPositive
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {displayChange.isPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{displayChange.value}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Price
                        {hasLivePrice && (
                          <span className="ml-2 text-xs text-green-400">● Live</span>
                        )}
                      </span>
                      <span className={`text-sm font-semibold text-foreground ${hasLivePrice ? 'text-green-400' : ''}`}>
                        {displayPrice}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Market Cap</span>
                      <span className="text-sm font-semibold text-foreground">
                        {stock.marketCap}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sector</span>
                      <span className="text-sm font-semibold text-foreground">{stock.sector}</span>
                    </div>
                  </div>

                  {stock.reason && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {stock.reason}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && stocks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No stocks data available</p>
            <button
              onClick={() => fetchTopStocks(true)}
              className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 pt-8 border-t border-border"
          >
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Sources</h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 px-2 py-1 rounded bg-zinc-800/50"
                >
                  <span className="truncate max-w-[200px]">{source}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

