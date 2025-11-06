import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type InstrumentRow = {
  trading_symbol: string;
  name: string;
  exchange: string;
  segment: string;
  instrument_type: string;
  isin?: string;
};

let cache: { loaded: boolean; rows: InstrumentRow[] } = { loaded: false, rows: [] };

function parseCSVLine(line: string): string[] {
  // Simple CSV parser supporting quoted fields without embedded newlines.
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

function loadInstruments(): void {
  if (cache.loaded) return;
  const csvPath = path.resolve(process.cwd(), 'instrument.csv');
  if (!fs.existsSync(csvPath)) {
    cache = { loaded: true, rows: [] };
    return;
  }
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) {
    cache = { loaded: true, rows: [] };
    return;
  }
  const header = parseCSVLine(lines[0]);
  const idx = (name: string) => header.indexOf(name);
  const iTrading = idx('trading_symbol');
  const iName = idx('name');
  const iExchange = idx('exchange');
  const iSegment = idx('segment');
  const iType = idx('instrument_type');
  const iIsin = idx('isin');
  const rows: InstrumentRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = parseCSVLine(line);
    const trading_symbol = cols[iTrading] || '';
    const name = cols[iName] || '';
    const exchange = cols[iExchange] || '';
    const segment = cols[iSegment] || '';
    const instrument_type = cols[iType] || '';
    const isin = iIsin >= 0 ? cols[iIsin] : undefined;
    if (!trading_symbol) continue;
    // Keep primarily equities for autocomplete
    rows.push({ trading_symbol, name, exchange, segment, instrument_type, isin });
  }
  cache = { loaded: true, rows };
}

export async function GET(request: NextRequest) {
  try {
    loadInstruments();
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);
    if (!q) return NextResponse.json({ items: [] });

    const qUpper = q.toUpperCase();
    const isEq = (r: InstrumentRow) => r.segment === 'CASH' && r.instrument_type === 'EQ';

    // Fast first-pass by symbol startsWith, then includes, then name includes
    const pool = cache.rows;
    const starts = pool.filter((r) => isEq(r) && r.trading_symbol?.toUpperCase().startsWith(qUpper));
    const contains = pool.filter(
      (r) => isEq(r) && !r.trading_symbol?.toUpperCase().startsWith(qUpper) && r.trading_symbol?.toUpperCase().includes(qUpper)
    );
    const nameMatches = pool.filter(
      (r) => isEq(r) && r.name && r.name.toUpperCase().includes(qUpper)
    );
    const merged: InstrumentRow[] = [];
    for (const arr of [starts, contains, nameMatches]) {
      for (const r of arr) {
        if (!merged.find((m) => m.trading_symbol === r.trading_symbol && m.exchange === r.exchange)) merged.push(r);
        if (merged.length >= limit) break;
      }
      if (merged.length >= limit) break;
    }

    const items = merged.slice(0, limit).map((r) => ({
      symbol: r.trading_symbol,
      name: r.name,
      exchange: r.exchange,
      label: `${r.trading_symbol} — ${r.name || r.exchange} (${r.exchange})`
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Instrument search error:', error);
    return NextResponse.json({ items: [] });
  }
}



