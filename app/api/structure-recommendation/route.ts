import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Define the recommendation schema
const RecommendationSchema = z.object({
  action: z.enum(['BUY', 'SELL', 'HOLD']),
  confidence: z.number().min(1).max(100),
  targetPrice: z.number().nullable().optional(),
  currentPrice: z.number().nullable().optional(),
  reasoning: z.string(),
  keyFactors: z.array(z.string()),
  risks: z.array(z.string()),
  timeHorizon: z.string()
});

// Structured analysis sections schema
const StructuredSectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  content: z.string(),
});

const KpiItemSchema = z.object({ label: z.string(), value: z.string() });

const StructuredAnalysisSchema = z.object({
  sections: z.array(StructuredSectionSchema).min(1),
  kpis: z.array(KpiItemSchema).length(8).optional(),
});

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { companyName, research, financials } = await request.json();

    if (!companyName || !research) {
      return NextResponse.json(
        { error: 'Company name and research data are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Extract NSE symbol if available
    const symbolPrompt = `Given the company name "${companyName}" and the research excerpt below, return ONLY the likely NSE stock symbol (ticker) for the Indian exchange. If multiple classes exist, pick the primary. If unknown, return "N/A". Do not add any extra text.

RESEARCH EXCERPT:
${research.substring(0, 2000)}
`;

    const symbolResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You return only the NSE ticker, like RELIANCE, TCS, INFY, HDFCBANK or N/A.' },
        { role: 'user', content: symbolPrompt }
      ],
      temperature: 1
    });

    const rawSymbol = (symbolResp.choices?.[0]?.message?.content || '').trim().toUpperCase();
    const nseSymbol = rawSymbol.replace(/[^A-Z0-9]/g, '') || 'N/A';
    console.log('Resolved NSE symbol:', nseSymbol);

    // Fetch Screener HTML if we have a symbol
    let screenerHtml = '';
    if (nseSymbol !== 'N/A') {
      try {
        const url = `https://www.screener.in/company/${encodeURIComponent(nseSymbol)}/consolidated/`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AskAlphaBot/1.0)' } });
        if (res.ok) {
          const html = await res.text();
          screenerHtml = html.slice(0, 100_000);
        } else {
          console.warn('Screener fetch failed', res.status);
        }
      } catch (e) {
        console.warn('Screener fetch error:', e);
      }
    }

    // Step 1: Generate the recommendation
    const structuringPrompt = `Based on the following comprehensive analysis of ${companyName}, generate a structured investment recommendation in JSON format.

ANALYSIS DATA (from Perplexity):
${research}

${financials ? `FINANCIAL DATA:
Revenue (Last 5 Years): ${JSON.stringify(financials.revenues_5yr)}
Profit (Last 5 Years): ${JSON.stringify(financials.profits_5yr)}
` : ''}

SCREENER COMPANY PAGE HTML (first 100k chars):
${screenerHtml}

Return a JSON object with this exact structure:
{
  "action": "BUY" | "SELL" | "HOLD",
  "confidence": 85,
  "targetPrice": 1250.50,
  "currentPrice": 1180.75,
  "reasoning": "Clear, concise explanation of the recommendation based on the analysis",
  "keyFactors": ["Factor 1", "Factor 2", "Factor 3", "Factor 4"],
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "timeHorizon": "6-12 months"
}

IMPORTANT FIELD REQUIREMENTS:
- action: Must be exactly "BUY", "SELL", or "HOLD"
- confidence: Number between 1-100
- targetPrice: **CRITICAL** - Only use if you find a RELIABLE analyst price target in the analysis. Convert to INR if needed. Set to null if no reliable target found.
- currentPrice: **CRITICAL** - Only use if you find the CURRENT/LIVE stock price in the analysis. Convert to INR if needed. Set to null if price data is outdated or unreliable.
- reasoning: String with 2-3 sentences explaining the recommendation
- keyFactors: Array of 3-5 strings describing supporting factors
- risks: Array of 2-4 strings describing risk factors
- timeHorizon: String describing investment timeframe

**PRICE VALIDATION RULES**:
1. **Current Price**: Only include if the analysis contains recent/live price data (within last trading day)
2. **Target Price**: CAREFULLY SEARCH the analysis for ANY mention of:
   - "Price target" or "target price"
   - "Fair value" estimates
   - "Consensus target" 
   - Analyst recommendations with specific price numbers
   - screener.in price targets or valuations
   - Brokerage price targets (even if in USD - convert to INR)
3. **Currency Conversion**: If prices are in USD, multiply by ~84 for INR conversion
4. **Sanity Check**: Ensure prices make logical sense (e.g., Indian stock prices typically range from ₹10 to ₹50,000)
5. **Extract Numbers**: Look for specific numerical targets in the analysis text, even if mentioned casually

**IMPORTANT**: If the analysis mentions ANY price target, fair value, or analyst recommendation with a specific number, extract it and convert to INR if needed. Do NOT set to null unless there are absolutely NO price targets mentioned anywhere in the analysis.

INSTRUCTIONS:
1. Choose BUY, SELL, or HOLD based on the analysis
2. Provide confidence level (1-100)
3. **THOROUGHLY SCAN** the analysis for any price targets, fair values, or analyst recommendations with specific numbers
4. If analysis mentions "price not current" for current price, set currentPrice to null, but still look for targets
5. Give a clear, compelling reasoning (2-3 sentences)
6. List 3-5 key supporting factors for the recommendation
7. List 2-4 main risks to consider
8. Specify appropriate time horizon (e.g., "3-6 months", "6-12 months", "12+ months")

Base your recommendation on:
- Financial performance and valuation
- Growth prospects and market position
- Recent developments and news
- Industry trends and competitive landscape
- Risk-reward profile

Return ONLY valid JSON without any additional text or explanation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a senior investment analyst who structures research into clear buy/sell/hold recommendations. You respond only with valid JSON data.'
        },
        {
          role: 'user',
          content: structuringPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 1
    });

    const recommendationJson = completion.choices[0].message.content;
    
    try {
      const recommendationData = JSON.parse(recommendationJson || '{}');
      
      // Validate the response structure using Zod
      const validatedRecommendation = RecommendationSchema.parse(recommendationData);
      
      console.log('Recommendation generated successfully for:', companyName, validatedRecommendation.action);
      console.log('Price data extracted - Current:', validatedRecommendation.currentPrice, 'Target:', validatedRecommendation.targetPrice);

      // Step 2: Create labeled JSON sections for the analysis content
      const sectionsPrompt = `Segment the following investment analysis into labeled sections and return JSON. Use markdown bullets and short paragraphs. Stick to content present in the analysis and do not invent data.

