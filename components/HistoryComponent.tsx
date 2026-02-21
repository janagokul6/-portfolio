'use client';

/**
 * History Component
 * Displays job application history with status indicators
 */

import { JobRecord } from '@/lib/types';
import { format } from 'date-fns';

interface HistoryComponentProps {
  jobs: JobRecord[];
  onRefresh: () => void;
}

export default function HistoryComponent({ jobs, onRefresh }: HistoryComponentProps) {
  /**
   * Get status icon and color
   */
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'sent':
        return { icon: '✅', color: 'text-green-600', label: 'Sent' };
      case 'failed':
        return { icon: '❌', color: 'text-red-600', label: 'Failed' };
      case 'pending':
        return { icon: '⏳', color: 'text-yellow-600', label: 'Pending' };
      default:
        return { icon: '❓', color: 'text-gray-600', label: 'Unknown' };
    }
  };
  
  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    } catch {
      return timestamp;
    }
  };
  
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No job applications yet</p>
        <p className="text-sm mt-2">Upload a screenshot to get started</p>
      </div>
    );
  }
  
  // Sort jobs by creation date (newest first)
  const sortedJobs = [...jobs].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Application History ({jobs.length})
        </h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
      
      {/* Job list */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {sortedJobs.map((job) => {
          const statusDisplay = getStatusDisplay(job.status);
          
          return (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Status and Company */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{statusDisplay.icon}</span>
                    <span className={`font-medium ${statusDisplay.color}`}>
                      {statusDisplay.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {job.company}
                  </h3>
                  <p className="text-gray-600">{job.position}</p>
                </div>
              </div>
              
              {/* Details */}
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span>{job.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Region:</span>
                  <span>{job.region}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Created:</span>
                  <span>{formatTimestamp(job.createdAt)}</span>
                </div>
                {job.scheduledAt && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Scheduled:</span>
                    <span>{formatTimestamp(job.scheduledAt)}</span>
                  </div>
                )}
                {job.processedAt && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Processed:</span>
                    <span>{formatTimestamp(job.processedAt)}</span>
                  </div>
                )}
              </div>
              
              {/* Error message if failed */}
              {job.status === 'failed' && job.error && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <span className="font-medium">Error:</span> {job.error}
                </div>
              )}
              
              {/* Email preview */}
              {job.emailSubject && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View email
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Subject:</span>
                      <p className="text-gray-900">{job.emailSubject}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Body:</span>
                      <p className="text-gray-900 whitespace-pre-wrap">{job.emailBody}</p>
                    </div>
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
