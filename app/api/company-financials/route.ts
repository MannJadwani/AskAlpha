import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

const FinancialsSchema = z.object({
  revenues_5yr: z.array(z.object({ year: z.string(), inr: z.number() })).length(5),
  profits_5yr: z.array(z.object({ year: z.string(), inr: z.number() })).length(5)
});

export async function POST(req: NextRequest) {
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: 'Perplexity API key is not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const companyName = (body?.companyName || '').toString().trim();
    if (!companyName) {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
    }

    const prompt = `Return ONLY valid JSON for the last 5 years of revenue and profit (PAT/Net income) for ${companyName}. Prefer INR figures. If a year is missing after exhaustive search of credible sources (screener.in, company filings, exchange disclosures), include the year with inr: 0.

JSON shape (exact):
{
  "revenues_5yr": [ { "year": "2021", "inr": 100000 }, { "year": "2022", "inr": 110000 }, { "year": "2023", "inr": 120000 }, { "year": "2024", "inr": 140000 }, { "year": "2025", "inr": 155000 } ],
  "profits_5yr": [ { "year": "2021", "inr": 9000 }, { "year": "2022", "inr": 10000 }, { "year": "2023", "inr": 11000 }, { "year": "2024", "inr": 12500 }, { "year": "2025", "inr": 13200 } ]
}

Rules:
- Use year strings (e.g., "2021").
- Values must be numbers (INR, not strings); do not include currency symbols.
- Provide exactly 5 items in each array.
- Respond ONLY with JSON.`;

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: 'You are a precise data extractor that returns only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1200
      })
    });

    if (!res.ok) {
      throw new Error(`Perplexity error: ${res.status}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Sometimes content may wrap JSON in text; attempt to find JSON block
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }
    const validated = FinancialsSchema.parse(parsed);
    return NextResponse.json(validated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch financials' }, { status: 500 });
  }
}


