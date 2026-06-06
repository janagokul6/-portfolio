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
      case 'applied_via_portal':
        return { icon: '🏢', color: 'text-purple-600', label: 'Applied (Portal)' };
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
          <h2 className="text-lg font-semibold text-[var(--white)]">Applications (0)</h2>
          <button
            onClick={onRefresh}
            className="p-2 text-[var(--gray)] hover:bg-[var(--card)] hover:text-[var(--white)] rounded-lg transition-colors"
            aria-label="Refresh history"
          >
            <RefreshIcon />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-center py-8 text-[var(--gray)]">
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
        <h2 className="text-lg font-semibold text-[var(--white)] truncate">
          Applications ({jobs.length})
        </h2>
        <button
          onClick={onRefresh}
          className="p-2 text-[var(--gray)] hover:bg-[var(--card)] hover:text-[var(--white)] rounded-lg transition-colors flex-shrink-0"
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
              className="rounded-lg overflow-hidden transition-all hover:border-[var(--border-hover)] hover:shadow-[0_0_20px_rgba(59,130,246,0.06)]"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
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
                  <p className="font-medium text-[var(--white)] truncate">{job.company}</p>
                  <p className="text-sm text-[var(--gray)] truncate">{job.position}</p>
                </div>
                <span className={`text-xs font-medium flex-shrink-0 ${statusDisplay.color}`}>
                  {statusDisplay.label}
                </span>
                <span className="flex-shrink-0 text-[var(--dim)]">
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
                className={isExpanded ? 'block border-t border-[var(--border)]' : 'hidden'}
              >
                <div className="p-3 sm:p-4 pt-2 bg-[rgba(0,0,0,0.15)] text-[var(--gray)] text-sm space-y-2">
                  {job.status === 'applied_via_portal' ? (
                    <DetailRow label="Source" value={`Portal (${job.portalName || 'Unknown ATS'})`} />
                  ) : (
                    <DetailRow label="Email" value={job.email} />
                  )}
                  {job.region && <DetailRow label="Region" value={job.region} />}
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
                      <div className="mt-2 p-2 bg-[var(--bg2)] rounded border border-[var(--border)] space-y-1">
                        <p><span className="font-medium text-[var(--dim)]">Subject: </span><span className="text-[var(--white)]">{job.emailSubject}</span></p>
                        <p className="text-[var(--gray)] whitespace-pre-wrap break-words">{job.emailBody}</p>
                      </div>
                    </details>
                  )}
                  {/* Tracking badges for sent emails */}
                  {job.status === 'sent' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.opened ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          👁️ Opened ({job.openCount || 1}x)
                        </span>
                      ) : null}
                      {job.clicked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          🔗 Clicked ({job.clickCount || 1}x)
                        </span>
                      ) : null}
                      {!job.opened && !job.clicked && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--faint)] text-[var(--gray)] border border-[var(--border)]">
                          📭 No activity yet
                        </span>
                      )}
                    </div>
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
      <span className="font-medium text-[var(--dim)] flex-shrink-0">{label}:</span>
      <span className="text-[var(--white)] truncate">{value}</span>
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
