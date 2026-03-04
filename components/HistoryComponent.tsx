'use client';

/**
 * History Component
 * Compact list of job applications; each item is expandable to show details.
 * List is scrollable inside the sidebar; responsive for mobile.
 */

import { useState } from 'react';
import { JobRecord } from '@/lib/types';
import { format } from 'date-fns';

interface HistoryComponentProps {
  jobs: JobRecord[];
  onRefresh: () => void;
}

export default function HistoryComponent({ jobs, onRefresh }: HistoryComponentProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM d, h:mm a');
    } catch {
      return timestamp;
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex justify-between items-center gap-2 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Applications (0)</h2>
          <button
            onClick={onRefresh}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Refresh history"
          >
            <RefreshIcon />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-center py-8 text-gray-500">
          <div>
            <p className="font-medium">No applications yet</p>
            <p className="text-sm mt-1">Upload a screenshot to get started</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const MAX_VISIBLE = 15;
  const visibleJobs = sortedJobs.slice(0, MAX_VISIBLE);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header: fixed height, not scrollable */}
      <div className="flex justify-between items-center gap-2 flex-shrink-0 mb-3">
        <h2 className="text-lg font-semibold text-gray-800 truncate">
          Applications ({jobs.length})
        </h2>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          aria-label="Refresh history"
        >
          <RefreshIcon />
        </button>
      </div>

      {/* Scrollable list: maintains height, scrolls inside sidebar */}
      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-1">
        {visibleJobs.map((job) => {
          const statusDisplay = getStatusDisplay(job.status);
          const isExpanded = expandedId === job.id;

          return (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-shadow hover:border-gray-300 hover:shadow-sm"
            >
              {/* List row: compact, consistent height */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : job.id)}
                className="w-full text-left flex items-center gap-3 py-3 px-3 sm:px-4 min-h-[56px]"
                aria-expanded={isExpanded}
                aria-controls={`history-details-${job.id}`}
              >
                <span className="text-lg flex-shrink-0" aria-hidden>
                  {statusDisplay.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{job.company}</p>
                  <p className="text-sm text-gray-600 truncate">{job.position}</p>
                </div>
                <span className={`text-xs font-medium flex-shrink-0 ${statusDisplay.color}`}>
                  {statusDisplay.label}
                </span>
                <span className="flex-shrink-0 text-gray-400">
                  {isExpanded ? (
                    <ChevronUpIcon />
                  ) : (
                    <ChevronDownIcon />
                  )}
                </span>
              </button>

              {/* Expandable details */}
              <div
                id={`history-details-${job.id}`}
                role="region"
                aria-label={`Details for ${job.company}`}
                className={isExpanded ? 'block border-t border-gray-100' : 'hidden'}
              >
                <div className="p-3 sm:p-4 pt-2 bg-gray-50/80 text-sm space-y-2">
                  <DetailRow label="Email" value={job.email} />
                  <DetailRow label="Region" value={job.region} />
                  <DetailRow label="Created" value={formatTimestamp(job.createdAt)} />
                  {job.scheduledAt && (
                    <DetailRow label="Scheduled" value={formatTimestamp(job.scheduledAt)} />
                  )}
                  {job.processedAt && (
                    <DetailRow label="Processed" value={formatTimestamp(job.processedAt)} />
                  )}
                  {job.status === 'failed' && job.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-red-700">
                      <span className="font-medium">Error: </span>
                      {job.error}
                    </div>
                  )}
                  {job.emailSubject && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-700">
                        View email
                      </summary>
                      <div className="mt-2 p-2 bg-white rounded border border-gray-100 space-y-1">
                        <p><span className="font-medium text-gray-700">Subject: </span>{job.emailSubject}</p>
                        <p className="text-gray-900 whitespace-pre-wrap break-words">{job.emailBody}</p>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 min-w-0">
      <span className="font-medium text-gray-600 flex-shrink-0">{label}:</span>
      <span className="text-gray-900 truncate">{value}</span>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}
