import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MINI_MODEL = process.env.OPENAI_MINI_MODEL || 'gpt-4.1-mini';

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
Return concise facts: company, country, exchange, status (upcoming vs listed), key dates (filing/offer/listing), price band/offering size, subscription/oversubscription (if known), lead managers, use of proceeds, and current performance if already listed.
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
            max_tokens: 2500
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

    // 2) Mini GPT to format a clean markdown analysis aware of timeline
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const formattingPrompt = `You are a senior equity capital markets analyst.
Today is ${nowISO}.
Using the research context below, write a clear, well-structured IPO analysis for "${ipoName}" as GitHub-flavored Markdown.

Decide whether this IPO is:
- Upcoming (future listing) → discuss timetable, price band/size, subscription, key risks, peers, and what to watch before listing.
- Recently listed or past → summarize offering terms and first-day/ongoing performance, valuation vs peers, and key post-listing drivers.

Add sections with headings:
1. Overview
2. Key Details (dates, size, price band, exchange)
3. Investment Thesis
4. Risks
5. Valuation & Peers
6. What to Watch Next (upcoming catalysts or performance notes)

If numbers are missing, be transparent (e.g., "not disclosed").
Close with a short, neutral conclusion (no investment advice).

Research context (verbatim):
---
${baseContext}
---
`;

    const completion = await openai.chat.completions.create({
      model: MINI_MODEL,
      messages: [
        { role: 'system', content: 'You produce polished, factual Markdown. No extra commentary.' },
        { role: 'user', content: formattingPrompt }
      ],
      temperature: 0.3
    });

    const markdown = completion.choices?.[0]?.message?.content || 'No analysis generated.';

    return NextResponse.json({
      success: true,
      analysis: { markdown },
      citations
    });
  } catch (error: any) {
    console.error('IPO analysis error:', error);
    return NextResponse.json({ error: 'Failed to generate IPO analysis' }, { status: 500 });
  }
}


