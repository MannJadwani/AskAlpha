'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ShinyButton } from '@/components/magicui/shiny-button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReports } from '../../../context/ReportContext';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { downloadReportAsText } from '../../../lib/exportReport';
import supabase from '../../../lib/supabase';
import FullScreenReport from '@/components/FullScreenReport';
import ComingSoon from '@/components/ui/coming-soon';

interface ReportSection {
  SectionName: string;
  InformationNeeded: string;
  DetailedContent?: string;
  isGeneratingDetails?: boolean;
  detailsError?: string;
  parsedContent?: string; // Store parsed HTML content
  sources?: string[]; // Add sources for individual sections
}

interface ReportData {
  sections: ReportSection[];
  sources?: string[]; // Add sources for the overall report

  charts?: {
    timeSeries?: { title: string; unit?: string; series: { label: string; value: number }[]; description?: string };
    breakdown?: { title: string; labels: string[]; values: number[]; description?: string };
  };
}

function SignInPrompt() {
  return (
    <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Authentication required</h3>
          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <p>You need to be signed in to save reports. Your reports will be securely stored in your account and available across devices.</p>
            <div className="mt-4">
              <Link 
                href="/sign-in" 
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Sign in
              </Link>
              <Link 
                href="/sign-up" 
                className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component that handles search params
function SearchParamsHandler({ setCompanyName, setNumSections }: {
  setCompanyName: (name: string) => void;
  setNumSections: (num: number) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const company = searchParams.get('company');
    const sections = searchParams.get('sections');
    
    if (company) {
      setCompanyName(decodeURIComponent(company));
    }
    
    if (sections) {
      const sectionsNum = parseInt(sections);
      if (sectionsNum >= 1 && sectionsNum <= 20) {
        setNumSections(sectionsNum);
      }
    }
  }, [searchParams, setCompanyName, setNumSections]);

  return null;
}

function CompanyReportContent() {
  const router = useRouter();
  const { saveReport } = useReports();
  const [companyName, setCompanyName] = useState('');
  const [numSections, setNumSections] = useState(10);
  const [report, setReport] = useState<string | null>(null);
  const [parsedReport, setParsedReport] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [chartData, setChartData] = useState<ReportData['charts'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [generatingAllDetails, setGeneratingAllDetails] = useState(false);
  const [generatingAllProgress, setGeneratingAllProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Parse markdown when report changes
  useEffect(() => {
    if (report) {
      // Use marked synchronously to convert Markdown to HTML
      const html = marked.parse(report, { async: false }) as string;
      setParsedReport(DOMPurify.sanitize(html));
    }
  }, [report]);

  // debug chart changes
  useEffect(() => {
    if (chartData) {
      console.log('chartData state updated:', chartData);
    } else {
      console.log('chartData is null');
    }
  }, [chartData]);

  // Parse section content when it changes
  useEffect(() => {
    if (reportData && reportData.sections.some(s => s.DetailedContent && !s.parsedContent)) {
      const updatedSections = reportData.sections.map(section => {
        if (section.DetailedContent && !section.parsedContent) {
          // Parse the markdown to HTML
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

  // Reset save success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Add a useEffect for checking authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setAuthChecked(true);
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const generateReport = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    if (numSections < 1 || numSections > 20) {
      setError('Number of sections must be between 1 and 20');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setReportData(null);
      
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          companyName,
          numSections
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      console.log('generate-report response:', data);
      if (data.reportData) {
        console.log('reportData.charts from API:', data.reportData?.charts);
        setReportData({
          sections: data.reportData.sections,
          sources: data.sources || [],
          charts: data.reportData.charts || undefined
        });
        setChartData(data.reportData.charts || null);
      } else {
        // Some providers may still return JSON as a raw string under `report`.
        // Try to parse it and extract sections/charts; fallback to raw text.
        let parsed: any = null;
        try {
          if (typeof data.report === 'string') {
            parsed = JSON.parse(data.report);
          }
        } catch {}
        if (parsed && parsed.sections) {
          console.log('parsed report charts:', parsed?.charts);
          setReportData({
            sections: parsed.sections,
            sources: data.sources || [],
            charts: parsed.charts || undefined
          });
          setChartData(parsed.charts || null);
        } else {
          setReport(data.report);
        }
      }
    } catch (err) {
      setError('Error generating report. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSectionDetails = async (sectionIndex: number) => {
    if (!reportData) return;
    
    const section = reportData.sections[sectionIndex];
    
    // Update the section to show loading state
    const updatedSections = [...reportData.sections];
    updatedSections[sectionIndex] = {
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
      const sectionSources = data.sources || [];
      
      // Parse the markdown to HTML
      const html = marked.parse(content, { async: false }) as string;
      
      // Update the section with the generated details
      const sectionsWithDetails = [...reportData.sections];
      sectionsWithDetails[sectionIndex] = {
        ...section,
        DetailedContent: content,
        parsedContent: DOMPurify.sanitize(html),
        sources: sectionSources,
        isGeneratingDetails: false
      };
      
      setReportData({ sections: sectionsWithDetails });
      
      // Save the updated report to the database if user is logged in
      if (user) {
        try {
          await saveReport({
            companyName,
            sections: sectionsWithDetails,
            sources: reportData.sources
          });
        } catch (err) {
          console.error('Error saving updated report after generating details:', err);
        }
      }
      
      return true;
    } catch (err) {
      console.error(err);
      
      // Update the section with the error
      const sectionsWithError = [...reportData.sections];
      sectionsWithError[sectionIndex] = {
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
    
    setGeneratingAllDetails(true);
    setGeneratingAllProgress(0);
    
    // Filter sections that don't have details yet
    const sectionsToGenerate = reportData.sections
      .map((section, index) => ({ section, index }))
      .filter(({ section }) => !section.DetailedContent && !section.isGeneratingDetails);
    
    let successCount = 0;
    let currentSections = [...reportData.sections]; // Create a local copy to track updates
    
    // Generate details for each section sequentially
    for (let i = 0; i < sectionsToGenerate.length; i++) {
      const { index } = sectionsToGenerate[i];
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
        const sectionSources = data.sources || [];
        const html = marked.parse(content, { async: false }) as string;
        
        currentSections[index] = {
          ...section,
          DetailedContent: content,
          parsedContent: DOMPurify.sanitize(html),
          sources: sectionSources,
          isGeneratingDetails: false
        };
        
        // Update the UI with the latest data
        setReportData({ sections: [...currentSections] });
        successCount++;
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
      setGeneratingAllProgress(Math.round(((i + 1) / sectionsToGenerate.length) * 100));
    }
    
    // Save the updated report with all generated details to the database if user is logged in
    if (user && successCount > 0) {
      try {
        await saveReport({
          companyName,
          sections: currentSections,
          sources: reportData?.sources
        });
      } catch (err) {
        console.error('Error saving report after generating all details:', err);
      }
    }
    
    setGeneratingAllDetails(false);
    
    // Return to ensure user knows the operation is complete
    return successCount;
  };

  const handleSaveReport = async () => {
    if (!authChecked) return;
    
    if (!user) {
      // If not logged in, prompt to sign in
      setShowSignInPrompt(true);
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (reportData) {
        // Make sure all sections with DetailedContent have their parsedContent
        const sectionsWithParsedContent = reportData.sections.map(section => {
          if (section.DetailedContent && !section.parsedContent) {
            // Parse the markdown to HTML if not already parsed
            const html = marked.parse(section.DetailedContent, { async: false }) as string;
            return {
              ...section,
              parsedContent: DOMPurify.sanitize(html)
            };
          }
          return section;
        });
        
        await saveReport({
          companyName,
          sections: sectionsWithParsedContent,
          sources: reportData.sources
        });
        setSaveSuccess(true);
      } else if (report) {
        // For text-based reports, use the raw text rather than formatting HTML
        await saveReport({
          companyName,
          htmlContent: report
        });
        setSaveSuccess(true);
      }
    } catch (err) {
      console.error('Failed to save report:', err);
      setError('Failed to save report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportReport = () => {
    if (reportData) {
      downloadReportAsText({
        id: `temp-${Date.now()}`,
        companyName,
        timestamp: Date.now(),
        sections: reportData.sections
      });
    } else if (report) {
      downloadReportAsText({
        id: `temp-${Date.now()}`,
        companyName,
        timestamp: Date.now(),
        htmlContent: report
      });
    }
  };

  const createTempReport = () => {
    return {
      id: `temp-${Date.now()}`,
      companyName,
      timestamp: Date.now(),
      sections: reportData?.sections,
      htmlContent: report || undefined
    };
  };

  // Add a new function to handle PDF export via full screen view
  const handleExportToPDF = () => {
    setIsFullScreen(true);
    // Use setTimeout to ensure the full screen view is rendered before triggering PDF export
    setTimeout(() => {
      const exportButton = document.querySelector('[aria-label="Export as PDF"]');
      if (exportButton) {
        (exportButton as HTMLButtonElement).click();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-zinc-300 w-full">
      <Suspense fallback={null}>
        <SearchParamsHandler setCompanyName={setCompanyName} setNumSections={setNumSections} />
      </Suspense>
      <div className="mx-auto max-w-6xl px-6 py-12">
      

        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden mb-8">
            <div className="border-b border-white/10 p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-lg bg-white/10 ring-1 ring-inset ring-white/15">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-200" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Generate Equity Report</h2>
                  <p className="text-zinc-400 mt-1">AI-powered financial analysis and market research</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
               <div className="space-y-8">
                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-zinc-200 mb-3">
                    Company Name or Ticker Symbol
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="company-name"
                      className="block w-full rounded-xl border border-white/10 bg-black/30 px-6 py-4 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
                      placeholder="e.g., Apple Inc., AAPL, Tesla, Microsoft"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="num-sections" className="block text-sm font-medium text-zinc-200 mb-3">
                    Number of Report Sections
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="num-sections"
                      min="1"
                      max="20"
                      className="block w-full rounded-xl border border-white/10 bg-black/30 px-6 py-4 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
                      value={numSections}
                      onChange={(e) => setNumSections(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                      disabled={loading}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2h10a1 1 0 100-2H3zm0 4a1 1 0 000 2h6a1 1 0 100-2H3zm0 4a1 1 0 100 2h6a1 1 0 100-2H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Choose between 1-20 sections for comprehensive analysis
                  </p>
                </div>
              
                {error && (
                  <div className="rounded-xl bg-red-900/20 p-4 border border-red-800">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-200">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {saveSuccess && (
                  <div className="rounded-xl bg-emerald-900/20 p-4 border border-emerald-800">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-emerald-200">
                          Report saved successfully! <Link href="/my-reports" className="underline hover:text-green-900 dark:hover:text-green-100">View in My Reports</Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <ShinyButton
                    className="px-8 py-4 text-lg"
                    onClick={generateReport}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                        </svg>
                        Generate AI Report
                      </>
                    )}
                  </ShinyButton>
                </div>
            </div>
          </div>
          
            {loading && (
              <div className="border-t border-white/10 p-8 bg-white/[0.03]">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-white/20 rounded-full animate-spin border-t-white/60"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-white">
                      Researching {companyName}
                    </h3>
                    <p className="text-zinc-400 max-w-md">
                      AI is analyzing company financials, market position, and competitive landscape to generate comprehensive insights
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-sm font-medium">Processing data...</span>
                  </div>
                </div>
              </div>
            )}
        </div>

        {report && !reportData && !loading && (
          <div className="bg-white/5 backdrop-blur rounded-xl overflow-hidden w-full border border-white/10">
            {showSignInPrompt && <SignInPrompt />}
            
            <div className="border-b border-white/10 bg-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Equity Research Report: {companyName}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFullScreen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-white/10 text-zinc-200 hover:bg-white/15 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Full Screen
                </button>
                <button
                  onClick={handleExportToPDF}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-white/10 text-zinc-200 hover:bg-white/15 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Export to PDF
                </button>
                <button
                  onClick={handleExportReport}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-white/10 text-zinc-200 hover:bg-white/15 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export as Text
                </button>
                <button
                  onClick={handleSaveReport}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-white/10 text-zinc-200 hover:bg-white/15 transition-colors"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                      </svg>
                      {user ? 'Save Report' : 'Sign in to Save'}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center">
                <div className="mb-6 max-w-2xl mx-auto text-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    Report for {companyName} is ready
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    This report contains a comprehensive analysis of {companyName}, including business model, market position, competitive advantages, and financial analysis.
                  </p>
                  <button
                    onClick={() => setIsFullScreen(true)}
                    className="mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    View Full Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

          {reportData && !loading && (
            <div className="bg-white/5 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden w-full border border-white/10">
              {chartData && (chartData.timeSeries || chartData.breakdown) && (
                <div className="px-6 py-6 border-b border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {chartData.timeSeries && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <h4 className="text-sm font-semibold text-white mb-2">{chartData.timeSeries.title}</h4>
                        <div className="text-xs text-zinc-400 mb-3">{chartData.timeSeries.description}</div>
                        <svg viewBox="0 0 100 40" className="w-full h-40">
                          <polyline fill="none" stroke="#22d3ee" strokeWidth="1.5"
                            points={(() => {
                              const s = chartData.timeSeries!.series;
                              const max = Math.max(1, ...s.map(p => p.value));
                              return s.map((p, i) => {
                                const x = (i / Math.max(1, s.length - 1)) * 100;
                                const y = 38 - (p.value / max) * 35;
                                return `${x},${y}`;
                              }).join(' ');
                            })()} />
                        </svg>
                        <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
                          {chartData.timeSeries.series.map(pt => (
                            <span key={pt.label}>{pt.label}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {chartData.breakdown && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col items-center">
                        <h4 className="text-sm font-semibold text-white mb-2">{chartData.breakdown.title}</h4>
                        <div className="text-xs text-zinc-400 mb-3">{chartData.breakdown.description}</div>
                        <svg viewBox="0 0 42 42" className="w-40 h-40 rotate-[-90deg]">
                          {(() => {
                            const total = chartData.breakdown!.values.reduce((a,b)=>a+b,0) || 1;
                            let acc = 0;
                            const colors = ['#22d3ee','#a78bfa','#ff7ad9','#eab308','#10b981'];
                            return chartData.breakdown!.values.map((v, idx) => {
                              const r = 16; const c = 21; const circ = 2 * Math.PI * r; const frac = v / total;
                              const dash = circ * frac; const gap = circ - dash;
                              const el = (
                                <circle key={idx} cx={c} cy={c} r={r} fill="transparent" stroke={colors[idx % colors.length]} strokeWidth="8" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-circ * acc} />
                              );
                              acc += frac; return el;
                            });
                          })()}
                          <circle cx="21" cy="21" r="10" className="fill-[var(--background)]" />
                        </svg>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-300 w-full">
                          {chartData.breakdown.labels.map((lbl, i) => (
                            <div key={lbl} className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-sm" style={{ background: ['#22d3ee','#a78bfa','#ff7ad9','#eab308','#10b981'][i % 5] }} />
                              <span className="truncate">{lbl}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {showSignInPrompt && <SignInPrompt />}
              
              <div className="border-b border-white/10 bg-white/5 px-6 py-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-4 shadow-lg bg-white/10 ring-1 ring-inset ring-white/15">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-200" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Equity Research Report</h3>
                    <p className="text-zinc-400 text-sm">{companyName} • AI-Generated Analysis</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsFullScreen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/10 text-zinc-200 hover:bg-white/15 transition-all duration-200 shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Full Screen
                </button>
                <button
                  onClick={handleExportToPDF}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-white/10 text-zinc-200 hover:bg-white/15 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Export to PDF
                </button>
                {!generatingAllDetails && (
                  <button
                    onClick={generateAllDetails}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                    disabled={reportData.sections.every(section => section.DetailedContent || section.isGeneratingDetails)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Generate All Details
                  </button>
                )}
                <button
                  onClick={handleExportReport}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-white/10 text-zinc-200 hover:bg-white/15 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Export as Text
                </button>
                <button
                  onClick={handleSaveReport}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                      </svg>
                      {user ? 'Save Report' : 'Sign in to Save'}
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Sources Display - Perplexity Style */}
                {reportData.sources && reportData.sources.length > 0 && (
              <div className="px-6 py-6 bg-white/[0.03] border-b border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-white">Sources</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reportData.sources.map((source, index) => {
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
                        return `${domain}/assets/logo/icon.png`;
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
                        className="group relative bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 relative">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
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
                                  <div className="w-4 h-4 bg-gradient-to-br from-zinc-400 to-zinc-600 rounded text-white text-xs font-semibold items-center justify-center hidden">
                                    {domain.charAt(0).toUpperCase()}
                                  </div>
                                </>
                              ) : (
                                <div className="w-4 h-4 bg-gradient-to-br from-zinc-400 to-zinc-600 rounded text-white text-xs font-semibold flex items-center justify-center">
                                  {domain.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 text-white text-xs font-semibold rounded-full flex items-center justify-center border-2 border-[#0a0c10]">
                              {index + 1}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white mb-1 truncate">
                              {domain}
                            </div>
                            <div className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                              {source.length > 60 ? `${source.substring(0, 60)}...` : source}
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
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
            
              <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6">
                {reportData.sections.map((section, index) => (
                    <div key={index} className="p-5 rounded-lg border border-white/10 bg-white/5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                        <h3 className="text-lg font-bold text-white">{section.SectionName}</h3>
                      {!section.DetailedContent && !section.isGeneratingDetails && (
                        <button
                          onClick={() => generateSectionDetails(index)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-white/10 text-zinc-200 hover:bg-white/15 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Generate Details
                        </button>
                      )}
                    </div>
                    
                    {/* Section Points */}
                    <div className="grid gap-3 mb-4">
                      {section.InformationNeeded.split(',').map((point, pointIndex) => (
                        <div key={pointIndex} className="flex items-start">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3 mt-0.5">•</span>
                          <p className="text-slate-700 dark:text-slate-300">{point.trim()}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Generate Details Loading State */}
                      {section.isGeneratingDetails && (
                      <div className="mt-4 p-4 border border-white/10 rounded-lg bg-white/5">
                        <div className="flex items-center space-x-3">
                          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-sm text-zinc-300">Generating detailed analysis...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Generate Details Error State */}
                      {section.detailsError && (
                      <div className="mt-4 p-4 border border-red-800 rounded-lg bg-red-900/20">
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-red-300">{section.detailsError}</p>
                            <button
                              onClick={() => generateSectionDetails(index)}
                            className="mt-2 text-xs text-red-300 underline hover:text-red-200"
                            >
                              Try Again
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Replace the detailed content section with a simple indicator */}
                      {section.DetailedContent && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-zinc-300">
                              Detailed analysis available in full screen view
                            </span>
                          </div>
                          <button
                            onClick={() => setIsFullScreen(true)}
                            className="text-xs text-zinc-200 hover:text-white underline"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isFullScreen && (
        <FullScreenReport 
          report={createTempReport()}
          onClose={() => setIsFullScreen(false)}
        />
      )}
      </div>
    </div>
  );
}

export default function CompanyReport() {
  return (
   <>
   <ComingSoon>
   <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 w-full">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden mb-8 border border-primary/10 dark:border-primary/20 p-8">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin border-t-primary-600 dark:border-t-primary-400"></div>
                <span className="ml-3 text-primary-600 dark:text-primary-400">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <CompanyReportContent />
    </Suspense>
   </ComingSoon>
    
   </>
  );
}