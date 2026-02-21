'use client';

/**
 * Main Application Page
 * Chat-like interface for job email scheduler
 */

import { useState, useEffect } from 'react';
import { JobRecord, SyncResponse } from '@/lib/types';
import { saveJob, getAllJobs, mergeProcessedJobs } from '@/lib/utils/localStorage';
import UploadComponent from '@/components/UploadComponent';
import HistoryComponent from '@/components/HistoryComponent';

export default function Home() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
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
        // Merge processed jobs with localStorage
        mergeProcessedJobs(data.processedJobs);
        
        // Reload jobs from localStorage
        const updatedJobs = getAllJobs();
        setJobs(updatedJobs);
      }
    } catch (error) {
      console.error('Sync error:', error);
      // Don't show error to user for sync failures
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Handle successful upload
   */
  const handleUploadComplete = (jobRecord: JobRecord) => {
    // Save to localStorage
    saveJob(jobRecord);
    
    // Update state
    setJobs(prevJobs => [jobRecord, ...prevJobs]);
    
    // Clear any previous errors
    setError(null);
  };
  
  /**
   * Handle upload error
   */
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  };
  
  /**
   * Handle manual refresh
   */
  const handleRefresh = () => {
    syncJobs();
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Job Email Scheduler
          </h1>
          <p className="text-gray-600">
            Upload job screenshots and automate your follow-up emails
          </p>
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
        
        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Upload Screenshot
            </h2>
            <UploadComponent
              onUploadComplete={handleUploadComplete}
              onError={handleError}
            />
          </div>
          
          {/* Right Column - History */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <HistoryComponent
              jobs={jobs}
              onRefresh={handleRefresh}
            />
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
        
        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          <p>
            Emails are automatically sent at scheduled times based on job region
          </p>
        </div>
      </div>
    </main>
  );
}
