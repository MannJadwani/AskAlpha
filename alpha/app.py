"""
Alpha: standalone FastAPI service for on-demand equity reports.

Pipeline per request:
1. Accept a stock ticker (symbol).
2. Ensure we know the correct Screener.in URL slug for this symbol:
   - Try the symbol directly on Screener.
   - If Screener rejects / 404s, ask Gemini to map the ticker to the proper Screener slug,
     store that mapping, and retry.
3. Scrape latest data from Screener for that slug and upsert into a local SQLite DB.
4. Read all data for the symbol from the DB, compute derived metrics.
5. Call Perplexity (Sonar) for qualitative / external context.
6. Call OpenAI GPT to generate the full 11-section report and a BUY/SELL/HOLD verdict.
7. Return the report + verdict as JSON.

This folder (`alpha/`) is self-contained and can be moved into a fresh project.
Just install `requirements.txt` and run:

    uvicorn alpha.app:app --reload
"""

import json
import os
import sqlite3
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from dotenv import load_dotenv
import google.generativeai as genai
import pandas as pd
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger


BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "screener_financials.db")


# -----------------------------
# Data structures
# -----------------------------
load_dotenv()

@dataclass
class DBData:
    symbol: str
    screener_symbol: str
    key_metrics: Dict[str, str]
    sections: Dict[str, pd.DataFrame]


@dataclass
class DerivedMetrics:
    # Basic metrics
    latest_year: Optional[str]
    latest_revenue: Optional[float]
    latest_pat: Optional[float]
    latest_cfo: Optional[float]
    cfo_to_pat_ratio: Optional[float]
    debt_to_equity: Optional[float]
    roe: Optional[float]
    roce: Optional[float]
    
    # Growth metrics
    revenue_growth_1y: Optional[float]  # YoY growth
    revenue_growth_3y_cagr: Optional[float]
    pat_growth_1y: Optional[float]
    pat_growth_3y_cagr: Optional[float]
    revenue_3y_avg: Optional[float]
    pat_3y_avg: Optional[float]
    
    # Profitability
    net_margin: Optional[float]
    operating_margin: Optional[float]
    ebitda_margin: Optional[float]
    
    # Efficiency & Asset Utilization
    asset_turnover: Optional[float]
    inventory_turnover: Optional[float]
    receivables_turnover: Optional[float]
    
    # Working Capital
    working_capital: Optional[float]
    current_ratio: Optional[float]
    quick_ratio: Optional[float]
    cash_conversion_cycle_days: Optional[float]
    
    # Leverage & Solvency
    interest_coverage: Optional[float]
    debt_to_ebitda: Optional[float]
    equity_to_assets: Optional[float]
    
    # Valuation (if market cap available)
    pe_ratio: Optional[float]
    pb_ratio: Optional[float]
    ev_to_ebitda: Optional[float]
    
    # Cash Flow Quality
    fcf: Optional[float]  # Free Cash Flow
    fcf_margin: Optional[float]
    capex_to_revenue: Optional[float]
    
    # Quality Indicators
    earnings_quality_score: Optional[float]  # Based on CFO/PAT consistency
    balance_sheet_health_score: Optional[float]  # Based on debt, liquidity, etc.


@dataclass
class PerplexityContext:
    raw_response: str


@dataclass
class LLMReportResult:
    report_markdown: str
    verdict: str
    verdict_rationale: str


class ScrapeSymbolRequest(BaseModel):
    symbol: str
    force: bool = False  # If True, bypass 16-hour freshness check


class DeleteSymbolRequest(BaseModel):
    symbol: str


class AnalyzeRequest(BaseModel):
    symbol: str
    horizon_years: int = 3


class AnalyzeResponse(BaseModel):
    symbol: str
    screener_symbol: str
    horizon_years: int
    last_updated: str
    verdict: str
    verdict_rationale: str
    report_markdown: str


class CompanyDataResponse(BaseModel):
    symbol: str
    screener_symbol: str
    last_updated: Optional[str]
    key_metrics: Dict[str, str]
    sections: Dict[str, Any]  # section name -> list of row dicts (metric + period cols)


# -----------------------------
# DB helpers
# -----------------------------


def connect_db() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = connect_db()
    cur = conn.cursor()

    # Main tables (same schema as original project)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS key_metrics (
            symbol TEXT,
            metric TEXT,
            value TEXT,
            UNIQUE(symbol, metric)
        );
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS financials (
            symbol TEXT,
            section TEXT,
            metric TEXT,
            period TEXT,
            value TEXT
        );
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS peers (
            symbol TEXT,
            peer_name TEXT,
            metric TEXT,
            value TEXT
        );
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS processing_log (
            symbol TEXT PRIMARY KEY,
            date_scraped TEXT,
            status TEXT DEFAULT 'success'
        );
        """
    )
    # Migration: Add status column if it doesn't exist (for existing databases)
    try:
        cur.execute("ALTER TABLE processing_log ADD COLUMN status TEXT DEFAULT 'success'")
    except sqlite3.OperationalError:
        # Column already exists, ignore
        pass
    # Mapping from user-supplied ticker to Screener slug
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS symbol_mapping (
            input_symbol TEXT PRIMARY KEY,
            screener_symbol TEXT NOT NULL,
            last_resolved_at TEXT
        );
        """
    )
    # Mapping from company name to NSE symbol
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS name_to_symbol (
            company_name TEXT PRIMARY KEY,
            nse_symbol TEXT NOT NULL,
            last_resolved_at TEXT
        );
        """
    )

    # Global stock symbol index (from Groww instruments CSV)
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS symbol_index (
            symbol TEXT PRIMARY KEY,              -- NSE trading_symbol (e.g., HDFCBANK)
            exchange TEXT,
            segment TEXT,
            instrument_type TEXT,
            series TEXT,
            groww_api_symbol TEXT,               -- e.g., NSE_HDFCBANK
            last_updated TEXT
        );
        """
    )

    conn.commit()
    conn.close()


def upsert_processing_log(symbol: str, status: str = "success") -> None:
    conn = connect_db()
    cur = conn.cursor()
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute(
        """
        INSERT INTO processing_log(symbol, date_scraped, status)
        VALUES (?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET date_scraped = excluded.date_scraped, status = excluded.status
        """,
        (symbol, ts, status),
    )
    conn.commit()
    conn.close()


def get_last_updated(symbol: str) -> Optional[str]:
    conn = connect_db()
    cur = conn.cursor()
    row = cur.execute(
        "SELECT date_scraped FROM processing_log WHERE symbol = ?", (symbol,)
    ).fetchone()
    conn.close()
    return row["date_scraped"] if row else None


def get_mapped_screener_symbol(input_symbol: str) -> Optional[str]:
    conn = connect_db()
    cur = conn.cursor()
    row = cur.execute(
        "SELECT screener_symbol FROM symbol_mapping WHERE input_symbol = ?",
        (input_symbol,),
    ).fetchone()
    conn.close()
    return row["screener_symbol"] if row else None


def get_symbol_from_name(company_name: str) -> Optional[str]:
    """
    Check if we already have a symbol mapped for this company name.
    """
    conn = connect_db()
    cur = conn.cursor()
    row = cur.execute(
        "SELECT nse_symbol FROM name_to_symbol WHERE company_name = ?",
        (company_name.strip().upper(),),
    ).fetchone()
    conn.close()
    return row["nse_symbol"] if row else None


def save_name_to_symbol_mapping(company_name: str, nse_symbol: str) -> None:
    """
    Save a mapping from company name to NSE symbol.
    """
    conn = connect_db()
    cur = conn.cursor()
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute(
        """
        INSERT INTO name_to_symbol(company_name, nse_symbol, last_resolved_at)
        VALUES (?, ?, ?)
        ON CONFLICT(company_name) DO UPDATE SET
            nse_symbol = excluded.nse_symbol,
            last_resolved_at = excluded.last_resolved_at
        """,
        (company_name.strip().upper(), nse_symbol.upper(), ts),
    )
    conn.commit()
    conn.close()


