import { Report } from '../../../../context/ReportContext';
import { downloadReportAsText } from '../../../../lib/exportReport';
import { useState } from 'react';

interface ReportsSidebarProps {
  savedReports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report) => void;
  onDeleteReport: (id: string) => void;
  onClearAllReports: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  formatDate: (timestamp: number) => string;
}

export default function ReportsSidebar({
  savedReports,
  selectedReport,
  onSelectReport,
  onDeleteReport,
  onClearAllReports,
  sidebarCollapsed,
  onToggleSidebar,
  formatDate
}: ReportsSidebarProps) {
  const [hoveredReport, setHoveredReport] = useState<string | null>(null);
  
  const handleExportReport = (report: Report) => {
    downloadReportAsText(report);
  };

  return (
    <div className={`${sidebarCollapsed ? 'lg:w-20' : 'lg:w-1/3'} w-full overflow-hidden transition-all duration-700 ease-out transform`}>
      <div className="relative bg-gradient-to-br from-white/95 via-slate-50/90 to-white/80 dark:from-slate-900/95 dark:via-slate-800/90 dark:to-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg dark:shadow-xl border border-white/40 dark:border-slate-700/40 overflow-hidden h-full group hover:shadow-xl transition-all duration-500">
        
        {/* Subtle animated background gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-pink-500/3 dark:from-blue-400/2 dark:via-purple-400/2 dark:to-pink-400/2"></div>
        </div>

        {/* Header with refined glassmorphism */}
        <div className="relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/4 via-purple-600/4 to-pink-600/4 dark:from-blue-400/2 dark:via-purple-400/2 dark:to-pink-400/2"></div>
          <div className="relative flex items-center justify-between px-6 py-6 border-b border-white/30 dark:border-slate-700/30 backdrop-blur-sm">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 shadow-md flex items-center justify-center transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-300 ease-out">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white relative z-10" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a3 3 0 003 3h2a3 3 0 003-3V3a2 2 0 012 2v6h-1a1 1 0 100 2h1v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3h1a1 1 0 100-2H4V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:via-slate-100 dark:to-slate-200 bg-clip-text text-transparent tracking-tight">
                    My Reports
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 animate-pulse"></div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {savedReports.length} {savedReports.length === 1 ? 'report' : 'reports'}
                      </p>
                    </div>
                    {savedReports.length > 0 && (
                      <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      Active
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!sidebarCollapsed && savedReports.length > 0 && (
              <button
                onClick={onClearAllReports}
                className="group/btn relative px-4 py-2 text-xs font-semibold text-red-400 hover:text-white transition-all duration-300 rounded-lg overflow-hidden border border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-600/20 backdrop-blur-sm"
                title="Clear all reports"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V7z" clipRule="evenodd" />
                  </svg>
                  <span>Clear All</span>
                </span>
              </button>
            )}
          </div>
        </div>
        
        {/* Refined toggle button */}
        <button
          onClick={onToggleSidebar}
          className={`absolute ${sidebarCollapsed ? 'right-2' : 'right-[-16px]'} top-1/2 transform -translate-y-1/2 z-20 
            bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full p-2.5 shadow-md
            border-3 border-white dark:border-slate-900 transition-all duration-300 ease-out
            hover:scale-105 hover:shadow-lg hover:rotate-180 group/toggle`}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent"></div>
          {sidebarCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover/toggle:scale-105" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10 transition-transform duration-300 group-hover/toggle:scale-105" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        
        {/* Reports list with enhanced styling */}
        {!sidebarCollapsed && (
          <div className="relative z-10 max-h-[100vh] overflow-y-auto custom-scrollbar">
            {savedReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">No Reports Yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                  Create your first financial report to see it appear here with beautiful analytics and insights.
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {savedReports.map((report, index) => (
                  <div 
                    key={report.id} 
                    className={`group/item relative p-5 cursor-pointer rounded-xl transition-all duration-300 ease-out transform hover:scale-[1.01] border border-transparent
                      ${selectedReport?.id === report.id 
                        ? 'bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50/60 dark:from-blue-950/60 dark:via-blue-900/40 dark:to-indigo-950/40 border-blue-200/60 dark:border-blue-800/60 shadow-md' 
                        : 'hover:bg-gradient-to-br hover:from-white/80 hover:via-slate-50/60 hover:to-white/40 dark:hover:from-slate-800/60 dark:hover:via-slate-700/40 dark:hover:to-slate-800/20 hover:border-slate-200/50 dark:hover:border-slate-600/30 hover:shadow-md'
                      }`}
                    onClick={() => onSelectReport(report)}
                    onMouseEnter={() => setHoveredReport(report.id)}
                    onMouseLeave={() => setHoveredReport(null)}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'slideInUp 0.6s ease-out forwards'
                    }}
                  >
                    {/* Selected indicator */}
                    {selectedReport?.id === report.id && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full"></div>
                    )}
                    
                    {/* Subtle hover effect */}
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/3 via-purple-500/3 to-indigo-500/3 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 ${selectedReport?.id === report.id ? 'opacity-20' : ''}`}></div>
                    
                    <div className="relative z-10 flex justify-between items-start space-x-4">
                      <div className="flex-1 min-w-0">
                        {/* Company avatar */}
                        <div className="flex items-start space-x-4 mb-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md transition-all duration-300 ${
                            selectedReport?.id === report.id 
                              ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 scale-105' 
                              : 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 group-hover/item:from-blue-400 group-hover/item:via-blue-500 group-hover/item:to-indigo-600 group-hover/item:scale-105'
                          }`}>
                            {report.companyName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-lg leading-tight mb-1 transition-colors duration-300 ${
                              selectedReport?.id === report.id 
                                ? 'text-blue-800 dark:text-blue-300' 
                                : 'text-slate-900 dark:text-white group-hover/item:text-blue-700 dark:group-hover/item:text-blue-400'
                            }`}>
                              {report.companyName}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                              {formatDate(report.timestamp)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Report details */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-green-500"></div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                              {report.sections ? `${report.sections.length} sections` : 'Text report'}
                            </p>
                          </div>
                          
                          {/* Report type indicator */}
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
                              report.sections 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {report.sections ? 'Structured' : 'Text'}
                            </div>
                            {hoveredReport === report.id && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 animate-fade-in">
                                Click to view →
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex flex-col space-y-2 opacity-0 group-hover/item:opacity-100 transition-all duration-300 transform translate-x-2 group-hover/item:translate-x-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportReport(report);
                          }}
                          className="group/export w-9 h-9 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 flex items-center justify-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all duration-300 hover:scale-105"
                          title="Export as Text"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/export:scale-105 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteReport(report.id);
                          }}
                          className="group/delete w-9 h-9 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-300 hover:scale-105"
                          title="Delete Report"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/delete:scale-105 group-hover/delete:rotate-6 transition-all duration-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v6a1 1 0 11-2 0V7zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V7z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Collapsed sidebar view */}
        {sidebarCollapsed && (
          <div className="relative z-10 flex flex-col items-center py-8 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {savedReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            ) : (
              savedReports.map((report, index) => (
                <div 
                  key={report.id} 
                  className="group/avatar relative"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInScale 0.6s ease-out forwards'
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-xl border border-slate-700 dark:border-slate-300">
                      {report.companyName}
                      <div className="text-xs opacity-75 mt-1">
                        {formatDate(report.timestamp)}
                      </div>
                      {/* Arrow */}
                      <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100"></div>
                    </div>
                  </div>
                  
                  {/* Avatar */}
                  <div 
                    className={`w-12 h-12 rounded-xl cursor-pointer transition-all duration-300 ease-out transform group-hover/avatar:scale-105 shadow-md flex items-center justify-center font-bold text-lg relative overflow-hidden ${
                      selectedReport?.id === report.id 
                        ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white scale-105 ring-2 ring-blue-200/50 dark:ring-blue-800/50' 
                        : 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 dark:from-slate-600 dark:via-slate-700 dark:to-slate-800 text-white hover:from-blue-400 hover:via-blue-500 hover:to-indigo-600'
                    }`}
                    onClick={() => onSelectReport(report)}
                    title={report.companyName}
                  >
                    {/* Background animation */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Company initials */}
                    <span className="relative z-10 transform group-hover/avatar:scale-105 transition-transform duration-300">
                      {report.companyName.substring(0, 2).toUpperCase()}
                    </span>
                    
                    {/* Selection indicator */}
                    {selectedReport?.id === report.id && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
