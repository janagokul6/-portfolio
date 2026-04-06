/**
 * Email Service for sending emails via Gmail SMTP
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { SMTPConfig } from '@/lib/types';

/**
 * Email Service interface
 */
export interface EmailService {
  sendEmail(to: string, subject: string, body: string, attachmentPath?: string): Promise<void>;
}

/**
 * Get SMTP configuration from environment variables
 */
function getSMTPConfig(): SMTPConfig {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  
  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required');
  }
  
  return {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user,
      pass
    }
  };
}

/**
 * Gmail SMTP Email Service Implementation
 */
class GmailEmailService implements EmailService {
  private transporter: Transporter;
  private fromAddress: string;
  
  constructor() {
    const config = getSMTPConfig();
    this.fromAddress = process.env.FROM_MAIL || config.auth.user;
    
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      // Connection timeout
      connectionTimeout: 10000,
      // Socket timeout
      socketTimeout: 10000
    });
  }
  
  /**
   * Send an email via Gmail SMTP
   * Includes retry logic for rate limits
   */
  async sendEmail(to: string, subject: string, body: string, attachmentPath?: string): Promise<void> {
    const mailOptions: any = {
      from: this.fromAddress,
      to: process.env.NODE_ENV === 'development' ?  process.env.TO_MAIL : to,
      subject,
      text: body
    };
    
    // Add attachment if provided
    if (attachmentPath) {
      mailOptions.attachments = [{
        path: attachmentPath
      }];
    }
    
    let lastError: Error | null = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.transporter.sendMail(mailOptions);
        return; // Success
      } catch (error) {
        lastError = error as Error;
        
        // Check for specific error codes
        const errorCode = (error as any).code;
        const errorMessage = (error as Error).message;
        
        // Authentication error - don't retry
        if (errorCode === 'EAUTH') {
          throw new Error('Gmail authentication failed. Check credentials.');
        }
        
        // Rate limit error - retry after delay
        if (errorCode === 'RATE_LIMIT' || errorMessage.includes('rate limit')) {
          if (attempt < maxRetries - 1) {
            // Wait 5 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
        }
        
        // Network timeout - retry
        if (errorCode === 'ETIMEDOUT' || errorCode === 'ESOCKET') {
          if (attempt < maxRetries - 1) {
            // Wait 3 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          throw new Error('Email sending timed out. Will retry later.');
        }
        
        // Other errors - throw immediately
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Failed to send email after retries');
  }
  
  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}

/**
 * Create email service instance
 */
export function createEmailService(): EmailService {
  return new GmailEmailService();
}

/**
 * Default email service instance
 */
export const emailService = createEmailService();
