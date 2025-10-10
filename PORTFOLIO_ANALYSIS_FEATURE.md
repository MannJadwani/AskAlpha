# Portfolio Analysis Feature

## Overview
Added a new Portfolio Analysis page where users can upload their investment portfolio (via file or manual entry) and receive AI-powered analysis, insights, and recommendations.

---

## New Files Created

### 1. Portfolio Page
**Path:** `/app/(report)/portfolio/page.tsx`

**Features:**
- File upload (CSV/Excel) support with drag & drop
- Manual entry option for portfolio data
- Real-time portfolio analysis
- Detailed holdings table with gain/loss calculations
- AI-generated insights and recommendations
- Risk score assessment
- Beautiful, responsive UI using Framer Motion

**Upload Methods:**
1. **File Upload:** Drag & drop or click to upload CSV/Excel files
2. **Manual Entry:** Type portfolio holdings directly in a text area

**Expected Format:**
```
Symbol, Quantity, Avg Price, Current Price (optional)
RELIANCE, 100, 2450.50, 2580.00
TCS, 50, 3200.00, 3450.00
INFY, 75, 1450.25
```

---

### 2. API Endpoint
**Path:** `/app/api/analyze-portfolio/route.ts`

**Three-Step Process:**

#### Step 1: Parse Portfolio Data
- Uses GPT-4o-mini to intelligently parse uploaded data
- Handles both CSV and manual text formats
- Extracts: symbol, quantity, average price

#### Step 2: Fetch Current Prices
- Uses Perplexity API to get live stock prices
- Searches screener.in and NSE/BSE data
- Calculates current value and gain/loss for each holding

#### Step 3: Generate AI Insights
- Analyzes portfolio composition and performance
- Calculates risk score (0-100)
- Provides 3-5 actionable recommendations
- Considers diversification, risk exposure, and market conditions

**API Response:**
```json
{
  "holdings": [
    {
      "symbol": "RELIANCE",
      "quantity": 100,
      "avgPrice": 2450.50,
      "currentPrice": 2580.00,
      "value": 258000,
      "gainLoss": 12950,
      "gainLossPercent": 5.29
    }
  ],
  "totalValue": 500000,
  "totalInvestment": 450000,
  "totalGainLoss": 50000,
  "totalGainLossPercent": 11.11,
  "insights": "Your portfolio shows strong performance...",
  "recommendations": [
    "Consider diversifying into defensive sectors",
    "Take partial profits in high-performing stocks"
  ],
  "riskScore": 45,
  "timestamp": "2025-10-10T12:00:00.000Z"
}
```

---

## Navigation Updates

### Mobile Bottom Navigation
**File:** `/app/(report)/components/MobileBottomNav.tsx`

**Changes:**
- Added "Portfolio" button with Briefcase icon
- Grid updated to `grid-cols-4` (4 items)

**Navigation Items:**
1. AI (Recommendations)
2. Portfolio ✨ NEW
3. Trade
4. Pro (Pricing)

### Desktop Sidebar
**File:** `/components/Sidebar.tsx`

**Changes:**
- Added "Portfolio Analysis" menu item
- Uses Briefcase icon from lucide-react

**Navigation Items:**
1. AI Recommendations
2. Portfolio Analysis ✨ NEW

---

## Middleware Update
**File:** `/middleware.ts`

**Changes:**
- Added `/portfolio` to protected routes
- Requires authentication to access

**Protected Routes:**
`['/my-reports', '/recommendation', '/analytics', '/pricing', '/trade', '/portfolio']`

---

## UI Components & Features

### Upload Section
- **File Upload Area:**
  - Drag & drop functionality
  - Click to browse files
  - File validation (CSV, XLSX, XLS only)
  - File size display
  - Remove file option

- **Manual Entry:**
  - Multi-line text area
  - Helpful placeholder text
  - Format guidance

- **Format Help:**
  - Clear instructions panel
  - Example data format
  - Column descriptions

### Analysis Results

#### Portfolio Summary Cards
- Total Investment
- Current Value
- Gain/Loss (with percentage)
- Risk Score with color coding

#### Holdings Table
- Symbol
- Quantity
- Average Price
- Current Price
- Current Value
- Gain/Loss (absolute & percentage)
- Color-coded gains (green) and losses (red)

#### AI Insights Section
- Comprehensive portfolio analysis
- Performance assessment
- Composition overview

#### Recommendations
- Numbered list of actionable recommendations
- Specific, personalized suggestions
- Investment strategy improvements

---

## Features & Capabilities

### ✅ Smart Parsing
- Handles various CSV formats
- Tolerates missing data
- Intelligent column detection
- Works with headers or without

