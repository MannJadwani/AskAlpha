import { useMemo } from 'react';
import { Report } from '../../../../context/ReportContext';

export function useReportAnalytics(savedReports: Report[]) {
  return useMemo(() => {
    const totalReports = savedReports.length;
    const totalSections = savedReports.reduce((acc, report) => acc + (report.sections?.length || 0), 0);
    const completedSections = savedReports.reduce((acc, report) => 
      acc + (report.sections?.filter(s => s.DetailedContent).length || 0), 0);
    const totalSources = savedReports.reduce((acc, report) => 
      acc + (report.sources?.length || 0) + (report.sections?.reduce((sAcc, section) => 
        sAcc + (section.sources?.length || 0), 0) || 0), 0);
    
    const recentActivity = savedReports.filter(report => 
      Date.now() - report.timestamp < 7 * 24 * 60 * 60 * 1000).length;
    
    const companiesCovered = new Set(savedReports.map(r => r.companyName.toLowerCase())).size;
    
    return {
      totalReports,
      totalSections,
      completedSections,
      totalSources,
      recentActivity,
      companiesCovered,
      completionRate: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0
    };
  }, [savedReports]);
}
