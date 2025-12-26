import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const MAIN_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const MINI_MODEL = process.env.OPENAI_MINI_MODEL || "gpt-4o-mini";

// Output schema for the final IPO report
const IpoReportSchema = z.object({
  verdict: z.enum(["SUBSCRIBE", "AVOID", "HIGH-RISK SUBSCRIBE", "LONG-TERM SUBSCRIBE"]),
  valuation_view: z.enum(["CHEAP", "FAIR", "EXPENSIVE"]),
  symbol: z.string(),
  screener_symbol: z.string().optional(),
  last_updated: z.string(),
  sources: z.array(z.string()).optional(),
  sections: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      content: z.string(),
    })
  ),
});

// Helper to call Perplexity for specific research tasks
async function perplexityResearch(
  query: string, 
  systemPrompt: string,
  searchRecency: "day" | "week" | "month" = "month"
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
        temperature: 0.1, // Lower temperature for more factual responses
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
    console.log(`[Perplexity] Got ${content.length} chars, ${citations.length} citations`);
    return { content, citations };
  } catch (e) {
    console.warn("Perplexity research failed:", e);
    return { content: "", citations: [] };
  }
}

// Step 1: Fetch Business & Industry Context
async function fetchBusinessContext(company: string) {
  return perplexityResearch(
    `Search for "${company} IPO India" and provide:
    1. What does ${company} do? Main business, products/services
    2. Revenue breakdown by segments
    3. Market position and market share in India
    4. Key competitors (list names)
    5. Industry TAM (Total Addressable Market) and growth rate
    6. Geographic presence
    7. Key customers and customer concentration
    8. Competitive moat/advantages
    
    Search DRHP, RHP, SEBI filings, Moneycontrol, Economic Times, Business Standard for accurate data.`,
    `You are researching the ${company} IPO in India. Extract EXACT factual data from official sources like DRHP/RHP prospectus, NSE/BSE filings, and reputable financial news. Always cite specific numbers and percentages.`,
    "month"
  );
}

// Step 2: Fetch Financial Performance Data
async function fetchFinancialData(company: string) {
  return perplexityResearch(
    `Search "${company} IPO financials DRHP" and extract EXACT numbers:
    1. Revenue for FY22, FY23, FY24 (in ₹ crores) and YoY growth %
    2. EBITDA for FY22, FY23, FY24 and EBITDA margins %
    3. PAT (Net Profit) for FY22, FY23, FY24 and net margins %
    4. ROE and ROCE for latest year
    5. Total debt and Debt-to-Equity ratio
    6. Operating cash flow vs PAT
    7. EPS (Earnings Per Share)
    8. Any restated financials or red flags
    
    Get exact figures from DRHP/RHP prospectus financial statements.`,
    `You are extracting financial data for ${company} IPO from the DRHP/RHP prospectus. Provide EXACT numbers in Indian Rupees (₹ crores). Do not estimate or round - use the precise figures from the prospectus.`,
    "month"
  );
}

// Step 3: Fetch Risk Factors
async function fetchRiskFactors(company: string) {
  return perplexityResearch(
    `Search "${company} IPO risk factors" and list the KEY risks from DRHP:
    1. Top 5 business/operational risks
    2. Customer concentration risk (% revenue from top customers)
    3. Any pending litigations or legal cases
    4. Regulatory risks specific to the industry
    5. Financial risks (debt, forex, interest rate)
    6. Key person dependency
    7. Related party transactions concerns
    8. Any SEBI observations or concerns
    
    Extract from the Risk Factors section of DRHP/RHP.`,
    `You are analyzing risks for ${company} IPO. List SPECIFIC risks mentioned in the DRHP with exact details where available (e.g., "Top 5 customers contribute 60% of revenue").`,
    "month"
  );
}

// Step 4: Fetch Use of Proceeds & IPO Structure
async function fetchIpoStructure(company: string) {
  return perplexityResearch(
    `Search "${company} IPO issue size price band" for EXACT details:
    1. Total IPO size in ₹ crores
    2. Fresh issue amount (₹ crores)
    3. OFS (Offer for Sale) amount (₹ crores) and who is selling
    4. Price band: ₹ floor to ₹ cap per share
    5. Lot size (number of shares) and minimum investment (₹)
    6. IPO dates: open date, close date, listing date
    7. Use of proceeds breakdown (₹ crores for each: debt repayment, capex, working capital, acquisitions)
    8. Post-issue market cap at upper price band
    
    Get from NSE/BSE announcements, SEBI filings, Moneycontrol IPO page.`,
    `You are extracting ${company} IPO structure details. Provide EXACT figures in ₹ crores. Include specific dates. Do not estimate.`,
    "week"
  );
}

