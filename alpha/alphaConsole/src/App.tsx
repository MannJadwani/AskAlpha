import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

type SymbolIndexResponse = {
  symbols: string[]
  count: number
}

type ScrapeSymbolResponse = {
  symbol: string
  screener_symbol: string | null
  last_updated: string | null
  status: 'success' | 'failed'
  error?: string
}

type ScrapingStatsResponse = {
  total_symbols: number
  scraped_successfully: number
  failed: number
  recently_scraped: number
  not_scraped: number
}

type RefreshIndexResponse = {
  status: string
  symbols_upserted: number
}

type CompanyDataResponse = {
  symbol: string
  screener_symbol: string
  last_updated: string | null
  key_metrics: Record<string, string>
  sections: Record<string, any[]>
}

type AnalyzeResponse = {
  symbol: string
  screener_symbol: string
  horizon_years: number
  last_updated: string
  verdict: string
  verdict_rationale: string
  report_markdown: string
}

function App() {
  const [logLines, setLogLines] = useState<string[]>([])
  const [isRefreshingIndex, setIsRefreshingIndex] = useState(false)
  const [isScrapingOne, setIsScrapingOne] = useState(false)
  const [isScrapingAll, setIsScrapingAll] = useState(false)
  const [singleSymbol, setSingleSymbol] = useState('')
  const [deleteSymbol, setDeleteSymbol] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [totalSymbols, setTotalSymbols] = useState<number | null>(null)
  const [processedSymbols, setProcessedSymbols] = useState(0)
  const abortAllRef = useRef(false)
  const [viewSymbol, setViewSymbol] = useState('')
  const [viewData, setViewData] = useState<CompanyDataResponse | null>(null)
  const [viewSection, setViewSection] = useState<string | null>(null)
  const [isLoadingView, setIsLoadingView] = useState(false)
  const [symbolList, setSymbolList] = useState<string[]>([])
  const [reportSymbol, setReportSymbol] = useState('')
  const [reportHorizon, setReportHorizon] = useState(3)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportData, setReportData] = useState<AnalyzeResponse | null>(null)
  const [scrapingStats, setScrapingStats] = useState<ScrapingStatsResponse | null>(null)
  const [successCount, setSuccessCount] = useState(0)
  const [failureCount, setFailureCount] = useState(0)

  const appendLog = useCallback((line: string) => {
    setLogLines(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`])
  }, [])

  const fetchScrapingStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/scraping-stats`)
      if (res.ok) {
        const data = (await res.json()) as ScrapingStatsResponse
        setScrapingStats(data)
      }
    } catch (err) {
      // Silently fail
    }
  }, [])

  const handleRefreshIndex = async () => {
    setIsRefreshingIndex(true)
    appendLog('Refreshing symbol index from Groww...')
    try {
      const res = await fetch(`${API_BASE}/refresh-index`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as RefreshIndexResponse
      appendLog(`Symbol index refreshed. Upserted ${data.symbols_upserted} symbols.`)
      fetchScrapingStats()
    } catch (err) {
      appendLog(`Error refreshing index: ${(err as Error).message}`)
    } finally {
      setIsRefreshingIndex(false)
    }
  }

  const handleScrapeOne = async (force: boolean = false) => {
    const symbol = singleSymbol.trim().toUpperCase()
    if (!symbol) {
      appendLog('Please enter a symbol to scrape.')
      return
    }
    setIsScrapingOne(true)
    appendLog(`${force ? 'Force ' : ''}Scraping data for ${symbol}...`)
    try {
      const res = await fetch(`${API_BASE}/scrape-symbol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, force }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as ScrapeSymbolResponse
      if (data.status === 'success') {
        appendLog(
          `✓ Scraped ${data.symbol} (Screener: ${data.screener_symbol}) at ${data.last_updated}.`
        )
        setSuccessCount(prev => prev + 1)
      } else {
        appendLog(`✗ Failed to scrape ${data.symbol}: ${data.error || 'Unknown error'}`)
        setFailureCount(prev => prev + 1)
      }
      fetchScrapingStats()
    } catch (err) {
      appendLog(`Error scraping ${symbol}: ${(err as Error).message}`)
      setFailureCount(prev => prev + 1)
      fetchScrapingStats()
    } finally {
      setIsScrapingOne(false)
    }
  }

  const handleDeleteSymbol = async () => {
    const symbol = deleteSymbol.trim().toUpperCase()
    if (!symbol) {
      appendLog('Please enter a symbol to delete.')
      return
    }
    
    if (!confirm(`Are you sure you want to delete all data for ${symbol}? This cannot be undone.`)) {
      return
    }
    
    setIsDeleting(true)
    appendLog(`Deleting all data for ${symbol}...`)
    try {
      const res = await fetch(`${API_BASE}/delete-symbol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      appendLog(`✓ Deleted data for ${data.symbol} (${data.count} symbol(s) removed)`)
      setDeleteSymbol('')
      fetchScrapingStats()
    } catch (err) {
      appendLog(`Error deleting ${symbol}: ${(err as Error).message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const handleScrapeAll = async () => {
    if (isScrapingAll) return
    setIsScrapingAll(true)
    abortAllRef.current = false
    setProcessedSymbols(0)
    setSuccessCount(0)
    setFailureCount(0)
    appendLog('Fetching symbol list from API...')

    try {
      const res = await fetch(`${API_BASE}/symbols`)
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as SymbolIndexResponse
      let symbols = data.symbols ?? []

      if (symbols.length === 0) {
        appendLog('No symbols found in index. Refresh index first.')
        setIsScrapingAll(false)
        return
      }

      // Shuffle to avoid sequential scraping patterns
      symbols = [...symbols].sort(() => Math.random() - 0.5)
      setTotalSymbols(symbols.length)
      appendLog(`Starting bulk scrape for ${symbols.length} symbols...`)

      for (let i = 0; i < symbols.length; i++) {
        if (abortAllRef.current) {
          appendLog('Bulk scrape cancelled.')
          break
        }

        const sym = symbols[i]
        appendLog(`(${i + 1}/${symbols.length}) Scraping ${sym}...`)
        try {
          const res2 = await fetch(`${API_BASE}/scrape-symbol`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: sym }),
          })
          if (!res2.ok) {
            appendLog(`  -> Error for ${sym}: ${await res2.text()}`)
            setFailureCount(prev => prev + 1)
          } else {
            const d2 = (await res2.json()) as ScrapeSymbolResponse
            if (d2.status === 'success') {
              appendLog(
                `  -> ✓ ${d2.symbol} (Screener: ${d2.screener_symbol}) at ${d2.last_updated}`
              )
              setSuccessCount(prev => prev + 1)
            } else {
              appendLog(`  -> ✗ Failed ${d2.symbol}: ${d2.error || 'Unknown error'}`)
              setFailureCount(prev => prev + 1)
            }
          }
        } catch (err) {
          appendLog(`  -> Network error for ${sym}: ${(err as Error).message}`)
          setFailureCount(prev => prev + 1)
        }

        setProcessedSymbols(prev => prev + 1)

        // Random pause between 1–5 seconds to mimic human behaviour
        const delayMs = (1 + Math.random() * 4) * 1000
        appendLog(`  -> Sleeping for ${(delayMs / 1000).toFixed(2)}s...`)
        await sleep(delayMs)
      }

      appendLog(`Bulk scrape complete. Success: ${successCount}, Failed: ${failureCount}`)
      fetchScrapingStats()

      appendLog('Bulk scrape complete.')
    } catch (err) {
      appendLog(`Error fetching symbol list: ${(err as Error).message}`)
    } finally {
      setIsScrapingAll(false)
    }
  }

  const handleCancelAll = () => {
    if (!isScrapingAll) return
    abortAllRef.current = true
    appendLog('Requested cancellation of bulk scrape...')
  }

  useEffect(() => {
    // On first load, just log the API base and try to fetch symbol list for viewer
    appendLog(`Using API base: ${API_BASE}`)
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/symbols`)
        if (!res.ok) return
        const data = (await res.json()) as SymbolIndexResponse
        setSymbolList(data.symbols ?? [])
      } catch {
        // ignore
      }
    })()
  }, [appendLog])

  const handleSelectViewSymbol = (sym: string) => {
    setViewSymbol(sym)
    setViewSection(null)
    setViewData(null)
  }

  const handleLoadViewData = async () => {
    const sym = viewSymbol.trim().toUpperCase()
    if (!sym) {
      appendLog('Enter a symbol to view.')
      return
    }
    setIsLoadingView(true)
    appendLog(`Loading company data for ${sym}...`)
    try {
      const res = await fetch(`${API_BASE}/company-data/${encodeURIComponent(sym)}`)
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as CompanyDataResponse
      setViewData(data)
      const sections = Object.keys(data.sections || {})
      setViewSection(sections[0] ?? null)
      appendLog(
        `Loaded company data for ${data.symbol} (Screener: ${data.screener_symbol}).`
      )
    } catch (err) {
      appendLog(`Error loading company data: ${(err as Error).message}`)
    } finally {
      setIsLoadingView(false)
    }
  }

  const handleGenerateReport = async (
    symbolOverride?: string,
    horizonOverride?: number
  ) => {
    const symbol = (symbolOverride ?? reportSymbol).trim().toUpperCase()
    const horizon = horizonOverride ?? reportHorizon
    if (!symbol) {
      appendLog('Please enter a symbol to generate report.')
      return
    }
    // Sync state when using override (demo button)
    if (symbolOverride) setReportSymbol(symbol)
    if (horizonOverride !== undefined) setReportHorizon(horizon)

    setIsGeneratingReport(true)
    setReportData(null)
    appendLog(`Generating AI investment report for ${symbol}...`)
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, horizon_years: horizon }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as AnalyzeResponse
      setReportData(data)
      appendLog(
        `Generated report for ${data.symbol}. Verdict: ${data.verdict}`
      )
    } catch (err) {
      appendLog(`Error generating report: ${(err as Error).message}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const progress =
    totalSymbols && totalSymbols > 0
      ? `${processedSymbols}/${totalSymbols} (${(
          (processedSymbols / totalSymbols) *
          100
        ).toFixed(1)}%)`
      : null

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-sky-600 flex items-center justify-center text-xs font-bold text-white">
            α
          </div>
      <div>
            <h1 className="text-lg font-semibold tracking-tight">Alpha Console</h1>
            <p className="text-xs text-slate-500">Screener scraper & data viewer</p>
          </div>
        </div>
        <span className="text-xs text-slate-500">API: {API_BASE}</span>
      </header>

      <main className="w-full max-w-7xl mx-auto flex flex-col gap-4 px-4 py-4 lg:px-8 lg:py-6">
        {/* Scraping controls + log */}
        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Symbol index</h2>
            <button
              onClick={handleRefreshIndex}
              disabled={isRefreshingIndex || isScrapingAll}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
            >
              {isRefreshingIndex ? 'Refreshing…' : 'Fetch Symbols (Refresh Index)'}
            </button>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Fetch single stock data</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. HDFCBANK"
                value={singleSymbol}
                onChange={e => setSingleSymbol(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={() => handleScrapeOne(false)}
                disabled={isScrapingOne || isScrapingAll}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {isScrapingOne ? 'Fetching…' : 'Fetch This Stock Data'}
              </button>
              <button
                onClick={() => handleScrapeOne(true)}
                disabled={isScrapingOne || isScrapingAll}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-500 disabled:opacity-50"
                title="Force update (bypasses 16-hour freshness check)"
              >
                Force Update
              </button>
      </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Delete stock data</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. HDFCBANK"
                value={deleteSymbol}
                onChange={e => setDeleteSymbol(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={handleDeleteSymbol}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete Record'}
        </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Permanently deletes all database records and HTML file for this symbol. This action cannot be undone.
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Fetch all stocks</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleScrapeAll}
                disabled={isScrapingAll}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {isScrapingAll ? 'Running Bulk Fetch…' : 'Fetch All Stocks (Randomized)'}
              </button>
              <button
                onClick={handleCancelAll}
                disabled={!isScrapingAll}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              {progress && (
                <span className="text-xs text-slate-500">Progress: {progress}</span>
              )}
              {isScrapingAll && (
                <span className="text-xs text-slate-700">
                  ✓ {successCount} | ✗ {failureCount}
                </span>
              )}
      </div>
            <p className="text-[11px] text-slate-500">
              Uses random order and a random 1–5s delay between scraper calls to reduce
              anti-scraping risk. 404 errors trigger Gemini fallback to find correct Screener slug.
            </p>
            {scrapingStats && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div className="text-[11px] font-medium text-slate-700 mb-1">Scraping Statistics:</div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                  <div>Total symbols: <span className="font-semibold">{scrapingStats.total_symbols}</span></div>
                  <div>Scraped: <span className="font-semibold text-emerald-700">{scrapingStats.scraped_successfully}</span></div>
                  <div>Failed: <span className="font-semibold text-red-700">{scrapingStats.failed}</span></div>
                  <div>Not scraped: <span className="font-semibold text-slate-500">{scrapingStats.not_scraped}</span></div>
                  <div className="col-span-2">Recently scraped (16h): <span className="font-semibold text-sky-700">{scrapingStats.recently_scraped}</span></div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Generate AI Investment Report</h2>
            <div className="flex gap-2 items-end flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <div className="mb-1 text-[11px] font-medium text-slate-500">
                  Symbol
                </div>
                <input
                  type="text"
                  placeholder="e.g. HDFCBANK"
                  value={reportSymbol}
                  onChange={e => setReportSymbol(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="w-24">
                <div className="mb-1 text-[11px] font-medium text-slate-500">
                  Horizon (years)
                </div>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={reportHorizon}
                  onChange={e => setReportHorizon(parseInt(e.target.value) || 3)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {isGeneratingReport ? 'Generating…' : 'Generate Report'}
              </button>
              <button
                onClick={() => handleGenerateReport('RELIANCE', 3)}
                disabled={isGeneratingReport}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-200 disabled:opacity-50"
                title="Loads a demo symbol and generates its report"
              >
                Load Demo
              </button>
            </div>
            {reportData && (
              <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {reportData.symbol} Investment Report
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Last updated: {reportData.last_updated} • Horizon: {reportData.horizon_years} years
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                    reportData.verdict === 'BUY' ? 'bg-emerald-100 text-emerald-800' :
                    reportData.verdict === 'SELL' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {reportData.verdict}
                  </div>
                </div>
                <div className="text-xs text-slate-700 bg-white p-3 rounded border border-slate-200">
                  <div className="font-semibold mb-1">Rationale:</div>
                  <div>{reportData.verdict_rationale}</div>
                </div>
                <div className="max-h-96 overflow-y-auto rounded-md border border-slate-200 bg-white p-4 text-xs text-slate-800 whitespace-pre-wrap font-mono">
                  {reportData.report_markdown}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">Activity log</h2>
            <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px] font-mono text-slate-800">
              {logLines.length === 0 ? (
                <div className="text-slate-400">No activity yet.</div>
              ) : (
                logLines.map((line, idx) => <div key={idx}>{line}</div>)
              )}
            </div>
          </section>
        </div>

        {/* Stock data viewer */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col min-h-[420px]">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Stock data viewer</h2>
          <div className="flex gap-3 mb-3">
            <div className="w-40">
              <div className="mb-1 text-[11px] font-medium text-slate-500">
                Symbols
              </div>
              <div className="h-64 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 text-[11px]">
                {symbolList.length === 0 ? (
                  <div className="p-2 text-slate-400 text-center">
                    Refresh index to load symbols.
                  </div>
                ) : (
                  symbolList.map(sym => (
                    <button
                      key={sym}
                      onClick={() => handleSelectViewSymbol(sym)}
                      className={`block w-full px-2 py-1 text-left hover:bg-slate-200 ${
                        viewSymbol === sym ? 'bg-slate-200 text-sky-700' : 'text-slate-800'
                      }`}
                    >
                      {sym}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <div className="mb-1 text-[11px] font-medium text-slate-500">
                    Selected Symbol
                  </div>
                  <input
                    type="text"
                    value={viewSymbol}
                    onChange={e => setViewSymbol(e.target.value)}
                    placeholder="e.g. HDFCBANK"
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <button
                  onClick={handleLoadViewData}
                  disabled={isLoadingView}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isLoadingView ? 'Loading…' : 'Load Data'}
                </button>
              </div>

              {viewData ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {viewData.symbol}{' '}
                        <span className="text-slate-500">
                          (Screener: {viewData.screener_symbol})
                        </span>
                      </div>
                        {viewData.last_updated && (
                        <div className="text-[11px] text-slate-500">
                          Last scraped: {viewData.last_updated}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 text-[11px] text-slate-600">
                      {Object.entries(viewData.key_metrics)
                        .slice(0, 4)
                        .map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded-full border border-slate-700 px-2 py-0.5"
                          >
                            <span className="font-medium">{k}:</span> {v}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-1">
                      {Object.keys(viewData.sections).map(sec => (
                        <button
                          key={sec}
                          onClick={() => setViewSection(sec)}
                          className={`px-2 py-1 text-[11px] rounded-md ${
                            viewSection === sec
                              ? 'bg-sky-100 text-sky-700'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {sec}
                        </button>
                      ))}
                    </div>
                    {viewSection && (
                      <div className="rounded-md border border-slate-200 bg-white overflow-x-auto">
                        <table className="min-w-max border-collapse text-[11px] text-slate-900">
                          <thead className="bg-slate-100 sticky top-0 z-10">
                            <tr>
                              {viewData.sections[viewSection]?.[0] &&
                                Object.keys(viewData.sections[viewSection][0]).map(
                                  col => (
                                    <th
                                      key={col}
                                      className="px-2 py-1 border-b border-slate-200 text-left font-semibold"
                                    >
                                      {col}
                                    </th>
                                  )
                                )}
                            </tr>
                          </thead>
                          <tbody>
                            {viewData.sections[viewSection]?.map((row, idx) => (
                              <tr
                                key={idx}
                                className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                              >
                                {Object.keys(row).map(col => (
                                  <td
                                    key={col}
                                    className="px-2 py-1 border-b border-slate-200 whitespace-nowrap"
                                  >
                                    {row[col]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-md bg-slate-50">
                  Select a symbol and click &quot;Load Data&quot; to view financial tables.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