def resolve_symbol_from_name_with_gemini(company_name: str) -> Optional[str]:
    """
    Use Gemini to resolve a company name to its NSE trading symbol.
    
    Args:
        company_name: The company name (e.g., "Reliance Industries", "HDFC Bank")
    
    Returns: NSE symbol (e.g., "RELIANCE", "HDFCBANK") or None if resolution fails
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are helping to map Indian company names to their NSE (National Stock Exchange) trading symbols.

Given the company name: "{company_name}"

Return ONLY the NSE trading symbol (ticker) for this company. The symbol should be:
- Uppercase
- No spaces or special characters
- The official NSE trading symbol

Examples:
- "Reliance Industries" -> "RELIANCE"
- "HDFC Bank" -> "HDFCBANK"
- "Tata Consultancy Services" -> "TCS"
- "Infosys" -> "INFY"
- "Bharti Airtel" -> "BHARTIARTL"

Rules:
- Return ONLY the symbol string, no extra words, no markdown, no quotes, no explanations.
- If the company is not listed on NSE or you're unsure, return "NOT_FOUND"
- Focus on Indian companies listed on NSE (National Stock Exchange of India)
"""

    try:
        resp = model.generate_content(prompt)
        symbol = (resp.text or "").strip()
        # Clean up quotes if the model added them
        symbol = symbol.strip("\"' ")
        symbol = symbol.upper()
        
        # Validate it looks like a symbol (not "NOT_FOUND" or empty)
        if symbol and symbol != "NOT_FOUND" and len(symbol) >= 2 and len(symbol) <= 20:
            return symbol
        return None
    except Exception as e:
        print(f"Error resolving symbol from name '{company_name}': {e}")
        return None


def is_likely_symbol(input_str: str) -> bool:
    """
    Heuristic to determine if input is likely a symbol vs a company name.
    
    Symbols are typically:
    - Short (2-15 characters)
    - Uppercase
    - No spaces
    - Alphanumeric only
    
    Names are typically:
    - Longer (15+ characters)
    - Have spaces
    - Mixed case
    - May have special characters
    """
    cleaned = input_str.strip()
    
    # If it has spaces, it's likely a name
    if ' ' in cleaned:
        return False
    
    # If it's very long, it's likely a name
    if len(cleaned) > 20:
        return False
    
    # If it's all uppercase and short, likely a symbol
    if cleaned.isupper() and len(cleaned) <= 15:
        return True
    
    # If it's short and alphanumeric, likely a symbol
    if len(cleaned) <= 10 and cleaned.replace('_', '').replace('-', '').isalnum():
        return True
    
    # Otherwise, treat as name
    return False


def resolve_input_to_symbol(input_str: str) -> str:
    """
    Resolve user input (either symbol or company name) to an NSE symbol.
    
    Args:
        input_str: Either a symbol (e.g., "RELIANCE") or company name (e.g., "Reliance Industries")
    
    Returns: NSE symbol (uppercase)
    
    Raises HTTPException if resolution fails.
    """
    normalized = input_str.strip()
    
    # Check if it looks like a symbol
    if is_likely_symbol(normalized):
        return normalized.upper()
    
    # It's likely a company name - check cache first
    cached_symbol = get_symbol_from_name(normalized)
    if cached_symbol:
        return cached_symbol
    
    # Try to resolve using Gemini
    resolved_symbol = resolve_symbol_from_name_with_gemini(normalized)
    if resolved_symbol:
        # Save the mapping for future use
        save_name_to_symbol_mapping(normalized, resolved_symbol)
        return resolved_symbol
    
    # Resolution failed
    raise HTTPException(
        status_code=404,
        detail=f"Could not resolve company name '{normalized}' to an NSE symbol. Please try using the NSE trading symbol directly (e.g., 'RELIANCE', 'HDFCBANK')."
    )


def save_symbol_mapping(input_symbol: str, screener_symbol: str) -> None:
    conn = connect_db()
    cur = conn.cursor()
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cur.execute(
        """
        INSERT INTO symbol_mapping(input_symbol, screener_symbol, last_resolved_at)
        VALUES (?, ?, ?)
        ON CONFLICT(input_symbol) DO UPDATE SET
            screener_symbol = excluded.screener_symbol,
            last_resolved_at = excluded.last_resolved_at
        """,
        (input_symbol, screener_symbol, ts),
    )
    conn.commit()
    conn.close()


# -----------------------------
# Screener scraping helpers
# -----------------------------


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def parse_table(soup: BeautifulSoup, section_id: str) -> Optional[pd.DataFrame]:
    """Parses a standard Screener HTML table into a Pandas DataFrame.
    
    This matches the exact logic from main.py to ensure data alignment is correct.
    """
    section = soup.find("section", id=section_id)
    if not section:
        return None

    table = section.find("table")
    if not table:
        return None

    headers = []
    thead = table.find("thead")
    if thead:
        header_row = thead.find("tr")
        if header_row:
            th_elements = header_row.find_all("th")
            # First column is always 'Metric', rest are period headers
            headers = ["Metric"] + [th.text.strip() for th in th_elements[1:]]

    rows_data = []
    tbody = table.find("tbody")
    if tbody:
        for tr in tbody.find_all("tr"):
            tds = tr.find_all("td")
            if not tds:
                continue
            # First td is the metric name, rest are values
            name_col = tds[0].text.strip()
            values = [td.text.strip() for td in tds[1:]]
            rows_data.append([name_col] + values)

    if headers and rows_data:
        # Ensure all rows have the same number of columns
        max_cols = max(len(r) for r in rows_data) if rows_data else 0
        if max_cols == 0:
            return None
            
        # Pad rows that are shorter
        for row in rows_data:
            while len(row) < max_cols:
                row.append("")
        
        # Adjust headers to match data width
        if len(headers) < max_cols:
            headers += [f"Col_{i}" for i in range(len(headers), max_cols)]
        elif len(headers) > max_cols:
            headers = headers[:max_cols]
        
        try:
            df = pd.DataFrame(rows_data, columns=headers)
            return df
        except Exception as e:
            # Log error but don't crash
            print(f"Error creating DataFrame for {section_id}: {e}")
            return None

    return None


def scrape_screener_company(screener_symbol: str) -> Optional[Dict[str, pd.DataFrame]]:
    url = f"https://www.screener.in/company/{screener_symbol}/consolidated"
    resp = requests.get(url, headers=HEADERS, timeout=20)
    
    # Always save HTML file, even for errors (so we can inspect what Screener returned)
    files_dir = os.path.join(os.path.dirname(DB_PATH), "files")
    os.makedirs(files_dir, exist_ok=True)
    html_filename = os.path.join(files_dir, f"{screener_symbol}.html")
    try:
        with open(html_filename, "w", encoding="utf-8") as f:
            f.write(resp.text)
    except Exception as e:
        print(f"Warning: Could not save HTML file for {screener_symbol}: {e}")
    
    # Now handle response status
    if resp.status_code == 404:
        # Explicit 404 - symbol not found on Screener
        raise HTTPException(status_code=404, detail=f"Screener returned 404 for '{screener_symbol}'")
    if resp.status_code != 200:
        return None

    soup = BeautifulSoup(resp.content, "html.parser")
    data_sheets: Dict[str, pd.DataFrame] = {}

    # Top ratios (Overview)
    ratios_list = soup.find("ul", id="top-ratios")
    if ratios_list:
        r_data = [
            {
                "Metric": item.find("span", class_="name").text.strip(),
                "Value": item.find("span", class_="value").text.strip(),
            }
            for item in ratios_list.find_all("li")
        ]
        data_sheets["Overview"] = pd.DataFrame(r_data)

    sections_map = {
        "Quarterly Results": "quarters",
        "Profit & Loss": "profit-loss",
        "Balance Sheet": "balance-sheet",
        "Cash Flows": "cash-flow",
        "Ratios": "ratios",
        "Shareholding Pattern": "shareholding",
    }

    for sheet_name, html_id in sections_map.items():
        df = parse_table(soup, html_id)
        if df is not None:
            data_sheets[sheet_name] = df

    # Peers
    peers_section = soup.find("section", id="peers")
    if peers_section:
        peer_table = peers_section.find("table")
        if peer_table:
            headers = [th.text.strip() for th in peer_table.find_all("th")]
            rows = []
            if peer_table.find("tbody"):
                for tr in peer_table.find("tbody").find_all("tr"):
                    rows.append([td.text.strip() for td in tr.find_all("td")])
            if rows:
                if len(headers) > len(rows[0]):
                    headers = headers[: len(rows[0])]
                elif len(headers) < len(rows[0]):
                    headers += [
                        f"Col_{i}" for i in range(len(headers), len(rows[0]))
                    ]
                data_sheets["Peers"] = pd.DataFrame(rows, columns=headers)

    return data_sheets if data_sheets else None


