'use client';

/**
 * Main Application Page
 * Sidebar layout: History in left sidebar (desktop always visible, mobile drawer via hamburger).
 * Upload remains the main content.
 */

import { useState, useEffect, useCallback } from 'react';
import { JobRecord, SyncResponse } from '@/lib/types';
import { saveJob, getAllJobs, mergeProcessedJobs } from '@/lib/utils/localStorage';
import UploadComponent from '@/components/UploadComponent';
import HistoryComponent from '@/components/HistoryComponent';

const SIDEBAR_ID = 'history-sidebar';

export default function Home() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /**
   * Load jobs from localStorage on mount
   */
  useEffect(() => {
    const loadedJobs = getAllJobs();
    setJobs(loadedJobs);

    // Auto-sync on load
    syncJobs();
  }, []);

  /**
   * Close mobile sidebar on Escape
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Sync processed jobs from backend
   */
  const syncJobs = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync');
      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data: SyncResponse = await response.json();

      if (data.processedJobs.length > 0) {
        mergeProcessedJobs(data.processedJobs);
        const updatedJobs = getAllJobs();
        setJobs(updatedJobs);
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUploadComplete = (jobRecord: JobRecord) => {
    saveJob(jobRecord);
    setJobs((prev) => [jobRecord, ...prev]);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const handleRefresh = useCallback(() => {
    syncJobs();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Mobile backdrop: only when sidebar is open on small screens */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden"
        style={{ opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? 'auto' : 'none' }}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar: desktop = in flow; mobile = fixed drawer */}
      <aside
        id={SIDEBAR_ID}
        className={`
          flex flex-col flex-shrink-0 w-72 md:w-80
          bg-gray-50 border-r border-gray-200
          md:relative md:translate-x-0 md:transition-none
          fixed inset-y-0 left-0 z-50
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        aria-label="Application history"
      >
        {/* Sidebar header: title + close (mobile) */}
        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 truncate">
            History
          </h2>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close history sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* History: header fixed, list scrolls inside */}
        <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
          <HistoryComponent jobs={jobs} onRefresh={handleRefresh} />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="container mx-auto px-4 py-6 md:py-8 flex-1">
          {/* Header with hamburger (mobile) */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-white/80 hover:text-gray-900"
              aria-label="Open history sidebar"
              aria-expanded={sidebarOpen}
              aria-controls={SIDEBAR_ID}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-center md:text-center flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                Job Email Scheduler
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Upload job screenshots and automate your follow-up emails
              </p>
            </div>
            {/* Spacer for mobile so title stays centered */}
            <div className="w-10 h-10 md:hidden flex-shrink-0" aria-hidden="true" />
          </div>

          {/* Error Display */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Upload - main content */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Upload Screenshot
              </h2>
              <UploadComponent
                onUploadComplete={handleUploadComplete}
                onError={handleError}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-600 text-sm">
            <p>
              Emails are automatically sent at scheduled times based on job region
            </p>
          </div>
        </div>
      </div>

      {/* Sync Indicator */}
      {isSyncing && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Syncing...
        </div>
      )}
    </main>
  );
}
