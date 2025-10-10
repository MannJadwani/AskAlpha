# Recommendation Generation Flow

## Overview
The report generation on the recommendations page now follows a clean three-step API flow that separates concerns and makes the process more modular and maintainable.

## Three-Step Process

### Step 1: Get Company Data from Perplexity
**Endpoint:** `/api/company-research`

**Purpose:** Fetch comprehensive company information using Perplexity AI

**Request:**
```json
{
  "companyName": "Apple Inc"
}
```

**Response:**
```json
{
  "companyName": "Apple Inc",
  "research": "Detailed analysis content...",
  "citations": ["https://source1.com", "https://source2.com"],
  "timestamp": "2025-10-09T..."
}
```

**What it does:**
- Uses Perplexity's `sonar-pro` model to research the company
- Gathers financial metrics, current prices, analyst targets, business fundamentals
- Collects citations from credible sources (screener.in, NSE/BSE, analyst reports)
- Returns raw research data for further processing

---

### Step 2: Get Revenue and Profit Charts Data
**Endpoint:** `/api/company-financials`

**Purpose:** Fetch structured financial data for charting (revenue and profit over 5 years)

**Request:**
```json
{
  "companyName": "Apple Inc"
}
```

**Response:**
```json
{
  "revenues_5yr": [
    { "year": "2021", "inr": 100000 },
    { "year": "2022", "inr": 110000 },
    { "year": "2023", "inr": 120000 },
    { "year": "2024", "inr": 140000 },
    { "year": "2025", "inr": 155000 }
  ],
  "profits_5yr": [
    { "year": "2021", "inr": 9000 },
    { "year": "2022", "inr": 10000 },
    { "year": "2023", "inr": 11000 },
    { "year": "2024", "inr": 12500 },
    { "year": "2025", "inr": 13200 }
  ]
}
```

**What it does:**
- Uses Perplexity to extract exact 5-year revenue and profit data
- Returns structured JSON ready for charts (Recharts library)
- Prefers INR values for Indian market context
- Validates data using Zod schemas

---

### Step 3: Structure Data and Generate Recommendation
**Endpoint:** `/api/structure-recommendation`

**Purpose:** Combine research and financial data to create a structured investment recommendation

**Request:**
```json
{
  "companyName": "Apple Inc",
  "research": "Research content from step 1...",
  "financials": {
    "revenues_5yr": [...],
    "profits_5yr": [...]
  }
}
```

**Response:**
```json
{
  "recommendation": {
    "action": "BUY",
    "confidence": 85,
    "targetPrice": 1250.50,
    "currentPrice": 1180.75,
    "reasoning": "Strong fundamentals with...",
    "keyFactors": ["Factor 1", "Factor 2", ...],
    "risks": ["Risk 1", "Risk 2", ...],
    "timeHorizon": "6-12 months"
  },
  "structuredAnalysis": {
    "kpis": [
      { "label": "Revenue (TTM, INR)", "value": "₹1,29,801 Cr" },
      ...
    ],
    "sections": [
      {
        "key": "financial_performance",
        "title": "Financial Performance",
        "content": "- bullet points..."
      },
      ...
    ]
  },
  "timestamp": "2025-10-09T..."
}
```

**What it does:**
- Uses OpenAI GPT-4o-mini to analyze the combined data
- Extracts NSE symbol and fetches Screener.in data for additional context
- Generates structured BUY/SELL/HOLD recommendation with confidence score
- Extracts key performance indicators (KPIs)
- Creates thematic sections (financial performance, valuation, risks, etc.)
- Validates all output with Zod schemas

---

## Frontend Integration

### Recommendation Page Flow
Located at: `/app/(report)/recommendation/page.tsx`

The `handleAnalyze` function orchestrates the three-step process:

1. **User Input:** Company name or ticker symbol
2. **Step 1:** Fetch research from `/api/company-research`
3. **Step 2:** Fetch financials from `/api/company-financials` (with error handling)
4. **Step 3:** Structure recommendation from `/api/structure-recommendation`
5. **Display:** Combine all data and render the recommendation UI

### Loading States
- `researching`: Steps 1-2 (data gathering)
- `structuring`: Step 3 (recommendation generation)
- `complete`: Display results

### Error Handling
- Each step has independent error handling
- Financial data is optional (continues without it if fetch fails)
- Clear error messages displayed to user

---

## Benefits of This Architecture

1. **Separation of Concerns:** Each API endpoint has a single, clear responsibility
2. **Modularity:** Endpoints can be called independently or in different combinations
3. **Error Isolation:** Failures in one step don't necessarily break the entire flow
4. **Testability:** Each endpoint can be tested in isolation
5. **Flexibility:** Easy to add new data sources or modify existing ones
6. **Reusability:** Endpoints can be reused in other parts of the application

---

## Data Sources

### Primary Sources
- **Perplexity AI (sonar-pro):** Real-time company research and financial data
- **Screener.in:** Indian stock market data, financials, analyst targets
- **NSE/BSE:** Live stock prices for Indian companies
- **OpenAI (GPT-4o-mini):** Structuring and recommendation generation

### Data Validation
- All API responses are validated using Zod schemas
- Type safety enforced throughout the flow
- Fallback values for missing data (e.g., "N/A" for unavailable KPIs)

---

## Future Enhancements

Potential improvements to consider:

1. **Caching:** Cache research and financial data to reduce API calls
2. **Webhooks:** Real-time updates when new data becomes available
3. **Batch Processing:** Analyze multiple companies in parallel
4. **Historical Tracking:** Store recommendations over time for backtesting
5. **User Preferences:** Customize KPIs and sections based on user preferences
6. **International Support:** Better currency conversion and multi-market support


