import { useState, useMemo } from 'react';
import { Report } from '../../../../context/ReportContext';

export function useReportFiltering(savedReports: Report[]) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'sections'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered and sorted reports
  const filteredReports = useMemo(() => {
    let filtered = savedReports;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(report => 
        report.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(report => {
        if (!report.sections) return filterBy === 'complete';
        const hasDetails = report.sections.some(s => s.DetailedContent);
        return filterBy === 'complete' ? hasDetails : !hasDetails;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'company':
          return a.companyName.localeCompare(b.companyName);
        case 'sections':
          return (b.sections?.length || 0) - (a.sections?.length || 0);
        case 'date':
        default:
          return b.timestamp - a.timestamp;
      }
    });

    return filtered;
  }, [savedReports, searchQuery, filterBy, sortBy]);

  return {
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    filterBy,
    setFilterBy,
    searchQuery,
    setSearchQuery,
    filteredReports
  };
}
