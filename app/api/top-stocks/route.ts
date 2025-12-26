import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// Helper to call Perplexity for top stocks research
async function perplexityResearch(query: string, systemPrompt: string): Promise<{ content: string; citations: string[] }> {
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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 1,
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

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    if (!SUPABASE_URL) {
      return NextResponse.json(
        { 
          error: 'Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL in your environment variables.',
          details: 'Get your Supabase URL from your project settings at https://supabase.com/dashboard'
        },
        { status: 500 }
      );
    }

    // Use service role key for writes (bypasses RLS), fallback to anon key for reads
    const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    if (!supabaseKey) {
      return NextResponse.json(
        { 
          error: 'Supabase API key missing. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.',
          details: 'Get your service role key from: Supabase Dashboard > Project Settings > API > service_role key (keep this secret!)'
        },
        { status: 500 }
      );
    }

    // Check for forceRefresh query parameter (only in dev mode)
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('forceRefresh') === 'true' && process.env.NODE_ENV === 'development';

    const supabase = createClient(SUPABASE_URL, supabaseKey);
    const today = getTodayDate();

    // Skip cache check if forceRefresh is true (dev mode only)
    if (!forceRefresh) {
      // Check if we have data that was updated within the last 24 hours
      const { data: existingData, error: fetchError } = await supabase
        .from('top_stocks')
        .select('*')
        .eq('date', today)
        .single();

      if (existingData && !fetchError) {
        // Check if data was updated within the last 24 hours
        const updatedAt = new Date(existingData.updated_at);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate < 24) {
          // Return cached data if updated within 24 hours
          console.log(`[Top Stocks] Returning cached data (updated ${hoursSinceUpdate.toFixed(1)} hours ago)`);
          return NextResponse.json({
            success: true,
            data: existingData.stocks_data,
            sources: existingData.sources || [],
            date: existingData.date,
            cached: true,
            lastUpdated: existingData.updated_at,
          });
        } else {
          // Data exists but is older than 24 hours, will fetch fresh data below
          console.log(`[Top Stocks] Cached data is ${hoursSinceUpdate.toFixed(1)} hours old, fetching fresh data`);
        }
      }
    } else {
      console.log(`[Top Stocks] Force refresh requested (dev mode)`);
    }

    // No data for today OR data is older than 24 hours, fetch from Perplexity
    console.log(`[Top Stocks] Fetching fresh data for ${today}`);

    if (!PERPLEXITY_API_KEY || !OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API keys not configured' },
        { status: 500 }
      );
    }

    // Step 1: Use Perplexity to get top stocks
    const perplexityQuery = `Search for "top gainers NSE BSE today" and "top stocks by volume India today" from these EXACT sources:
1. NSE India official website (nseindia.com) - Top Gainers section
2. BSE India official website (bseindia.com) - Top Gainers section  
3. Screener.in - Top gainers and most active stocks
4. Moneycontrol - Market section, Top Gainers
5. Economic Times Markets - Top Gainers page

For each of the top 20-30 stocks, extract EXACT data from these official sources:
- Company name (exact as listed)
- NSE/BSE symbol (e.g., RELIANCE, TCS, INFY)
- Current market price in ₹ (from NSE/BSE official data, NOT estimated)
- Price change % for today (e.g., +5.2% or -2.1%)
- Market capitalization in ₹ crores (from NSE/BSE or Screener.in)
- Sector/Industry name
- Volume traded today (if available)
- Brief reason for movement (news, earnings announcement, etc.)

CRITICAL: Use ONLY official NSE/BSE data for prices. Do NOT estimate or calculate. Get exact current prices from exchange websites.`;

    const systemPrompt = `You are a financial data researcher extracting EXACT stock data from official Indian stock exchange sources. 

PRIORITY SOURCES (in order):
1. NSE India (nseindia.com) - Official exchange data
2. BSE India (bseindia.com) - Official exchange data
3. Screener.in - Reliable financial data aggregator
4. Moneycontrol - Market data section
5. Economic Times Markets - Top gainers page

RULES:
- Extract EXACT numbers from official sources - do NOT estimate or calculate
- Current prices MUST come from NSE/BSE official pages
- Market cap should be in ₹ crores from official sources
- Price change % should be today's actual change from exchange data
- If a number is not available, say "N/A" - do NOT make up numbers
- Cross-reference multiple sources to verify accuracy`;

    const { content: researchData, citations } = await perplexityResearch(
      perplexityQuery,
      systemPrompt
    );
    console.log(`[Top Stocks] Perplexity research received: ${researchData} characters`);
    console.log(`[Top Stocks] Perplexity citations:`, citations);
    if (researchData.length < 500) {
      console.warn(`[Top Stocks] Warning: Perplexity returned very short response`);
    }
    // Log first 500 chars of research data for debugging
    console.log(`[Top Stocks] Research data preview:`, researchData.substring(0, 500));
    
    // Step 2: Use OpenAI to structure the data into JSON
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const extractionPrompt = `Extract and structure the following top stocks data into a JSON array.

Research Data from Perplexity:
${researchData}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "stocks": [
    {
      "symbol": "NSE symbol (e.g., RELIANCE, TCS, INFY)",
      "name": "Company name (exact as listed on NSE/BSE)",
      "price": "Current price in ₹ (EXACT from NSE/BSE, format: ₹1,234.56)",
      "change": "Price change % for today (e.g., +5.2 or -2.1)",
      "marketCap": "Market cap in ₹ crores (format: 1,23,456 Cr)",
      "sector": "Industry sector name",
      "reason": "Brief reason for trending (1 sentence, from news/earnings)"
    }
  ]
}

CRITICAL RULES:
- Use ONLY the EXACT numbers provided in the research data above
- Do NOT estimate, calculate, or make up any numbers
- If a price is "₹2,450" in the research, use exactly "₹2,450" - do NOT change it
- If market cap is "₹1,23,456 Cr", use exactly that format
- If a field is missing in research data, use "N/A" - do NOT invent values
- Include top 20-30 stocks that have complete data
- Ensure symbol matches NSE/BSE format (uppercase, no spaces)
- Price must include ₹ symbol and be in Indian Rupees format
- Change % must include + or - sign`;

    const extractionResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a precise data extraction assistant. Extract EXACT stock data from research text. Use ONLY the numbers provided - do NOT estimate, calculate, or modify values. Always return valid JSON only."
        },
        {
          role: "user",
          content: extractionPrompt
        }
      ],
      temperature: 0.0, // Lower temperature for more accurate extraction
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const extractedJson = JSON.parse(extractionResponse.choices[0]?.message?.content || '{"stocks": []}');
    const stocks = extractedJson.stocks || [];

    console.log(`[Top Stocks] Extracted ${stocks.length} stocks from OpenAI`);
    if (stocks.length > 0) {
      console.log(`[Top Stocks] Sample stock data:`, JSON.stringify(stocks[0], null, 2));
    }

    if (stocks.length === 0) {
      return NextResponse.json(
        { error: 'No stocks data extracted' },
        { status: 500 }
      );
    }

    // Step 3: Store in database (only if we have service role key, otherwise skip storage)
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const { error: insertError } = await supabase
        .from('top_stocks')
        .upsert({
          date: today,
          stocks_data: stocks,
          sources: citations,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'date'
        });

      if (insertError) {
        console.error('Error storing top stocks:', insertError);
        // Still return the data even if storage fails
      }
    } else {
      console.warn('[Top Stocks] Service role key not configured - data will not be cached. Add SUPABASE_SERVICE_ROLE_KEY to enable caching.');
    }

    return NextResponse.json({
      success: true,
      data: stocks,
      sources: citations,
      date: today,
      cached: false,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error fetching top stocks:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch top stocks' },
      { status: 500 }
    );
  }
}

