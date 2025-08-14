import { ShinyButton } from '@/components/magicui/shiny-button';
import { useState } from 'react';
import { Report } from '../../../../context/ReportContext';
import { downloadReportAsText } from '../../../../lib/exportReport';

interface ReportDetailViewProps {
  selectedReport: Report | null;
  sidebarCollapsed: boolean;
  generatingAllDetails: boolean;
  generatingAllProgress: number;
  formatDate: (timestamp: number) => string;
  generateAllDetails: () => Promise<number | undefined>;
  generateSectionDetails: (sectionIndex: number) => Promise<boolean | undefined>;
  onFullScreen: () => void;
}

export default function ReportDetailView({
  selectedReport,
  sidebarCollapsed,
  generatingAllDetails,
  generatingAllProgress,
  formatDate,
  generateAllDetails,
  generateSectionDetails,
  onFullScreen
}: ReportDetailViewProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  
  const handleExportReport = (report: Report) => {
    downloadReportAsText(report);
  };

  if (!selectedReport) {
    return (
      <div className="bg-gradient-to-br from-white/95 via-slate-50/90 to-white/80 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-slate-700/40 p-16 text-center h-full flex flex-col items-center justify-center group hover:shadow-2xl transition-all duration-700 w-full">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-indigo-500/3 dark:from-blue-400/2 dark:via-purple-400/2 dark:to-indigo-400/2 rounded-3xl"></div>
        </div>
        
        {/* Icon with enhanced design */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center mb-8 shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent"></div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-xl"></div>
        </div>
        
        {/* Enhanced typography */}
        <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-200 bg-clip-text text-transparent mb-4 tracking-tight">
          Select a Report
        </h3>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
          Choose a report from the sidebar to view its detailed analysis, insights, and comprehensive data
        </p>
        
        {/* Subtle animation indicator */}
        <div className="mt-8 flex items-center space-x-2 opacity-50">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).origin;
      return `${domain}/favicon.ico`;
    } catch {
      return null;
    }
  };

  return (
    <div className={`w-full ${sidebarCollapsed ? 'lg:w-[calc(100%-4rem)]' : 'lg:w-3/4'} overflow-hidden transition-all duration-700 ease-out`}>
      <div className="flex flex-col h-full bg-gradient-to-br from-white/95 via-slate-50/90 to-white/80 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/80 backdrop-blur-xl shadow-xl rounded-3xl border border-white/40 dark:border-slate-700/40 group hover:shadow-2xl transition-all duration-500">
        
        {/* Enhanced background animation */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-indigo-500/3 dark:from-blue-400/2 dark:via-purple-400/2 dark:to-indigo-400/2"></div>
        </div>
        
        {/* Premium Header Design */}
        <div className="relative z-10 border-b border-white/30 dark:border-slate-700/30 bg-gradient-to-r from-white/50 via-slate-50/30 to-white/50 dark:from-slate-800/50 dark:via-slate-700/30 dark:to-slate-800/50 backdrop-blur-sm px-8 py-6 flex items-center justify-between sticky top-0 rounded-t-3xl">
          {/* Header content with enhanced design */}
          <div className="flex items-center space-x-6">
            {/* Company avatar with advanced styling */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-xl transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-500">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="text-white font-bold text-xl relative z-10">
                {selectedReport.companyName.substring(0, 2).toUpperCase()}
              </span>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-lg"></div>
            </div>
            
            {/* Company info with premium typography */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-200 bg-clip-text text-transparent tracking-tight">
                {selectedReport.companyName}
              </h1>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse"></div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Generated {formatDate(selectedReport.timestamp)}
                  </p>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  {selectedReport.sections ? 'Structured Report' : 'Text Report'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Enhanced action buttons */}
          <div className="flex items-center gap-3">
            <ShinyButton onClick={() => handleExportReport(selectedReport)} title="Export as Text" className="!bg-white/5 !text-zinc-200 !ring-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-xl"></div>
              <div className="absolute inset-0 bg-emerald-500/10 group-hover/btn:bg-transparent transition-colors duration-500 rounded-xl"></div>
              <span className="relative z-10 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Export</span>
              </span>
            </ShinyButton>
            
            {selectedReport.sections && !generatingAllDetails && (
              <ShinyButton onClick={generateAllDetails} className="!bg-white/5 !text-zinc-200 !ring-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-xl"></div>
                <div className="absolute inset-0 bg-blue-500/10 group-hover/btn:bg-transparent transition-colors duration-500 rounded-xl"></div>
                <span className="relative z-10 flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/btn:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Generate All</span>
                </span>
              </ShinyButton>
            )}
            
            <ShinyButton onClick={onFullScreen} title="View Full Screen" className="!bg-white/5 !text-zinc-200 !ring-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-xl"></div>
              <div className="absolute inset-0 bg-purple-500/10 group-hover/btn:bg-transparent transition-colors duration-500 rounded-xl"></div>
              <span className="relative z-10 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Full Screen</span>
              </span>
            </ShinyButton>
          </div>
        </div>

        {/* Enhanced progress bar for generating all details */}
        {generatingAllDetails && (
          <div className="relative z-10 px-8 py-6 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-blue-900/20 dark:via-indigo-900/15 dark:to-blue-900/20 border-b border-blue-100/60 dark:border-blue-900/40 backdrop-blur-sm sticky top-[88px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-blue-800 dark:text-blue-200 text-lg">Generating All Details</span>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Processing sections with AI analysis...</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{generatingAllProgress}%</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">Complete</div>
              </div>
            </div>
            <div className="relative w-full bg-blue-200/50 dark:bg-blue-800/30 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg relative overflow-hidden" 
                style={{ width: `${generatingAllProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Premium Sources Display */}
        {selectedReport.sources && selectedReport.sources.length > 0 && (
          <div className="relative px-8 py-6 bg-gradient-to-r from-emerald-50/60 via-emerald-50/40 to-emerald-50/60 dark:from-emerald-900/15 dark:via-emerald-900/10 dark:to-emerald-900/15 border-b border-emerald-100/40 dark:border-emerald-900/30 backdrop-blur-sm">
            
            <div className="relative z-10">
              {/* Collapsible Header */}
              <button
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="w-full flex items-center gap-4 mb-4 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 rounded-xl p-3 transition-all duration-300 group/toggle"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-md transform group-hover/toggle:scale-105 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-lg font-bold bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 dark:from-emerald-200 dark:via-emerald-100 dark:to-emerald-200 bg-clip-text text-transparent">
                    Research Sources
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    {selectedReport.sources?.length || 0} verified source{(selectedReport.sources?.length || 0) !== 1 ? 's' : ''} analyzed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${sourcesExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              
              {/* Collapsible Content */}
              <div className={`transition-all duration-500 overflow-hidden ${sourcesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {selectedReport.sources?.map((source, index) => {
                    const domain = getDomainFromUrl(source);
                    const faviconUrl = getFaviconUrl(source);
                    
                    return (
                      <a
                        key={index}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative bg-gradient-to-br from-white/80 via-slate-50/60 to-white/60 dark:from-slate-800/80 dark:via-slate-700/60 dark:to-slate-800/70 border border-emerald-200/50 dark:border-emerald-700/40 rounded-xl p-4 hover:border-emerald-300/70 dark:hover:border-emerald-600/60 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
                      >
                        {/* Reduced card background animation */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/3 via-emerald-600/3 to-emerald-500/3"></div>
                        </div>
                        
                        <div className="relative z-10 flex items-start gap-3">
                          <div className="flex-shrink-0 relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100 dark:from-emerald-800 dark:via-emerald-700 dark:to-emerald-800 rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-emerald-200/40 dark:border-emerald-600/40 group-hover:scale-105 transition-transform duration-200">
                              {faviconUrl ? (
                                <>
                                  <img
                                    src={faviconUrl}
                                    alt={`${domain} favicon`}
                                    className="w-5 h-5 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                  <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded text-white text-xs font-bold items-center justify-center hidden">
                                    {domain.charAt(0).toUpperCase()}
                                  </div>
                                </>
                              ) : (
                                <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded text-white text-xs font-bold flex items-center justify-center">
                                  {domain.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-200">
                              {domain}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                              Source {index + 1} of {selectedReport.sources?.length || 0}
                            </p>
                            <div className="mt-1.5 w-6 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full group-hover:w-8 transition-all duration-200"></div>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-105">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  }) || []}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Report Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {selectedReport.sections ? (
            <div className="space-y-8">
              {selectedReport.sections.map((section, index) => (
                <div 
                  key={index} 
                  className="group/section relative bg-gradient-to-br from-white/90 via-slate-50/80 to-white/70 dark:from-slate-800/90 dark:via-slate-700/70 dark:to-slate-800/80 rounded-3xl border border-slate-200/60 dark:border-slate-600/50 shadow-lg hover:shadow-2xl transition-all duration-500 p-8 hover:scale-[1.01] hover:-translate-y-1 backdrop-blur-sm"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'slideInUp 0.8s ease-out forwards'
                  }}
                >
                  {/* Section background animation */}
                  <div className="absolute inset-0 opacity-0 group-hover/section:opacity-100 transition-opacity duration-700 rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-indigo-500/3 dark:from-blue-400/2 dark:via-purple-400/2 dark:to-indigo-400/2"></div>
                  </div>
                  
                  <div className="relative z-10 flex items-start justify-between mb-8">
                    <div className="flex-1 space-y-4">
                      {/* Section header with enhanced design */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg transform group-hover/section:scale-110 group-hover/section:rotate-3 transition-all duration-500">
                          <span className="text-white font-bold text-lg">{index + 1}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-200 bg-clip-text text-transparent leading-tight tracking-tight">
                            {section.SectionName}
                          </h3>
                          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Section description with better typography */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-600/40">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg font-medium">
                          {section.InformationNeeded}
                        </p>
                      </div>
                    </div>
                    
                    {/* Enhanced action button */}
                    {!section.DetailedContent && !section.isGeneratingDetails && (
                      <div className="ml-6 flex-shrink-0">
                        <ShinyButton onClick={() => generateSectionDetails(index)} className="!bg-white/5 !text-zinc-200 !ring-white/10">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-2xl"></div>
                          <div className="absolute inset-0 bg-blue-500/10 group-hover/btn:bg-transparent transition-colors duration-500 rounded-2xl"></div>
                          <span className="relative z-10 flex items-center space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover/btn:rotate-12 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            <span>Generate Details</span>
                          </span>
                        </ShinyButton>
                      </div>
                    )}
                  </div>

                  {/* Enhanced loading state */}
                  {section.isGeneratingDetails && (
                    <div className="relative border-t border-slate-200/60 dark:border-slate-700/50 pt-8 mt-8">
                      <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <div className="text-center space-y-2">
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                              Generating section details...
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              AI is analyzing and creating comprehensive insights
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced error state */}
                  {section.detailsError && (
                    <div className="border-t border-slate-200/60 dark:border-slate-700/50 pt-8 mt-8">
                      <div className="bg-gradient-to-r from-red-50 via-red-50/80 to-red-50 dark:from-red-900/20 dark:via-red-900/15 dark:to-red-900/20 border border-red-200/60 dark:border-red-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shadow-md">
                            <svg className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">Error Generating Content</h4>
                            <span className="text-red-700 dark:text-red-300 text-sm">{section.detailsError}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced content display */}
                  {section.parsedContent && (
                    <div className="border-t border-slate-200/60 dark:border-slate-700/50 pt-8 mt-8">
                      <div className="bg-gradient-to-br from-white/60 via-slate-50/40 to-white/60 dark:from-slate-800/60 dark:via-slate-700/40 dark:to-slate-800/60 rounded-2xl p-8 border border-slate-200/50 dark:border-slate-600/40 backdrop-blur-sm">
                        <div 
                          className="prose dark:prose-invert max-w-none prose-headings:bg-gradient-to-r prose-headings:from-slate-900 prose-headings:via-slate-700 prose-headings:to-slate-800 dark:prose-headings:from-white dark:prose-headings:via-slate-100 dark:prose-headings:to-slate-200 prose-headings:bg-clip-text prose-headings:text-transparent prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-700 dark:prose-li:text-slate-300"
                          dangerouslySetInnerHTML={{ __html: section.parsedContent }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : selectedReport.htmlContent ? (
            <div className="bg-gradient-to-br from-white/90 via-slate-50/80 to-white/70 dark:from-slate-800/90 dark:via-slate-700/70 dark:to-slate-800/80 rounded-3xl border border-slate-200/60 dark:border-slate-600/50 shadow-xl p-8 backdrop-blur-sm">
              <div 
                className="prose dark:prose-invert max-w-none prose-headings:bg-gradient-to-r prose-headings:from-slate-900 prose-headings:via-slate-700 prose-headings:to-slate-800 dark:prose-headings:from-white dark:prose-headings:via-slate-100 dark:prose-headings:to-slate-200 prose-headings:bg-clip-text prose-headings:text-transparent prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-700 dark:prose-li:text-slate-300"
                dangerouslySetInnerHTML={{ __html: selectedReport.htmlContent }}
              />
              <div className="mt-12 pt-8 border-t border-slate-200/60 dark:border-slate-700/50">
                <ShinyButton onClick={onFullScreen} className="!bg-white/5 !text-zinc-200 !ring-white/10">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left rounded-2xl"></div>
                  <div className="absolute inset-0 bg-blue-500/10 group-hover/btn:bg-transparent transition-colors duration-500 rounded-2xl"></div>
                  <span className="relative z-10 flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover/btn:scale-110 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>View Full Report</span>
                  </span>
                </ShinyButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center mb-6 mx-auto shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-slate-600 dark:text-slate-400">No content available for this report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
