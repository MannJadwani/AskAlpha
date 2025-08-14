/**
 * Utility functions for exporting reports
 */

import { Report } from '../context/ReportContext';

/**
 * Convert a report to plain text format
 */
export function convertReportToText(report: Report): string {
  let text = `EQUITY RESEARCH REPORT: ${report.companyName.toUpperCase()}\n`;
  text += `Generated on: ${new Date(report.timestamp).toLocaleString()}\n\n`;
  
  if (report.sections && report.sections.length > 0) {
    // For structured reports with sections
    report.sections.forEach((section, index) => {
      text += `SECTION ${index + 1}: ${section.SectionName.toUpperCase()}\n`;
      text += `${'-'.repeat(60)}\n\n`;
      
      if (section.DetailedContent) {
        // Use the raw DetailedContent (markdown) rather than the HTML
        text += `${section.DetailedContent}\n\n`;
      } else {
        text += `Information Needed: ${section.InformationNeeded}\n\n`;
      }
    });
  } else if (report.htmlContent) {
    // For plain text reports
    text += report.htmlContent;
  }
  
  return text;
}

/**
 * Download a report as a text file
 */
export function downloadReportAsText(report: Report) {
  const text = convertReportToText(report);
  const filename = `${report.companyName.replace(/\s+/g, '_')}_Report_${new Date(report.timestamp).toISOString().split('T')[0]}.txt`;
  
  // Create a blob with the text content
  const blob = new Blob([text], { type: 'text/plain' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // Trigger the download
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 