def delete_all_data_for_symbol(symbol: str) -> None:
    """
    Delete all data (DB records and HTML file) for a given symbol.
    This is used when force updating to ensure a clean slate.
    """
    conn = connect_db()
    cur = conn.cursor()
    
    # Delete from all tables
    cur.execute("DELETE FROM key_metrics WHERE symbol = ?", (symbol,))
    cur.execute("DELETE FROM financials WHERE symbol = ?", (symbol,))
    cur.execute("DELETE FROM peers WHERE symbol = ?", (symbol,))
    cur.execute("DELETE FROM processing_log WHERE symbol = ?", (symbol,))
    
    conn.commit()
    conn.close()
    
    # Delete HTML file if it exists
    files_dir = os.path.join(os.path.dirname(DB_PATH), "files")
    html_filename = os.path.join(files_dir, f"{symbol}.html")
    try:
        if os.path.exists(html_filename):
            os.remove(html_filename)
    except Exception as e:
        print(f"Warning: Could not delete HTML file for {symbol}: {e}")


def save_screener_data(symbol: str, data_sheets: Dict[str, pd.DataFrame]) -> None:
    conn = connect_db()
    cur = conn.cursor()

    # Cleanup existing
    cur.execute("DELETE FROM key_metrics WHERE symbol = ?", (symbol,))
    cur.execute("DELETE FROM financials WHERE symbol = ?", (symbol,))
    cur.execute("DELETE FROM peers WHERE symbol = ?", (symbol,))

    # Overview
    if "Overview" in data_sheets:
        df = data_sheets["Overview"]
        rows = [(symbol, row["Metric"], row["Value"]) for _, row in df.iterrows()]
        cur.executemany(
            "INSERT INTO key_metrics(symbol, metric, value) VALUES (?, ?, ?)", rows
        )

    # Peers
    if "Peers" in data_sheets:
        df = data_sheets["Peers"]
        if "Name" in df.columns:
            melted = df.melt(id_vars=["Name"], var_name="Metric", value_name="Value")
            rows = [
                (symbol, row["Name"], row["Metric"], row["Value"])
                for _, row in melted.iterrows()
            ]
            cur.executemany(
                "INSERT INTO peers(symbol, peer_name, metric, value) VALUES (?, ?, ?, ?)",
                rows,
            )

    # Time-series sections
    time_series_sections = [
        "Quarterly Results",
        "Profit & Loss",
        "Balance Sheet",
        "Cash Flows",
        "Ratios",
        "Shareholding Pattern",
    ]
    for section in time_series_sections:
        if section not in data_sheets:
            continue
        df = data_sheets[section]
        
        # Ensure 'Metric' column exists
        if "Metric" not in df.columns:
            continue
            
        # Get all columns except 'Metric' as period columns
        date_cols = [c for c in df.columns if c != "Metric"]
        if not date_cols:
            continue
        
        # Convert to string to avoid any type issues, and handle NaN values
        df = df.fillna("")  # Replace NaN with empty string
        
        # Melt the dataframe: Metric stays as id, periods become rows
        try:
            melted = df.melt(
                id_vars=["Metric"], 
                value_vars=date_cols, 
                var_name="Period", 
                value_name="Value"
            )
            # Convert values to string and clean
            melted["Value"] = melted["Value"].astype(str).replace("nan", "")
            
            rows = [
                (symbol, section, str(row["Metric"]), str(row["Period"]), str(row["Value"]))
                for _, row in melted.iterrows()
            ]
            cur.executemany(
                """
                INSERT INTO financials(symbol, section, metric, period, value)
                VALUES (?, ?, ?, ?, ?)
                """,
                rows,
            )
        except Exception as e:
            print(f"Error saving {section} for {symbol}: {e}")
            continue

    conn.commit()
    conn.close()
    upsert_processing_log(symbol, "success")


# -----------------------------
# Symbol resolution via Gemini
# -----------------------------


def resolve_screener_symbol_with_gemini(input_symbol: str) -> Optional[str]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Fallback: no Gemini available
        return None

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
You are helping to map Indian stock tickers to Screener.in company URLs.

Given the ticker: "{input_symbol}"

Return ONLY the Screener slug that should replace {{symbol}} in:
  https://www.screener.in/company/{{symbol}}/consolidated

Examples of slugs:
- "RELIANCE"
- "HDFCBANK"
- "AIROLAM-INDIA"

