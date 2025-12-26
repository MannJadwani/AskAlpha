'use client';

import { useState, useEffect, useRef } from 'react';
import { useReports, Report } from '../../../context/ReportContext';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Loader2, ArrowLeft, FileText, Trash2, Download, Calendar, Search, Star, TrendingUp, Filter, CheckSquare, Square, FileDown, Command, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useKeyboardShortcuts, ShortcutsModal } from '@/components/KeyboardShortcuts';
import { exportToPDF, exportToExcel, exportToText } from '@/lib/exportUtils';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';
type SearchMode = 'name' | 'content';

export default function MyReports() {
  const { savedReports, deleteReport, isLoading, error, saveReport } = useReports();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('name');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [reportVersions, setReportVersions] = useState<Map<string, Report[]>>(new Map());
  const reportContentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts(() => {
    searchInputRef.current?.focus();
  });

  // Render markdown content when report is selected
  useEffect(() => {
    if (!selectedReport) {
      setRenderedContent('');
      return;
    }

    const renderContent = async () => {
      try {
        let content = '';
        
        // If report has sections, render them
        if (selectedReport.sections && selectedReport.sections.length > 0) {
          const sectionsHtml = await Promise.all(
            selectedReport.sections.map(async (section) => {
              const sectionContent = section.DetailedContent || section.InformationNeeded || '';
              if (sectionContent) {
                const html = await marked.parse(sectionContent);
                return `<div class="mb-8">
                  <h2 class="text-2xl font-bold text-foreground mb-4">${section.SectionName}</h2>
                  ${DOMPurify.sanitize(html)}
                </div>`;
              }
              return '';
            })
          );
          content = sectionsHtml.join('');
        } 
        // Otherwise use htmlContent
        else if (selectedReport.htmlContent) {
          const html = await marked.parse(selectedReport.htmlContent);
          content = DOMPurify.sanitize(html);
        }

        setRenderedContent(content);
      } catch (error) {
        console.error('Error rendering content:', error);
        setRenderedContent(selectedReport.htmlContent || '');
      }
    };

    renderContent();
  }, [selectedReport]);

  // Load favorites and versions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('reportFavorites');
    if (stored) {
      setFavorites(new Set(JSON.parse(stored)));
    }
    const storedVersions = localStorage.getItem('reportVersions');
    if (storedVersions) {
      setReportVersions(new Map(JSON.parse(storedVersions)));
    }
  }, []);

  // Save report version when report is updated
  useEffect(() => {
    if (!selectedReport) return;
    
    const versions = reportVersions.get(selectedReport.id) || [];
    const existingVersion = versions.find(v => v.timestamp === selectedReport.timestamp);
    
    if (!existingVersion && versions.length > 0) {
      // Add new version (keep last 10 versions)
      const newVersions = [selectedReport, ...versions].slice(0, 10);
      const updatedVersions = new Map(reportVersions);
      updatedVersions.set(selectedReport.id, newVersions);
      setReportVersions(updatedVersions);
      localStorage.setItem('reportVersions', JSON.stringify(Array.from(updatedVersions.entries())));
    } else if (versions.length === 0) {
      // First version
      const updatedVersions = new Map(reportVersions);
      updatedVersions.set(selectedReport.id, [selectedReport]);
      setReportVersions(updatedVersions);
      localStorage.setItem('reportVersions', JSON.stringify(Array.from(updatedVersions.entries())));
    }
  }, [selectedReport?.id, selectedReport?.timestamp]);

  // Save favorites to localStorage
  const toggleFavorite = (reportId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(reportId)) {
      newFavorites.delete(reportId);
    } else {
      newFavorites.add(reportId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('reportFavorites', JSON.stringify(Array.from(newFavorites)));
  };

  // Enhanced search - search in content
  const searchInContent = async (report: Report, query: string): Promise<boolean> => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    
    // Search in company name
    if (report.companyName.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in HTML content
    if (report.htmlContent && report.htmlContent.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in sections
    if (report.sections) {
      for (const section of report.sections) {
        if (section.SectionName?.toLowerCase().includes(lowerQuery)) return true;
        if (section.DetailedContent?.toLowerCase().includes(lowerQuery)) return true;
        if (section.InformationNeeded?.toLowerCase().includes(lowerQuery)) return true;
      }
    }
    
    return false;
  };

  // Filter and sort reports with enhanced search
  const [filteredAndSortedReports, setFilteredAndSortedReports] = useState<Report[]>([]);
  
  useEffect(() => {
    const filterReports = async () => {
      let filtered = savedReports;
      
      // Date range filter
      if (dateRange.start || dateRange.end) {
        filtered = filtered.filter((report) => {
          const reportDate = new Date(report.timestamp);
          if (dateRange.start) {
            const startDate = new Date(dateRange.start);
            if (reportDate < startDate) return false;
          }
          if (dateRange.end) {
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59, 999);
            if (reportDate > endDate) return false;
          }
          return true;
        });
      }
      
      // Search filter
      if (searchQuery) {
        if (searchMode === 'name') {
          filtered = filtered.filter((report) =>
            report.companyName.toLowerCase().includes(searchQuery.toLowerCase())
          );
        } else {
          // Search in content (async)
          const searchPromises = filtered.map(report => searchInContent(report, searchQuery));
          const searchResults = await Promise.all(searchPromises);
          filtered = filtered.filter((_, index) => searchResults[index]);
        }
      }
      
      // Sort
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return b.timestamp - a.timestamp;
          case 'oldest':
            return a.timestamp - b.timestamp;
          case 'name-asc':
            return a.companyName.localeCompare(b.companyName);
          case 'name-desc':
            return b.companyName.localeCompare(a.companyName);
          default:
            return 0;
        }
      });
      
      // Favorites first
      filtered.sort((a, b) => {
        const aIsFavorite = favorites.has(a.id);
        const bIsFavorite = favorites.has(b.id);
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return 0;
      });
      
      setFilteredAndSortedReports(filtered);
    };
    
    filterReports();
  }, [savedReports, searchQuery, searchMode, dateRange, sortBy, favorites]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleDelete = async (id: string) => {
    await deleteReport(id);
    setShowDeleteConfirm(null);
    if (selectedReport?.id === id) {
      setSelectedReport(null);
    }
  };

  const handleExport = async (report: Report, format: 'text' | 'pdf' | 'excel' = 'text') => {
    try {
      if (format === 'text') {
        const content = report.htmlContent || 
          (report.sections?.map(s => `${s.SectionName}\n\n${s.DetailedContent || s.InformationNeeded}`).join('\n\n') || '');
        exportToText(content, `${report.companyName}_report.txt`);
      } else if (format === 'pdf' && reportContentRef.current) {
        await exportToPDF(reportContentRef.current, `${report.companyName}_report.pdf`);
      } else if (format === 'excel') {
        const data = report.sections?.map(s => ({
          Section: s.SectionName,
          Content: s.DetailedContent || s.InformationNeeded || '',
        })) || [{ Section: 'Report', Content: report.htmlContent || '' }];
        exportToExcel(data, `${report.companyName}_report.xlsx`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const handleBulkExport = async (format: 'text' | 'excel') => {
    if (selectedReports.size === 0) return;
    
    try {
      const selected = savedReports.filter(r => selectedReports.has(r.id));
      
      if (format === 'excel') {
        const data = selected.flatMap(report => 
          (report.sections?.map(s => ({
            Company: report.companyName,
            Section: s.SectionName,
            Content: s.DetailedContent || s.InformationNeeded || '',
            Date: new Date(report.timestamp).toLocaleDateString(),
          })) || [{
            Company: report.companyName,
            Section: 'Report',
            Content: report.htmlContent || '',
            Date: new Date(report.timestamp).toLocaleDateString(),
          }])
        );
        exportToExcel(data, `bulk_reports_${new Date().getTime()}.xlsx`);
      } else {
        // Export as ZIP of text files (simplified - export individually)
        selected.forEach(report => {
          const content = report.htmlContent || 
            (report.sections?.map(s => `${s.SectionName}\n\n${s.DetailedContent || s.InformationNeeded}`).join('\n\n') || '');
          exportToText(content, `${report.companyName}_report.txt`);
        });
      }
      setSelectedReports(new Set());
    } catch (error) {
      console.error('Bulk export error:', error);
      alert('Failed to export reports. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedReports.size} report(s)? This action cannot be undone.`)) {
      for (const id of selectedReports) {
        await deleteReport(id);
      }
      setSelectedReports(new Set());
      if (selectedReport && selectedReports.has(selectedReport.id)) {
        setSelectedReport(null);
      }
    }
  };

  const toggleSelectReport = (reportId: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId);
    } else {
      newSelected.add(reportId);
    }
    setSelectedReports(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === filteredAndSortedReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredAndSortedReports.map(r => r.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="items-center justify-start w-full flex flex-col min-h-screen">
        <div className="mx-auto max-w-7xl px-6 py-12 w-full">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading your reports...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show report detail view
  if (selectedReport) {
    return (
      <div className="items-center justify-center w-full flex flex-col min-h-screen">
        <div className="mx-auto max-w-5xl px-6 py-12 w-full">
          {/* Header with back button */}
          <div className="mb-8 flex items-center justify-between no-print">
            <button
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-card transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Reports</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-card transition-colors"
                title="Print-friendly view"
              >
                <FileText className="h-4 w-4" />
                <span>Print</span>
              </button>
              <div className="relative group">
                <button
                  onClick={() => {
                    const menu = document.getElementById('export-menu');
                    menu?.classList.toggle('hidden');
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-card transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <div id="export-menu" className="hidden absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      handleExport(selectedReport, 'text');
                      document.getElementById('export-menu')?.classList.add('hidden');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-muted rounded-t-lg"
                  >
                    Export as Text
                  </button>
                  <button
                    onClick={() => {
                      handleExport(selectedReport, 'pdf');
                      document.getElementById('export-menu')?.classList.add('hidden');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-muted"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => {
                      handleExport(selectedReport, 'excel');
                      document.getElementById('export-menu')?.classList.add('hidden');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-muted rounded-b-lg"
                  >
                    Export as Excel
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(selectedReport.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Report Content */}
          <motion.div
            ref={reportContentRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-8 shadow-xl"
          >
            {/* Report Header */}
            <div className="mb-8 pb-6 border-b border-border">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                  {selectedReport.companyName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {selectedReport.companyName}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(selectedReport.timestamp)}</span>
                    </div>
                    {selectedReport.sections && (
                      <span className="px-2 py-1 rounded bg-muted">
                        {selectedReport.sections.length} sections
                      </span>
                    )}
                    {reportVersions.has(selectedReport.id) && reportVersions.get(selectedReport.id)!.length > 1 && (
                      <span className="px-2 py-1 rounded bg-muted">
                        {reportVersions.get(selectedReport.id)!.length} versions
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Version History */}
              {reportVersions.has(selectedReport.id) && reportVersions.get(selectedReport.id)!.length > 1 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View version history ({reportVersions.get(selectedReport.id)!.length} versions)
                    </summary>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {reportVersions.get(selectedReport.id)!.map((version, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedReport(version);
                            setRenderedContent(''); // Trigger re-render
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                            version.timestamp === selectedReport.timestamp
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          <div className="text-sm font-medium text-foreground">
                            Version {reportVersions.get(selectedReport.id)!.length - idx}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(version.timestamp)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Report Body */}
            {renderedContent ? (
              <div className="prose dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90">
                <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No content available for this report</p>
              </div>
            )}

            {/* Sources */}
            {selectedReport.sources && selectedReport.sources.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Sources</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedReport.sources.map((source, index) => (
                    <a
                      key={index}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline px-3 py-1 rounded bg-muted"
                    >
                      {new URL(source).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2">Delete Report?</h3>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete this report? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 rounded-lg border border-border hover:bg-card transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show reports list
  return (
    <div className="items-center justify-start w-full flex flex-col min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-12 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                My Reports
              </h1>
              <p className="text-muted-foreground">
                View and manage all your generated research reports
              </p>
            </div>
            {savedReports.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">{savedReports.length}</div>
                  <div className="text-sm text-muted-foreground">Total Reports</div>
                </div>
                {favorites.size > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground flex items-center gap-1 justify-end">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      {favorites.size}
                    </div>
                    <div className="text-sm text-muted-foreground">Favorites</div>
                  </div>
                )}
                {savedReports.length > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground flex items-center gap-1 justify-end">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {getRelativeTime(Math.max(...savedReports.map(r => r.timestamp)))}
                    </div>
                    <div className="text-sm text-muted-foreground">Last Generated</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search and Sort */}
          {savedReports.length > 0 && (
            <div className="space-y-4 mt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search reports... (Press ⌘K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-20 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                    <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">⌘K</kbd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSearchMode(searchMode === 'name' ? 'content' : 'name')}
                    className={`px-3 py-2 rounded-lg border border-border text-sm transition-colors ${
                      searchMode === 'name' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card hover:bg-muted'
                    }`}
                  >
                    {searchMode === 'name' ? 'Name' : 'Content'}
                  </button>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="pl-10 pr-8 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent appearance-none cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Date Range:</span>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground"
                />
                {(dateRange.start || dateRange.end) && (
                  <button
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="px-2 py-1 rounded hover:bg-muted"
                    title="Clear date filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Bulk Actions */}
              {selectedReports.size > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm text-foreground">
                    {selectedReports.size} selected
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <div className="relative group">
                      <button
                        onClick={() => {
                          const menu = document.getElementById('bulk-export-menu');
                          menu?.classList.toggle('hidden');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-card text-sm"
                      >
                        <FileDown className="h-4 w-4" />
                        Export
                      </button>
                      <div id="bulk-export-menu" className="hidden absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            handleBulkExport('text');
                            document.getElementById('bulk-export-menu')?.classList.add('hidden');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted rounded-t-lg text-sm"
                        >
                          Export as Text
                        </button>
                        <button
                          onClick={() => {
                            handleBulkExport('excel');
                            document.getElementById('bulk-export-menu')?.classList.add('hidden');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted rounded-b-lg text-sm"
                        >
                          Export as Excel
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-500 text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedReports(new Set())}
                      className="px-3 py-1.5 rounded-lg hover:bg-card text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {filteredAndSortedReports.length === 0 && savedReports.length > 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No reports found</h2>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : savedReports.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-xl">
            <div className="mx-auto w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-6">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              No Reports Yet
            </h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
              You haven't generated any reports yet. Create your first research report to see it here.
            </p>
            <a
              href="/report-gen"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Generate Your First Report
            </a>
          </div>
        ) : (
          <>
            {/* Select All */}
            {savedReports.length > 0 && (
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-card transition-colors text-sm"
                >
                  {selectedReports.size === filteredAndSortedReports.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  <span>Select All</span>
                </button>
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-card transition-colors text-sm ml-auto"
                  title="Keyboard Shortcuts"
                >
                  <Command className="h-4 w-4" />
                  <span className="hidden sm:inline">Shortcuts</span>
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => !selectedReports.size && setSelectedReport(report)}
                  className={`relative rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg group ${
                    selectedReports.size ? 'cursor-default' : 'cursor-pointer hover:border-ring'
                  } ${selectedReports.has(report.id) ? 'ring-2 ring-primary' : ''}`}
                >
                  {/* Checkbox for bulk selection */}
                  {selectedReports.size > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectReport(report.id);
                      }}
                      className="absolute top-4 left-4 z-10"
                    >
                      {selectedReports.has(report.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  )}
                <div className={`flex items-start gap-4 mb-4 ${selectedReports.size > 0 ? 'pl-10' : ''}`}>
                  <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                    {report.companyName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                        {report.companyName}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(report.id);
                        }}
                        className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
                        title={favorites.has(report.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star
                          className={`h-4 w-4 transition-colors ${
                            favorites.has(report.id)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground hover:text-yellow-400'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{getRelativeTime(report.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {report.sections ? (
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        {report.sections.length} sections
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                        Text report
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative group/export">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const menu = document.getElementById(`export-menu-${report.id}`);
                          menu?.classList.toggle('hidden');
                        }}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        title="Export"
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <div
                        id={`export-menu-${report.id}`}
                        className="hidden absolute right-0 bottom-full mb-2 w-40 bg-card border border-border rounded-lg shadow-lg z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            handleExport(report, 'text');
                            document.getElementById(`export-menu-${report.id}`)?.classList.add('hidden');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted rounded-t-lg text-sm"
                        >
                          Text
                        </button>
                        <button
                          onClick={() => {
                            handleExport(report, 'excel');
                            document.getElementById(`export-menu-${report.id}`)?.classList.add('hidden');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted rounded-b-lg text-sm"
                        >
                          Excel
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(report.id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
              ))}
          </div>
          </>
        )}

        {/* Keyboard Shortcuts Modal */}
        <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">Delete Report?</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete this report? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
