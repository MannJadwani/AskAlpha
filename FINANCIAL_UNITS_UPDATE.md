# Financial Units Display Update

## Overview
Updated the financial data API and charts to dynamically display units (Lakhs, Crores, or Thousands) based on company size.

## Changes Made

### 1. API Endpoint (`/api/company-financials/route.ts`)

**Updated Schema:**
```typescript
const FinancialsSchema = z.object({
  revenues_5yr: z.array(z.object({ year: z.string(), inr: z.number() })).length(5),
  profits_5yr: z.array(z.object({ year: z.string(), inr: z.number() })).length(5),
  revenue_unit: z.enum(['Lakhs', 'Crores', 'Thousands']),  // ✨ NEW
  profit_unit: z.enum(['Lakhs', 'Crores', 'Thousands'])     // ✨ NEW
});
```

**API Response Example:**
```json
{
  "revenues_5yr": [
    { "year": "2021", "inr": 150000 },
    { "year": "2022", "inr": 165000 },
    ...
  ],
  "profits_5yr": [
    { "year": "2021", "inr": 12000 },
    { "year": "2022", "inr": 13500 },
    ...
  ],
  "revenue_unit": "Crores",
  "profit_unit": "Crores"
}
```

**Unit Selection Logic:**
- **Crores**: Large companies (revenues > 100 crores) - Most Indian listed companies
- **Lakhs**: Small/medium companies (revenues between 1 lakh - 100 crores)
- **Thousands**: Very small companies (revenues < 1 lakh)

GPT-4o-mini intelligently selects the appropriate unit based on company size.

---

### 2. Frontend Charts (`/app/(report)/recommendation/page.tsx`)

**Updated Interface:**
```typescript
interface RecommendationData {
  ...
  structuredAnalysis?: { 
    revenues_5yr?: { year: string; inr: number }[];
    profits_5yr?: { year: string; inr: number }[];
    revenue_unit?: string;  // ✨ NEW
    profit_unit?: string;   // ✨ NEW
  } | null;
}
```

**Chart Title Updates:**
- Revenue Chart: `"Revenue (Last 5 Years) - ₹ in Crores"`
- Profit Chart: `"Profit (Last 5 Years) - ₹ in Lakhs"`

**Legend Updates:**
- Displays: `"Revenue (₹ Crores)"` or `"Profit (₹ Lakhs)"` based on actual unit

**Tooltip Updates:**
- Shows formatted value with proper Indian number formatting
- Displays unit in tooltip: `"Revenue (₹ Crores): ₹1,50,000"`

---

## Visual Examples

### Before:
```
Revenue (Last 5 Years)
Y-axis: 150k, 160k, 170k
Tooltip: ₹1,50,000.00
```

### After:
```
Revenue (Last 5 Years) - ₹ in Crores
Y-axis: 150.0k, 160.0k, 170.0k
Tooltip: Revenue (₹ Crores): ₹1,50,000
Legend: Revenue (₹ Crores)
```

---

## Benefits

1. **Clarity**: Users immediately know what scale the numbers represent
2. **Context**: Units adjust based on company size (startup vs. large cap)
3. **Indian Standard**: Uses familiar Indian numbering (Lakhs/Crores)
4. **Accuracy**: GPT intelligently determines the most appropriate unit
5. **Consistency**: Both charts and tooltips show the same unit

---

## Technical Details

### Data Flow:
1. **Perplexity** finds raw financial data from sources (screener.in, etc.)
2. **GPT-4o-mini** structures the data and determines appropriate units
3. **Frontend** receives unit info and displays in:
   - Chart titles
   - Y-axis labels
   - Legend entries
   - Tooltips

### Number Formatting:
- Y-axis: `1500` → `"1.5k"` (condensed for space)
- Tooltip: `150000` → `"₹1,50,000"` (Indian comma format)
- Always shows ₹ symbol for clarity

---

## Future Enhancements

1. **User Preference**: Allow users to select preferred unit display
2. **Auto-switching**: Show Crores for large values, Lakhs for smaller within same dataset
3. **International**: Add support for Millions/Billions for global companies
4. **Percentage Growth**: Show YoY growth percentages alongside absolute values


