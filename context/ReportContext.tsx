'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabase from '../lib/supabase';
import { useRouter } from 'next/navigation';

// Define the shape of a report
export interface Report {
  id: string;
  companyName: string;
  timestamp: number;
  sections?: {
    SectionName: string;
    InformationNeeded: string;
    DetailedContent?: string;
    isGeneratingDetails?: boolean;
    detailsError?: string;
    parsedContent?: string;
    sources?: string[];
  }[];
  htmlContent?: string;
  sources?: string[];
}

// Define the report data for saving or updating
export interface SaveReportData extends Omit<Report, 'id' | 'timestamp'> {
  id?: string; // Optional id field for updates
}

// Define the context shape
interface ReportContextType {
  savedReports: Report[];
  saveReport: (report: SaveReportData) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  clearAllReports: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Create the context
const ReportContext = createContext<ReportContextType | undefined>(undefined);

// Provider component
export function ReportProvider({ children }: { children: ReactNode }) {
  const [savedReports, setSavedReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Check for user session on component mount
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSavedReports([]);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsLoading(false);
    };
    
    getInitialSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load saved reports from database when user changes
  useEffect(() => {
    if (!user) {
      // If no user is logged in, use localStorage as fallback
      try {
        const storedReports = localStorage.getItem('savedReports');
        if (storedReports) {
          setSavedReports(JSON.parse(storedReports));
        }
      } catch (error) {
        console.error('Failed to parse saved reports from localStorage:', error);
      }
      setIsLoading(false);
      return;
    }

    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }

        // Transform data from database format to Report format
        const transformedReports = data.map(item => ({
          id: item.id,
          companyName: item.company_name,
          timestamp: new Date(item.created_at).getTime(),
          sections: item.sections as Report['sections'],
          htmlContent: item.html_content || undefined,
          sources: item.sources as string[] || undefined,
        }));

        setSavedReports(transformedReports);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  // Update function signature
  const saveReport = async (report: SaveReportData) => {
    if (!user) {
      // If no user is logged in, save to localStorage as fallback
      console.log('No user logged in. Saving report to localStorage:', report.companyName);
      const newReport: Report = {
        ...report,
        id: report.id || `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      const updatedReports = [newReport, ...savedReports];
      setSavedReports(updatedReports);
      
      try {
        localStorage.setItem('savedReports', JSON.stringify(updatedReports));
      } catch (error) {
        console.error('Failed to save reports to localStorage:', error);
      }
      
      return;
    }

    try {
      console.log('Saving report to database:', report.companyName);
      
      // For existing reports, check if we need to update
      let existingReport: Report | undefined;
      
      if (report.id) {
        existingReport = savedReports.find(r => r.id === report.id);
      }
      
      if (existingReport) {
        console.log('Updating existing report:', existingReport.id);
        
        // Update existing report
        const { error } = await supabase
          .from('reports')
          .update({
            company_name: report.companyName,
            sections: report.sections || null,
            html_content: report.htmlContent || null,
            sources: report.sources || null,
          })
          .eq('id', existingReport.id);
        
        if (error) {
          throw error;
        }
        
        // Update in local state
        const updatedReport: Report = {
          ...existingReport,
          companyName: report.companyName,
          sections: report.sections,
          htmlContent: report.htmlContent,
          sources: report.sources,
        };
        
        setSavedReports(prevReports => 
          prevReports.map(r => r.id === updatedReport.id ? updatedReport : r)
        );
        
        console.log('Report updated successfully');
        return;
      }
      
      // Insert new report
      console.log('Creating new report');
      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          company_name: report.companyName,
          sections: report.sections || null,
          html_content: report.htmlContent || null,
          sources: report.sources || null,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }

      // Transform the returned data to Report format
      const newReport: Report = {
        id: data.id,
        companyName: data.company_name,
        timestamp: new Date(data.created_at).getTime(),
        sections: data.sections as Report['sections'],
        htmlContent: data.html_content || undefined,
        sources: data.sources as string[] || undefined,
      };

      setSavedReports(prevReports => [newReport, ...prevReports]);
      console.log('New report created successfully with ID:', newReport.id);
    } catch (err) {
      console.error('Error saving report:', err);
      setError('Failed to save report. Please try again.');
    }
  };

  // Function to delete a report
  const deleteReport = async (id: string) => {
    if (!user) {
      // If no user is logged in, delete from localStorage as fallback
      const updatedReports = savedReports.filter(report => report.id !== id);
      setSavedReports(updatedReports);
      
      try {
        localStorage.setItem('savedReports', JSON.stringify(updatedReports));
      } catch (error) {
        console.error('Failed to update reports in localStorage:', error);
      }
      
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }

      setSavedReports(prevReports => prevReports.filter(report => report.id !== id));
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report. Please try again.');
    }
  };

  // Function to clear all reports
  const clearAllReports = async () => {
    if (!user) {
      // If no user is logged in, clear localStorage as fallback
      setSavedReports([]);
      localStorage.removeItem('savedReports');
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }

      setSavedReports([]);
    } catch (err) {
      console.error('Error clearing reports:', err);
      setError('Failed to clear reports. Please try again.');
    }
  };

  return (
    <ReportContext.Provider value={{ 
      savedReports, 
      saveReport, 
      deleteReport, 
      clearAllReports,
      isLoading,
      error
    }}>
      {children}
    </ReportContext.Provider>
  );
}

// Custom hook to use the report context
export function useReports() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
} 