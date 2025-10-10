import { NextRequest, NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

export async function POST(request: NextRequest) {
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

    // Research the company using Perplexity API
    const researchPrompt = `Provide a comprehensive investment analysis for ${companyName}.
    
    **PRIMARY DATA SOURCES TO USE:**
    - screener.in (best source for Indian stock data, financials, and analyst targets)
    - NSE/BSE official data for current prices
    - Recent analyst reports from major brokerages
    
    Always use the latest data and information from this year. screener.in is the best source of information for Indian companies.
    
    **🎯 CRITICAL PRIORITY - FIND THESE 8 EXACT KPI METRICS (MUST NOT BE "N/A"):**
    Your PRIMARY objective is to locate these specific metrics. Search exhaustively across screener.in, company filings, annual reports, and financial aggregators:
    
    1. **Revenue (TTM, INR)** - Trailing Twelve Months revenue in Indian Rupees (e.g., "₹1,29,801 Cr")
    2. **Profit Margin** - Net profit margin percentage (e.g., "10.43%")
    3. **EBIT Margin** - Earnings Before Interest and Tax margin percentage (e.g., "17.08%")
    4. **EPS (TTM)** - Trailing Twelve Months Earnings Per Share in Rupees (e.g., "₹60.23")
    5. **Return on Equity (ROE)** - ROE percentage (e.g., "8.0%") **[CRITICAL - Never skip this]**
    6. **Return on Capital Employed (ROCE)** - ROCE percentage (e.g., "8.71%") **[CRITICAL - Never skip this]**
    7. **Book Value / Share** - Book value per share in Rupees (e.g., "₹746.08") **[CRITICAL - Never skip this]**
    8. **P/E Ratio** - Price to Earnings ratio (e.g., "22.4x")
    
    **MANDATORY**: These 8 metrics are displayed prominently on the recommendation page. You MUST find all 8 values with exhaustive searching.
    
    **SPECIFIC SOURCES TO CHECK (in order of priority):**
    1. **screener.in** - Go to screener.in/company/[SYMBOL]/consolidated/ and extract from:
       - "Ratios" section: ROE, ROCE, Book Value
       - "Profit & Loss" section: Revenue, EBIT, Net Profit for margin calculations
       - "Quarterly Results" section: Latest EPS
       - "Valuation" section: P/E ratio
    
    2. **Moneycontrol** - Check company financials page for ratios and per-share data
    3. **NSE/BSE** - Official exchange data for Book Value and financial ratios
    4. **Company Annual Report** - Balance Sheet for Shareholder Equity, Total Assets, Net Worth
    5. **Economic Times Markets** - For valuation ratios and per-share metrics
    
    **EXTRACTION RULES FOR CRITICAL METRICS:**
    - **ROE**: Look for "Return on Equity", "ROE %", "Return on Net Worth" - typically in 5-30% range for healthy companies
    - **ROCE**: Look for "Return on Capital Employed", "ROCE %", "Return on Capital" - typically in 5-25% range
    - **Book Value/Share**: Look for "Book Value per Share", "Net Worth per Share", "Equity per Share" - usually in ₹50-₹2000 range
    
    If you cannot find these directly, provide the RAW DATA so it can be calculated:
    - For ROE: Provide Net Profit and Total Shareholder Equity (ROE = Net Profit / Shareholder Equity × 100)
    - For ROCE: Provide EBIT and Capital Employed or (Total Assets - Current Liabilities)
    - For Book Value/Share: Provide Total Shareholder Equity and Total Outstanding Shares
    
    Cross-reference multiple sources and prefer the most recent TTM (Trailing Twelve Months) data available.
    
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

**REITERATING THE 8 CRITICAL KPIs - YOUR TOP PRIORITY:**
These exact metrics MUST be included in your response with actual values (NOT "N/A" unless absolutely impossible after exhaustive search):

1. **Revenue (TTM, INR)** - From screener.in "Sales" or latest quarterly results
2. **Profit Margin** - Calculate from Net Profit/Sales if not directly available
3. **EBIT Margin** - Operating Profit/Sales or from screener.in
4. **EPS (TTM)** - Earnings per share from screener.in or exchange filings
5. **ROE (Return on Equity)** - MANDATORY - Check screener.in "Return on Equity" field, Moneycontrol ratios, or annual report. If not found, provide Net Profit and Shareholder Equity separately so it can be calculated.
6. **ROCE (Return on Capital Employed)** - MANDATORY - Check screener.in "ROCE" field, Moneycontrol, or calculate from EBIT and Capital Employed. Provide raw numbers if direct % not available.
7. **Book Value / Share** - MANDATORY - Check screener.in "Book Value" field, NSE/BSE data, or company balance sheet. Provide Total Equity and Share Count if direct value not available.
8. **P/E Ratio** - Current Price/EPS, from screener.in or market data

**CRITICAL INSTRUCTIONS FOR ROE, ROCE, AND BOOK VALUE:**
These 3 metrics are FREQUENTLY missing. You MUST make extra effort:

**For ROE:**
- Primary: screener.in "Return on Equity %" (usually in ratios table)
- Secondary: Moneycontrol → Company → Financials → Ratios → "ROE %"
- Tertiary: Latest annual report - find Net Profit and Total Shareholder Equity, state both clearly
- Example output: "ROE is 12.5%" OR "Net Profit: ₹5,000 Cr, Shareholder Equity: ₹40,000 Cr (for ROE calculation)"

**For ROCE:**
- Primary: screener.in "ROCE %" (in compounded returns or ratios section)
- Secondary: Moneycontrol ratios page
- Tertiary: Calculate or provide EBIT and (Total Assets - Current Liabilities)
- Example output: "ROCE is 15.2%" OR "EBIT: ₹8,000 Cr, Capital Employed: ₹50,000 Cr (for ROCE calculation)"

**For Book Value / Share:**
- Primary: screener.in "Book Value" (per share, in company overview or per-share data)
- Secondary: NSE/BSE company page "Book Value per Share"
- Tertiary: Latest balance sheet - Total Shareholder Equity divided by Outstanding Shares
- Example output: "Book Value per Share: ₹450.50" OR "Total Equity: ₹30,000 Cr, Outstanding Shares: 500 Cr (for Book Value calculation)"

**SEARCH EXHAUSTIVELY**: Visit screener.in company page, check the "Key Ratios" and "Profit & Loss" sections. If Indian company not on screener.in, use Moneycontrol or Investing.com India. For international companies, use Yahoo Finance or company investor relations, then convert to INR where applicable.

**DO NOT RETURN "N/A"** for these 8 KPIs unless you have genuinely exhausted all possible sources. These values are displayed prominently to users and "N/A" creates a poor experience. If you cannot find the final calculated metric, at minimum provide the raw financial data needed to calculate it (Net Profit, Equity, EBIT, Assets, Liabilities, Share Count).

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

    console.log('Perplexity research completed for:', companyName);

    return NextResponse.json({
      companyName,
      research: analysisContent,
      citations,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching company research:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while researching the company'
      },
      { status: 500 }
    );
  }
}

