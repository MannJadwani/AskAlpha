import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface Section {
  SectionName: string;
  InformationNeeded: string;
  DetailedContent?: string;
  isGeneratingDetails?: boolean;
  detailsError?: string;
  parsedContent?: string;
  isSelected: boolean;
}

interface ReportViewerProps {
  plan: {
    type: 'plan';
    sections: Section[];
    companyName: string;
    title: string;
  };
  report: {
    type: 'report';
    content: string;
    title: string;
  } | null;
  title: string;
  activeTab: 'plan' | 'report';
  onTabChange: (tab: 'plan' | 'report') => void;
  onGenerateDetails?: (index: number) => void;
  onSectionSelect?: (index: number, isSelected: boolean) => void;
  onAddSection?: () => void;
  onGenerateReport?: () => void;
  generatingAllDetails?: boolean;
  generatingAllProgress?: number;
}

export default function ReportViewer({
  plan,
  report,
  title,
  activeTab,
  onTabChange,
  onGenerateDetails,
  onSectionSelect,
  onAddSection,
  onGenerateReport,
  generatingAllDetails = false,
  generatingAllProgress = 0
}: ReportViewerProps) {
  const hasSelectedSections = plan.sections?.some(section => section.isSelected);
  const selectedSectionsCount = plan.sections?.filter(section => section.isSelected).length || 0;

  const markdownComponents: Components = {
    code({className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;
      return isInline ? (
        <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200" {...props}>
          {children}
        </code>
      ) : (
        <div className="relative group">
          <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-200 hover:bg-slate-700"
              onClick={() => navigator.clipboard.writeText(String(children))}
            >
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            language={match[1]}
            style={vscDarkPlus as any}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              padding: '1.5rem',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    },
    table({children, ...props}) {
      return (
        <div className="my-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" {...props}>
            {children}
          </table>
        </div>
      );
    },
    thead({children, ...props}) {
      return (
        <thead className="bg-slate-50 dark:bg-slate-800/50" {...props}>
          {children}
        </thead>
      );
    },
    th({children, ...props}) {
      return (
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
          {...props}
        >
          {children}
        </th>
      );
    },
    td({children, ...props}) {
      return (
        <td 
          className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200"
          {...props}
        >
          {children}
        </td>
      );
    },
    blockquote({children, ...props}) {
      return (
        <blockquote 
          className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 my-4 italic text-slate-700 dark:text-slate-300"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    a({children, href, ...props}) {
      return (
        <a 
          href={href}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    }
  };

  return (
    <div className="h-full flex flex-col rounded-xl bg-white dark:bg-slate-800/50 border border-primary/10 dark:border-primary/20 shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-primary/10 dark:border-primary/20 bg-gradient-to-r from-primary-50/50 to-secondary-50/50 dark:from-primary/5 dark:to-secondary/5">
        <button
          onClick={() => onTabChange('plan')}
          className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === 'plan'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-white/50 dark:bg-white/5'
              : 'text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          Analysis Plan
        </button>
        <button
          onClick={() => onTabChange('report')}
          className={`px-4 py-3 text-sm font-medium transition-all duration-200 ${
            activeTab === 'report'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-white/50 dark:bg-white/5'
              : 'text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/50 dark:hover:bg-white/5'
          }`}
        >
          Report
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text ">
                {plan.title}
              </h2>
              {onAddSection && (
                <button
                  onClick={onAddSection}
                  className="rounded-lg bg-primary-50 dark:bg-primary/10 px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary/20 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                >
                  Add Section
                </button>
              )}
            </div>

            <div className="space-y-4">
              {plan.sections?.map((section, index) => (
                <motion.div
                  key={section.SectionName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl border border-primary/10 dark:border-primary/20 p-4 bg-white dark:bg-slate-800/50 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={section.isSelected}
                        onChange={(e) => onSectionSelect?.(index, e.target.checked)}
                        className="h-4 w-4 rounded border-primary/30 text-primary-600 focus:ring-primary-500 dark:border-primary/20 dark:bg-slate-700/50"
                      />
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text ">
                          {section.SectionName}
                        </h3>
                        {section.DetailedContent && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            ✓ Generated
                          </span>
                                                 )}
                         
                         {/* Completion Status */}
                         {plan.sections.filter(s => s.isSelected).length > 0 && 
                          plan.sections.filter(s => s.isSelected && s.DetailedContent).length === plan.sections.filter(s => s.isSelected).length && 
                          !generatingAllDetails && (
                           <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                             <div className="flex items-center space-x-2">
                               <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                               <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                 ✅ Report generation completed! All selected sections have been analyzed.
                               </span>
                             </div>
                           </div>
                         )}
                       </div>
                     </div>
                  </div>

                  <p className="text-sm text-primary-600/70 dark:text-primary-400/70 mb-4">
                    {section.InformationNeeded}
                  </p>

                  {section.DetailedContent && (
                    <div className="mt-4 prose prose-sm dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ __html: section.parsedContent || section.DetailedContent }} />
                    </div>
                  )}

                  {!section.DetailedContent && !section.isGeneratingDetails && section.isSelected && onGenerateDetails && (
                    <div className="mt-4">
                      <button
                        onClick={() => onGenerateDetails(index)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        Generate Details
                      </button>
                    </div>
                  )}

                  {section.isGeneratingDetails && (
                    <div className="mt-4 flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                      <span className="text-sm">Generating details...</span>
                    </div>
                  )}

                  {section.detailsError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      {section.detailsError}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {generatingAllDetails && (
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Generating section details...
                  </span>
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {generatingAllProgress}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generatingAllProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Please wait while we generate detailed analysis for each selected section...
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="prose prose-primary dark:prose-invert max-w-none">
            {report || (plan.sections && plan.sections.some(s => s.isSelected && s.DetailedContent)) ? (
              <div>
                {/* Use the report content if available, otherwise compile from sections */}
                {report ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {report.content}
                  </ReactMarkdown>
                ) : (
                  <div>
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                        Financial Analysis Report for {plan.companyName}
                      </h1>
                      
                      {/* Report Progress Summary */}
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                            Report Progress
                          </h2>
                          <div className="flex items-center space-x-2">
                            {generatingAllDetails && (
                              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                <span className="text-sm font-medium">Generating...</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                              {plan.sections.filter(s => s.isSelected).length}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Selected Sections</div>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {plan.sections.filter(s => s.isSelected && s.DetailedContent).length}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">Completed</div>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {plan.sections.filter(s => s.isSelected && s.isGeneratingDetails).length}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">In Progress</div>
                          </div>
                        </div>
                        
                        {generatingAllDetails && (
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${generatingAllProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                                         </div>
                     
                     {/* Table of Contents */}
                     {plan.sections.filter(s => s.isSelected).length > 1 && (
                       <div className="mb-8 bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                         <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
                           📋 Table of Contents
                         </h2>
                         <div className="space-y-2">
                           {plan.sections
                             .filter(section => section.isSelected)
                             .map((section, index) => (
                               <div key={section.SectionName} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                 <div className="flex items-center space-x-3">
                                   <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-6">
                                     {index + 1}.
                                   </span>
                                   <span className="text-slate-700 dark:text-slate-300">
                                     {section.SectionName}
                                   </span>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                   {section.DetailedContent ? (
                                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                       ✓ Complete
                                     </span>
                                   ) : section.isGeneratingDetails ? (
                                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                       🔄 Generating
                                     </span>
                                   ) : (
                                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                       ⏳ Pending
                                     </span>
                                   )}
                                 </div>
                               </div>
                             ))}
                         </div>
                       </div>
                     )}
                     
                     {plan.sections
                      .filter(section => section.isSelected)
                      .map((section, index) => (
                        <div key={section.SectionName} className="mb-8">
                          <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">
                            {section.SectionName}
                          </h2>
                          
                          {section.DetailedContent ? (
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {section.DetailedContent}
                              </ReactMarkdown>
                            </div>
                          ) : section.isGeneratingDetails ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300">
                                  Generating Analysis...
                                </h3>
                              </div>
                              <div className="space-y-3">
                                {section.InformationNeeded.split(',').map((info, infoIndex) => (
                                  <div key={infoIndex} className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                                    <p className="text-blue-600 dark:text-blue-400">
                                      {info.trim()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/40 rounded-md">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  🔄 AI is researching and analyzing this section...
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Analysis Overview
                              </h3>
                              <div className="space-y-3">
                                {section.InformationNeeded.split(',').map((info, infoIndex) => (
                                  <div key={infoIndex} className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                                    <p className="text-slate-600 dark:text-slate-400">
                                      {info.trim()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  💡 Detailed analysis for this section will be generated when you click "Generate Report"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    
                    {plan.sections.filter(s => s.isSelected).length === 0 && (
                      <div className="text-center py-12">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 border border-slate-200 dark:border-slate-700">
                          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">
                            No Sections Selected
                          </h3>
                          <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Go to the Analysis Plan tab and select sections to include in your report.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-primary-600/70 dark:text-primary-400/70 mt-12">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text ">No Report Generated</h3>
                <p className="mt-1 text-sm">
                  Select sections in the Analysis Plan tab and click "Generate Report" to create a report.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Generate Report Button */}
      {hasSelectedSections && onGenerateReport && !generatingAllDetails && activeTab === 'plan' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <button
            onClick={onGenerateReport}
            className="rounded-full bg-primary-gradient px-8 py-4 text-white hover:opacity-90 font-medium shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
            <span>Generate Report ({selectedSectionsCount} sections)</span>
          </button>
        </motion.div>
      )}
    </div>
  );
} 