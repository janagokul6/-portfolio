/**
 * Core data types for the Job Email Scheduler application
 */

/**
 * Job status type union
 */
export type JobStatus = 'pending' | 'sent' | 'failed' | 'applied_via_portal';

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
  source?: 'email' | 'extension' | 'portal'; // How this application was submitted
  portalName?: string;           // ATS portal name (e.g., 'greenhouse', 'lever')
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
 * Extension capture request payload (text-based, from Chrome extension)
 */
export interface CaptureRequest {
  pageText: string;              // Raw text scraped from the job posting page
  pageUrl?: string;              // URL of the job posting page
  manualEmail?: string;          // Manually entered email when LLM couldn't find one
}

/**
 * Extension capture response payload
 */
export interface CaptureResponse {
  success: boolean;
  jobRecord?: JobRecord;
  error?: string;
  requiresEmail?: boolean;       // True when LLM could not find a recruiter email
  duplicate?: boolean;           // True when the same job is already in the queue
  company?: string;              // Returned alongside requiresEmail for context
  position?: string;             // Returned alongside requiresEmail for context
  region?: string;               // Returned alongside requiresEmail for context
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
  portalApplied: number;         // Jobs applied via portal
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

/**
 * Work Experience entry for Master Profile
 */
export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

/**
 * Education entry for Master Profile
 */
export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

/**
 * Master Profile for Auto-fill
 */
export interface MasterProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string; // Comma separated or free text
}
