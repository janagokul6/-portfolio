/**
 * Core data types for the Job Email Scheduler application
 */

/**
 * Job status type union
 */
export type JobStatus = 'pending' | 'sent' | 'failed';

/**
 * Core data structure representing a job application
 */
export interface JobRecord {
  id: string;                    // Unique identifier (UUID)
  email: string;                 // Recipient email address
  company: string;               // Company name
  position: string;              // Job position title
  region: string;                // Geographic region
  status: JobStatus;             // Current status
  emailSubject: string;          // Generated email subject
  emailBody: string;             // Generated email body
  scheduledAt: string;           // ISO timestamp for scheduled send
  createdAt: string;             // ISO timestamp of creation
  processedAt?: string;          // ISO timestamp when processed
  error?: string;                // Error message if failed
  imageUrl?: string;             // Optional: stored image reference
}

/**
 * Extracted job details from LLM
 */
export interface ExtractedDetails {
  email: string;                 // Recipient email address
  company: string;               // Company name
  position: string;              // Job position title
  region: string;                // Geographic region
}

/**
 * Generated email draft from LLM
 */
export interface EmailDraft {
  subject: string;               // Email subject line
  body: string;                  // Email body content
}

/**
 * Upload request payload
 */
export interface UploadRequest {
  image: string;                 // Base64 encoded image
  promptText?: string;           // Optional user prompt
}

/**
 * Upload response payload
 */
export interface UploadResponse {
  success: boolean;
  jobRecord?: JobRecord;
  error?: string;
}

/**
 * Sync response payload
 */
export interface SyncResponse {
  processedJobs: JobRecord[];
}

/**
 * In-memory store status (current server-side store counts)
 */
export interface StoreStatusResponse {
  total: number;
  pending: number;
  processed: number;
}

/**
 * Cron response payload
 */
export interface CronResponse {
  processed: number;
  errors: string[];
}

/**
 * Error response payload
 */
export interface ErrorResponse {
  error: string;
  details?: Record<string, unknown>;
}

/**
 * SMTP configuration
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}
