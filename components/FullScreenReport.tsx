import { Report } from '../context/ReportContext';
import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface FullScreenReportProps {
  report: Report;
  onClose: () => void;
}

export default function FullScreenReport({ report, onClose }: FullScreenReportProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    
    // Prevent scrolling of the background
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  // Handle clicking outside the content to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current === e.target) {
      onClose();
    }
  };
  
  // Render the appropriate content based on the report type
  const renderReportContent = () => {
    if (report.sections) {
      return (
        <div className="max-w-5xl mx-auto divide-y divide-slate-200 dark:divide-slate-700">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            {report.companyName} - Equity Research Report
          </h1>
          
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Generated on {new Date(report.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          {/* Sources Display - Perplexity Style */}
          {report.sources && report.sources.length > 0 && (
            <div className="mb-8 px-6 py-6 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Sources</h4>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.sources.map((source, index) => {
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
                  
                  const domain = getDomainFromUrl(source);
                  const faviconUrl = getFaviconUrl(source);
                  
                  return (
                    <a
                      key={index}
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 relative">
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                            {faviconUrl ? (
                              <>
                                <img
                                  src={faviconUrl}
                                  alt={`${domain} favicon`}
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <div className="w-4 h-4 bg-gradient-to-br from-slate-400 to-slate-600 rounded text-white text-xs font-semibold items-center justify-center hidden">
                                  {domain.charAt(0).toUpperCase()}
                                </div>
                              </>
                            ) : (
                              <div className="w-4 h-4 bg-gradient-to-br from-slate-400 to-slate-600 rounded text-white text-xs font-semibold flex items-center justify-center">
                                {domain.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-semibold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-white mb-1 truncate">
                            {domain}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {source.length > 60 ? `${source.substring(0, 60)}...` : source}
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 dark:text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {report.sections.map((section, index) => (
            <div key={index} className="py-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {section.SectionName}
              </h2>
              
              {/* Section key points */}
              <div className="grid gap-2 mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Key Points</h3>
                {section.InformationNeeded.split(',').map((point, pointIndex) => (
                  <div key={pointIndex} className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3 mt-0.5">•</span>
                    <p className="text-slate-700 dark:text-slate-300">{point.trim()}</p>
                  </div>
                ))}
              </div>
              
              {/* Detailed content if available */}
              {section.DetailedContent && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Detailed Analysis</h3>
                  <div className="prose prose-slate dark:prose-invert max-w-none w-full prose-headings:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:font-semibold prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-600 dark:prose-li:text-slate-300">
                    <div dangerouslySetInnerHTML={{ __html: section.parsedContent || DOMPurify.sanitize(marked.parse(section.DetailedContent, { async: false }) as string) }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } else if (report.htmlContent) {
      // For reports with just HTML content
      const parsedHtml = DOMPurify.sanitize(marked.parse(report.htmlContent, { async: false }) as string);
      
      return (
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            {report.companyName} - Equity Research Report
          </h1>
          
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Generated on {new Date(report.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none w-full prose-headings:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:font-semibold prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-600 dark:prose-li:text-slate-300">
            <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center p-8">
          <p className="text-slate-700 dark:text-slate-300">No content available for this report.</p>
        </div>
      );
    }
  };

  // Add a print handler function
  const handlePrint = () => {
    window.print();
  };

  // Add a dedicated PDF export function
  const handleExportToPDF = () => {
    // Set the document title to include the company name for better PDF filename
    const originalTitle = document.title;
    document.title = `${report.companyName} - Equity Research Report`;
    
    // Apply specialized PDF settings
    const style = document.createElement('style');
    style.innerHTML = `
      @page {
        margin: 1cm;
        size: A4;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Trigger print dialog with PDF settings
    window.print();
    
    // Cleanup
    document.head.removeChild(style);
    document.title = originalTitle;
  };

  // Add some print-specific CSS
  useEffect(() => {
    // Add print styles
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #full-screen-report-content, #full-screen-report-content * {
          visibility: visible;
        }
        #full-screen-report-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center overflow-hidden"
      onClick={handleBackdropClick}
    >
      <div 
        ref={contentRef} 
        id="full-screen-report-content"
        className="bg-white dark:bg-slate-900 w-full h-full overflow-auto p-8 md:p-12"
      >
        <div className="fixed top-6 right-6 flex gap-2 no-print">
          <button
            onClick={handleExportToPDF}
            className="p-2 rounded-full bg-red-600/50 hover:bg-red-600 text-white transition-colors"
            aria-label="Export as PDF"
            title="Export as PDF"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7v0a3 3 0 116 0v0" />
            </svg>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 rounded-full bg-green-600/50 hover:bg-green-600 text-white transition-colors"
            aria-label="Print report"
            title="Print report"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 text-white transition-colors"
            aria-label="Close full screen view"
            title="Close full screen view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mt-6">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
} 