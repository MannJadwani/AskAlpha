import { NextRequest, NextResponse } from 'next/server';

const GROWW_PROXY_URL = process.env.GROWW_PROXY_URL || '';
const GROWW_PROXY_TOKEN = process.env.GROWW_PROXY_TOKEN || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || '').toUpperCase();
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });

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
        // Expect { ltp, day_change_perc } shape; map defensively
        return NextResponse.json({
          symbol,
          ltp: data?.ltp ?? data?.quote?.ltp ?? null,
          day_change_perc: data?.day_change_perc ?? data?.quote?.day_change_perc ?? null,
        });
      }
    }
    // Fallback mock if proxy not configured
    const base = symbol.length * 100 + (Date.now() % 1000) / 10;
    const change = Math.sin(Date.now() / 60000) * 1.5;
    const ltp = Math.max(1, Math.round((base + change) * 100) / 100);
    const day_change_perc = Math.round(change * 100) / 100;
    return NextResponse.json({ symbol, ltp, day_change_perc });
  } catch (e) {
    return NextResponse.json({ symbol, ltp: null, day_change_perc: null });
  }
}


