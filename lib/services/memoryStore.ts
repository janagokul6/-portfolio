/**
 * In-memory storage for pending and processed jobs
 * This provides temporary storage during the job lifecycle
 */

import { JobRecord } from '@/lib/types';

/**
 * Memory Store interface
 */
export interface MemoryStore {
  saveJob(job: JobRecord): void;
  getJob(jobId: string): JobRecord | null;
  getAllJobs(): JobRecord[];
  getPendingJobs(): JobRecord[];
  getProcessedJobs(): JobRecord[];
  updateJob(jobId: string, updates: Partial<JobRecord>): void;
  deleteJob(jobId: string): void;
}

/**
 * Simple in-memory implementation using Map
 * Thread-safe for serverless environment
 */
class InMemoryStore implements MemoryStore {
  private jobsMap: Map<string, JobRecord>;

  constructor() {
    this.jobsMap = new Map();
  }

  /**
   * Save a job to the store
   */
  saveJob(job: JobRecord): void {
    this.jobsMap.set(job.id, { ...job });
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): JobRecord | null {
    const job = this.jobsMap.get(jobId);
    return job ? { ...job } : null;
  }

  /**
   * Get all jobs
   */
  getAllJobs(): JobRecord[] {
    return Array.from(this.jobsMap.values()).map(job => ({ ...job }));
  }

  /**
   * Get all pending jobs
   */
  getPendingJobs(): JobRecord[] {
    return Array.from(this.jobsMap.values())
      .filter(job => job.status === 'pending')
      .map(job => ({ ...job }));
  }

  /**
   * Get all processed jobs (sent or failed)
   */
  getProcessedJobs(): JobRecord[] {
    return Array.from(this.jobsMap.values())
      .filter(job => job.status === 'sent' || job.status === 'failed')
      .map(job => ({ ...job }));
  }

  /**
   * Update a job with partial updates
   */
  updateJob(jobId: string, updates: Partial<JobRecord>): void {
    const job = this.jobsMap.get(jobId);
    if (job) {
      this.jobsMap.set(jobId, { ...job, ...updates });
    }
  }

  /**
   * Delete a job from the store
   */
  deleteJob(jobId: string): void {
    this.jobsMap.delete(jobId);
  }
}

/**
 * Singleton instance of the memory store
 * Persists across function invocations in the same container
 */
export const memoryStore: MemoryStore = new InMemoryStore();
