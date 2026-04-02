/**
 * Cron Log Store — service for recording and querying cron hit logs
 */

import { CronLogEntry } from '@/lib/types';
import { connectDB } from '@/lib/db/mongoose';
import CronLogModel from '@/lib/db/models/CronLog';

/**
 * Convert a Mongoose CronLog document to a plain CronLogEntry
 */
function docToLogEntry(doc: any): CronLogEntry {
    return {
        hitAt: new Date(doc.hitAt).toISOString(),
        source: doc.source,
        durationMs: doc.durationMs,
        processed: doc.processed,
        errors: doc.errorMessages || [],
        status: doc.status,
        message: doc.message || undefined,
    };
}

export const cronLogStore = {
    /**
     * Record a cron hit log
     */
    async logCronHit(entry: CronLogEntry): Promise<void> {
        await connectDB();
        await CronLogModel.create({
            hitAt: new Date(entry.hitAt),
            source: entry.source,
            durationMs: entry.durationMs,
            processed: entry.processed,
            errorMessages: entry.errors,
            status: entry.status,
            message: entry.message,
        });
    },

    /**
     * Get recent cron logs (default: last 3 days)
     */
    async getRecentLogs(days: number = 3): Promise<CronLogEntry[]> {
        await connectDB();
        const since = new Date();
        since.setDate(since.getDate() - days);

        const docs = await CronLogModel.find({ hitAt: { $gte: since } })
            .sort({ hitAt: -1 })
            .lean();

        return docs.map(docToLogEntry);
    },
};
