'use client';

import { useEffect, useMemo, useState } from 'react';

interface Instrument {
  trading_symbol: string;
  exchange?: string;
  segment?: string;
  isin?: string;
}

interface Quote {
  trading_symbol: string;
  ltp?: number;
  day_change_perc?: number;
}

const STORAGE_KEY = 'trade_instruments_v1';

export default function TradePage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [search, setSearch] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load instruments from localStorage, then refresh from API
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInstruments(JSON.parse(raw));
    } catch {}
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/trade/instruments', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load instruments');
        const data = await res.json();
        const list: Instrument[] = data?.instruments || [];
        setInstruments(list);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
      } catch (e: any) {
        setError(e?.message || 'Failed to load instruments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Poll quotes for watchlist
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      if (watchlist.length === 0) return;
      try {
        const updated: Record<string, Quote> = { ...quotes };
        await Promise.all(watchlist.map(async s => {
          const res = await fetch(`/api/trade/quote?symbol=${encodeURIComponent(s)}`, { cache: 'no-store' });
          if (!res.ok) return;
          const q = await res.json();
          updated[s] = { trading_symbol: s, ltp: q?.ltp, day_change_perc: q?.day_change_perc };
        }));
        if (!stop) setQuotes(updated);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => { stop = true; clearInterval(id); };
  }, [watchlist]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return instruments.slice(0, 100);
    return instruments.filter(i => i.trading_symbol?.toLowerCase().includes(q)).slice(0, 100);
  }, [search, instruments]);

  const toggleWatch = (sym: string) => {
    setWatchlist(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Trade (Mock)</h1>
        <p className="text-sm text-muted-foreground">Search instruments, add to watchlist, and view live quotes via Groww API proxy.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbol (e.g., RELIANCE, TCS, INFY)"
          className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent bg-input text-foreground placeholder:text-muted-foreground"
        />
        {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-semibold text-foreground mb-3">Search Results</div>
          <div className="divide-y divide-border">
            {filtered.map(inst => (
              <div key={inst.trading_symbol} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{inst.trading_symbol}</div>
                  <div className="text-xs text-muted-foreground">{inst.exchange || 'NSE'} • {inst.segment || 'CASH'}</div>
                </div>
                <button onClick={() => toggleWatch(inst.trading_symbol)} className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10">
                  {watchlist.includes(inst.trading_symbol) ? 'Remove' : 'Watch'}
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-6 text-sm text-muted-foreground">No instruments match your search.</div>
            )}
          </div>
        </div>

        {/* Watchlist */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-sm font-semibold text-foreground mb-3">Watchlist</div>
          <div className="space-y-3">
            {watchlist.map(sym => (
              <div key={sym} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <div className="font-medium">{sym}</div>
                  <div className="text-xs text-muted-foreground">LTP: {quotes[sym]?.ltp ?? '—'} {typeof quotes[sym]?.day_change_perc === 'number' ? `(${quotes[sym]?.day_change_perc?.toFixed(2)}%)` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10">Buy</button>
                  <button className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-white/5 dark:hover:bg-white/10">Sell</button>
                </div>
              </div>
            ))}
            {watchlist.length === 0 && (
              <div className="py-6 text-sm text-muted-foreground">Add symbols to watchlist from search results.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}






