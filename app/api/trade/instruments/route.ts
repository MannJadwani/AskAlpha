import { NextRequest, NextResponse } from 'next/server';

const GROWW_INSTRUMENTS_CSV = 'https://growwapi-assets.groww.in/instruments/instrument.csv';

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let i = 0, field = '', row: string[] = [], inQuotes = false;
  while (i < content.length) {
    const c = content[i++];
    if (inQuotes) {
      if (c === '"') {
        if (content[i] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field.trim()); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (field.length || row.length) { row.push(field.trim()); rows.push(row); }
        field = ''; row = [];
        if (c === '\r' && content[i] === '\n') i++;
      } else { field += c; }
    }
  }
  if (field.length || row.length) { row.push(field.trim()); rows.push(row); }
  return rows;
}

export async function GET(_req: NextRequest) {
  try {
    const resp = await fetch(GROWW_INSTRUMENTS_CSV, { cache: 'no-store' });
    if (!resp.ok) throw new Error('Failed to download instruments CSV');
    const csv = await resp.text();
    const rows = parseCSV(csv);
    if (rows.length < 2) return NextResponse.json({ instruments: [] });
    const header = rows[0].map(h => h.toLowerCase());
    const symIdx = header.findIndex(h => ['trading_symbol','tradingsymbol','symbol','trading symbol'].includes(h));
    const exchIdx = header.findIndex(h => ['exchange','exch'].includes(h));
    const segIdx = header.findIndex(h => ['segment'].includes(h));
    const isinIdx = header.findIndex(h => ['isin','symbol_isin'].includes(h));
    const instruments = rows.slice(1).map(r => ({
      trading_symbol: (r[symIdx] || '').toUpperCase(),
      exchange: exchIdx >= 0 ? r[exchIdx] : 'NSE',
      segment: segIdx >= 0 ? r[segIdx] : 'CASH',
      isin: isinIdx >= 0 ? r[isinIdx] : undefined,
    })).filter(x => x.trading_symbol);
    return NextResponse.json({ instruments });
  } catch (e) {
    return NextResponse.json({ instruments: [] });
  }
}


