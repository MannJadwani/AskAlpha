import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const TIMEOUT_MS = Number(process.env.PORTFOLIO_TIMEOUT_MS || 45000);
const MAX_TOKENS = Number(process.env.PORTFOLIO_MAX_TOKENS || 2000);

interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  value?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

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

function safeJsonParse(raw: string | undefined | null): any | null {
  if (!raw || typeof raw !== 'string') return null;
  let text = raw.trim();
  try {
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    return JSON.parse(text);
  } catch {
    const arrStart = text.indexOf('[');
    const arrEnd = text.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      const sliced = text.slice(arrStart, arrEnd + 1);
      try {
        return JSON.parse(sliced);
      } catch {}
    }
    const objStart = text.indexOf('{');
    const objEnd = text.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      const obj = text.slice(objStart, objEnd + 1);
      try {
        return JSON.parse(obj);
      } catch {}
    }
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Gemini API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const method = formData.get('method') as string;
    
    let portfolioText = '';
    
    if (method === 'file') {
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Read file content
      const fileContent = await file.text();
      portfolioText = fileContent;
    } else {
      portfolioText = formData.get('portfolioData') as string;
      
      if (!portfolioText) {
        return NextResponse.json(
          { error: 'No portfolio data provided' },
          { status: 400 }
        );
      }
    }

    console.log('Received portfolio data:', portfolioText.substring(0, 200));

    // Step 1: Parse portfolio holdings using Gemini
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const parsePrompt = `Parse the following portfolio data and extract holdings. The data may be in CSV or free-text manual entry.

Portfolio Data:
${portfolioText}

Return ONLY a JSON array of holdings with EXACTLY this structure (no markdown):
[
  { "symbol": "RELIANCE", "quantity": 100, "avgPrice": 2450.50 }
]

Rules:
- Extract symbol (ticker), quantity (number), and avgPrice (number in INR if Indian, USD if US)
- Ignore headers if present
- Handle both comma- and whitespace-separated formats
- Do not include extra keys; return only the array.`;

    const parseResp = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: parsePrompt,
        config: { temperature: 0.1, maxOutputTokens: MAX_TOKENS }
      }),
      Math.min(TIMEOUT_MS, 20000)
    );

    const parsedData = safeJsonParse(parseResp.text || '') || {};
    const holdings: PortfolioHolding[] = Array.isArray(parsedData)
      ? parsedData
      : Array.isArray((parsedData as any).holdings) ? (parsedData as any).holdings : [];

    if (!holdings || holdings.length === 0) {
      return NextResponse.json(
        { error: 'Could not parse portfolio holdings. Please check the format.' },
        { status: 400 }
      );
    }

    console.log('Parsed holdings:', holdings.length, 'stocks');

    // Step 2: Get current prices using Gemini with Google Search grounding
    try {
      const symbols = holdings.map(h => h.symbol).join(', ');
      const pricePrompt = `Fetch the LATEST current market prices for the following stocks: ${symbols}

CRITICAL REQUIREMENTS:
1. For Indian stocks, prefer screener.in and NSE/BSE; for US stocks, use official sources or major aggregators (e.g., Nasdaq, Google Finance).
2. Use Google Search to retrieve fresh prices.
3. Return ONLY valid JSON with this exact shape:
{
  "prices": [
    { "symbol": "RELIANCE", "currentPrice": 2580.25, "currency": "INR" }
  ]
}`;

      async function callPrices(useSearch: boolean) {
        return await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: pricePrompt,
          config: {
            tools: useSearch ? [{ googleSearch: {} }] : undefined,
            temperature: 0.2,
            maxOutputTokens: MAX_TOKENS
          }
        });
      }

      let priceResp;
      try {
        priceResp = await withTimeout(
          callPrices(true),
          Math.min(TIMEOUT_MS, 30000),
          () => console.warn('Gemini price fetch (with search) timed out')
        );
      } catch (firstErr) {
        console.warn('Gemini price fetch failed (with search), retrying without tools:', firstErr);
        priceResp = await withTimeout(
          callPrices(false),
          Math.min(TIMEOUT_MS, 20000)
        );
      }

      const pricesJson = safeJsonParse(priceResp.text || '') || {};
      const pricesArr: Array<{ symbol: string; currentPrice: number; currency?: string }> = pricesJson.prices || [];

      const symbolToPrice = new Map<string, { currentPrice: number; currency?: string }>();
      for (const p of pricesArr) {
        if (p && typeof p.symbol === 'string' && typeof p.currentPrice === 'number') {
          symbolToPrice.set(p.symbol.toUpperCase().trim(), { currentPrice: p.currentPrice, currency: p.currency });
        }
      }

      for (const holding of holdings) {
        const key = holding.symbol.toUpperCase().trim();
        const entry = symbolToPrice.get(key);
        if (entry && typeof entry.currentPrice === 'number') {
          const price = entry.currentPrice;
          holding.currentPrice = price;
          holding.value = holding.quantity * price;
          holding.gainLoss = holding.value - (holding.quantity * holding.avgPrice);
          holding.gainLossPercent = (holding.gainLoss / (holding.quantity * holding.avgPrice)) * 100;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch current prices via Gemini:', err);
    }

    // Calculate totals
    const totalInvestment = holdings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0);
    const totalValue = holdings.reduce((sum, h) => sum + (h.value || (h.quantity * h.avgPrice)), 0);
    const totalGainLoss = totalValue - totalInvestment;
    const totalGainLossPercent = (totalGainLoss / totalInvestment) * 100;

    // Step 3: Generate AI insights using Gemini
    const insightsPrompt = `Analyze this investment portfolio and provide insights.

Portfolio Holdings JSON:
${JSON.stringify(holdings)}

Totals (INR where applicable):
Total Investment: ${totalInvestment.toFixed(2)}
Current Value: ${totalValue.toFixed(2)}
Total Gain/Loss: ${totalGainLoss.toFixed(2)} (${totalGainLossPercent.toFixed(2)}%)

Provide ONLY valid JSON with this exact structure (no markdown):
{
  "insights": "Brief 2-3 sentence analysis",
  "riskScore": 45,
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "diversification": [{ "sector": "IT", "allocation": 35 }]
}`;

    const insightsResp = await withTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: insightsPrompt,
        config: { temperature: 0.4, maxOutputTokens: MAX_TOKENS }
      }),
      Math.min(TIMEOUT_MS, 20000)
    );

    const insightsData = safeJsonParse(insightsResp.text || '{}') || {};

    const response = {
      holdings,
      totalValue,
      totalInvestment,
      totalGainLoss,
      totalGainLossPercent,
      insights: insightsData.insights || 'Analysis complete.',
      recommendations: Array.isArray(insightsData.recommendations) ? insightsData.recommendations : [],
      diversification: Array.isArray(insightsData.diversification) ? insightsData.diversification : [],
      riskScore: typeof insightsData.riskScore === 'number' ? insightsData.riskScore : 50,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while analyzing the portfolio'
      },
      { status: 500 }
    );
  }
}

