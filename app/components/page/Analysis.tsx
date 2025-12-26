'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReportViewer from '../ReportViewer';
import AddSectionModal from '../AddSectionModal';
import { motion, AnimatePresence } from 'framer-motion';
import ResearchingCompany from '../ResearchingCompany';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { ShinyButton } from '@/components/magicui/shiny-button';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface Section {
  SectionName: string;
  InformationNeeded: string;
  DetailedContent?: string;
  isGeneratingDetails?: boolean;
  detailsError?: string;
  parsedContent?: string;
  isSelected: boolean;
}

interface ReportData {
  sections: Section[];
}

type Report = {
  type: 'plan';
  sections: Section[];
  companyName: string;
  title: string;
} | {
  type: 'report';
  content: string;
  title: string;
};

interface Company {
  name: string;
  ticker: string;
  category: string;
}

const indianCompanies: Record<string, Company[]> = {
  technology: [
    { name: 'TCS', ticker: 'TCS.NS', category: 'Technology' },
    { name: 'Infosys', ticker: 'INFY.NS', category: 'Technology' },
    { name: 'Wipro', ticker: 'WIPRO.NS', category: 'Technology' }
  ],
  banking: [
    { name: 'HDFC Bank', ticker: 'HDFCBANK.NS', category: 'Banking' },
    { name: 'ICICI Bank', ticker: 'ICICIBANK.NS', category: 'Banking' },
    { name: 'SBI', ticker: 'SBIN.NS', category: 'Banking' }
  ],
  industry: [
    { name: 'Reliance', ticker: 'RELIANCE.NS', category: 'Conglomerate' },
    { name: 'Tata Motors', ticker: 'TATAMOTORS.NS', category: 'Automotive' },
    { name: 'Adani Ports', ticker: 'ADANIPORTS.NS', category: 'Infrastructure' }
  ],
  consumer: [
    { name: 'ITC Limited', ticker: 'ITC.NS', category: 'Consumer Goods' },
    { name: 'Hindustan Unilever', ticker: 'HINDUNILVR.NS', category: 'Consumer Goods' },
    { name: 'Asian Paints', ticker: 'ASIANPAINT.NS', category: 'Consumer Goods' }
  ]
};



