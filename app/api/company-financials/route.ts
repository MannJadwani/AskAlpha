import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const FinancialsSchema = z.object({
  revenues_5yr: z.array(z.object({ year: z.string(), inr: z.number() })).length(5),
  profits_5yr: z.array(z.object({ year: z.string(), inr: z.number() })).length(5),
  revenue_unit: z.enum(['Lakhs', 'Crores', 'Thousands']),
  profit_unit: z.enum(['Lakhs', 'Crores', 'Thousands'])
});

export async function POST(req: NextRequest) {
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: 'Perplexity API key is not configured' }, { status: 500 });
  }

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const companyName = (body?.companyName || '').toString().trim();
    if (!companyName) {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
    }

    // Step 1: Ask Perplexity to find the financial data
    console.log('Step 1: Asking Perplexity to find financial data for:', companyName);
    
    const researchPrompt = `Find the last 5 years of annual revenue and profit (PAT/Net income) data for ${companyName}. 

Search the following sources thoroughly:
- screener.in (best source for Indian companies)
- Company annual reports and filings
- NSE/BSE disclosures
- Official investor relations pages
- Financial databases

For each year, provide:
1. The fiscal year
2. Total revenue/sales in INR crores (or specify currency if different)
3. Net profit/PAT in INR crores (or specify currency if different)

Provide the actual numbers with their sources. Be as specific and accurate as possible. If data is in a different currency, mention the currency and provide conversion context.`;

    const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are a financial data researcher who finds accurate historical financial data from credible sources.' },
          { role: 'user', content: researchPrompt }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        return_citations: true
      })
    });

    if (!perplexityRes.ok) {
      throw new Error(`Perplexity error: ${perplexityRes.status}`);
    }

    const perplexityData = await perplexityRes.json();
    const financialResearch = perplexityData?.choices?.[0]?.message?.content || '';
    
    console.log('Step 1 complete: Financial data received from Perplexity');
    console.log('Research preview:', financialResearch);

    // Step 2: Use GPT-4o-mini to convert the data to structured JSON
    console.log('Step 2: Using GPT-4o-mini to structure the data into JSON...');
    
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const structuringPrompt = `Based on the following financial research data for ${companyName}, extract and structure the revenue and profit data into JSON format.

FINANCIAL RESEARCH DATA:
${financialResearch}

You must return EXACTLY this JSON structure with exactly 5 years of data:
{
  "revenues_5yr": [
    { "year": "2021", "inr": 100000 },
    { "year": "2022", "inr": 110000 },
    { "year": "2023", "inr": 120000 },
    { "year": "2024", "inr": 140000 },
    { "year": "2025", "inr": 155000 }
  ],
  "profits_5yr": [
    { "year": "2021", "inr": 9000 },
    { "year": "2022", "inr": 10000 },
    { "year": "2023", "inr": 11000 },
    { "year": "2024", "inr": 12500 },
    { "year": "2025", "inr": 13200 }
  ],
  "revenue_unit": "Crores",
  "profit_unit": "Crores"
}

RULES:
- Extract the most recent 5 consecutive fiscal years available
- Year should be a string (e.g., "2021", "2022")
- Values (inr) must be numbers representing the magnitude in the chosen unit
- Choose the most appropriate unit based on the company size:
  * Use "Crores" for large companies (revenues > 100 crores)
  * Use "Lakhs" for small/medium companies (revenues between 1 lakh - 100 crores)
  * Use "Thousands" for very small companies (revenues < 1 lakh)
- revenue_unit and profit_unit must be one of: "Lakhs", "Crores", or "Thousands"
- If the data mentions USD, convert using rate: 1 USD ≈ 83-85 INR
- If the data mentions millions/billions, convert appropriately (1 billion USD ≈ 8400 crores INR)
- If a year is missing, set inr to 0 but still include all 5 years
- Both revenue_unit and profit_unit should typically be the same unless there's a significant difference in scale
- Return ONLY valid JSON, no markdown fences or extra text`;

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a data structuring assistant that converts financial research into precise JSON format. You respond only with valid JSON.' 
        },
        { 
          role: 'user', 
          content: structuringPrompt 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const gptContent = gptResponse.choices?.[0]?.message?.content || '{}';
    console.log('Step 2 complete: GPT structured the data');
    console.log('Structured JSON:', gptContent);
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(gptContent);
    } catch {
      // Fallback: try to find JSON in the response
      const match = gptContent.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }
    
    const validated = FinancialsSchema.parse(parsed);
    console.log('Validation successful, returning structured financial data');
    
    return NextResponse.json(validated);
  } catch (e: any) {
    console.error('Error in company-financials:', e);
    return NextResponse.json({ error: e?.message || 'Failed to fetch financials' }, { status: 500 });
  }
}
