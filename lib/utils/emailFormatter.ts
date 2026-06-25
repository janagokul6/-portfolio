/**
 * Email formatting utilities
 */

import path from 'path';

/**
 * Add signature to email body
 */
export function addSignature(emailBody: string): string {
  const name = process.env.APPLICANT_NAME;
  if (!name) {
    throw new Error('APPLICANT_NAME environment variable is required');
  }
  const contact = process.env.APPLICANT_CONTACT;
  // Simple signature format
  const signature = `\n\nBest regards,\n${name}\n${contact}`;

  return emailBody + signature;
}

/**
 * Get resume file path from environment or default.
 * Uses an absolute path so it works correctly in Vercel serverless
 * where relative paths are resolved against an unpredictable cwd.
 */
export function getResumePath(): string {
  if (process.env.RESUME_PATH) {
    return process.env.RESUME_PATH;
  }
  // Build absolute path — process.cwd() is the project root on Vercel
  return path.join(process.cwd(), 'public', 'Gokul Jana (resume).pdf');
}
