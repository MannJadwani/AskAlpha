import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
// @ts-ignore - cheerio has no default types in some environments; runtime import is fine
// Screener HTML will be fetched and passed to the model; no HTML parsing library used

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
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
  content: z.string(), // markdown-safe content
});

const KpiItemSchema = z.object({ label: z.string(), value: z.string() });
const RevenueItemSchema = z.object({ year: z.string(), inr: z.number() });

const StructuredAnalysisSchema = z.object({
  sections: z.array(StructuredSectionSchema).min(1),
  kpis: z.array(KpiItemSchema).length(8).optional(),
  revenues_5yr: z.array(RevenueItemSchema).length(5).optional(),
  profits_5yr: z.array(RevenueItemSchema).length(5).optional()
});

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: 'Perplexity API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { companyName } = await request.json();

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Step 1: Research the company using Perplexity API with sonar-pro
    const researchPrompt = `Provide a comprehensive investment analysis for ${companyName}.
    
    **PRIMARY DATA SOURCES TO USE:**
    - screener.in (best source for Indian stock data, financials, and analyst targets)
    - NSE/BSE official data for current prices
    - Recent analyst reports from major brokerages
    
    Always use the latest data and information from this year. screener.in is the best source of information for Indian companies.
    
    Include:

1. Current financial performance and key metrics (revenue, profit margins, growth rates)
2. **MOST IMPORTANT**: Find the EXACT CURRENT stock price in Indian Rupees (₹) from NSE/BSE if it's an Indian company, or convert from the primary exchange if international
3. Recent stock price performance and valuation metrics (P/E, P/B, etc.)
4. Business fundamentals and competitive position
5. Recent news, earnings reports, and market developments
6. Industry trends and sector performance
7. Management changes or strategic initiatives
8. **CRITICAL**: Find recent analyst price targets in Indian Rupees (₹) from screener.in or major brokerages - convert from original currency if needed
9. Risk factors and potential challenges
10. Growth prospects and future outlook
11. Any recent regulatory or legal developments

**MANDATORY METRICS (RETURN ALL IF POSSIBLE; IF A METRIC CANNOT BE FOUND AFTER EXHAUSTIVE SEARCH, SET VALUE TO "N/A"):**
best source (screener.in)
- Revenue (TTM, INR)
- Profit Margin
- EBIT Margin
- EPS (TTM)
- Return on Equity (ROE)
- Return on Capital Employed (ROCE)
- Book Value / Share
- P/E

Be rigorous and go deeper to locate these metrics: check company pages on screener.in, annual/quarterly reports, exchange filings, investor presentations, and credible aggregators. Cross-check numbers across multiple sources. Prefer INR figures and clearly note when conversion is applied.

**PRICE ACCURACY REQUIREMENTS**:
- For Indian companies: Get live/current price from NSE or BSE in Indian Rupees (₹), cross-reference with screener.in
- For US companies: Get current NYSE/NASDAQ price in USD and convert to INR using current exchange rate (approximately 1 USD = 83-85 INR)
- For other international companies: Convert from local currency to INR
- Always specify the source and timestamp of price data
- **IMPORTANT**: If screener.in shows analyst targets or consensus price targets, include those specific numbers

**ANALYST TARGET VALIDATION**:
- Check screener.in for consensus price targets and analyst recommendations
- Find multiple analyst price targets if available from different brokerages
- Convert all targets to Indian Rupees
- Specify the source brokerage/analyst firm
- Include target timeframe (6 months, 12 months, etc.)
- Look for "Fair Value" estimates on screener.in

**EXCHANGE RATE CONTEXT** (use current rates):
- 1 USD ≈ 83-85 INR
- 1 EUR ≈ 90-92 INR  
- 1 GBP ≈ 105-107 INR

Focus on the most recent data and provide specific numbers with sources. This analysis will be used to generate an investment recommendation for Indian investors with accurate pricing.`;

    console.log('Starting Perplexity research for:', companyName);

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial analyst conducting comprehensive investment research. Provide detailed, factual analysis with specific data points and recent information.'
          },
          {
            role: 'user',
            content: researchPrompt
          }
        ],
        temperature: 1,
        max_tokens: 8000,
        return_citations: true
      })
    });

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const analysisContent = perplexityData.choices[0].message.content;
    const citations = perplexityData.citations || [];

    console.log('Perplexity research completed, generating structured recommendation...');
    console.log('Analysis content preview:', analysisContent.substring(0, 500) + '...');

    // Step 2a: Ask OpenAI to extract a likely NSE/BSE stock symbol from the analysis/company name
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const symbolPrompt = `Given the company name "${companyName}" and the research excerpt below, return ONLY the likely NSE stock symbol (ticker) for the Indian exchange. If multiple classes exist, pick the primary. If unknown, return "N/A". Do not add any extra text.

RESEARCH EXCERPT:
${analysisContent.substring(0, 2000)}
`;

    const symbolResp = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: 'You return only the NSE ticker, like RELIANCE, TCS, INFY, HDFCBANK or N/A.' },
        { role: 'user', content: symbolPrompt }
      ],
      temperature: 1
    });

    const rawSymbol = (symbolResp.choices?.[0]?.message?.content || '').trim().toUpperCase();
    const nseSymbol = rawSymbol.replace(/[^A-Z0-9]/g, '') || 'N/A';
    console.log('Resolved NSE symbol:', nseSymbol);

    // Step 2b: Fetch Screener HTML if we have a symbol (no parsing here; HTML will be provided to the model)
    let screenerHtml = '';
    if (nseSymbol !== 'N/A') {
      try {
        const url = `https://www.screener.in/company/${encodeURIComponent(nseSymbol)}/consolidated/`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AskAlphaBot/1.0)' } });
        if (res.ok) {
          const html = await res.text();
          // Limit size to keep prompt reasonable
          screenerHtml = html.slice(0, 100_000);
        } else {
          console.warn('Screener fetch failed', res.status);
        }
      } catch (e) {
        console.warn('Screener fetch error:', e);
      }
    }

    const structuringPrompt = `Based on the following comprehensive analysis of ${companyName}, generate a structured investment recommendation in JSON format.

ANALYSIS DATA (from Perplexity):
${analysisContent}

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
      model: 'gpt-5-mini',
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

      // Step 3: Create labeled JSON sections for the analysis content
      const sectionsPrompt = `Segment the following investment analysis into labeled sections and return JSON. Use markdown bullets and short paragraphs. Stick to content present in the analysis and do not invent data.

