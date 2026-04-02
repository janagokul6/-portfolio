'use client';

/**
 * CronTimeline Component
 * Compact horizontal timeline of recent cron hits displayed in the status bar.
 * Each dot represents one hit; color indicates status; hover shows details.
 */

import { useState } from 'react';
import { CronLogEntry } from '@/lib/types';

interface CronTimelineProps {
    logs: CronLogEntry[];
}

const MAX_DOTS = 20;

function getStatusColor(status: string): string {
    switch (status) {
        case 'success':
            return 'bg-green-400';
        case 'partial':
            return 'bg-yellow-400';
        case 'skipped':
            return 'bg-yellow-300';
        case 'error':
            return 'bg-red-400';
        default:
            return 'bg-gray-400';
    }
}

function getStatusRingColor(status: string): string {
    switch (status) {
        case 'success':
            return 'ring-green-300/50';
        case 'partial':
            return 'ring-yellow-300/50';
        case 'skipped':
            return 'ring-yellow-200/50';
        case 'error':
            return 'ring-red-300/50';
        default:
            return 'ring-gray-300/50';
    }
}

function formatLocalTime(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return isoString;
    }
}

function formatLocalDate(isoString: string): string {
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return '';
    }
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export default function CronTimeline({ logs }: CronTimelineProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (logs.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <span className="font-medium text-gray-300">Cron:</span>
                <span className="text-gray-500 text-xs">no recent hits</span>
            </div>
        );
    }

    // Show most recent first, cap at MAX_DOTS
    const visibleLogs = logs.slice(0, MAX_DOTS).reverse(); // reverse so timeline reads left → right (oldest → newest)
    const latestLog = logs[0]; // already sorted newest first from API

    return (
        <div className="flex items-center gap-2 relative">
            <span className="font-medium text-gray-300 flex-shrink-0">Cron:</span>

            {/* Dot timeline */}
            <div className="flex items-center gap-[3px]">
                {visibleLogs.map((log, index) => {
                    const actualIndex = index;
                    const isHovered = hoveredIndex === actualIndex;

                    return (
                        <div key={`${log.hitAt}-${index}`} className="relative">
                            <div
                                className={`
                  w-2 h-2 rounded-full cursor-pointer transition-all duration-150
                  ${getStatusColor(log.status)}
                  ${isHovered ? `ring-2 ${getStatusRingColor(log.status)} scale-150` : ''}
                `}
                                onMouseEnter={() => setHoveredIndex(actualIndex)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />

                            {/* Tooltip */}
                            {isHovered && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-700">
                                        <div className="font-medium mb-1">
                                            {formatLocalDate(log.hitAt)} {formatLocalTime(log.hitAt)}
                                        </div>
                                        <div className="flex flex-col gap-0.5 text-gray-300">
                                            <span>
                                                Source: <span className={log.source === 'cron' ? 'text-blue-300' : 'text-purple-300'}>{log.source === 'cron' ? '⏰ Cron' : '🖱 UI'}</span>
                                            </span>
                                            <span>Status: <span className={
                                                log.status === 'success' ? 'text-green-300' :
                                                    log.status === 'error' ? 'text-red-300' : 'text-yellow-300'
                                            }>{log.status}</span></span>
                                            <span>Processed: {log.processed} job{log.processed !== 1 ? 's' : ''}</span>
                                            <span>Duration: {formatDuration(log.durationMs)}</span>
                                            {log.message && (
                                                <span className="text-gray-400 italic mt-0.5">{log.message}</span>
                                            )}
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Last hit label */}
            <span className="text-gray-400 text-xs flex-shrink-0 hidden sm:inline">
                last: {formatLocalTime(latestLog.hitAt)}
            </span>
        </div>
    );
}
