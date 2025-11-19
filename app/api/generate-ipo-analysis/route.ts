import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MINI_MODEL = process.env.OPENAI_MINI_MODEL || 'gpt-4o-mini';

// Define the IPO recommendation schema
const IpoRecommendationSchema = z.object({
  action: z.enum(['APPLY', 'AVOID', 'NEUTRAL']),
  confidence: z.number().min(1).max(100),
  listingDate: z.string().nullable().optional(),
  priceBand: z.string().nullable().optional(),
  issueSize: z.string().nullable().optional(),
  lotSize: z.string().nullable().optional(),
  subscriptionStatus: z.string().nullable().optional(),
  gmp: z.string().nullable().optional(),
  reasoning: z.string(),
  keyFactors: z.array(z.string()),
  risks: z.array(z.string()),
  timeHorizon: z.string().optional() // e.g. "Listing Gain" or "Long Term"
});

// Structured analysis sections schema
const StructuredSectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  content: z.string(),
});

const KpiItemSchema = z.object({ label: z.string(), value: z.string() });

const PeerComparisonSchema = z.object({
  name: z.string(),
  nav: z.string(),
  pe: z.string(),
  ronw: z.string(),
  eps: z.string(),
});

const IpoStructuredAnalysisSchema = z.object({
  sections: z.array(StructuredSectionSchema).min(1),
  kpis: z.array(KpiItemSchema).length(8).optional(),
  peerComparison: z.array(PeerComparisonSchema).optional(),
});

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
  }

  try {
    const { ipoName } = await request.json();
    if (!ipoName || typeof ipoName !== 'string') {
      return NextResponse.json({ error: 'IPO name is required' }, { status: 400 });
    }

    const nowISO = new Date().toISOString();

    // 1) Perplexity: one focused search to gather latest IPO facts
    let baseContext = '';
    let citations: string[] = [];
    if (PERPLEXITY_API_KEY) {
      try {
        const userPrompt = `Find authoritative, up-to-date details for the IPO: ${ipoName}.
Return concise facts: 
- Company background and business model
- IPO Dates (Open, Close, Allotment, Listing)
- Price Band and Lot Size
- Issue Size (Fresh vs OFS)
- Grey Market Premium (GMP) if available
- Subscription Status (if live/closed)
- Financials (Revenue, Profit, Margins for last 3 years)
- Valuation (P/E, P/B vs Peers)
- Key Strengths and Risks
Keep answers strictly factual; include dates (ISO preferred) and currencies.`;

        const ppRes = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: 'sonar-pro',
            messages: [
              { role: 'system', content: 'You are a precise financial research assistant. Be current and cite sources.' },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 3000
          })
        });

        if (ppRes.ok) {
          const data = await ppRes.json();
          baseContext = data?.choices?.[0]?.message?.content || '';
          if (Array.isArray(data?.citations)) citations = data.citations;
        }
      } catch (e) {
        console.warn('Perplexity IPO lookup failed:', e);
      }
    }

    // 2) OpenAI to structure the analysis
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    // Prompt 1: Generate Recommendation and Core Details
    const recommendationPrompt = `Based on the research below for "${ipoName}" IPO, generate a structured recommendation.

RESEARCH CONTEXT:
${baseContext}

Return a JSON object with this exact structure:
{
  "action": "APPLY" | "AVOID" | "NEUTRAL",
  "confidence": 85,
  "listingDate": "YYYY-MM-DD" or "TBD",
  "priceBand": "₹100 - ₹120",
  "issueSize": "₹1000 Cr",
  "lotSize": "100 Shares",
  "subscriptionStatus": "Over-subscribed 10x" or "Not yet open",
  "gmp": "₹20 (15%)" or "N/A",
  "reasoning": "Clear explanation...",
  "keyFactors": ["Strong financials", "Reasonable valuation"],
  "risks": ["Regulatory risk", "High competition"],
  "timeHorizon": "Listing Gain" or "Long Term" or "Avoid"
}

Rules:
- action: APPLY (Good), AVOID (Bad), NEUTRAL (Mixed/Risky)
- confidence: 1-100
- gmp: Include percentage if available
- timeHorizon: Suggest "Listing Gain" for hot IPOs with high GMP, "Long Term" for fundamental picks, "Listing Gain & Long Term" for both.
`;

    const recCompletion = await openai.chat.completions.create({
      model: MINI_MODEL,
      messages: [
        { role: 'system', content: 'You are an IPO analyst. Return valid JSON.' },
        { role: 'user', content: recommendationPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const recommendationJson = recCompletion.choices?.[0]?.message?.content || '{}';
    const recommendation = IpoRecommendationSchema.parse(JSON.parse(recommendationJson));

    // Prompt 2: Generate Structured Analysis Sections & KPIs
    const sectionsPrompt = `Based on the research below for "${ipoName}" IPO, generate detailed analysis sections and KPIs.

RESEARCH CONTEXT:
${baseContext}

Return a JSON object with this exact structure:
{
  "kpis": [
    { "label": "Price Band", "value": "..." },
    { "label": "Lot Size", "value": "..." },
    { "label": "Issue Size", "value": "..." },
    { "label": "GMP / Premium", "value": "..." },
    { "label": "P/E Ratio", "value": "..." },
    { "label": "Revenue (Last FY)", "value": "..." },
    { "label": "Profit (Last FY)", "value": "..." },
    { "label": "Listing Date", "value": "..." }
  ],
  "sections": [
    { "key": "overview", "title": "Company Overview", "content": "Markdown content..." },
    { "key": "financials", "title": "Financial Health", "content": "Markdown content..." },
    { "key": "valuation", "title": "Valuation & Peers", "content": "Markdown content..." },
    { "key": "objects_of_offer", "title": "Objects of the Offer", "content": "Markdown content details about Fresh Issue vs Offer for Sale..." },
    { "key": "fund_utilization", "title": "Fund Utilization", "content": "Markdown content on how the funds raised will be used..." },
    { "key": "customer_concentration", "title": "Customer Concentration", "content": "Markdown content on top clients and their revenue contribution..." },
    { "key": "strengths_risks", "title": "Strengths & Risks", "content": "Markdown content..." },
    { "key": "dates", "title": "Important Dates", "content": "Markdown content..." }
  ],
  "peerComparison": [
    { "name": "Company A", "nav": "₹120", "pe": "25x", "ronw": "15%", "eps": "₹10" },
    { "name": "Company B", "nav": "₹140", "pe": "30x", "ronw": "18%", "eps": "₹12" }
  ]
}

Rules:
- kpis: Exactly 8 key metrics. Use "N/A" if not found. Prefer INR.
- sections: Use markdown bullets and short paragraphs. Ensure "Fund Utilization" covers the planned use of proceeds. Include "Customer Concentration" if data is available.
- peerComparison: Include the IPO company and at least 2-3 listed peers. Return precise figures for NAV, P/E, RONW (%), and EPS.
`;

    const secCompletion = await openai.chat.completions.create({
      model: MINI_MODEL,
      messages: [
        { role: 'system', content: 'You are an IPO analyst. Return valid JSON.' },
        { role: 'user', content: sectionsPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const sectionsJson = secCompletion.choices?.[0]?.message?.content || '{}';
    const structuredAnalysis = IpoStructuredAnalysisSchema.parse(JSON.parse(sectionsJson));

    return NextResponse.json({
      success: true,
      data: {
        recommendation,
        structuredAnalysis,
        perplexityAnalysis: {
            content: baseContext, // Keep original context available if needed
            citations
        },
        analysisTimestamp: nowISO
      }
    });

  } catch (error: any) {
    console.error('IPO analysis error:', error);
    return NextResponse.json({ error: 'Failed to generate IPO analysis' }, { status: 500 });
  }
}