// Step 5: Fetch Promoter & Management Info
async function fetchPromoterManagement(company: string) {
  return perplexityResearch(
    `Search "${company} IPO promoters management" for:
    1. Promoter names and their background
    2. Pre-IPO promoter holding %
    3. Post-IPO promoter holding % (after dilution)
    4. PE/VC investors selling in OFS and their holding
    5. CEO/MD name and experience (years in industry)
    6. CFO name and background
    7. Any promoter pledges
    8. Any legal cases or controversies involving promoters
    9. Previous ventures of promoters
    10. Board composition (independent directors count)
    
    Extract from DRHP Management section.`,
    `You are researching ${company} IPO promoters and management. Provide names and specific percentages/numbers. Note any governance red flags.`,
    "month"
  );
}

// Step 6: Fetch Valuation & Peer Comparison
async function fetchValuationData(company: string) {
  return perplexityResearch(
    `Search "${company} IPO valuation P/E peer comparison" for:
    1. ${company} IPO P/E ratio at upper price band (price / EPS)
    2. ${company} P/B ratio (price / book value per share)
    3. ${company} market cap at upper band (₹ crores)
    4. List 3-4 LISTED PEER companies with current:
       - Company name, Market cap, P/E, P/B, ROE%
    5. Industry average P/E
    6. Is ${company} IPO premium or discount to peers? By how much %?
    7. Any broker recommendations and target prices
    
    Get peer data from Screener.in, Moneycontrol, or broker reports.`,
    `You are comparing ${company} IPO valuation with listed peers. Provide EXACT P/E, P/B ratios for the IPO and each peer. Calculate premium/discount percentage.`,
    "week"
  );
}

