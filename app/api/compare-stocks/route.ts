import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const TIMEOUT_MS = Number(process.env.COMPARE_TIMEOUT_MS || 45000);

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

// Helper to call Perplexity for company research
async function perplexityResearch(
  query: string,
  systemPrompt: string,
  searchRecency: "day" | "week" | "month" = "week"
): Promise<{ content: string; citations: string[] }> {
  if (!PERPLEXITY_API_KEY) return { content: "", citations: [] };
  
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        return_citations: true,
        search_recency_filter: searchRecency,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Perplexity error ${res.status}:`, errorText);
      throw new Error(`Perplexity error ${res.status}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const citations = Array.isArray(data?.citations) ? data.citations : [];
    return { content, citations };
  } catch (e) {
    console.warn("Perplexity research failed:", e);
    return { content: "", citations: [] };
  }
}

export async function POST(request: NextRequest) {
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: 'Perplexity API key is not configured' },
      { status: 500 }
    );
  }

  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
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

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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

    // Fetch company data using Perplexity and extract structured data with OpenAI
    async function fetchCompanyData(companyName: string): Promise<{ data: any; citations: string[] }> {
      // Step 1: Use Perplexity to research the company
      const perplexityQuery = `Search for "${companyName} stock fundamentals" and find:
1. Current stock price (₹ or $)
2. Market capitalization
3. P/E ratio (Price to Earnings)
4. P/B ratio (Price to Book)
5. ROE % (Return on Equity)
6. ROCE % (Return on Capital Employed)
7. Debt-to-Equity ratio
8. Net profit margin %
9. Revenue growth % (YoY)
10. Industry sector
11. Stock symbol (NSE/BSE for Indian stocks)
12. Recent news or developments
13. Analyst rating (BUY/HOLD/SELL) if available
14. Target price if available

For Indian stocks, prioritize Screener.in, Moneycontrol, NSE/BSE. For international stocks, use Yahoo Finance, Bloomberg, or company investor relations pages.`;

      const systemPrompt = `You are a financial research assistant. Extract EXACT financial metrics and company information from reliable sources. For Indian stocks, prioritize Screener.in and Moneycontrol. Provide specific numbers with units.`;

      const { content: researchData, citations } = await perplexityResearch(
        perplexityQuery,
        systemPrompt,
        "week"
      );

      // Step 2: Use OpenAI to structure the data into JSON
      const extractionPrompt = `Extract and structure the following company research data into JSON format.

Company: ${companyName}

Research Data:
${researchData}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "name": "${companyName}",
  "symbol": "Stock symbol (NSE/BSE for Indian, else primary exchange)",
  "overview": "Brief 2-3 sentence business overview",
  "metrics": {
    "currentPrice": "Current price with currency (₹XX or $XX)",
    "marketCap": "Market cap with unit (Cr/Bn)",
    "pe": "P/E ratio as number or string",
    "pb": "P/B ratio as number or string",
    "roe": "ROE % as number or string",
    "roce": "ROCE % as number or string",
    "debtToEquity": "Debt/Equity ratio as number or string",
    "profitMargin": "Net profit margin % as number or string",
    "revenueGrowth": "YoY revenue growth % as number or string",
    "sector": "Industry sector name"
  },
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "recentNews": "Brief summary of recent news or developments",
  "analystRating": "BUY/HOLD/SELL or 'N/A'",
  "targetPrice": "Target price if available, else 'N/A'"
}

IMPORTANT:
- Use EXACT numbers from the research data. Do not estimate.
- If a metric is not found, use "N/A" for that field.
- For Indian stocks, ensure symbol includes exchange (e.g., "NSE:RELIANCE" or "BSE:500325").
- Extract strengths and weaknesses from the research data.`;

      const extractionResponse = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a data extraction assistant. Extract structured financial data from research text. Always return valid JSON only."
          },
          {
            role: "user",
            content: extractionPrompt
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const extractedJson = safeJsonParse(extractionResponse.choices[0]?.message?.content || "{}") || {};

      return {
        data: {
          name: companyName,
          ...extractedJson,
        },
        citations,
      };
    }

    const sources: string[] = [];
    const perCompanyResults: any[] = [];

    console.log('Fetching per-company data with Perplexity for:', companies);

    // Process each company in parallel for faster results
    const companyPromises = companies.map(async (companyName: string) => {
      try {
        const result = await withTimeout(
          fetchCompanyData(companyName),
          TIMEOUT_MS,
          () => console.warn(`Company fetch timed out for ${companyName}`)
        );
        sources.push(...result.citations);
        return result.data;
      } catch (error) {
        console.error(`Error fetching data for ${companyName}:`, error);
        // Return a basic structure even if fetch fails
        return {
          name: companyName,
          symbol: 'N/A',
          overview: 'Data fetch failed',
          metrics: {
            currentPrice: 'N/A',
            marketCap: 'N/A',
            pe: 'N/A',
            pb: 'N/A',
            roe: 'N/A',
            roce: 'N/A',
            debtToEquity: 'N/A',
            profitMargin: 'N/A',
            revenueGrowth: 'N/A',
            sector: 'N/A'
          },
          strengths: [],
          weaknesses: [],
          recentNews: 'N/A',
          analystRating: 'N/A',
          targetPrice: 'N/A'
        };
      }
    });

    const results = await Promise.all(companyPromises);
    perCompanyResults.push(...results);

    // Final comparison summary generation based on collected company data
    const comparisonInputJson = JSON.stringify({ companies: perCompanyResults }, null, 2);
    const comparisonPrompt = `Based on the following structured company data JSON, produce a comparison analysis.

Company Data:
${comparisonInputJson}

Generate a comparison object with this exact structure:
{
  "valuation": "Which company has better valuation and why (2-3 sentences). Compare P/E, P/B ratios.",
  "growth": "Which has better growth prospects (2-3 sentences). Compare revenue growth and future potential.",
  "profitability": "Which is more profitable (2-3 sentences). Compare ROE, ROCE, profit margins.",
  "risk": "Comparative risk assessment (2-3 sentences). Consider debt levels, volatility, sector risks.",
  "recommendation": "Overall investment recommendation - which to choose and why (3-4 sentences). Be specific and actionable."
}

Use objective language. Do not repeat all metrics; synthesize insights. Reference specific numbers from the data.`;

    let comparisonJson: any = {};
    try {
      const comparisonResp = await withTimeout(
        openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            {
              role: "system",
              content: "You are a financial analyst providing objective stock comparisons. Synthesize insights from company data."
            },
            {
              role: "user",
              content: comparisonPrompt
            }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
          max_tokens: 1500,
        }),
        Math.min(TIMEOUT_MS, 25000)
      );

      const comparisonText = comparisonResp.choices[0]?.message?.content || '{}';
      comparisonJson = safeJsonParse(comparisonText) ?? {};
    } catch (error) {
      console.error('Error generating comparison:', error);
      comparisonJson = {
        valuation: 'Comparison analysis unavailable',
        growth: 'Comparison analysis unavailable',
        profitability: 'Comparison analysis unavailable',
        risk: 'Comparison analysis unavailable',
        recommendation: 'Comparison analysis unavailable'
      };
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

