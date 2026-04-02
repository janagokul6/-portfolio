/**
 * Mongoose schema and model for Cron Hit Logs
 * Auto-deleted after 7 days via MongoDB TTL index
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { CronLogSource, CronLogStatus } from '@/lib/types';

/**
 * Mongoose document interface for CronLog
 */
export interface ICronLogDocument extends Document {
    hitAt: Date;
    source: CronLogSource;
    durationMs: number;
    processed: number;
    errorMessages: string[];
    status: CronLogStatus;
    message?: string;
}

const CronLogSchema = new Schema<ICronLogDocument>(
    {
        hitAt: {
            type: Date,
            required: true,
            index: { expires: 604800 }, // TTL: 7 days (7 * 24 * 60 * 60 = 604800 seconds)
        },
        source: {
            type: String,
            enum: ['cron', 'ui'] as CronLogSource[],
            required: true,
        },
        durationMs: {
            type: Number,
            required: true,
        },
        processed: {
            type: Number,
            required: true,
            default: 0,
        },
        errorMessages: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ['success', 'partial', 'skipped', 'error'] as CronLogStatus[],
            required: true,
        },
        message: {
            type: String,
        },
    },
    {
        timestamps: false,
    }
);

/**
 * Prevent model recompilation in Next.js hot-reload
 */
const CronLogModel: Model<ICronLogDocument> =
    mongoose.models.CronLog || mongoose.model<ICronLogDocument>('CronLog', CronLogSchema);

export default CronLogModel;
