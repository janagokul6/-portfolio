/**
 * Mongoose schema and model for JobRecord
 * Fields match the existing JobRecord TypeScript interface exactly
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { JobRecord, JobStatus } from '@/lib/types';

/**
 * Mongoose document interface extending JobRecord
 */
export interface IJobDocument extends Omit<JobRecord, 'id'>, Document {
    jobId: string; // Maps to JobRecord.id (UUID)
}

const JobSchema = new Schema<IJobDocument>(
    {
        jobId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
        },
        company: {
            type: String,
            required: true,
        },
        position: {
            type: String,
            required: true,
        },
        region: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed'] as JobStatus[],
            required: true,
            default: 'pending',
            index: true,
        },
        emailSubject: {
            type: String,
            required: true,
        },
        emailBody: {
            type: String,
            required: true,
        },
        scheduledAt: {
            type: String,
            required: true,
            index: true,
        },
        createdAt: {
            type: String,
            required: true,
        },
        processedAt: {
            type: String,
        },
        error: {
            type: String,
        },
        imageUrl: {
            type: String,
        },
        opened: {
            type: Boolean,
            default: false,
        },
        openedAt: {
            type: String,
        },
        openCount: {
            type: Number,
            default: 0,
        },
        clicked: {
            type: Boolean,
            default: false,
        },
        clickedAt: {
            type: String,
        },
        clickCount: {
            type: Number,
            default: 0,
        },
    },
    {
        // Disable Mongoose's automatic timestamps since we manage createdAt manually
        timestamps: false,
    }
);

/**
 * Convert Mongoose document to plain JobRecord
 */
JobSchema.methods.toJobRecord = function (): JobRecord {
    const doc = this.toObject();
    return {
        id: doc.jobId,
        email: doc.email,
        company: doc.company,
        position: doc.position,
        region: doc.region,
        status: doc.status,
        emailSubject: doc.emailSubject,
        emailBody: doc.emailBody,
        scheduledAt: doc.scheduledAt,
        createdAt: doc.createdAt,
        processedAt: doc.processedAt,
        error: doc.error,
        imageUrl: doc.imageUrl,
        opened: doc.opened,
        openedAt: doc.openedAt,
        openCount: doc.openCount,
        clicked: doc.clicked,
        clickedAt: doc.clickedAt,
        clickCount: doc.clickCount,
    };
};

/**
 * Prevent model recompilation in Next.js hot-reload
 */
const JobModel: Model<IJobDocument> =
    mongoose.models.Job || mongoose.model<IJobDocument>('Job', JobSchema);

export default JobModel;
