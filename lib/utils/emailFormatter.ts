/**
 * Email formatting utilities
 */

/**
 * Add signature to email body
 */
export function addSignature(emailBody: string): string {
  const name = process.env.APPLICANT_NAME || 'Gokul Jana';
  const contact = process.env.APPLICANT_CONTACT;
  
  // Simple signature format
  const signature = `\n\nBest regards,\n${name}\n${contact}`;
  
  return emailBody + signature;
}

/**
 * Get resume file path from environment or default
 */
export function getResumePath(): string {
  return process.env.RESUME_PATH || 'public/Gokul Jana (resume).pdf';
}