Rules:
- Answer with JUST the slug string, no extra words, no markdown, no quotes.
If you are unsure, make your best guess based on public info.
"""

    resp = model.generate_content(prompt)
    slug = (resp.text or "").strip()
    # Clean up quotes if the model added them
    slug = slug.strip("\"' ")
    return slug or None


def ensure_latest_data_for_symbol(input_symbol: str, force: bool = False) -> str:
    """
    Ensure DB has fresh data for the requested ticker.
    
    Args:
        input_symbol: The ticker symbol to scrape
        force: If True, bypass the 16-hour freshness check and always re-scrape
    
    Returns: screener_symbol actually used for scraping / DB storage.
    Raises HTTPException if scraping fails even after Gemini fallback.
    """
    init_db()
    normalized = input_symbol.strip().upper()

    # 1. Check if we already mapped this symbol to a Screener slug
    mapped = get_mapped_screener_symbol(normalized)
    candidates = [normalized] + ([mapped] if mapped else [])

    # If force=True, delete all existing data for all candidates before scraping
    if force:
        for candidate in candidates:
            delete_all_data_for_symbol(candidate)
    
    # If force=False and we scraped this symbol within the last 16 hours, skip re-scraping.
    freshness_cutoff = datetime.utcnow() - timedelta(hours=16) if not force else None
    
    for candidate in candidates:
        # Check freshness if not forcing
        if not force and freshness_cutoff:
            last = get_last_updated(candidate)
            if last:
                try:
                    last_dt = datetime.strptime(last, "%Y-%m-%d %H:%M:%S")
                    if last_dt >= freshness_cutoff:
                        # Recent enough: just return, updating mapping if needed.
                        if candidate != normalized:
                            save_symbol_mapping(normalized, candidate)
                        return candidate
                except Exception:
                    # If parsing fails, fall back to re-scraping.
                    pass

        # Not fresh or forcing: hit Screener.
        try:
            data_sheets = scrape_screener_company(candidate)
            if data_sheets:
                save_screener_data(candidate, data_sheets)
                if candidate != normalized:
                    save_symbol_mapping(normalized, candidate)
                return candidate
        except HTTPException as e:
            # 404 or other HTTP error - try next candidate or Gemini
            if e.status_code == 404:
                continue  # Try next candidate
            raise

    # 2. If Screener failed for both, ask Gemini to resolve slug
    slug = resolve_screener_symbol_with_gemini(normalized)
    if slug:
        # If force=True, delete existing data for the Gemini-resolved slug too
        if force:
            delete_all_data_for_symbol(slug)
        
        # Check freshness if not forcing
        if not force and freshness_cutoff:
            last = get_last_updated(slug)
            if last:
                try:
                    last_dt = datetime.strptime(last, "%Y-%m-%d %H:%M:%S")
                    if last_dt >= freshness_cutoff:
                        save_symbol_mapping(normalized, slug)
                        return slug
                except Exception:
                    pass

        try:
            data_sheets = scrape_screener_company(slug)
            if data_sheets:
                save_screener_data(slug, data_sheets)
                save_symbol_mapping(normalized, slug)
                return slug
        except HTTPException:
            # Even Gemini-resolved slug failed
            pass

    # If everything failed, mark as failed in processing_log
    upsert_processing_log(normalized, "failed")
    raise HTTPException(
        status_code=404,
        detail=f"Could not resolve Screener URL for symbol '{input_symbol}'.",
    )


# -----------------------------
# Symbol index via Groww instruments CSV
# -----------------------------

GROWW_INSTRUMENTS_URL = "https://growwapi-assets.groww.in/instruments/instrument.csv"
STOCK_SERIES = {"EQ", "BE", "BZ", "SM", "ST"}


def refresh_symbol_index() -> int:
    """
    Download Groww instruments CSV and refresh the local symbol_index table.

    Filters:
    - exchange == NSE
    - segment == CASH
    - instrument_type == EQ
    - series in STOCK_SERIES

    Returns: number of symbols upserted.
    """
    try:
        resp = requests.get(GROWW_INSTRUMENTS_URL, timeout=60)
        resp.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to download Groww instruments CSV: {e}",
        ) from e

    from io import StringIO

    csv_buf = StringIO(resp.text)
    df = pd.read_csv(
        csv_buf,
        usecols=[
            "exchange",
            "instrument_type",
            "segment",
            "series",
            "trading_symbol",
        ],
        low_memory=False,
    )

    mask = (
        df["exchange"].str.upper().eq("NSE")
        & df["segment"].str.upper().eq("CASH")
        & df["instrument_type"].str.upper().eq("EQ")
        & df["series"].str.upper().isin(STOCK_SERIES)
    )
    filtered = df.loc[mask].copy()
    filtered["trading_symbol"] = (
        filtered["trading_symbol"].astype(str).str.strip()
    )
    filtered = filtered[filtered["trading_symbol"] != ""].drop_duplicates(
        subset=["trading_symbol"]
    )

    conn = connect_db()
    cur = conn.cursor()
    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    rows = [
        (
            row["trading_symbol"],
            row["exchange"],
            row["segment"],
            row["instrument_type"],
            row["series"],
            f"NSE_{row['trading_symbol']}",
            ts,
        )
        for _, row in filtered.iterrows()
    ]

    cur.executemany(
        """
        INSERT INTO symbol_index(
            symbol, exchange, segment, instrument_type, series, groww_api_symbol, last_updated
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
            exchange = excluded.exchange,
            segment = excluded.segment,
            instrument_type = excluded.instrument_type,
            series = excluded.series,
            groww_api_symbol = excluded.groww_api_symbol,
            last_updated = excluded.last_updated
        """,
        rows,
    )
    conn.commit()
    conn.close()
    return len(rows)


# -----------------------------
# Numeric helpers / derived metrics
# -----------------------------


def parse_number(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s:
        return None
    s = (
        s.replace(",", "")
        .replace("₹", "")
        .replace("Rs.", "")
        .replace("Rs", "")
        .replace("\u00a0", " ")
    )
    if s.endswith("%"):
        s = s[:-1]
    try:
        return float(s)
    except ValueError:
        return None


def _get_latest_column(df: pd.DataFrame) -> Optional[str]:
    if df is None or df.empty:
        return None
    cols = [c for c in df.columns if c != "metric"]
    return cols[-1] if cols else None


def load_db_data(symbol: str, screener_symbol: str) -> DBData:
    conn = connect_db()
    try:
        km_rows = conn.execute(
            "SELECT metric, value FROM key_metrics WHERE symbol = ?", (screener_symbol,)
        ).fetchall()
        key_metrics = {row["metric"]: row["value"] for row in km_rows}

        df_all = pd.read_sql(
            "SELECT section, metric, period, value FROM financials WHERE symbol = ?",
            conn,
            params=(screener_symbol,),
        )
        sections: Dict[str, pd.DataFrame] = {}
        if not df_all.empty:
            for sec in df_all["section"].unique():
                df_sec = df_all[df_all["section"] == sec]
                pivot = df_sec.pivot(index="metric", columns="period", values="value")
                pivot.reset_index(inplace=True)
                pivot.columns.name = None
                sections[sec] = pivot

        if not key_metrics and not sections:
            raise HTTPException(
                status_code=500,
                detail=f"No financial data found in DB for '{screener_symbol}'.",
            )

        return DBData(
            symbol=symbol,
            screener_symbol=screener_symbol,
            key_metrics=key_metrics,
            sections=sections,
        )
    finally:
        conn.close()


def load_peer_data(symbol: str) -> Dict[str, Any]:
    """Load peer comparison data from the database."""
    conn = connect_db()
    try:
        peer_rows = conn.execute(
            "SELECT peer_name, metric, value FROM peers WHERE symbol = ?", (symbol,)
        ).fetchall()
        
        if not peer_rows:
            return {}
        
        # Organize by peer name
        peers_dict: Dict[str, Dict[str, str]] = {}
        for row in peer_rows:
            peer_name = row["peer_name"]
            if peer_name not in peers_dict:
                peers_dict[peer_name] = {}
            peers_dict[peer_name][row["metric"]] = row["value"]
        
        return peers_dict
    finally:
        conn.close()


def _get_metric_value(df: pd.DataFrame, pattern: str, period: str) -> Optional[float]:
    """Helper to extract a metric value from a dataframe."""
    if df is None or df.empty or period not in df.columns:
        return None
    row = df[df["metric"].str.contains(pattern, case=False, na=False)]
    if row.empty:
        return None
    return parse_number(row[period].iloc[0])


def _get_numeric_columns(df: pd.DataFrame) -> list:
    """Get all numeric period columns (excluding 'metric')."""
    if df is None or df.empty:
        return []
    return [c for c in df.columns if c != "metric"]


def _calculate_cagr(start_val: Optional[float], end_val: Optional[float], years: int) -> Optional[float]:
    """Calculate CAGR given start and end values and number of years."""
    if start_val is None or end_val is None or years <= 0 or start_val <= 0:
        return None
    if end_val <= 0:
        return None
    return ((end_val / start_val) ** (1.0 / years) - 1.0) * 100


def compute_derived_metrics(db_data: DBData) -> DerivedMetrics:
    pl = db_data.sections.get("Profit & Loss")
    cash_flows = db_data.sections.get("Cash Flows")
    balance_sheet = db_data.sections.get("Balance Sheet")
    ratios = db_data.sections.get("Ratios")

    # Initialize all metrics
    latest_year = None
    latest_revenue = None
    latest_pat = None
    latest_cfo = None
    cfo_to_pat_ratio = None
    debt_to_equity = None
    roe_val = None
    roce_val = None
    
    # Growth metrics
    revenue_growth_1y = None
    revenue_growth_3y_cagr = None
    pat_growth_1y = None
    pat_growth_3y_cagr = None
    revenue_3y_avg = None
    pat_3y_avg = None
    
    # Profitability
    net_margin = None
    operating_margin = None
    ebitda_margin = None
    
    # Efficiency
    asset_turnover = None
    inventory_turnover = None
    receivables_turnover = None
    
    # Working Capital
    working_capital = None
    current_ratio = None
    quick_ratio = None
    cash_conversion_cycle_days = None
    
    # Leverage
    interest_coverage = None
    debt_to_ebitda = None
    equity_to_assets = None
    
    # Valuation
    pe_ratio = None
    pb_ratio = None
    ev_to_ebitda = None
    
    # Cash Flow
    fcf = None
    fcf_margin = None
    capex_to_revenue = None
    
    # Quality scores
    earnings_quality_score = None
    balance_sheet_health_score = None

    # Extract latest year and basic metrics
    if pl is not None and not pl.empty:
        numeric_cols = _get_numeric_columns(pl)
        if numeric_cols:
            latest_year = numeric_cols[-1]
            latest_revenue = _get_metric_value(pl, "Sales|Revenue", latest_year)
            latest_pat = _get_metric_value(pl, "Net Profit|PAT|Profit After Tax", latest_year)
            
            # Operating profit / EBIT
            operating_profit = _get_metric_value(pl, "Operating Profit|EBIT|Profit Before", latest_year)
            if operating_profit and latest_revenue and latest_revenue != 0:
                operating_margin = (operating_profit / latest_revenue) * 100
            
            # EBITDA
            ebitda = _get_metric_value(pl, "EBITDA", latest_year)
            if not ebitda:
                # Try to calculate: Operating Profit + Depreciation
                dep = _get_metric_value(pl, "Depreciation", latest_year)
                if operating_profit and dep:
                    ebitda = operating_profit + dep
            if ebitda and latest_revenue and latest_revenue != 0:
                ebitda_margin = (ebitda / latest_revenue) * 100
            
            # Net margin
            if latest_pat and latest_revenue and latest_revenue != 0:
                net_margin = (latest_pat / latest_revenue) * 100
            
            # Growth calculations
            if len(numeric_cols) >= 2:
                prev_year = numeric_cols[-2]
                prev_revenue = _get_metric_value(pl, "Sales|Revenue", prev_year)
                prev_pat = _get_metric_value(pl, "Net Profit|PAT|Profit After Tax", prev_year)
                
                if prev_revenue and latest_revenue and prev_revenue != 0:
                    revenue_growth_1y = ((latest_revenue - prev_revenue) / prev_revenue) * 100
                
                if prev_pat and latest_pat and prev_pat != 0:
                    pat_growth_1y = ((latest_pat - prev_pat) / prev_pat) * 100
            
            # 3-year CAGR and averages
            if len(numeric_cols) >= 3:
                year_3_ago = numeric_cols[-3]
                rev_3_ago = _get_metric_value(pl, "Sales|Revenue", year_3_ago)
                pat_3_ago = _get_metric_value(pl, "Net Profit|PAT|Profit After Tax", year_3_ago)
                
                if rev_3_ago and latest_revenue:
                    revenue_growth_3y_cagr = _calculate_cagr(rev_3_ago, latest_revenue, 3)
                    # Average of last 3 years
                    rev_2_ago = _get_metric_value(pl, "Sales|Revenue", numeric_cols[-2])
                    if rev_2_ago:
                        revenue_3y_avg = (rev_3_ago + rev_2_ago + latest_revenue) / 3
                
                if pat_3_ago and latest_pat:
                    pat_growth_3y_cagr = _calculate_cagr(pat_3_ago, latest_pat, 3)
                    pat_2_ago = _get_metric_value(pl, "Net Profit|PAT|Profit After Tax", numeric_cols[-2])
                    if pat_2_ago:
                        pat_3y_avg = (pat_3_ago + pat_2_ago + latest_pat) / 3

    # Cash flow metrics
    if cash_flows is not None and not cash_flows.empty and latest_year:
        latest_cfo = _get_metric_value(cash_flows, "net cash from operating activities|operating activities", latest_year)
        
        if latest_cfo and latest_pat and latest_pat != 0:
            cfo_to_pat_ratio = latest_cfo / latest_pat
        
        # Free Cash Flow = CFO - Capex
        capex = _get_metric_value(cash_flows, "capital expenditure|capex|purchase of fixed assets", latest_year)
        if latest_cfo and capex:
            fcf = latest_cfo - abs(capex)  # Capex is usually negative
            if latest_revenue and latest_revenue != 0:
                fcf_margin = (fcf / latest_revenue) * 100
                capex_to_revenue = (abs(capex) / latest_revenue) * 100

    # Balance sheet metrics
    if balance_sheet is not None and not balance_sheet.empty and latest_year:
        # Debt metrics
        long_term = _get_metric_value(balance_sheet, "Long Term Borrowings", latest_year)
        short_term = _get_metric_value(balance_sheet, "Short Term Borrowings", latest_year)
        total_debt = (long_term or 0) + (short_term or 0)
        
        # Equity
        share_cap = _get_metric_value(balance_sheet, "Share Capital", latest_year)
        reserves = _get_metric_value(balance_sheet, "Reserves|Surplus", latest_year)
        equity = (share_cap or 0) + (reserves or 0)
        
        if equity and equity != 0:
            if total_debt > 0:
                debt_to_equity = total_debt / equity
        
        # Total assets
        total_assets = _get_metric_value(balance_sheet, "Total Assets", latest_year)
        if not total_assets:
            # Try sum of assets
            non_current = _get_metric_value(balance_sheet, "Non.*Current Assets|Fixed Assets", latest_year)
            current = _get_metric_value(balance_sheet, "Current Assets", latest_year)
            if non_current and current:
                total_assets = non_current + current
        
        # Working capital
        current_assets = _get_metric_value(balance_sheet, "Current Assets", latest_year)
        current_liabilities = _get_metric_value(balance_sheet, "Current Liabilities", latest_year)
        if current_assets and current_liabilities:
            working_capital = current_assets - current_liabilities
            if current_liabilities != 0:
                current_ratio = current_assets / current_liabilities
        
        # Quick ratio (Current Assets - Inventory) / Current Liabilities
        inventory = _get_metric_value(balance_sheet, "Inventory|Stock", latest_year)
        if current_assets and inventory and current_liabilities and current_liabilities != 0:
            quick_ratio = (current_assets - inventory) / current_liabilities
        
        # Asset turnover
        if total_assets and latest_revenue and total_assets != 0:
            asset_turnover = latest_revenue / total_assets
        
        # Equity to assets
        if total_assets and equity and total_assets != 0:
            equity_to_assets = (equity / total_assets) * 100
        
        # Inventory turnover
        if inventory and latest_revenue and inventory != 0:
            inventory_turnover = latest_revenue / inventory
        
        # Receivables turnover
        receivables = _get_metric_value(balance_sheet, "Trade Receivables|Sundry Debtors|Receivables", latest_year)
        if receivables and latest_revenue and receivables != 0:
            receivables_turnover = latest_revenue / receivables
        
        # Cash conversion cycle (simplified: DSO + DIO - DPO)
        if receivables and latest_revenue and latest_revenue != 0:
            dso = (receivables / latest_revenue) * 365  # Days Sales Outstanding
        else:
            dso = None
        
        if inventory and latest_revenue and latest_revenue != 0:
            dio = (inventory / latest_revenue) * 365  # Days Inventory Outstanding
        else:
            dio = None
        
        payables = _get_metric_value(balance_sheet, "Trade Payables|Sundry Creditors|Payables", latest_year)
        if payables and latest_revenue and latest_revenue != 0:
            dpo = (payables / latest_revenue) * 365  # Days Payable Outstanding
        else:
            dpo = None
        
        if dso and dio and dpo:
            cash_conversion_cycle_days = dso + dio - dpo

    # Interest coverage
    if pl is not None and not pl.empty and latest_year:
        ebit = _get_metric_value(pl, "Operating Profit|EBIT|Profit Before", latest_year)
        interest = _get_metric_value(pl, "Interest|Finance Cost", latest_year)
        if ebit and interest and interest != 0:
            interest_coverage = ebit / abs(interest)
    
    # Debt to EBITDA
    if pl is not None and not pl.empty and latest_year:
        ebitda = _get_metric_value(pl, "EBITDA", latest_year)
        if not ebitda and balance_sheet is not None and not balance_sheet.empty:
            # Calculate EBITDA
            ebit = _get_metric_value(pl, "Operating Profit|EBIT", latest_year)
            dep = _get_metric_value(pl, "Depreciation", latest_year)
            if ebit and dep:
                ebitda = ebit + dep
        
        if ebitda and total_debt and ebitda != 0:
            debt_to_ebitda = total_debt / ebitda

    # Valuation ratios from key_metrics
    if "PE" in db_data.key_metrics:
        pe_ratio = parse_number(db_data.key_metrics["PE"])
    if "PB" in db_data.key_metrics:
        pb_ratio = parse_number(db_data.key_metrics["PB"])
    if "EV/EBITDA" in db_data.key_metrics:
        ev_to_ebitda = parse_number(db_data.key_metrics["EV/EBITDA"])
    
    if "ROE" in db_data.key_metrics:
        roe_val = parse_number(db_data.key_metrics["ROE"])
    if "ROCE" in db_data.key_metrics:
        roce_val = parse_number(db_data.key_metrics["ROCE"])

    # Quality scores (simple heuristics)
    # Earnings quality: based on CFO/PAT ratio consistency
    if cfo_to_pat_ratio is not None:
        if cfo_to_pat_ratio >= 1.0:
            earnings_quality_score = 100.0
        elif cfo_to_pat_ratio >= 0.8:
            earnings_quality_score = 80.0
        elif cfo_to_pat_ratio >= 0.6:
            earnings_quality_score = 60.0
        else:
            earnings_quality_score = max(0, cfo_to_pat_ratio * 100)
    
    # Balance sheet health: based on debt, liquidity, leverage
    health_factors = []
    if current_ratio:
        if current_ratio >= 2.0:
            health_factors.append(25)
        elif current_ratio >= 1.5:
            health_factors.append(20)
        elif current_ratio >= 1.0:
            health_factors.append(15)
        else:
            health_factors.append(5)
    
    if debt_to_equity is not None:
        if debt_to_equity <= 0.3:
            health_factors.append(25)
        elif debt_to_equity <= 0.5:
            health_factors.append(20)
        elif debt_to_equity <= 1.0:
            health_factors.append(15)
        else:
            health_factors.append(5)
    
    if interest_coverage:
        if interest_coverage >= 5.0:
            health_factors.append(25)
        elif interest_coverage >= 3.0:
            health_factors.append(20)
        elif interest_coverage >= 1.5:
            health_factors.append(15)
        else:
            health_factors.append(5)
    
    if roe_val:
        if roe_val >= 20:
            health_factors.append(25)
        elif roe_val >= 15:
            health_factors.append(20)
        elif roe_val >= 10:
            health_factors.append(15)
        else:
            health_factors.append(10)
    
    if health_factors:
        balance_sheet_health_score = sum(health_factors) / len(health_factors) * (100 / 25)

    return DerivedMetrics(
        latest_year=latest_year,
        latest_revenue=latest_revenue,
        latest_pat=latest_pat,
        latest_cfo=latest_cfo,
        cfo_to_pat_ratio=cfo_to_pat_ratio,
        debt_to_equity=debt_to_equity,
        roe=roe_val,
        roce=roce_val,
        revenue_growth_1y=revenue_growth_1y,
        revenue_growth_3y_cagr=revenue_growth_3y_cagr,
        pat_growth_1y=pat_growth_1y,
        pat_growth_3y_cagr=pat_growth_3y_cagr,
        revenue_3y_avg=revenue_3y_avg,
        pat_3y_avg=pat_3y_avg,
        net_margin=net_margin,
        operating_margin=operating_margin,
        ebitda_margin=ebitda_margin,
        asset_turnover=asset_turnover,
        inventory_turnover=inventory_turnover,
        receivables_turnover=receivables_turnover,
        working_capital=working_capital,
        current_ratio=current_ratio,
        quick_ratio=quick_ratio,
        cash_conversion_cycle_days=cash_conversion_cycle_days,
        interest_coverage=interest_coverage,
        debt_to_ebitda=debt_to_ebitda,
        equity_to_assets=equity_to_assets,
        pe_ratio=pe_ratio,
        pb_ratio=pb_ratio,
        ev_to_ebitda=ev_to_ebitda,
        fcf=fcf,
        fcf_margin=fcf_margin,
        capex_to_revenue=capex_to_revenue,
        earnings_quality_score=earnings_quality_score,
        balance_sheet_health_score=balance_sheet_health_score,
    )


# -----------------------------
# Perplexity + OpenAI clients
# -----------------------------


def fetch_perplexity_context(symbol: str, screener_symbol: str) -> PerplexityContext:
    """
    Fetch comprehensive external context using Perplexity API.
    Uses multiple targeted queries for better coverage.
    """
    api_key = os.environ.get("PERPLEXITY_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="PERPLEXITY_API_KEY not configured in environment.",
        )

    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    system_prompt = (
        "You are a professional equity research assistant. Provide factual, "
        "well-sourced information for investment analysis. Include source URLs "
        "for major claims. Be concise but comprehensive."
    )

    # Multi-part query for comprehensive coverage
    user_prompt = f"""
For the Indian stock {symbol} (NSE ticker, Screener.in slug: {screener_symbol}), 
collect comprehensive information for an investment research report:

**1. Business & Operations:**
- Detailed business model, primary products/services, and revenue streams
- Operating segments and their contribution to revenue
- Geographic revenue breakdown (domestic vs international)
- Key customers, suppliers, and business relationships
- Market position and competitive advantages
- Unit economics if available (margins by segment, customer acquisition cost, etc.)

**2. Recent Developments & Catalysts:**
- Major corporate actions in the last 12-24 months (M&A, divestitures, expansions)
- Recent product launches, partnerships, or strategic initiatives
- Regulatory approvals, licenses, or compliance issues
- Management changes or key personnel movements
- Upcoming catalysts (product launches, capacity expansions, regulatory decisions) in next 1-3 years

**3. Risks & Controversies:**
- Regulatory risks or pending investigations
- Governance issues, related-party transactions, or management concerns
- Environmental, social, or ESG controversies
- Legal disputes or litigation
- Competitive threats or market share losses
- Supply chain or operational risks

**4. Financial Context:**
- Industry trends affecting the company
- Peer comparisons or benchmarking data if available
- Analyst coverage and recent rating changes
- Insider trading activity or significant shareholding changes

**5. Strategic Outlook:**
- Management guidance or forward-looking statements
- Industry growth prospects and company positioning
- Capital allocation strategy (dividends, buybacks, capex plans)

Format the response as structured markdown with clear sections and bullet points.
Include source URLs for all major claims.
"""

    payload = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "search_recency_filter": "month",  # Focus on recent information
    }

    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        if "choices" in data and data["choices"]:
            content = data["choices"][0].get("message", {}).get("content", "")
            return PerplexityContext(raw_response=content or "")
        return PerplexityContext(raw_response="")
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502, detail=f"Error calling Perplexity API: {e}"
        ) from e


def get_openai_client() -> OpenAI:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured in environment.",
        )
    return OpenAI(api_key=api_key)


def generate_report_with_openai(
    db_data: DBData,
    derived: DerivedMetrics,
    perplexity_ctx: PerplexityContext,
    horizon_years: int,
) -> LLMReportResult:
    client = get_openai_client()

    numeric_payload: Dict[str, Any] = {
        "symbol": db_data.symbol,
        "screener_symbol": db_data.screener_symbol,
        "key_metrics": db_data.key_metrics,
        "derived_metrics": asdict(derived),
        "sections": {},
    }
    for sec, df in db_data.sections.items():
        numeric_payload["sections"][sec] = df.to_dict(orient="records")

    system_prompt = f"""
You are a senior equity research analyst at a top-tier investment firm, writing 
a comprehensive, decision-oriented investment memo for institutional investors.

**Report Structure (EXACTLY follow these 11 sections):**

1. **One-Page Investment Snapshot**
   - **Verdict**: BUY / WATCH / AVOID (one clear word)
   - **Time Horizon**: e.g., "1-3 years" or "5+ years" (be specific)
   - **Portfolio Position**: Core / Satellite / High-beta bet
   - **3-5 Key Bullets**:
     * Why this business wins (competitive moat, market position)
     * Main risk (biggest threat to the thesis)
     * What needs to go right (key assumptions for success)
     * Optional: Valuation attractiveness or entry point guidance

2. **Segment & Unit Economics**
   - Break down revenue by segment/product/geography if available
   - Unit economics: margins by segment, customer economics, operational leverage
   - Growth drivers by segment
   - Use actual numbers from the financial data provided

3. **Variant Perception vs Market**
   - What does the market believe vs. what you believe?
   - Key mispricings or misunderstood aspects
   - Consensus expectations vs. your view
   - Use derived metrics (growth rates, margins, quality scores) to support your view

4. **Risks & Mitigants (Properly Structured)**
   - **Business Risks**: Competitive, operational, market risks
   - **Financial Risks**: Leverage, liquidity, cash flow risks
   - **Regulatory/ESG Risks**: Compliance, environmental, governance
   - For each risk, provide: (1) Probability, (2) Impact, (3) Mitigants
   - Use financial ratios (debt/equity, interest coverage, current ratio) to quantify financial risks

5. **Catalysts & Triggers**
   - **Positive Catalysts**: Product launches, capacity expansions, regulatory approvals, M&A
   - **Negative Catalysts**: Competitive threats, regulatory changes, management issues
   - Timeline for each catalyst
   - Use Perplexity data for recent developments and upcoming events

6. **Scenario & Sensitivity Analysis**
   - **Base Case**: Your central forecast (use growth rates, margins from derived metrics)
   - **Bull Case**: What if everything goes right? (quantify upside)
   - **Bear Case**: What if key risks materialize? (quantify downside)
   - Key sensitivities: revenue growth, margin expansion, valuation multiples
   - Use 3-year CAGR and historical averages to inform scenarios

7. **Accounting Quality & Forensic Checks**
   - **Earnings Quality**: Analyze CFO/PAT ratio, working capital trends, cash conversion
   - **Red Flags**: Unusual revenue recognition, related-party transactions, off-balance-sheet items
   - **Balance Sheet Health**: Debt structure, liquidity position, asset quality
   - Use derived metrics: earnings_quality_score, balance_sheet_health_score, cash_conversion_cycle
   - Compare working capital trends, inventory turnover, receivables turnover

8. **Shareholding, Flows & Liquidity Deep Dive**
   - Promoter holding, FII/DII trends, retail participation
   - Recent changes in shareholding pattern
   - Liquidity metrics (average daily volume, free float)
   - Use Shareholding Pattern data from financials

9. **ESG & Reputation / Controversy Check**
   - Environmental impact, sustainability practices
   - Social responsibility, labor practices
   - Governance quality, board composition, related-party transactions
   - Any controversies or regulatory issues
   - Use Perplexity data for ESG information and controversies

10. **Peer Benchmarking Dashboard**
    - Compare key metrics vs. peers: ROE, ROCE, margins, growth, valuation multiples
    - Relative valuation: P/E, P/B, EV/EBITDA vs. peer median
    - Operational efficiency: asset turnover, inventory turnover vs. peers
    - Use peer data if available, otherwise use industry benchmarks
    - Highlight where the company outperforms or underperforms

11. **Ongoing KPI Tracker / "What to Watch"**
    - **Revenue Growth**: Track YoY and 3-year CAGR trends
    - **Margin Expansion**: Operating margin, EBITDA margin trends
    - **Cash Generation**: FCF margin, CFO/PAT ratio
    - **Balance Sheet**: Debt/equity, interest coverage, current ratio
    - **Efficiency**: Asset turnover, inventory turnover, cash conversion cycle
    - **Valuation**: P/E, P/B, EV/EBITDA vs. historical and peer ranges
    - Set specific thresholds for each metric (e.g., "Watch if ROE falls below 15%")

**Critical Instructions:**
- **Use Numbers**: Reference specific metrics from derived_metrics (growth rates, margins, ratios, quality scores)
- **Be Quantitative**: When discussing trends, cite actual numbers and percentages
- **Peer Comparison**: Use peer data when available, highlight relative performance
- **Time-Series Analysis**: Reference multi-year trends, not just latest year
- **Be Honest**: Explicitly state when data is missing or uncertain
- **Actionable**: Each section should inform the investment decision
- **Writing Style**: Concise, punchy, institutional-grade. Avoid fluff.
- **Horizon**: Assume {horizon_years}-year investment horizon unless data suggests otherwise

**Data Usage:**
- Use `derived_metrics` for all calculated ratios, growth rates, and quality scores
- Use `sections` (P&L, Balance Sheet, Cash Flows) for time-series analysis
- Use `key_metrics` for valuation multiples and standard ratios
- Use `perplexity_ctx` for qualitative context, catalysts, risks, ESG
- Use `peer_data` for benchmarking (if provided)
"""

    # Load peer data
    peer_data = load_peer_data(db_data.screener_symbol)
    if peer_data:
        numeric_payload["peer_data"] = peer_data

    user_prompt = """
Here is the comprehensive financial data for {symbol}:

**1. Key Metrics & Valuation:**
```json
{key_metrics_json}
```

**2. Derived Metrics (Calculated):**
```json
{derived_metrics_json}
```

**3. Time-Series Financial Data (P&L, Balance Sheet, Cash Flows, Ratios, Shareholding):**
```json
{sections_json}
```

**4. Peer Comparison Data (if available):**
```json
{peer_data_json}
```

**5. External Context & Qualitative Information (from Perplexity):**
```markdown
{perplexity_md}
```

**Instructions:**
- Write the full 11-section report using the exact structure in the system message
- Use specific numbers from derived_metrics (growth rates, margins, ratios, quality scores)
- Reference time-series trends from sections data
- Compare against peers when peer_data is available
- Integrate qualitative insights from Perplexity for catalysts, risks, ESG
- Be quantitative and specific - cite actual percentages, ratios, and trends
- Do not add extra sections beyond the 11 specified
- Ensure Section 1 (One-Page Investment Snapshot) has a clear BUY/WATCH/AVOID verdict
""".format(
        symbol=db_data.symbol,
        key_metrics_json=json.dumps(db_data.key_metrics, default=str, indent=2),
        derived_metrics_json=json.dumps(asdict(derived), default=str, indent=2),
        sections_json=json.dumps({k: v.to_dict(orient="records") for k, v in db_data.sections.items()}, default=str, indent=2),
        peer_data_json=json.dumps(peer_data, default=str, indent=2) if peer_data else "{}",
        perplexity_md=perplexity_ctx.raw_response,
    )

    completion = client.chat.completions.create(
        model="gpt-5.1",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    report_markdown = completion.choices[0].message.content or ""

    verdict_system = """
You are an investment committee summarizer.
Given an equity research report, classify the stock as BUY, SELL, or HOLD for an
equity investor, and explain the reasoning concisely.

Be pragmatic and honest: if the case is weak, say SELL or HOLD.
"""
    verdict_user = f"""
Here is the full investment report (markdown):

```markdown
{report_markdown}
```

Return a short JSON object with the following fields:
- verdict: one of "BUY", "SELL", "HOLD"
- horizon_years: integer (your recommended holding horizon)
- rationale: 2–4 sentences explaining the decision.
"""

    verdict_completion = client.chat.completions.create(
        model="gpt-5.1",
        messages=[
            {"role": "system", "content": verdict_system},
            {"role": "user", "content": verdict_user},
        ],
        temperature=0.2,
    )
    verdict_raw = verdict_completion.choices[0].message.content or ""

    verdict = "HOLD"
    rationale = verdict_raw.strip()
    try:
        parsed = json.loads(verdict_raw)
        verdict = parsed.get("verdict", verdict).upper()
        rationale = parsed.get("rationale", rationale)
    except Exception:
        pass

    return LLMReportResult(
        report_markdown=report_markdown,
        verdict=verdict,
        verdict_rationale=rationale,
    )


# -----------------------------
# FastAPI app
# -----------------------------


app = FastAPI(title="Alpha Equity Report Service")

# Allow browser frontends (e.g. Vite dev server) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize scheduler for daily symbol index refresh
scheduler = BackgroundScheduler()


def scheduled_refresh_symbol_index() -> None:
    """
    Scheduled task to refresh symbol index daily.
    Runs silently in the background and logs errors without raising exceptions.
    """
    try:
        print(f"[{datetime.utcnow()}] Starting scheduled symbol index refresh...")
        count = refresh_symbol_index()
        print(f"[{datetime.utcnow()}] Symbol index refresh completed. Upserted {count} symbols.")
    except Exception as e:
        print(f"[{datetime.utcnow()}] Error during scheduled symbol index refresh: {e}")
        # Don't raise - this is a background task


@app.on_event("startup")
def startup_event() -> None:
    init_db()
    # Refresh symbol index at startup
    try:
        print(f"[{datetime.utcnow()}] Refreshing symbol index at startup...")
        refresh_symbol_index()
        print(f"[{datetime.utcnow()}] Startup symbol index refresh completed.")
    except HTTPException:
        # Don't block startup if Groww CSV is temporarily unavailable.
        print(f"[{datetime.utcnow()}] Startup symbol index refresh failed (non-blocking).")
    
    # Schedule daily refresh at 2 AM UTC (7:30 AM IST)
    scheduler.add_job(
        scheduled_refresh_symbol_index,
        trigger=CronTrigger(hour=2, minute=0),  # 2 AM UTC = 7:30 AM IST
        id='daily_symbol_refresh',
        name='Daily Symbol Index Refresh',
        replace_existing=True
    )
    scheduler.start()
    print(f"[{datetime.utcnow()}] Scheduled daily symbol index refresh at 2:00 AM UTC (7:30 AM IST)")


@app.on_event("shutdown")
def shutdown_event() -> None:
    """Shutdown scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        print(f"[{datetime.utcnow()}] Scheduler shut down.")


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_stock(req: AnalyzeRequest) -> AnalyzeResponse:
    # 0. Resolve input (symbol or company name) to NSE symbol
    resolved_symbol = resolve_input_to_symbol(req.symbol)
    
    # 1. Scrape latest data (with Gemini fallback for Screener slug)
    screener_symbol = ensure_latest_data_for_symbol(resolved_symbol)

    # 2. Load from DB + derived metrics
    db_data = load_db_data(resolved_symbol, screener_symbol)
    derived = compute_derived_metrics(db_data)

    # 3. External context
    perplexity_ctx = fetch_perplexity_context(resolved_symbol, screener_symbol)

    # 4. LLM report + verdict
    llm_result = generate_report_with_openai(
        db_data=db_data,
        derived=derived,
        perplexity_ctx=perplexity_ctx,
        horizon_years=req.horizon_years,
    )

    last_updated = get_last_updated(screener_symbol) or datetime.utcnow().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    return AnalyzeResponse(
        symbol=resolved_symbol,
        screener_symbol=screener_symbol,
        horizon_years=req.horizon_years,
        last_updated=last_updated,
        verdict=llm_result.verdict,
        verdict_rationale=llm_result.verdict_rationale,
        report_markdown=llm_result.report_markdown,
    )


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/refresh-index")
def refresh_index() -> Dict[str, Any]:
    """
    Manually refresh the Groww-based NSE stock symbol index.
    Useful if you want to update symbols without restarting the server.
    """
    count = refresh_symbol_index()
    return {"status": "ok", "symbols_upserted": count}


@app.get("/symbols")
def list_symbols() -> Dict[str, Any]:
    """
    Return all indexed NSE stock symbols from the local symbol_index table.
    """
    conn = connect_db()
    cur = conn.cursor()
    rows = cur.execute("SELECT symbol FROM symbol_index ORDER BY symbol").fetchall()
    conn.close()
    symbols = [r["symbol"] for r in rows]
    return {"symbols": symbols, "count": len(symbols)}


@app.post("/delete-symbol")
def delete_symbol(req: DeleteSymbolRequest) -> Dict[str, Any]:
    """
    Delete all data (DB records and HTML file) for a given symbol.
    """
    init_db()
    normalized = req.symbol.strip().upper()
    
    # Get mapped screener symbol if exists
    mapped = get_mapped_screener_symbol(normalized)
    symbols_to_delete = [normalized]
    if mapped and mapped != normalized:
        symbols_to_delete.append(mapped)
    
    deleted_count = 0
    for sym in symbols_to_delete:
        delete_all_data_for_symbol(sym)
        deleted_count += 1
    
    return {
        "status": "success",
        "symbol": normalized,
        "symbols_deleted": symbols_to_delete,
        "count": deleted_count,
    }


@app.get("/scraping-stats")
def get_scraping_stats() -> Dict[str, Any]:
    """
    Return statistics about scraping success/failure counts.
    """
    conn = connect_db()
    cur = conn.cursor()
    
    # Count total symbols in index
    total_symbols = cur.execute("SELECT COUNT(*) FROM symbol_index").fetchone()[0]
    
    # Count successfully scraped (has data in key_metrics)
    scraped_count = cur.execute(
        "SELECT COUNT(DISTINCT symbol) FROM key_metrics"
    ).fetchone()[0]
    
    # Count failed (status = 'failed' in processing_log)
    failed_count = cur.execute(
        "SELECT COUNT(*) FROM processing_log WHERE status = 'failed'"
    ).fetchone()[0]
    
    # Count with recent data (within 16 hours)
    freshness_cutoff = (datetime.utcnow() - timedelta(hours=16)).strftime("%Y-%m-%d %H:%M:%S")
    recent_count = cur.execute(
        "SELECT COUNT(*) FROM processing_log WHERE date_scraped >= ? AND status = 'success'",
        (freshness_cutoff,)
    ).fetchone()[0]
    
    conn.close()
    
    return {
        "total_symbols": total_symbols,
        "scraped_successfully": scraped_count,
        "failed": failed_count,
        "recently_scraped": recent_count,
        "not_scraped": total_symbols - scraped_count - failed_count,
    }


@app.post("/scrape-symbol")
def scrape_symbol(req: ScrapeSymbolRequest) -> Dict[str, Any]:
    """
    Scrape/refresh Screener data for a single symbol without generating a report.

    This is useful for bulk preloading/updating the DB while applying
    random sequence and random pause logic on the client side.
    """
    try:
        screener_symbol = ensure_latest_data_for_symbol(req.symbol)
        last_updated = get_last_updated(screener_symbol) or datetime.utcnow().strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        return {
            "symbol": req.symbol.upper(),
            "screener_symbol": screener_symbol,
            "last_updated": last_updated,
            "status": "success",
        }
    except HTTPException as e:
        # Mark as failed in processing_log
        upsert_processing_log(req.symbol.upper(), "failed")
        return {
            "symbol": req.symbol.upper(),
            "screener_symbol": None,
            "last_updated": None,
            "status": "failed",
            "error": e.detail,
        }


@app.get("/company-data/{symbol}", response_model=CompanyDataResponse)
def get_company_data(symbol: str) -> CompanyDataResponse:
    """
    Return structured financial data for a symbol from the local DB
    (does not trigger a fresh scrape).

    Use /scrape-symbol or /analyze first to ensure the symbol has data.
    """
    init_db()
    normalized = symbol.strip().upper()
    screener_symbol = get_mapped_screener_symbol(normalized) or normalized

    # Check if we have any data for this screener_symbol
    conn = connect_db()
    cur = conn.cursor()
    has_data = cur.execute(
        "SELECT 1 FROM key_metrics WHERE symbol = ? LIMIT 1", (screener_symbol,)
    ).fetchone()
    conn.close()

    if not has_data:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No financial data found for symbol '{normalized}' "
                f"(Screener: '{screener_symbol}'). "
                "Scrape it first using /scrape-symbol or /analyze."
            ),
        )

    db_data = load_db_data(normalized, screener_symbol)

    # Convert sections DataFrames to list-of-dicts rows
    sections_dict: Dict[str, Any] = {}
    for sec, df in db_data.sections.items():
        sections_dict[sec] = df.to_dict(orient="records")

    last_updated = get_last_updated(screener_symbol)

    return CompanyDataResponse(
        symbol=normalized,
        screener_symbol=screener_symbol,
        last_updated=last_updated,
        key_metrics=db_data.key_metrics,
        sections=sections_dict,
    )