### ✅ Real-Time Pricing
- Fetches current stock prices via Perplexity
- Supports Indian stocks (NSE/BSE)
- Calculates unrealized gains/losses
- Shows percentage returns

### ✅ AI-Powered Analysis
- Portfolio performance evaluation
- Risk assessment (0-100 scale)
- Diversification analysis
- Personalized recommendations

### ✅ User Experience
- Beautiful animations (Framer Motion)
- Responsive design (mobile + desktop)
- Loading states
- Error handling
- Credits integration

### ✅ Security
- Authentication required
- Protected route
- File type validation
- Secure file handling

---

## How It Works

### User Flow:
1. **Navigate** to Portfolio page via sidebar or bottom nav
2. **Choose** upload method (file or manual entry)
3. **Upload** portfolio data
4. **Analyze** - Click "Analyze Portfolio" button
5. **Review** results:
   - See portfolio summary
   - Check individual holdings
   - Read AI insights
   - View recommendations
6. **Analyze Another** - Reset and analyze different portfolio

### API Flow:
1. Receive portfolio data (file or text)
2. Parse using GPT-4o-mini → extract holdings
3. Fetch current prices using Perplexity → update values
4. Calculate totals and metrics
5. Generate insights using GPT-4o-mini → risk score + recommendations
6. Return complete analysis

---

## Error Handling

### Frontend:
- File type validation
- Empty data checks
- Credit balance checks
- User-friendly error messages

### Backend:
- Invalid format handling
- Missing data fallbacks
- API failure recovery
- Comprehensive error logging

---

## Credits System Integration

### Credits Required:
- 1 credit per portfolio analysis
- Same as other AI features (recommendations)

### Credit Checks:
- ✅ Shown in header banner
- ✅ Disabled UI when credits = 0
- ✅ Warning when credits ≤ 2
- ✅ Links to pricing page

---

## Design Principles

### Follows Site Theme:
- Uses global design tokens
- Consistent with recommendation page
- Dark mode support
- Matches existing color palette

### User-Centric:
- Multiple upload methods
- Clear instructions
- Helpful examples
- Informative feedback

### Performance:
- Efficient file parsing
- Optimized API calls
- Fast rendering
- Smooth animations

---

## Future Enhancements

Potential improvements:

1. **Historical Tracking:**
   - Save portfolio snapshots
   - Track performance over time
   - Compare date ranges

2. **Advanced Analytics:**
   - Sector allocation pie chart
   - Performance benchmarking vs. indices
   - Dividend yield calculations
   - Tax implications

3. **Export Options:**
   - Download analysis as PDF
   - Export to Excel
   - Share via link

4. **Integration:**
   - Connect with broker accounts
   - Auto-sync holdings
   - Real-time updates

5. **Comparison:**
   - Compare multiple portfolios
   - Portfolio vs. portfolio analysis
   - Best practices suggestions

6. **Alerts:**
   - Price target notifications
   - Rebalancing suggestions
   - Market event alerts

---

## Testing Checklist

- [x] File upload works with CSV
- [x] File upload works with Excel
- [x] Manual entry works
- [x] Drag & drop functionality
- [x] File validation (rejects invalid types)
- [x] Portfolio parsing
- [x] Price fetching (with Perplexity)
- [x] AI insights generation
- [x] Risk score calculation
- [x] Recommendations display
- [x] Mobile navigation shows Portfolio
- [x] Desktop sidebar shows Portfolio
- [x] Authentication required
- [x] Credits integration
- [x] Error handling
- [x] Loading states
- [x] Responsive design

---

## Example Usage

### Sample CSV Content:
```csv
Symbol,Quantity,AvgPrice,CurrentPrice
RELIANCE,100,2450.50,2580.00
TCS,50,3200.00,3450.00
INFY,75,1450.25,1520.00
HDFCBANK,60,1650.00,1720.00
ICICIBANK,80,950.00,1020.00
```

### Sample Manual Entry:
```
RELIANCE, 100, 2450.50
TCS, 50, 3200.00
INFY, 75, 1450.25
HDFCBANK, 60, 1650.00
ICICIBANK, 80, 950.00
```

Both formats work seamlessly! 🎉

---

## Summary

The Portfolio Analysis feature provides a comprehensive, AI-powered solution for retail investors to:
- Upload their holdings easily
- Get real-time valuations
- Understand their portfolio risk
- Receive personalized recommendations
- Make better investment decisions

Built with modern tech stack:
- React + Next.js
- GPT-4o-mini for analysis
- Perplexity for real-time data
- Framer Motion for animations
- Tailwind CSS for styling