ANALYSIS DATA (from Perplexity):
${research}

${financials ? `FINANCIAL DATA:
Revenue (Last 5 Years): ${JSON.stringify(financials.revenues_5yr)}
Profit (Last 5 Years): ${JSON.stringify(financials.profits_5yr)}
` : ''}

SCREENER COMPANY PAGE HTML (first 100k chars, prefer this for exact figures if present):
${screenerHtml}

Return a JSON object with this exact shape:
{
  "kpis": [
    { "label": "Revenue (TTM, INR)", "value": "₹1,29,801 Cr" },
    { "label": "Profit Margin", "value": "10.43%" },
    { "label": "EBIT Margin", "value": "17.08%" },
    { "label": "EPS (TTM)", "value": "₹60.23" },
    { "label": "Return on Equity (ROE)", "value": "8.0%" },
    { "label": "Return on Capital Employed (ROCE)", "value": "8.71%" },
    { "label": "Book Value / Share", "value": "₹746.08" },
    { "label": "P/E", "value": "22.4x" }
  ],
  "sections": [
    { "key": "financial_performance", "title": "Financial Performance", "content": "- bullet..." },
    { "key": "valuation", "title": "Valuation & Multiples", "content": "- bullet..." },
    { "key": "fundamentals", "title": "Business Fundamentals & Moat", "content": "- bullet..." },
    { "key": "news_events", "title": "Recent News & Events", "content": "- bullet..." },
    { "key": "industry_trends", "title": "Industry & Trends", "content": "- bullet..." },
    { "key": "risks", "title": "Risks", "content": "- bullet..." },
    { "key": "outlook", "title": "Outlook & Catalysts", "content": "- bullet..." }
  ]
}

