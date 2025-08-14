import { NextRequest, NextResponse } from 'next/server';

// Note: You'll need to set this in your environment variables
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

export async function POST(request: NextRequest) {
  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: 'Perplexity API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { companyName, sectionName, informationNeeded } = await request.json();

    if (!companyName || !sectionName || !informationNeeded) {
      return NextResponse.json(
        { error: 'Company name, section name, and information needed are required' },
        { status: 400 }
      );
    }

    // Craft a prompt for Perplexity to generate detailed section content
    const researchPrompt = `
Generate a detailed analysis for the "${sectionName}" section of an equity research report for ${companyName}.

Focus on these specific points:
${informationNeeded}

Format your response as a well-structured analysis with:
1. A brief introduction to this aspect of the company
2. Detailed analysis of each requested point with supporting data where possible
3. A concluding paragraph that summarizes key insights

Your analysis should be professional, balanced, and supported by facts. Present information in a clear and organized manner suitable for investors and financial analysts.
`;

    // Call Perplexity API to generate the detailed section
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
            content: 'You are a professional equity analyst who creates detailed, well-researched sections for investment reports.'
          },
          {
            role: 'user',
            content: researchPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.json();
      console.error('Perplexity API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate section details from Perplexity API' },
        { status: 500 }
      );
    }

    const perplexityData = await perplexityResponse.json();
    const sectionContent = perplexityData.choices[0].message.content;
    const sources = perplexityData.citations || [];

    return NextResponse.json({
      sectionContent: sectionContent,
      sources: sources
    });
    
  } catch (error) {
    console.error('Error generating section details:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating section details' },
      { status: 500 }
    );
  }
} 