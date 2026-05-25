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
  opened?: boolean;              // Has the email been opened?
  openedAt?: string;             // ISO timestamp of first open
  openCount?: number;            // Total number of open events
  clicked?: boolean;             // Has any link been clicked?
  clickedAt?: string;            // ISO timestamp of first click
  clickCount?: number;           // Total number of click events
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
  opened: number;                // Jobs where email was opened
  clicked: number;               // Jobs where link was clicked
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

/**
 * Cron log source — how the /api/cron endpoint was triggered
 */
export type CronLogSource = 'cron' | 'ui';

/**
 * Cron log status
 */
export type CronLogStatus = 'success' | 'partial' | 'skipped' | 'error';

/**
 * Cron hit log entry
 */
export interface CronLogEntry {
  hitAt: string;               // ISO timestamp (UTC)
  source: CronLogSource;       // External cron or UI
  durationMs: number;          // Run duration in milliseconds
  processed: number;           // Number of jobs processed
  errors: string[];            // Error messages if any
  status: CronLogStatus;       // Overall result
  message?: string;            // Optional info message
}
