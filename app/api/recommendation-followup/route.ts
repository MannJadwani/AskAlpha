import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const FollowupSchema = z.object({
  question: z.string().min(1),
  context: z.object({
    companyName: z.string().optional(),
    perplexityAnalysis: z.object({
      content: z.string(),
      citations: z.array(z.string())
    }),
    recommendation: z.object({
      action: z.enum(['BUY', 'SELL', 'HOLD']),
      confidence: z.number().min(1).max(100),
      targetPrice: z.number().nullable().optional(),
      currentPrice: z.number().nullable().optional(),
      reasoning: z.string(),
      keyFactors: z.array(z.string()),
      risks: z.array(z.string()),
      timeHorizon: z.string()
    }),
    analysisTimestamp: z.string()
  })
});

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { question, context } = FollowupSchema.parse(body);

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const systemPrompt = `You are a senior investment analyst. Answer follow-up questions concisely and accurately using the provided report context. If information is not in the context, say you don't have that data instead of guessing. Prefer India/INR framing when relevant. Use markdown for formatting with short paragraphs and lists. Include a brief rationale and reference the provided sources when applicable.`;

    const userPrompt = `QUESTION:\n${question}\n\nCONTEXT (do not repeat verbatim):\n- Company: ${context.companyName ?? 'N/A'}\n- Recommendation: ${context.recommendation.action} (confidence ${context.recommendation.confidence}%)\n- Time Horizon: ${context.recommendation.timeHorizon}\n- Reasoning: ${context.recommendation.reasoning}\n- Key Factors: ${context.recommendation.keyFactors.join(', ')}\n- Risks: ${context.recommendation.risks.join(', ')}\n- Current Price: ${context.recommendation.currentPrice ?? 'N/A'}\n- Target Price: ${context.recommendation.targetPrice ?? 'N/A'}\n\nDETAILED ANALYSIS (for reference):\n${context.perplexityAnalysis.content}\n\nSOURCES (may cite inline as [Source N]):\n${context.perplexityAnalysis.citations.map((c, i) => `[${i + 1}] ${c}`).join('\n')}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 800
    });

    const answer = completion.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    return NextResponse.json({
      answer,
      citations: context.perplexityAnalysis.citations
    });
  } catch (error: any) {
    console.error('Follow-up error:', error);
    const message = error?.message || 'Failed to answer follow-up question';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}








