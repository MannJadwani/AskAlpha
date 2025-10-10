import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
  value?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const method = formData.get('method') as string;
    
    let portfolioText = '';
    
    if (method === 'file') {
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Read file content
      const fileContent = await file.text();
      portfolioText = fileContent;
    } else {
      portfolioText = formData.get('portfolioData') as string;
      
      if (!portfolioText) {
        return NextResponse.json(
          { error: 'No portfolio data provided' },
          { status: 400 }
        );
      }
    }

    console.log('Received portfolio data:', portfolioText.substring(0, 200));

    // Step 1: Parse portfolio holdings using GPT
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    const parsePrompt = `Parse the following portfolio data and extract holdings. The data may be in CSV format or manual entry format.

Portfolio Data:
${portfolioText}

Return a JSON array of holdings with this exact structure:
[
  {
    "symbol": "RELIANCE",
    "quantity": 100,
    "avgPrice": 2450.50
  },
  ...
]

Rules:
- Extract symbol (stock ticker), quantity (number of shares), and avgPrice (average purchase price)
- Ignore headers if present
- Handle both comma-separated and whitespace-separated formats
- Return ONLY valid JSON array, no markdown or extra text`;

    const parseResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a data parser that extracts portfolio holdings from various formats. Return only valid JSON.'
        },
        {
          role: 'user',
          content: parsePrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const parsedContent = parseResponse.choices[0].message.content || '{}';
    let parsedData = JSON.parse(parsedContent);
    
    // Handle if response is wrapped in an object
    let holdings: PortfolioHolding[] = Array.isArray(parsedData) ? parsedData : (parsedData.holdings || []);

    if (!holdings || holdings.length === 0) {
      return NextResponse.json(
        { error: 'Could not parse portfolio holdings. Please check the format.' },
        { status: 400 }
      );
    }

    console.log('Parsed holdings:', holdings.length, 'stocks');

    // Step 2: Get current prices using Perplexity
    if (PERPLEXITY_API_KEY) {
      try {
        const symbols = holdings.map(h => h.symbol).join(', ');
        const pricePrompt = `Get the current stock prices for the following Indian stocks: ${symbols}. 

Return the data in this exact format for each stock:
Symbol: SYMBOL
Current Price: ₹XXXX.XX

Use screener.in or NSE/BSE data. Return current market price in INR.`;

        const priceResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a stock price data provider. Return current market prices from reliable sources.'
              },
              {
                role: 'user',
                content: pricePrompt
              }
            ],
            temperature: 0.2,
            max_tokens: 2000
          })
        });

        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          const priceText = priceData.choices[0].message.content;
          
          console.log('Price data received:', priceText.substring(0, 200));

          // Parse prices and update holdings
          for (const holding of holdings) {
            const regex = new RegExp(`${holding.symbol}.*?(?:Current Price|Price).*?₹?([0-9,]+\\.?[0-9]*)`, 'i');
            const match = priceText.match(regex);
            
            if (match && match[1]) {
              const price = parseFloat(match[1].replace(/,/g, ''));
              if (!isNaN(price)) {
                holding.currentPrice = price;
                holding.value = holding.quantity * price;
                holding.gainLoss = holding.value - (holding.quantity * holding.avgPrice);
                holding.gainLossPercent = (holding.gainLoss / (holding.quantity * holding.avgPrice)) * 100;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch current prices:', err);
      }
    }

    // Calculate totals
    const totalInvestment = holdings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0);
    const totalValue = holdings.reduce((sum, h) => sum + (h.value || (h.quantity * h.avgPrice)), 0);
    const totalGainLoss = totalValue - totalInvestment;
    const totalGainLossPercent = (totalGainLoss / totalInvestment) * 100;

    // Step 3: Generate AI insights
    const insightsPrompt = `Analyze this investment portfolio and provide insights:

Portfolio Holdings:
${JSON.stringify(holdings, null, 2)}

Total Investment: ₹${totalInvestment.toFixed(2)}
Current Value: ₹${totalValue.toFixed(2)}
Total Gain/Loss: ₹${totalGainLoss.toFixed(2)} (${totalGainLossPercent.toFixed(2)}%)

Provide:
1. A brief 2-3 sentence analysis of the portfolio performance and composition
2. Risk assessment score (0-100, where 0 is very low risk and 100 is very high risk)
3. 3-5 specific, actionable recommendations for improving the portfolio

Consider:
- Diversification across sectors
- Risk exposure
- Performance of individual holdings
- Market conditions
- Portfolio balance

Return in this JSON format:
{
  "insights": "Brief analysis...",
  "riskScore": 45,
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}`;

    const insightsResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert portfolio analyst providing actionable insights for retail investors in India.'
        },
        {
          role: 'user',
          content: insightsPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const insightsContent = insightsResponse.choices[0].message.content || '{}';
    const insightsData = JSON.parse(insightsContent);

    const response = {
      holdings,
      totalValue,
      totalInvestment,
      totalGainLoss,
      totalGainLossPercent,
      insights: insightsData.insights || 'Analysis complete.',
      recommendations: insightsData.recommendations || [],
      diversification: insightsData.diversification || [],
      riskScore: insightsData.riskScore || 50,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while analyzing the portfolio'
      },
      { status: 500 }
    );
  }
}

