import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MINI_MODEL = process.env.OPENAI_MINI_MODEL || 'gpt-4.1-mini';

const TIMEOUT_MS = Number(process.env.CHARTS2_TIMEOUT_MS || 60000);
const MAX_TOKENS = Number(process.env.CHARTS2_MAX_TOKENS || 2000);

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
  if (!GEMINI_API_KEY && !PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: 'No data provider is configured (Gemini or Perplexity required)' }, { status: 500 });
  }
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
  }

  try {
    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Step 0: Extract structured features from the natural-language query using Gemini
    let interpretedFeatures: any = null;
    if (GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY as string });
        const featuresPrompt = `You interpret a user's data request and extract structured features ONLY as JSON (no markdown).

USER QUERY:
"${query}"

Return STRICT JSON with keys:
{
  "entity": "Primary company or index (e.g., Reliance Industries)",
  "tickerHint": "Optional ticker or symbol if obvious (e.g., RELIANCE)",
  "metric": "Requested metric (e.g., revenue, EPS, EBITDA, market cap)",
  "frequency": "annual|quarterly|monthly|unknown",
  "timespan": "Textual timespan (e.g., last five years, last 8 quarters)",
  "startLabel": "Optional start label (e.g., 2019)",
  "endLabel": "Optional end label (e.g., 2024)",
  "unitPreference": "Preferred unit if implied (e.g., INR Cr, USD Bn, %) or unknown",
  "geography": "Country/region focus if implied (e.g., India) or unknown",
  "notes": "Any clarifications that help retrieval"
}`;
        const featuresResp = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: featuresPrompt,
            config: { temperature: 0.1, maxOutputTokens: 512 }
          }) as any,
          Math.min(TIMEOUT_MS, 15000),
          () => console.warn('Gemini feature extraction timed out')
        );
        const featText = (featuresResp as any)?.text || '';
        const parsed = safeJsonParse(featText);
        if (parsed && typeof parsed === 'object') interpretedFeatures = parsed;
      } catch (e) {
        console.warn('Gemini feature extraction failed:', e);
      }
    }

    // Build the data retrieval prompt (includes interpreted features when available)
    const dataPrompt = `You are a financial data retrieval agent.
The user asked: "${query}".

INTERPRETED FEATURES (may be null):
${JSON.stringify(interpretedFeatures)}

TASK:
- Search the web for authoritative sources (prefer official filings, exchanges, screener.in for Indian equities, and company investor relations pages) to obtain the requested numeric time series or category series.
- Honor the interpreted features for entity, metric, frequency, timespan, geography, and units if available. If ambiguous, choose the most standard interpretation.
- Return STRICT JSON with this exact shape (no markdown, no commentary):
{
  "title": "Human-readable title",
  "unit": "e.g., INR Cr, USD Bn, %",
  "series": [
    { "label": "2019", "value": 123.45 },
    { "label": "2020", "value": 150.10 }
  ],
  "sources": ["https://source1", "https://source2"]
}

RULES:
- Ensure labels are chronological if time-based.
- Values must be numbers.
- Prefer last 5-10 points if the query mentions a time range.
- Include 1-3 credible source URLs used.
`;

    async function fetchDataViaGemini(): Promise<any> {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY as string });
      // Try with search tools first
      try {
        const respWithSearch = await withTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: dataPrompt,
            config: {
              tools: [{ googleSearch: {} }],
              temperature: 1,
              maxOutputTokens: MAX_TOKENS
            }
          }) as any,
          Math.min(TIMEOUT_MS, 40000),
          () => console.warn('Gemini data fetch (with search) timed out')
        );
        const text = (respWithSearch as any)?.text || '';
        console.log(text)
        const parsed = safeJsonParse(text);
        if (parsed && Array.isArray(parsed.series)) return parsed;
        throw new Error('Gemini returned unstructured data');
      } catch (err) {
        console.warn('Gemini with search failed, retrying without tools...', err);
        const respNoTools = await withTimeout(
          (new GoogleGenAI({ apiKey: GEMINI_API_KEY as string })).models.generateContent({
            model: GEMINI_MODEL,
            contents: dataPrompt,
            config: { temperature: 0.1, maxOutputTokens: MAX_TOKENS }
          }) as any,
          Math.min(TIMEOUT_MS, 25000),
          () => console.warn('Gemini data fetch (no tools) timed out')
        );
        const text = (respNoTools as any)?.text || '';
        const parsed = safeJsonParse(text);
        if (parsed && Array.isArray(parsed.series)) return parsed;
        throw new Error('Gemini returned unstructured data');
      }
    }

    async function fetchDataViaPerplexity(): Promise<any> {
      const res = await withTimeout(
        fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { role: 'system', content: 'You return ONLY valid JSON when asked. You are a financial data retrieval agent.' },
              { role: 'user', content: dataPrompt }
            ],
            temperature: 0.2,
            max_tokens: 2500,
            return_citations: true
          })
        }),
        Math.min(TIMEOUT_MS, 40000),
        () => console.warn('Perplexity data fetch timed out')
      );
      if (!res.ok) throw new Error(`Perplexity error: ${res.status}`);
      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content || '';
      const parsed = safeJsonParse(content);
      if (parsed && Array.isArray(parsed.series)) return parsed;
      throw new Error('Perplexity returned unstructured data');
    }

    let dataJson: any | null = null;
    if (GEMINI_API_KEY) {
      try {
        dataJson = await fetchDataViaGemini();
      } catch (e) {
        console.warn('Gemini failed to produce structured data:', e);
      }
    }
    if (!dataJson && PERPLEXITY_API_KEY) {
      try {
        dataJson = await fetchDataViaPerplexity();
      } catch (e) {
        console.warn('Perplexity failed to produce structured data as fallback:', e);
      }
    }
    if (!dataJson || !Array.isArray(dataJson.series)) {
      return NextResponse.json({ error: 'Failed to retrieve structured data for the query' }, { status: 502 });
    }

    // Call OpenAI to convert the data into standalone HTML with a responsive chart
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const chartPrompt = `Create a clean, modern, responsive HTML page that renders a chart for the following JSON data. The page must be fully self-contained and production-ready.

USER QUERY (for context):
${query}

DATA JSON:
${JSON.stringify(dataJson)}

REQUIREMENTS:
- Use Chart.js via CDN OR a simple inline SVG implementation; prefer Chart.js for interactivity.
- DARK THEME: Match a dark UI. Use a dark background (#0a0a0a or #0b0f1a) and light foreground text (#e5e7eb). Add <meta name="color-scheme" content="dark">.
- Title at top using the JSON title.
- If labels look like years or dates, render a line chart. Otherwise use a bar chart.
- Chart.js dark styling: legend labels color #e5e7eb; axes tick color #e5e7eb; gridline color rgba(255,255,255,0.1); tooltip background rgba(17,24,39,0.9) with light text.
- Show axes with labels and gridlines, legend when multiple datasets (here only one dataset named from the title).
- Make it responsive and readable on desktop and mobile.
- Include subtle hover tooltips.
- Optionally display a small "Sources" section at the bottom if sources are present in the JSON.
- Do not include any markdown fences; return ONLY raw HTML.
`;

    const htmlResp = await withTimeout(
      openai.chat.completions.create({
        model: OPENAI_MINI_MODEL,
        messages: [
          { role: 'system', content: 'You generate complete, safe, minimal HTML documents with charts from JSON data.' },
          { role: 'user', content: chartPrompt },
        ],
        temperature: 0.2,
        max_tokens: 3000
      }) as any,
      Math.min(TIMEOUT_MS, 40000),
      () => console.warn('OpenAI HTML generation timed out')
    );

    const html = (htmlResp as any)?.choices?.[0]?.message?.content || '';
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Failed to generate chart HTML' }, { status: 502 });
    }

    return NextResponse.json({
      html,
      data: dataJson,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating charts2:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while generating the chart' },
      { status: 500 }
    );
  }
}


