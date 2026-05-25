/**
 * Database-backed store for job records using MongoDB/Mongoose
 * Replaces the in-memory store with persistent storage
 */

import { JobRecord } from '@/lib/types';
import { connectDB } from '@/lib/db/mongoose';
import JobModel from '@/lib/db/models/Job';

/**
 * Convert a Mongoose Job document to a plain JobRecord
 */
function docToJobRecord(doc: any): JobRecord {
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
        processedAt: doc.processedAt || undefined,
        error: doc.error || undefined,
        imageUrl: doc.imageUrl || undefined,
        opened: doc.opened || false,
        openedAt: doc.openedAt || undefined,
        openCount: doc.openCount || 0,
        clicked: doc.clicked || false,
        clickedAt: doc.clickedAt || undefined,
        clickCount: doc.clickCount || 0,
    };
}

/**
 * Database Store — async methods backed by MongoDB
 */
export const dbStore = {
    /**
     * Save a new job to the database
     */
    async saveJob(job: JobRecord): Promise<void> {
        await connectDB();
        await JobModel.create({
            jobId: job.id,
            email: job.email,
            company: job.company,
            position: job.position,
            region: job.region,
            status: job.status,
            emailSubject: job.emailSubject,
            emailBody: job.emailBody,
            scheduledAt: job.scheduledAt,
            createdAt: job.createdAt,
            processedAt: job.processedAt,
            error: job.error,
            imageUrl: job.imageUrl,
        });
    },

    /**
     * Get a job by its UUID
     */
    async getJob(jobId: string): Promise<JobRecord | null> {
        await connectDB();
        const doc = await JobModel.findOne({ jobId }).lean();
        return doc ? docToJobRecord(doc) : null;
    },

    /**
     * Get all jobs, sorted by createdAt descending
     */
    async getAllJobs(): Promise<JobRecord[]> {
        await connectDB();
        const docs = await JobModel.find().sort({ createdAt: -1 }).lean();
        return docs.map(docToJobRecord);
    },

    /**
     * Get all pending jobs, sorted by scheduledAt ascending
     */
    async getPendingJobs(): Promise<JobRecord[]> {
        await connectDB();
        const docs = await JobModel.find({ status: 'pending' })
            .sort({ scheduledAt: 1 })
            .lean();
        return docs.map(docToJobRecord);
    },

    /**
     * Get all processed jobs (sent or failed)
     */
    async getProcessedJobs(): Promise<JobRecord[]> {
        await connectDB();
        const docs = await JobModel.find({ status: { $in: ['sent', 'failed'] } })
            .sort({ createdAt: -1 })
            .lean();
        return docs.map(docToJobRecord);
    },

    /**
     * Update a job with partial updates
     */
    async updateJob(jobId: string, updates: Partial<JobRecord>): Promise<void> {
        await connectDB();
        // Map 'id' field to 'jobId' if present in updates
        const { id, ...rest } = updates as any;
        const mongoUpdates: any = { ...rest };
        if (id !== undefined) {
            mongoUpdates.jobId = id;
        }
        await JobModel.updateOne({ jobId }, { $set: mongoUpdates });
    },

    /**
     * Delete a job from the database
     */
    async deleteJob(jobId: string): Promise<void> {
        await connectDB();
        await JobModel.deleteOne({ jobId });
    },
};
