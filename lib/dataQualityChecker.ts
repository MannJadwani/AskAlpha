/**
 * Data Quality Checker for Investment Recommendations
 * Calculates confidence and quality scores based on available data
 */

export interface DataQualityMetrics {
  overallScore: number; // 0-100
  kpiCompleteness: number; // Percentage of KPIs found (not N/A)
  dataFreshness: number; // 0-100 based on age of data
  sourceReliability: number; // 0-100 based on citation quality
  breakdown: {
    kpisFound: number;
    kpisTotal: number;
    citationCount: number;
    hasCurrentPrice: boolean;
    hasTargetPrice: boolean;
    dataAgeDays: number;
  };
  warnings: string[];
  suggestions: string[];
}

export function calculateDataQuality(
  kpis: Array<{ label: string; value: string }> | undefined,
  citations: string[],
  currentPrice: number | null | undefined,
  targetPrice: number | null | undefined,
  timestamp: string
): DataQualityMetrics {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // 1. KPI Completeness (40% weight)
  const kpisTotal = 8;
  const kpisFound = kpis?.filter(k => k.value !== 'N/A' && k.value.trim() !== '').length || 0;
  const kpiCompleteness = (kpisFound / kpisTotal) * 100;

  if (kpisFound < 6) {
    warnings.push(`Only ${kpisFound}/8 key metrics found`);
    suggestions.push('Some financial metrics are missing. Data may be limited for this company.');
  }

  // 2. Data Freshness (30% weight)
  const dataAge = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
  let dataFreshness = 100;
  if (dataAge > 1) dataFreshness = Math.max(0, 100 - (dataAge * 5)); // Decay 5% per day
  
  if (dataAge > 7) {
    warnings.push(`Data is ${dataAge} days old`);
    suggestions.push('Consider re-running analysis for latest information.');
  }

  // 3. Source Reliability (20% weight)
  const citationCount = citations.length;
  let sourceReliability = Math.min(100, citationCount * 20); // 5 citations = 100%
  
  // Boost score if we have screener.in or official sources
  const hasScreener = citations.some(c => c.includes('screener.in'));
  const hasOfficial = citations.some(c => c.includes('nseindia.com') || c.includes('bseindia.com'));
  
  if (hasScreener) sourceReliability = Math.min(100, sourceReliability + 20);
  if (hasOfficial) sourceReliability = Math.min(100, sourceReliability + 15);

  if (citationCount < 3) {
    warnings.push('Limited data sources found');
    suggestions.push('Recommendation based on fewer sources than ideal.');
  }

  // 4. Price Data Availability (10% weight)
  let priceDataScore = 0;
  if (currentPrice) priceDataScore += 50;
  if (targetPrice) priceDataScore += 50;

  if (!currentPrice) {
    warnings.push('Current market price not available');
  }
  if (!targetPrice) {
    warnings.push('No analyst price target found');
    suggestions.push('No consensus target price available. Recommendation based on fundamentals only.');
  }

  // Calculate overall weighted score
  const overallScore = Math.round(
    (kpiCompleteness * 0.4) +
    (dataFreshness * 0.3) +
    (sourceReliability * 0.2) +
    (priceDataScore * 0.1)
  );

  return {
    overallScore,
    kpiCompleteness: Math.round(kpiCompleteness),
    dataFreshness: Math.round(dataFreshness),
    sourceReliability: Math.round(sourceReliability),
    breakdown: {
      kpisFound,
      kpisTotal,
      citationCount,
      hasCurrentPrice: !!currentPrice,
      hasTargetPrice: !!targetPrice,
      dataAgeDays: dataAge
    },
    warnings,
    suggestions
  };
}

export function getQualityBadgeColor(score: number): string {
  if (score >= 80) return 'text-green-500 bg-green-500/10 border-green-500/20';
  if (score >= 60) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
  return 'text-red-500 bg-red-500/10 border-red-500/20';
}

export function getQualityLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Moderate';
  if (score >= 50) return 'Fair';
  return 'Limited';
}


