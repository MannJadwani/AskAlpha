import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = Number(process.env.COMPARE_TIMEOUT_MS || 45000);
const MAX_TOKENS = Number(process.env.COMPARE_MAX_TOKENS || 2500);

function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      onTimeout?.();
      reject(new Error('Request timed out'));
    }, ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Gemini API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { companies } = await request.json();

    if (!companies || !Array.isArray(companies) || companies.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 company names are required for comparison' },
        { status: 400 }
      );
    }

    if (companies.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 companies can be compared at once' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    function safeJsonParse(raw: string | undefined | null): any | null {
      if (!raw || typeof raw !== 'string') return null;
      let text = raw.trim();
      try {
        // strip markdown code fences if present
        text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        return JSON.parse(text);
      } catch {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const sliced = text.slice(start, end + 1);
          try {
            return JSON.parse(sliced);
          } catch {
            const noTrailingCommas = sliced.replace(/,(\s*[}\]])/g, '$1');
            try {
              return JSON.parse(noTrailingCommas);
            } catch {
              return null;
            }
          }
        }
        return null;
      }
    }

    // Helper to call Gemini with a specific prompt
    async function callGeminiWithPrompt(prompt: string, useSearch: boolean) {
      return await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          tools: useSearch ? [{ googleSearch: {} }] : undefined,
          temperature: 0.2,
          maxOutputTokens: MAX_TOKENS
        },
      });
    }

    // Build per-company prompt (single company search)
    function buildCompanyPrompt(companyName: string) {
      return `Find the latest fundamental data for the company: ${companyName}

IMPORTANT DATA SOURCING:
- Screener.in is the BEST and PRIMARY source for Indian stocks. Use it FIRST for ratios (ROE, ROCE, Book Value, P/E), profit & loss, balance sheet, and per-share metrics. If screener.in is unavailable, consult Moneycontrol, NSE/BSE, and official annual reports.
- You MUST find ALL KPI metrics below. Avoid "N/A" unless absolutely impossible after exhaustive search. If a KPI is missing, calculate it from raw data when possible (e.g., ROE = Net Profit / Shareholder Equity; ROCE = EBIT / Capital Employed).

Return ONLY valid JSON with this shape (no markdown):
{
  "name": "${companyName}",
  "symbol": "NSE/BSE symbol if Indian, else primary exchange symbol",
  "overview": "Brief 2-3 sentence overview of the business",
  "metrics": {
    "currentPrice": "₹XX or $XX with currency",
    "marketCap": "Value with unit (Cr/Bn)",
    "pe": "P/E ratio",
    "pb": "P/B ratio",
    "roe": "ROE %",
    "roce": "ROCE %",
    "debtToEquity": "Debt/Equity ratio",
    "profitMargin": "Net profit margin %",
    "revenueGrowth": "YoY revenue growth %",
    "sector": "Industry sector"
  },
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "recentNews": "Brief summary of recent significant news or developments",
  "analystRating": "BUY/HOLD/SELL if available, else 'N/A'",
  "targetPrice": "Analyst consensus target if available"
}`;
    }

    // Build follow-up prompt for a single company to fill missing KPIs
    function buildFillPrompt(companyName: string, missingKeys: string[]) {
      return `FILL ONLY THE FOLLOWING MISSING KPI FIELDS for ${companyName}.

IMPORTANT:
- screener.in is the PRIMARY source for Indian fundamentals (ratios, per-share metrics). Use it FIRST. Then Moneycontrol/NSE/BSE/annual reports if needed.
- You MUST try to find ALL missing KPIs. Avoid "N/A" unless absolutely impossible after exhaustive searching. If a KPI can be calculated from raw data, do so.

Return ONLY valid JSON, no markdown:
{ "fill": { ${missingKeys.map(k => `"${k}": "value"`).join(', ')} } }`;
    }

    const sources: string[] = [];
    const perCompanyResults: any[] = [];

    console.log('Fetching per-company data with Gemini for:', companies);

    // Sequentially process each company (one API call per company, with retry and timeout)
    for (const companyName of companies) {
      const companyPrompt = buildCompanyPrompt(companyName);
      let companyResp;
      try {
        companyResp = await withTimeout(
          callGeminiWithPrompt(companyPrompt, true),
          TIMEOUT_MS,
          () => console.warn(`Company fetch (with search) timed out for ${companyName}`)
        );
      } catch (firstErr) {
        console.warn(`Company fetch failed (with search) for ${companyName}, falling back without search:`, firstErr);
        companyResp = await withTimeout(
          callGeminiWithPrompt(companyPrompt, false),
          Math.min(TIMEOUT_MS, 30000),
          () => console.warn(`Company fetch (no search) timed out for ${companyName}`)
        );
      }

      const compText = companyResp.text || '{}';
      const compJson = safeJsonParse(compText) ?? {};

      // collect sources for this call
      const compChunks = companyResp.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (compChunks) {
        for (const chunk of compChunks) if (chunk.web?.uri) sources.push(chunk.web.uri);
      }

      // Second pass per company: detect missing KPIs and fill
      const kpiKeys = ['currentPrice','marketCap','pe','pb','roe','roce','debtToEquity','profitMargin','revenueGrowth','sector'];
      const metrics = compJson?.metrics || {};
      const missing: string[] = [];
      kpiKeys.forEach((k) => {
        const v = metrics?.[k];
        if (v === undefined || v === null || (typeof v === 'string' && v.trim().toUpperCase() === 'N/A')) missing.push(k);
      });

      if (missing.length > 0) {
        const fillPrompt = buildFillPrompt(companyName, missing);
        let fillResp;
        try {
          fillResp = await withTimeout(
            callGeminiWithPrompt(fillPrompt, true),
            Math.min(TIMEOUT_MS, 25000)
          );
        } catch {
          fillResp = await withTimeout(
            callGeminiWithPrompt(fillPrompt, false),
            Math.min(TIMEOUT_MS, 20000)
          );
        }
        const fillText = fillResp.text || '{}';
        const fillJson: any = safeJsonParse(fillText) ?? {};

        const fills = fillJson?.fill || {};
        if (!compJson.metrics) compJson.metrics = {};
        Object.keys(fills).forEach((k) => {
          const cur = compJson.metrics[k];
          if (cur === undefined || cur === null || (typeof cur === 'string' && cur.trim().toUpperCase() === 'N/A')) {
            compJson.metrics[k] = fills[k];
          }
        });

        // collect sources from follow-up
        const fillChunks = fillResp.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (fillChunks) {
          for (const chunk of fillChunks) if (chunk.web?.uri) sources.push(chunk.web.uri);
        }
      }

      perCompanyResults.push(compJson);
    }

    // Final comparison summary generation based on collected company data
    const comparisonInputJson = JSON.stringify({ companies: perCompanyResults });
    const comparisonPrompt = `Based on the following structured company data JSON, produce ONLY the "comparison" object with this exact shape and keys:
{
  "valuation": "Which company has better valuation and why (2-3 sentences)",
  "growth": "Which has better growth prospects (2-3 sentences)",
  "profitability": "Which is more profitable (2-3 sentences)",
  "risk": "Comparative risk assessment (2-3 sentences)",
  "recommendation": "Overall investment recommendation - which to choose and why (3-4 sentences)"
}

Use objective language. Do not repeat all metrics; synthesize insights.
Company data:
${comparisonInputJson}`;

    let comparisonResp;
    try {
      comparisonResp = await withTimeout(
        callGeminiWithPrompt(comparisonPrompt, false),
        Math.min(TIMEOUT_MS, 25000)
      );
    } catch {
      // fallback with search if needed
      comparisonResp = await withTimeout(
        callGeminiWithPrompt(comparisonPrompt, true),
        Math.min(TIMEOUT_MS, 20000)
      );
    }

    const comparisonText = comparisonResp?.text || '{}';
    const comparisonJson: any = safeJsonParse(comparisonText) ?? {};

    // collect sources from comparison step as well
    const comparisonChunks = comparisonResp?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (comparisonChunks) {
      for (const chunk of comparisonChunks) if (chunk.web?.uri) sources.push(chunk.web.uri);
    }

    return NextResponse.json({
      comparison: {
        companies: perCompanyResults,
        comparison: comparisonJson || {
          valuation: '',
          growth: '',
          profitability: '',
          risk: '',
          recommendation: ''
        }
      },
      sources: [...new Set(sources)],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error comparing stocks:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while comparing stocks'
      },
      { status: 500 }
    );
  }
}

