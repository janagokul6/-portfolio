/**
 * Local Storage Manager
 * Manages persistent storage of job records in browser
 */

import { JobRecord } from '@/lib/types';

const STORAGE_KEY = 'job_email_scheduler_jobs';

/**
 * Local Storage Manager interface
 */
export interface LocalStorageManager {
  saveJob(job: JobRecord): void;
  updateJob(jobId: string, updates: Partial<JobRecord>): void;
  getAllJobs(): JobRecord[];
  clearAll(): void;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear old completed jobs to free up space
 */
function clearOldJobs(): void {
  try {
    const jobs = getAllJobs();
    // Keep only jobs from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentJobs = jobs.filter(job => {
      const createdAt = new Date(job.createdAt);
      return createdAt > thirtyDaysAgo;
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentJobs));
  } catch (error) {
    console.error('Failed to clear old jobs:', error);
  }
}

/**
 * Save a job to localStorage
 */
export function saveJob(job: JobRecord): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }
  
  try {
    const jobs = getAllJobs();
    
    // Check if job already exists
    const existingIndex = jobs.findIndex(j => j.id === job.id);
    if (existingIndex >= 0) {
      jobs[existingIndex] = job;
    } else {
      jobs.push(job);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (error) {
    // Handle QuotaExceededError
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearOldJobs();
      // Retry
      try {
        const jobs = getAllJobs();
        const existingIndex = jobs.findIndex(j => j.id === job.id);
        if (existingIndex >= 0) {
          jobs[existingIndex] = job;
        } else {
          jobs.push(job);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
      } catch (retryError) {
        console.error('Failed to save job after clearing old jobs:', retryError);
      }
    } else {
      console.error('Failed to save job:', error);
    }
  }
}

/**
 * Update a job with partial updates
 */
export function updateJob(jobId: string, updates: Partial<JobRecord>): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return;
  }
  
  try {
    const jobs = getAllJobs();
    const jobIndex = jobs.findIndex(j => j.id === jobId);
    
    if (jobIndex >= 0) {
      jobs[jobIndex] = { ...jobs[jobIndex], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }
  } catch (error) {
    console.error('Failed to update job:', error);
  }
}

/**
 * Get all jobs from localStorage
 */
export function getAllJobs(): JobRecord[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    
    const jobs = JSON.parse(data) as JobRecord[];
    return jobs;
  } catch (error) {
    console.error('Failed to get jobs:', error);
    return [];
  }
}

/**
 * Clear all jobs from localStorage
 */
export function clearAll(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear jobs:', error);
  }
}

/**
 * Merge processed jobs from sync endpoint with local storage
 */
export function mergeProcessedJobs(processedJobs: JobRecord[]): void {
  if (!isLocalStorageAvailable()) {
    return;
  }
  
  try {
    const localJobs = getAllJobs();
    
    // Update existing jobs with processed data
    for (const processedJob of processedJobs) {
      const localIndex = localJobs.findIndex(j => j.id === processedJob.id);
      if (localIndex >= 0) {
        // Merge processed data (status, processedAt, error)
        localJobs[localIndex] = {
          ...localJobs[localIndex],
          status: processedJob.status,
          processedAt: processedJob.processedAt,
          error: processedJob.error
        };
      } else {
        // Add new processed job
        localJobs.push(processedJob);
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localJobs));
  } catch (error) {
    console.error('Failed to merge processed jobs:', error);
  }
}

/**
 * Default local storage manager
 */
export const localStorageManager: LocalStorageManager = {
  saveJob,
  updateJob,
  getAllJobs,
  clearAll
};