export default function CompanyAnalysis() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI financial analyst. I can help you analyze any company and create detailed reports. What company would you like to analyze today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [parsedReport, setParsedReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingAllDetails, setGeneratingAllDetails] = useState(false);
  const [generatingAllProgress, setGeneratingAllProgress] = useState(0);
  const [hasInitialInput, setHasInitialInput] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [activeTab, setActiveTab] = useState<'plan' | 'report'>('plan');

  // Parse markdown when report changes
  useEffect(() => {
    if (report) {
      const html = marked.parse(report, { async: false }) as string;
      setParsedReport(DOMPurify.sanitize(html));
    }
  }, [report]);

  // Parse section content when it changes
  useEffect(() => {
    if (reportData && reportData.sections.some(s => s.DetailedContent && !s.parsedContent)) {
      const updatedSections = reportData.sections.map(section => {
        if (section.DetailedContent && !section.parsedContent) {
          const html = marked.parse(section.DetailedContent, { async: false }) as string;
          return {
            ...section,
            parsedContent: DOMPurify.sanitize(html)
          };
        }
        return section;
      });
      
      setReportData({
        sections: updatedSections
      });
    }
  }, [reportData]);

  const generateReport = async (companyInput: string) => {
    if (!companyInput.trim()) {
      setError('Please enter a company name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setReportData(null);
      setCompanyName(companyInput);
      
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          companyName: companyInput,
          numSections: 6 // Default number of sections
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      if (data.reportData) {
        // Add isSelected property to each section
        const sectionsWithSelection = data.reportData.sections.map((section: Section) => ({
          ...section,
          isSelected: false
        }));
        setReportData({ sections: sectionsWithSelection });
      } else {
        setReport(data.report);
      }
    } catch (err) {
      setError('Error generating report. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = (index: number, isSelected: boolean) => {
    if (!reportData) return;
    
    const updatedSections = [...reportData.sections];
    updatedSections[index] = { ...updatedSections[index], isSelected };
    setReportData({ sections: updatedSections });
  };

  const handleAddSection = () => {
    setIsAddSectionModalOpen(true);
  };

  const handleAddSectionSubmit = (sectionName: string, informationNeeded: string[]) => {
    if (!reportData) return;
    
    const newSection: Section = {
      SectionName: sectionName,
      InformationNeeded: informationNeeded.join(', '),
      isSelected: false
    };
    
    setReportData({
      sections: [...reportData.sections, newSection]
    });
  };

  const handleGenerateDetails = async (index: number) => {
    if (!reportData) return;
    
    const section = reportData.sections[index];
    if (!section.isSelected) {
      alert('Please select the section before generating details.');
      return;
    }

    // Update the section to show loading state
    const updatedSections = [...reportData.sections];
    updatedSections[index] = {
      ...section,
      isGeneratingDetails: true,
      detailsError: undefined
    };
    
    setReportData({ sections: updatedSections });
    
    try {
      const response = await fetch('/api/generate-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          sectionName: section.SectionName,
          informationNeeded: section.InformationNeeded
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate section details');
      }

      const data = await response.json();
      const content = data.sectionContent;
      
      // Parse the markdown to HTML
      const html = marked.parse(content, { async: false }) as string;
      
      // Update the section with the generated details
      const sectionsWithDetails = [...reportData.sections];
      sectionsWithDetails[index] = {
        ...section,
        DetailedContent: content,
        parsedContent: DOMPurify.sanitize(html),
        isGeneratingDetails: false
      };
      
      setReportData({ sections: sectionsWithDetails });
      
      return true;
    } catch (err) {
      console.error(err);
      
      // Update the section with the error
      const sectionsWithError = [...reportData.sections];
      sectionsWithError[index] = {
        ...section,
        isGeneratingDetails: false,
        detailsError: 'Failed to generate details. Please try again.'
      };
      
      setReportData({ sections: sectionsWithError });
      return false;
    }
  };

  const generateAllDetails = async () => {
    if (!reportData) return;
    
    const selectedSections = reportData.sections
      .map((section, index) => ({ section, index }))
      .filter(({ section }) => section.isSelected && !section.DetailedContent && !section.isGeneratingDetails);
    
    if (selectedSections.length === 0) {
      // If all selected sections already have details, generate the final report
      handleGenerateReport();
      return;
    }

    setGeneratingAllDetails(true);
    setGeneratingAllProgress(0);
    
    let successCount = 0;
    let currentSections = [...reportData.sections];
    
    // Generate details for each selected section sequentially
    for (let i = 0; i < selectedSections.length; i++) {
      const { index } = selectedSections[i];
      const section = currentSections[index];
      
      // Update the section to show loading state
      currentSections[index] = {
        ...section,
        isGeneratingDetails: true,
        detailsError: undefined
      };
      
      // Update the UI with the loading state
      setReportData({ sections: [...currentSections] });
      
      try {
        const response = await fetch('/api/generate-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName,
            sectionName: section.SectionName,
            informationNeeded: section.InformationNeeded
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate section details');
        }

        const data = await response.json();
        
        // Update our local copy with the generated details
        const content = data.sectionContent;
        const html = marked.parse(content, { async: false }) as string;
        
        currentSections[index] = {
          ...section,
          DetailedContent: content,
          parsedContent: DOMPurify.sanitize(html),
          isGeneratingDetails: false
        };
        
              // Update the UI with the latest data
      setReportData({ sections: [...currentSections] });
      successCount++;
      
      // Auto-switch to report tab after first section is generated
      if (successCount === 1) {
        setActiveTab('report');
      }
      } catch (err) {
        console.error(err);
        
        // Update our local copy with the error
        currentSections[index] = {
          ...section,
          isGeneratingDetails: false,
          detailsError: 'Failed to generate details. Please try again.'
        };
        
        // Update the UI with the error state
        setReportData({ sections: [...currentSections] });
      }
      
      // Update progress
      setGeneratingAllProgress(Math.round(((i + 1) / selectedSections.length) * 100));
    }
    
    setGeneratingAllDetails(false);
    
    // After generating all details, create the final report
    if (successCount > 0) {
      handleGenerateReport();
    }
    
    return successCount;
  };

  const handleGenerateReport = async () => {
    // Redirect to report-gen page instead of generating old-style report
    if (companyName) {
      const encodedCompanyName = encodeURIComponent(companyName.trim());
      router.push(`/report-gen?symbol=${encodedCompanyName}`);
    }
    return;
    
    /*
    // Legacy code - kept for reference but disabled
    if (!reportData) return;
    
    const selectedSections = reportData.sections.filter(s => s.isSelected);
    if (selectedSections.length === 0) return;

    setIsAnalyzing(true);
    
    try {
      const reportContent = `
# Financial Analysis Report for ${companyName}

${selectedSections.map(section => `
## ${section.SectionName}

${section.DetailedContent || `Analysis for ${section.SectionName}:

${section.InformationNeeded.split(',').map(info => `
### ${info.trim()}
- Key finding 1
- Key finding 2
- Key finding 3
`).join('\n')}
`}`).join('\n')}
      `;

      setReport(reportContent);

      // Automatically switch to report tab
      setActiveTab('report');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve generated the report based on your selected sections. You can view it in the Report tab.'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error generating the report. Please try again.'
      }]);
    } finally {
      setIsAnalyzing(false);
    }
    */
  };

  const simulateResearch = async (companyInput: string) => {
    setIsResearching(true);
    setSelectedCompany(companyInput);
    
    // Generate the actual report using the API
    await generateReport(companyInput);
    
    setIsResearching(false);
    setHasInitialInput(true);
  };

  const router = useRouter();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Redirect to report-gen page with the company name pre-filled
    const encodedCompanyName = encodeURIComponent(inputMessage.trim());
    router.push(`/report-gen?symbol=${encodedCompanyName}`);
  };

  const handleRecommendationClick = (company: Company) => {
    setInputMessage(`${company.name} (${company.ticker})`);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-300 w-full">
      <AnimatePresence>
        {isResearching && <ResearchingCompany companyName={selectedCompany} />}
        
        {!hasInitialInput ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex min-h-screen items-center justify-center p-6"
          >
            <div className="w-full max-w-2xl">
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-center mb-12"
              >
                <h1 className="text-5xl font-bold text-white mb-6">
                  Financial Analysis
                </h1>
                <p className="text-xl text-zinc-400">
                  Enter a company name or ticker symbol to begin analysis
                </p>
              </motion.div>
              
              <form onSubmit={handleSendMessage} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="e.g., Apple Inc. or AAPL"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-xl text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ShinyButton type="submit" disabled={loading} className="px-6 py-3">
                      {loading ? 'Analyzing…' : 'Analyze'}
                    </ShinyButton>
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl p-6 border border-white/10 bg-white/5"
                >
                  <h3 className="text-lg font-medium text-white mb-4">
                    Popular Companies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {indianCompanies.technology.map((company) => (
                      <button
                        key={company.ticker}
                        type="button"
                        onClick={() => handleRecommendationClick(company)}
                        className="inline-flex items-center px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-200 text-sm hover:bg-white/10 transition"
                      >
                        <span className="mr-2">{company.name}</span>
                        <span className="text-zinc-400">{company.ticker}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-zinc-400">
                    Click on any company to quickly analyze its financial data and market performance.
                  </p>
                </motion.div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-4 border border-red-900/40 bg-red-900/10"
                  >
                    <div className="flex">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                      <p className="text-sm font-medium text-red-300">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex h-screen p-6 gap-6"
          >
            {/* Left side - Chat Interface */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-1/3 flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/10"
            >
              <div className="p-4 border-b border-white/10 bg-white/5">
                <h2 className="text-lg font-semibold text-white">AI Financial Analyst</h2>
                <p className="text-sm text-zinc-400">Ask me about any company</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl p-4 border ${
                        message.role === 'assistant'
                          ? 'bg-white/5 border-white/10 text-zinc-200'
                          : 'bg-white text-black border-white/20'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isAnalyzing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center space-x-2 text-zinc-300"
                  >
                    <div className="animate-pulse">Analyzing</div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </motion.div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about a company..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white/20"
                  />
                  <ShinyButton type="submit" disabled={isAnalyzing} className="px-4 py-2.5">
                    Send
                  </ShinyButton>
                </div>
              </form>
            </motion.div>

            {/* Right side - Report Viewer */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-2/3 h-full"
            >
              <ReportViewer 
                plan={{
                  type: 'plan',
                  sections: reportData?.sections || [],
                  companyName: companyName || 'New Analysis',
                  title: companyName ? `Analysis Plan: ${companyName}` : 'New Analysis Plan'
                }}
                report={report ? {
                  type: 'report',
                  content: report,
                  title: `${companyName} Analysis Report`
                } : null}
                title={report ? `${companyName} Analysis Report` : (companyName ? `Analysis Plan: ${companyName}` : 'New Analysis Plan')}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onGenerateDetails={handleGenerateDetails}
                onSectionSelect={handleSectionSelect}
                onAddSection={handleAddSection}
                onGenerateReport={generateAllDetails}
                generatingAllDetails={generatingAllDetails}
                generatingAllProgress={generatingAllProgress}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Section Modal */}
      <AddSectionModal
        isOpen={isAddSectionModalOpen}
        onClose={() => setIsAddSectionModalOpen(false)}
        onAdd={handleAddSectionSubmit}
      />
    </div>
  );
} 