Rules:
- kpis: Provide EXACTLY 8 items in the specified order. **AVOID "N/A" at all costs**. Prefer INR where relevant.

**CRITICAL - CALCULATE MISSING KPIs FROM RAW DATA:**
If any of these 3 metrics are not directly stated, CALCULATE them from raw financial data found in the analysis or screener HTML:

1. **ROE (Return on Equity)**: 
   - Formula: (Net Profit / Total Shareholder Equity) × 100
   - Look for: "Net Profit", "PAT", "Shareholder Equity", "Net Worth", "Reserves & Surplus"
   - If you find Net Profit and Equity anywhere in the data, calculate ROE yourself
   - Example: Net Profit ₹500 Cr, Equity ₹5,000 Cr → ROE = (500/5000) × 100 = 10.0%

2. **ROCE (Return on Capital Employed)**:
   - Formula: (EBIT / Capital Employed) × 100 OR (EBIT / (Total Assets - Current Liabilities)) × 100
   - Look for: "EBIT", "Operating Profit", "Total Assets", "Current Liabilities", "Capital Employed"
   - If you find EBIT and balance sheet data, calculate ROCE yourself
   - Example: EBIT ₹800 Cr, Capital Employed ₹6,000 Cr → ROCE = (800/6000) × 100 = 13.3%

3. **Book Value / Share**:
   - Formula: Total Shareholder Equity / Total Outstanding Shares
   - Look for: "Shareholder Equity", "Net Worth", "Outstanding Shares", "Equity Share Capital", "Share Count"
   - If you find equity and share count, calculate Book Value yourself
   - Example: Equity ₹10,000 Cr, Shares 100 Cr → Book Value = 10000/100 = ₹100 per share

**EXTRACTION PRIORITY:**
1. First, look for the direct metric in the Perplexity analysis
2. Second, search the screener.in HTML for the metric (look for "ROE", "ROCE", "Book Value" in the HTML)
3. Third, find raw financial data and CALCULATE the metric using the formulas above
4. ONLY set to "N/A" if absolutely no relevant financial data exists anywhere

- Only include non-empty sections; omit empty ones.
- Keep each section under 2200 characters.
- Use markdown lists and short paragraphs.
- Do not include price targets or current price unless present in the analysis.`;

      const sectionsResp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a precise financial data extractor and calculator. You extract metrics from analysis data and calculate missing financial ratios from raw balance sheet and P&L data. You are proficient in financial formulas (ROE, ROCE, Book Value, etc.) and always attempt to calculate missing metrics before returning "N/A". You return only valid JSON matching the requested schema.' 
          },
          { role: 'user', content: sectionsPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 1500
      });

      let structuredAnalysis: z.infer<typeof StructuredAnalysisSchema> | null = null;
      try {
        const sectionsJson = sectionsResp.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(sectionsJson);
        structuredAnalysis = StructuredAnalysisSchema.parse(parsed);
      } catch (e) {
        console.warn('Structured sections generation failed, falling back to markdown only.');
        structuredAnalysis = null;
      }

      // Fallback: ensure we always have 8 KPIs (pad with N/A) if sections generated kpi lines
      let kpis: { label: string; value: string }[] | undefined = structuredAnalysis?.kpis;
      if (!kpis) {
        try {
          const kpiSection = structuredAnalysis?.sections.find(s => s.key === 'kpis' || /kpi|key metrics/i.test(s.title));
          if (kpiSection) {
            const lines = (kpiSection.content || '')
              .split('\n')
              .map(l => l.replace(/^[-*]\s*/, '').trim())
              .filter(Boolean);
            kpis = lines.slice(0, 8).map(l => {
              const [label, ...rest] = l.split(':');
              return { label: (label || 'KPI').trim(), value: rest.join(':').trim() || 'N/A' };
            });
            while (kpis.length < 8) kpis.push({ label: 'KPI', value: 'N/A' });
          }
        } catch {}
      }

      const result = {
        recommendation: validatedRecommendation,
        structuredAnalysis: structuredAnalysis ? { ...structuredAnalysis, kpis } : { sections: [], kpis },
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(result);
      
    } catch (parseError) {
      console.error('Error parsing recommendation JSON:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse recommendation data' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error structuring recommendation:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while structuring the recommendation'
      },
      { status: 500 }
    );
  }
}

