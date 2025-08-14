'use client';

import { useState } from 'react';
import { useReports, Report } from '../../../context/ReportContext';
import FullScreenReport from '@/components/FullScreenReport';

// Components
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import ErrorAlert from './components/ErrorAlert';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import ReportsSidebar from './components/ReportsSidebar';
import ReportDetailView from './components/ReportDetailView';

// Hooks
import { useReportAnalytics } from './hooks/useReportAnalytics';
import { useReportActions } from './hooks/useReportActions';
import { useReportFiltering } from './hooks/useReportFiltering';

export default function MyReports() {
  const { savedReports, deleteReport, clearAllReports, saveReport, isLoading, error: reportError } = useReports();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Use custom hooks
  const analytics = useReportAnalytics(savedReports);
  const filtering = useReportFiltering(savedReports);
  
  const reportActions = useReportActions({
    selectedReport,
    setSelectedReport,
    saveReport,
    deleteReport,
    clearAllReports
  });

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle export to PDF via full screen view
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
      <div className="mx-auto max-w-6xl px-6 py-12">
        {reportError && <ErrorAlert error={reportError} />}

        {isLoading ? (
          <LoadingState />
        ) : savedReports.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 w-full h-[calc(100vh-150px)] overflow-hidden">
            {/* Reports List - Collapsible sidebar */}
            <ReportsSidebar
              savedReports={savedReports}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              onDeleteReport={reportActions.handleDeleteClick}
              onClearAllReports={() => reportActions.setShowDeleteConfirmation(true)}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={toggleSidebar}
              formatDate={reportActions.formatDate}
            />

            {/* Report Detail View */}
            <ReportDetailView
              selectedReport={selectedReport}
              sidebarCollapsed={sidebarCollapsed}
              generatingAllDetails={reportActions.generatingAllDetails}
              generatingAllProgress={reportActions.generatingAllProgress}
              formatDate={reportActions.formatDate}
              generateAllDetails={reportActions.generateAllDetails}
              generateSectionDetails={reportActions.generateSectionDetails}
              onFullScreen={() => setIsFullScreen(true)}
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={reportActions.showDeleteConfirmation}
          reportToDelete={reportActions.reportToDelete}
          onConfirm={reportActions.confirmDelete}
          onCancel={reportActions.cancelDelete}
        />

        {/* Full Screen Report */}
        {isFullScreen && selectedReport && (
          <FullScreenReport 
            report={selectedReport}
            onClose={() => setIsFullScreen(false)}
          />
        )}
      </div>
    </div>
  );
}
