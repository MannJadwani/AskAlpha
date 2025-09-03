import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Note: You'll need to set these in your environment variables
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { companyName, numSections } = await request.json();

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    if (numSections < 1 || numSections > 20) {
      return NextResponse.json(
        { error: 'Number of sections must be between 1 and 20' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // First, collect information about the company using Perplexity
    let companyInfo: string = "";
    let sources: string[] = [];
    let chartsFromPerplexity: any = {};
    
    if (PERPLEXITY_API_KEY) {
      try {
        const researchPrompt = `Research and provide detailed information about ${companyName}, focusing on business model, market position, financial performance, key products/services, competitive landscape, and recent developments.`;
        
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
                content: 'You are a professional business analyst who researches companies with accurate and up-to-date information.'
              },
              {
                role: 'user',
                content: researchPrompt
              }
            ],
            temperature: 0.2,
            max_tokens: 4000
          })
        });
  
        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          
          companyInfo = perplexityData.choices[0].message.content;
          sources = (perplexityData.citations as string[] | undefined) || sources;

        }
        // Ask Perplexity specifically for chart-friendly datasets
        // 1) Revenue time series (last 5 fiscal years)
        const revPrompt = `For ${companyName}, provide total revenue for the last 5 fiscal years as valid JSON: {"title":"Revenue (Last 5 Years)","unit":"USD Billion","series":[{"label":"FY2019","value":N},{"label":"FY2020","value":N},{"label":"FY2021","value":N},{"label":"FY2022","value":N},{"label":"FY2023","value":N}],"description":"Revenue trend based on reported or authoritative sources"}. Return ONLY JSON.`;
        try {
          const revRes = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
              model: 'sonar-pro',
              messages: [
                { role: 'system', content: 'You return only strict JSON when asked. No prose.' },
                { role: 'user', content: revPrompt }
              ],
              temperature: 0.1,
              max_tokens: 2000
            })
          });
          if (revRes.ok) {
            const revData = await revRes.json();
            const content = revData?.choices?.[0]?.message?.content;
            try {
              const parsed = JSON.parse(content);
              if (parsed && Array.isArray(parsed.series)) {
                chartsFromPerplexity.timeSeries = parsed;
            }
            } catch {}
            if (revData?.citations?.length) {
              sources = [...sources, ...revData.citations];
            }
          }
        } catch {}

        // 2) Revenue breakdown by segment or geography (latest)
        const breakdownPrompt = `For ${companyName}, provide the latest revenue breakdown by business segment (or geography if segment unavailable) as JSON: {"title":"Revenue by Segment","labels":["Segment A","Segment B"],"values":[N,N],"description":"Latest mix; units USD Billion"}. Keep lengths aligned and return ONLY JSON.`;
        try {
          const brRes = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
            },
            body: JSON.stringify({
              model: 'sonar-pro',
              messages: [
                { role: 'system', content: 'You return only strict JSON when asked. No prose.' },
                { role: 'user', content: breakdownPrompt }
              ],
              temperature: 0.1,
              max_tokens: 2000
            })
          });
          if (brRes.ok) {
            const brData = await brRes.json();
            const content = brData?.choices?.[0]?.message?.content;
            try {
              const parsed = JSON.parse(content);
              if (parsed && Array.isArray(parsed.labels) && Array.isArray(parsed.values)) {
                chartsFromPerplexity.breakdown = parsed;
              }
            } catch {}
            if (brData?.citations?.length) {
              sources = [...sources, ...brData.citations];
            }
          }
        } catch {}
      } catch (error) {
        console.error('Error with Perplexity API:', error);
        // Continue with OpenAI if Perplexity fails
      }
    }

    // Now, use OpenAI to generate the structured report sections
    console.log(companyInfo, 'Company Info from Perplexity');
    const prompt = `
You are a professional equity analyst. Based on the following information about ${companyName}, create a structured JSON report with ${numSections} sections.

Company Information:
${companyInfo || `Please research ${companyName} thoroughly.`}

Generate a JSON object with exactly ${numSections} sections for a comprehensive equity research report. In addition, include TWO visualization datasets that can be charted on the frontend:

{
  "sections": [
    {
      "SectionName": "Section Name 1",
      "InformationNeeded": "point 1, point 2, point 3, point 4"
    },
    {
      "SectionName": "Section Name 2",
      "InformationNeeded": "point 1, point 2, point 3, point 4"
    }
  ],
  "charts": {
    "timeSeries": {
      "title": "Revenue (Last 5 Years)",
      "unit": "USD Billion",
      "series": [
        { "label": "2019", "value": 0 },
        { "label": "2020", "value": 0 },
        { "label": "2021", "value": 0 },
        { "label": "2022", "value": 0 },
        { "label": "2023", "value": 0 }
      ],
      "description": "Revenue trend based on reported or estimated values"
    },
    "breakdown": {
      "title": "Revenue by Segment",
      "labels": ["Segment A", "Segment B", "Segment C", "Segment D"],
      "values": [0, 0, 0, 0],
      "description": "Mix of segments or geographies"
    }
  }
}

Rules:
1) Populate the chart values using the best available information from the context; if exact numbers are unavailable, provide reasonable approximations. Use consistent units.
2) Keep values non-negative. Ensure arrays lengths match.
3) Return ONLY valid JSON with the exact keys above. Do not include markdown fences or commentary.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are a professional equity analyst who creates structured JSON reports. You respond only with valid JSON data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const jsonContent = completion.choices[0].message.content;
    
    try {
      // Parse the JSON response to validate it
      const reportData = JSON.parse(jsonContent || '{}');

      // Merge charts from Perplexity if available
      if (chartsFromPerplexity && (chartsFromPerplexity.timeSeries || chartsFromPerplexity.breakdown)) {
        reportData.charts = reportData.charts || {};
        if (chartsFromPerplexity.timeSeries) {
          reportData.charts.timeSeries = chartsFromPerplexity.timeSeries;
        }
        if (chartsFromPerplexity.breakdown) {
          reportData.charts.breakdown = chartsFromPerplexity.breakdown;
        }
      }

      return NextResponse.json({
        reportData,
        sources
      });
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      
      // Fallback to returning the raw content if parsing fails
      return NextResponse.json({
        report: jsonContent,
        sources: sources
      });
    }
    
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating the report' },
      { status: 500 }
    );
  }
} 