// Step 7: Fetch Market Sentiment & GMP
async function fetchMarketSentiment(company: string) {
  return perplexityResearch(
    `Search "${company} IPO GMP subscription status today" for LATEST data:
    1. Current Grey Market Premium (GMP) in ₹ per share
    2. GMP as % of upper price band
    3. Expected listing price = upper band + GMP
    4. Final subscription numbers:
       - QIB subscription: X times
       - NII/HNI subscription: X times  
       - Retail subscription: X times
       - Overall subscription: X times
    5. Anchor investors: total amount raised, key names (mutual funds, FIIs)
    6. Broker recommendations summary (subscribe/avoid counts)
    7. Any news about allotment or listing date
    
    Check IPO Watch, Chittorgarh IPO, Moneycontrol IPO for latest GMP and subscription.`,
    `You are tracking ${company} IPO market sentiment. Get the LATEST GMP and subscription figures. GMP changes daily so get today's number. Subscription status should be final numbers if IPO is closed.`,
    "day"
  );
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const rawSymbol = (body?.symbol || "").toString().trim();
    if (!rawSymbol) {
      return NextResponse.json({ error: "IPO name/symbol is required" }, { status: 400 });
    }
    // Keep original casing for better search results (company names work better than uppercase symbols)
    const symbol = rawSymbol;

    // ============================================================
    // STEP 1-7: Parallel Research Calls (AI-Driven Pipeline)
    // ============================================================
    console.log(`[IPO Analysis] Starting comprehensive research for: ${symbol}`);
    const startTime = Date.now();
    
    const [
      businessContext,
      financialData,
      riskFactors,
      ipoStructure,
      promoterManagement,
      valuationData,
      marketSentiment,
    ] = await Promise.all([
      fetchBusinessContext(symbol),
      fetchFinancialData(symbol),
      fetchRiskFactors(symbol),
      fetchIpoStructure(symbol),
      fetchPromoterManagement(symbol),
      fetchValuationData(symbol),
      fetchMarketSentiment(symbol),
    ]);
    
    console.log(`[IPO Analysis] Research completed in ${Date.now() - startTime}ms`);
    console.log(`[IPO Analysis] Data received - Business: ${businessContext.content.length} chars, Financials: ${financialData.content.length} chars, IPO Structure: ${ipoStructure.content.length} chars, Sentiment: ${marketSentiment.content.length} chars`);

    // Collect all citations
    const allCitations = [
      ...businessContext.citations,
      ...financialData.citations,
      ...riskFactors.citations,
      ...ipoStructure.citations,
      ...promoterManagement.citations,
      ...valuationData.citations,
      ...marketSentiment.citations,
    ].filter((c, i, arr) => arr.indexOf(c) === i); // dedupe

    // ============================================================
    // STEP 8: Report Synthesis with OpenAI
    // ============================================================
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    const systemPrompt = `You are an expert IPO analyst specializing in the Indian stock market. 
Your task is to synthesize comprehensive research data into a professional, investor-grade IPO research report.

CRITICAL RULES:
- Use ONLY the numbers and data provided in the research data below
- DO NOT make up, estimate, or hallucinate any financial figures
- If a specific number is not in the research data, say "data not available"
- Copy exact figures (₹ crores, percentages, dates) from the research data
- Use Indian market conventions (₹ crores, lakh, NSE/BSE references)

Follow these principles:
- Be factual and data-driven; cite specific numbers FROM THE RESEARCH DATA
- Use bullet points for clarity
- Flag red flags prominently
- Give balanced views - mention both positives and negatives
- Make the recommendation actionable with clear reasoning
- Structure content for easy scanning by busy investors`;

    const userPrompt = `
Generate a comprehensive IPO research report for "${symbol}" using the research data below.

=== RESEARCH DATA ===

## BUSINESS & INDUSTRY CONTEXT:
${businessContext.content || "(Limited data available)"}

## FINANCIAL PERFORMANCE:
${financialData.content || "(Limited data available)"}

## RISK FACTORS:
${riskFactors.content || "(Limited data available)"}

## IPO STRUCTURE & USE OF PROCEEDS:
${ipoStructure.content || "(Limited data available)"}

## PROMOTERS & MANAGEMENT:
${promoterManagement.content || "(Limited data available)"}

## VALUATION VS PEERS:
${valuationData.content || "(Limited data available)"}

## MARKET SENTIMENT & GMP:
${marketSentiment.content || "(Limited data available)"}

=== END RESEARCH DATA ===

Now generate the final report as JSON with this exact structure:

{
  "verdict": "SUBSCRIBE | AVOID | HIGH-RISK SUBSCRIBE | LONG-TERM SUBSCRIBE",
  "valuation_view": "CHEAP | FAIR | EXPENSIVE",
  "symbol": "${symbol}",
  "screener_symbol": "${symbol}",
  "last_updated": "${new Date().toISOString()}",
  "sources": [],
  "sections": [
    {
      "key": "snapshot",
      "title": "IPO Snapshot",
      "content": "Markdown with: verdict badge, valuation view, issue size, price band, key dates, 5 bullet summary (2 strengths, 2 concerns, 1 key trigger)"
    },
    {
      "key": "business_overview",
      "title": "Business Overview & Industry Context",
      "content": "Markdown covering: what the company does, products/services, revenue segments, geographic presence, market position, competitors, industry size/growth, regulatory environment, competitive moat"
    },
    {
      "key": "financials",
      "title": "Financial Performance Analysis",
      "content": "Markdown with tables showing: 3-5 year revenue/EBITDA/PAT trends, margins, growth rates, ROE/ROCE, debt metrics, cash flows. Include assessment of financial health"
    },
    {
      "key": "derived_metrics",
      "title": "Key Financial Ratios & Metrics",
      "content": "Markdown table with: Revenue CAGR, PAT CAGR, EBITDA margin trend, Net margin, D/E ratio, Interest coverage, CFO/PAT ratio, FCF trend, Working capital days. Interpret each metric"
    },
    {
      "key": "ipo_structure",
      "title": "IPO Structure & Use of Proceeds",
      "content": "Markdown covering: total size, fresh vs OFS split, price band, lot size, dates, detailed use of proceeds breakdown, assessment of capital allocation"
    },
    {
      "key": "valuation",
      "title": "Valuation & Peer Comparison",
      "content": "Markdown with peer comparison table (P/E, P/B, EV/EBITDA, margins, ROE for IPO and 3-5 peers). State if IPO is cheap/fair/expensive vs peers with specific reasoning"
    },
    {
      "key": "risks",
      "title": "Risk Factors Assessment",
      "content": "Markdown categorizing risks: Industry, Business, Financial, Management, Legal. Rate key risks by severity. Highlight IPO-specific red flags"
    },
    {
      "key": "promoters_management",
      "title": "Promoters & Corporate Governance",
      "content": "Markdown on: promoter background, holding pre/post IPO, lock-in, management team quality, governance practices, board independence, any concerns"
    },
    {
      "key": "sentiment",
      "title": "Market Sentiment & Grey Market Premium",
      "content": "Markdown with: current GMP and trend, subscription levels by category (QIB/NII/Retail), anchor investor quality, news sentiment, expected listing pop"
    },
    {
      "key": "final_verdict",
      "title": "Investment Recommendation",
      "content": "Markdown with: Final verdict (SUBSCRIBE/AVOID/etc), suitable investor profile, investment thesis in 3 sentences, key triggers to watch, risk-reward summary"
    }
  ]
}

CRITICAL guidelines:
- Use ONLY the exact numbers from the research data above - DO NOT invent or estimate figures
- If a specific data point is missing, write "Data not available" instead of making up a number
- Use ₹ and crores for Indian currency conventions (as provided in research data)
- Copy exact figures, dates, percentages directly from the research data
- Create markdown tables for financial data and peer comparisons
- Be direct in recommendations - investors want clear guidance
- The "snapshot" section should work as an executive summary with key numbers from research data
`;

    const completion = await openai.chat.completions.create({
      model: MAIN_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 8000,
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    let parsed;
    
    try {
      parsed = IpoReportSchema.parse(JSON.parse(raw));
    } catch (parseError) {
      console.error("Schema validation failed, attempting recovery:", parseError);
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = IpoReportSchema.parse(JSON.parse(jsonMatch[0]));
      } else {
        throw parseError;
      }
    }

    console.log(`[IPO Analysis] Report generated successfully for: ${symbol}`);

    return NextResponse.json({
      success: true,
      data: {
        ...parsed,
        last_updated: new Date().toISOString(),
        sources: allCitations.length > 0 ? allCitations : parsed.sources,
      },
    });
  } catch (error: any) {
    console.error("IPO report generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate IPO report" },
      { status: 500 }
    );
  }
}
