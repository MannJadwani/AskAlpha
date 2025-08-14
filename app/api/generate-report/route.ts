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
    let companyInfo = "";
    let sources = [];
    
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
          sources= perplexityData.citations

        }
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

Generate a JSON object with exactly ${numSections} sections for a comprehensive equity research report. Follow this exact format:

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
  ]
}

Each section should focus on a different aspect of the company analysis. Section names should be professional, concise, and relevant to equity research. For each section, list 3-5 key points separated by commas that would need to be researched or included in that section.

IMPORTANT:
1. Return ONLY valid JSON without any explanation or additional text
2. Create exactly ${numSections} sections as requested
3. Make sure the sections cover all important aspects of a professional equity research report
4. Each "InformationNeeded" should be a comma-separated list of points
5. Be specific and detailed with the points
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
      
      return NextResponse.json({
        reportData: reportData,
        sources: sources
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