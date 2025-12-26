import { NextRequest, NextResponse } from 'next/server';

const GROWW_PROXY_URL = process.env.GROWW_PROXY_URL || '';
const GROWW_PROXY_TOKEN = process.env.GROWW_PROXY_TOKEN || '';

interface QuoteRequest {
  symbol: string;
}

interface QuoteResponse {
  symbol: string;
  ltp: number | null;
  day_change_perc: number | null;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbols: string[] = Array.isArray(body.symbols) 
      ? body.symbols.map((s: string) => s.toUpperCase().trim())
      : [];

    if (symbols.length === 0) {
      return NextResponse.json({ error: 'symbols array required' }, { status: 400 });
    }

    if (symbols.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 symbols allowed per request' }, { status: 400 });
    }

    // Fetch quotes in parallel
    const quotePromises = symbols.map(async (symbol): Promise<QuoteResponse> => {
      try {
        if (GROWW_PROXY_URL) {
          const res = await fetch(`${GROWW_PROXY_URL.replace(/\/$/, '')}/quote`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(GROWW_PROXY_TOKEN ? { Authorization: `Bearer ${GROWW_PROXY_TOKEN}` } : {}),
            },
            body: JSON.stringify({
              exchange: 'NSE',
              segment: 'CASH',
              trading_symbol: symbol,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            return {
              symbol,
              ltp: data?.ltp ?? data?.quote?.ltp ?? null,
              day_change_perc: data?.day_change_perc ?? data?.quote?.day_change_perc ?? null,
            };
          }
        }
        
        // Fallback: return null if proxy not configured or request failed
        return {
          symbol,
          ltp: null,
          day_change_perc: null,
        };
      } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        return {
          symbol,
          ltp: null,
          day_change_perc: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const quotes = await Promise.all(quotePromises);
    
    return NextResponse.json({
      success: true,
      quotes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in batch quotes endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}


