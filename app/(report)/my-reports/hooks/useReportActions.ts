import { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Report } from '../../../../context/ReportContext';

interface UseReportActionsProps {
  selectedReport: Report | null;
  setSelectedReport: (report: Report | null) => void;
  saveReport: (report: any) => Promise<void>;
  deleteReport: (id: string) => void;
  clearAllReports: () => void;
}

export function useReportActions({
  selectedReport,
  setSelectedReport,
  saveReport,
  deleteReport,
  clearAllReports
}: UseReportActionsProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [generatingAllDetails, setGeneratingAllDetails] = useState(false);
  const [generatingAllProgress, setGeneratingAllProgress] = useState(0);
  const [parsedHtmlContent, setParsedHtmlContent] = useState<string>('');

  // Parse HTML content when selected report changes
  useEffect(() => {
    if (selectedReport) {
      if (selectedReport.htmlContent) {
        const html = marked.parse(selectedReport.htmlContent, { async: false }) as string;
        setParsedHtmlContent(DOMPurify.sanitize(html));
      }
      
      // Ensure all sections with DetailedContent have parsedContent
      if (selectedReport.sections) {
        const needsUpdate = selectedReport.sections.some(
          section => section.DetailedContent && !section.parsedContent
        );
        
        if (needsUpdate) {
          const updatedSections = selectedReport.sections.map(section => {
            if (section.DetailedContent && !section.parsedContent) {
              const html = marked.parse(section.DetailedContent, { async: false }) as string;
              return {
                ...section,
                parsedContent: DOMPurify.sanitize(html)
              };
            }
            return section;
          });
          
          const updatedReport = {
            ...selectedReport,
            sections: updatedSections
          };
          
          // Update the selected report
          setSelectedReport(updatedReport);
          
          // Save the updated report to persist the changes
          saveReport({
            id: updatedReport.id,
            companyName: updatedReport.companyName,
            sections: updatedReport.sections,
            htmlContent: updatedReport.htmlContent
          });
        }
      }
    }
  }, [selectedReport?.id, selectedReport, setSelectedReport, saveReport]);

  // Generate section details
  const generateSectionDetails = async (sectionIndex: number) => {
    if (!selectedReport || !selectedReport.sections) return;
    
    const section = selectedReport.sections[sectionIndex];
    
    // Create a copy of the selected report to modify
    const updatedReport = { ...selectedReport };
    if (!updatedReport.sections) return;
    
    // Update the section to show loading state
    updatedReport.sections[sectionIndex] = {
      ...section,
      isGeneratingDetails: true,
      detailsError: undefined
    };
    
    setSelectedReport(updatedReport);
    
    try {
      const response = await fetch('/api/generate-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: selectedReport.companyName,
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
      const updatedReportWithDetails = { ...selectedReport };
      if (!updatedReportWithDetails.sections) return;
      
      updatedReportWithDetails.sections[sectionIndex] = {
        ...section,
        DetailedContent: content,
        parsedContent: DOMPurify.sanitize(html),
        isGeneratingDetails: false
      };
      
      setSelectedReport(updatedReportWithDetails);
      
      // Save the updated report to persist the changes
      await saveReport({
        id: updatedReportWithDetails.id,
        companyName: updatedReportWithDetails.companyName,
        sections: updatedReportWithDetails.sections,
        htmlContent: updatedReportWithDetails.htmlContent
      });
      return true;
    } catch (err) {
      console.error(err);
      
      // Update the section with the error
      const updatedReportWithError = { ...selectedReport };
      if (!updatedReportWithError.sections) return;
      
      updatedReportWithError.sections[sectionIndex] = {
        ...section,
        isGeneratingDetails: false,
        detailsError: 'Failed to generate details. Please try again.'
      };
      
      setSelectedReport(updatedReportWithError);
      return false;
    }
  };

  // Generate all section details
  const generateAllDetails = async () => {
    if (!selectedReport || !selectedReport.sections) return;
    
    setGeneratingAllDetails(true);
    setGeneratingAllProgress(0);
    
    // Filter sections that don't have details yet
    const sectionsToGenerate = selectedReport.sections
      .map((section, index) => ({ section, index }))
      .filter(({ section }) => !section.DetailedContent && !section.isGeneratingDetails);
    
    let successCount = 0;
    let currentReport = { ...selectedReport };
    // Ensure sections is treated as an array
    let currentSections = Array.isArray(currentReport.sections) ? [...currentReport.sections] : [];
    
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
      currentReport.sections = [...currentSections];
      setSelectedReport({ ...currentReport });
      
      try {
        const response = await fetch('/api/generate-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName: selectedReport.companyName,
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
        
        // Update our local copy with the generated details
        currentSections[index] = {
          ...section,
          DetailedContent: content,
          parsedContent: DOMPurify.sanitize(html),
          isGeneratingDetails: false
        };
        
        // Update the UI with the latest data
        currentReport.sections = [...currentSections];
        setSelectedReport({ ...currentReport });
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
        currentReport.sections = [...currentSections];
        setSelectedReport({ ...currentReport });
      }
      
      // Update progress
      setGeneratingAllProgress(Math.round(((i + 1) / sectionsToGenerate.length) * 100));
    }
    
    setGeneratingAllDetails(false);
    
    // Save the fully updated report if any details were successfully generated
    if (successCount > 0 && currentReport) {
      await saveReport({
        id: currentReport.id,
        companyName: currentReport.companyName,
        sections: currentReport.sections,
        htmlContent: currentReport.htmlContent
      });
    }
    
    // Return to ensure user knows the operation is complete
    return successCount;
  };

  // Handle report deletion
  const handleDeleteClick = (id: string) => {
    setReportToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    if (reportToDelete) {
      deleteReport(reportToDelete);
      if (selectedReport && selectedReport.id === reportToDelete) {
        setSelectedReport(null);
      }
    } else {
      clearAllReports();
      setSelectedReport(null);
    }
    setShowDeleteConfirmation(false);
    setReportToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setReportToDelete(null);
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    showDeleteConfirmation,
    reportToDelete,
    generatingAllDetails,
    generatingAllProgress,
    parsedHtmlContent,
    generateSectionDetails,
    generateAllDetails,
    handleDeleteClick,
    confirmDelete,
    cancelDelete,
    formatDate,
    setShowDeleteConfirmation
  };
}
