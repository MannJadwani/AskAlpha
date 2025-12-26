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
    <div className={`${sidebarCollapsed ? 'lg:w-20' : 'lg:w-1/3'} w-full overflow-hidden transition-all duration-300`}>
      <div className="relative rounded-2xl border border-border bg-card shadow-xl overflow-hidden h-full">
        {/* Header */}
        <div className="relative z-10 border-b border-border bg-card/50 px-6 py-4">
            {!sidebarCollapsed && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a3 3 0 003 3h2a3 3 0 003-3V3a2 2 0 012 2v6h-1a1 1 0 100 2h1v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3h1a1 1 0 100-2H4V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    My Reports
                  </h2>
                  <p className="text-sm text-muted-foreground">
                        {savedReports.length} {savedReports.length === 1 ? 'report' : 'reports'}
                      </p>
                </div>
              </div>
              {savedReports.length > 0 && (
              <button
                onClick={onClearAllReports}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors"
                title="Clear all reports"
              >
                  Clear All
              </button>
            )}
          </div>
          )}
        </div>
        
        {/* Toggle button */}
        <button
          onClick={onToggleSidebar}
          className={`absolute ${sidebarCollapsed ? 'right-2' : 'right-[-12px]'} top-1/2 transform -translate-y-1/2 z-20 
            bg-card border border-border rounded-full p-2 shadow-md hover:bg-card/80 transition-all duration-300`}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        
        {/* Reports list */}
        {!sidebarCollapsed && (
          <div className="relative z-10 max-h-[calc(100vh-200px)] overflow-y-auto p-4">
            {savedReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Yet</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Generate your first report to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedReports.map((report) => (
                  <div 
                    key={report.id} 
                    className={`group/item relative p-4 cursor-pointer rounded-xl transition-all duration-200 border ${
                      selectedReport?.id === report.id 
                        ? 'bg-card border-ring shadow-md' 
                        : 'border-border hover:bg-card/50 hover:border-ring/50'
                      }`}
                    onClick={() => onSelectReport(report)}
                    onMouseEnter={() => setHoveredReport(report.id)}
                    onMouseLeave={() => setHoveredReport(null)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                            selectedReport?.id === report.id 
                          ? 'bg-primary' 
                          : 'bg-muted text-foreground'
                          }`}>
                            {report.companyName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-base mb-1 truncate ${
                              selectedReport?.id === report.id 
                            ? 'text-foreground' 
                            : 'text-foreground'
                            }`}>
                              {report.companyName}
                            </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                              {formatDate(report.timestamp)}
                            </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {report.sections ? `${report.sections.length} sections` : 'Text report'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportReport(report);
                          }}
                          className="w-7 h-7 rounded-lg border border-border hover:bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          title="Export"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteReport(report.id);
                          }}
                          className="w-7 h-7 rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
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
          <div className="relative z-10 flex flex-col items-center py-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {savedReports.map((report) => (
                <div 
                  key={report.id} 
                  className="group/avatar relative"
                title={report.companyName}
              >
                <div 
                  className={`w-12 h-12 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center font-semibold text-sm ${
                      selectedReport?.id === report.id 
                      ? 'bg-primary text-primary-foreground ring-2 ring-ring' 
                      : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => onSelectReport(report)}
                  >
                      {report.companyName.substring(0, 2).toUpperCase()}
                </div>
                {selectedReport?.id === report.id && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-card"></div>
            )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