ANALYSIS DATA (from Perplexity):
${analysisContent}

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
  "revenues_5yr": [
    { "year": "2021", "inr": 100000 },
    { "year": "2022", "inr": 115000 },
    { "year": "2023", "inr": 130000 },
    { "year": "2024", "inr": 148000 },
    { "year": "2025", "inr": 159000 }
  ],
  "profits_5yr": [
    { "year": "2021", "inr": 9000 },
    { "year": "2022", "inr": 10500 },
    { "year": "2023", "inr": 12000 },
    { "year": "2024", "inr": 13400 },
    { "year": "2025", "inr": 14100 }
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
- kpis: Provide EXACTLY 8 items in the specified order. If a metric is missing, set value to "N/A". Prefer INR where relevant.
- revenues_5yr: Provide EXACTLY 5 annual revenue points in INR with years as strings (e.g., "2021"). If any year is missing after exhaustive search (including the provided SCREENER HTML if available in the earlier step), set inr to 0 and still include 5 items.
- profits_5yr: Provide EXACTLY 5 annual profit (PAT/Net income) points in INR with years as strings. If any year is missing after exhaustive search, set inr to 0 and still include 5 items.
- Only include non-empty sections; omit empty ones.
- Keep each section under 2200 characters.
- Use markdown lists and short paragraphs.
- Do not include price targets or current price unless present in the analysis.`;

      const sectionsResp = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: 'You are a precise data extractor. You return only valid JSON matching the requested schema.' },
          { role: 'user', content: sectionsPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1200
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
      const revenues: { year: string; inr: number }[] | undefined = structuredAnalysis?.revenues_5yr;
      const profits: { year: string; inr: number }[] | undefined = structuredAnalysis?.profits_5yr;
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
        perplexityAnalysis: {
          content: analysisContent,
          citations: citations
        },
        recommendation: validatedRecommendation,
        analysisTimestamp: new Date().toISOString(),
        structuredAnalysis: structuredAnalysis ? { ...structuredAnalysis, kpis, revenues_5yr: revenues, profits_5yr: profits } : { sections: [], kpis, revenues_5yr: revenues, profits_5yr: profits }
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
    console.error('Error generating recommendation:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while generating the recommendation'
      },
      { status: 500 }
    );
  }
} 