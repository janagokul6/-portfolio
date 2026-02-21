/**
 * Cron API Route
 * Executes scheduled email sending
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDay, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { CronResponse } from '@/lib/types';
import { memoryStore } from '@/lib/services/memoryStore';
import { emailService } from '@/lib/services/email';
import { logError } from '@/lib/utils/validation';
import { getResumePath } from '@/lib/utils/emailFormatter';

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = getDay(date);
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Move date to next Monday if it's a weekend
 */
function moveToNextMonday(date: Date): Date {
  let result = new Date(date);
  while (isWeekend(result)) {
    result = addDays(result, 1);
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const currentTime = new Date();
    const errors: string[] = [];
    let processedCount = 0;
    let postponedCount = 0;
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Check if today is a weekend (skip check in development mode)
    if (!isDevelopment && isWeekend(currentTime)) {
      console.log(`Cron: Today is a weekend (${currentTime.toDateString()}). Skipping email sending.`);
      
      // Get all pending jobs that are ready to send
      const pendingJobs = memoryStore.getPendingJobs();
      const readyJobs = pendingJobs.filter(job => {
        const scheduledTime = new Date(job.scheduledAt);
        return scheduledTime <= currentTime;
      });
      
      // Postpone weekend jobs to next Monday
      for (const job of readyJobs) {
        const nextMonday = moveToNextMonday(currentTime);
        // Set to 10 AM on Monday
        const postponedTime = setHours(nextMonday, 10);
        const finalTime = setMinutes(setSeconds(setMilliseconds(postponedTime, 0), 0), 0);
        
        memoryStore.updateJob(job.id, {
          scheduledAt: finalTime.toISOString()
        });
        
        postponedCount++;
        console.log(`Cron: Postponed job ${job.id} to ${finalTime.toISOString()}`);
      }
      
      return NextResponse.json({
        processed: 0,
        errors: [],
        message: `Weekend detected. Postponed ${postponedCount} jobs to next Monday.`
      } as CronResponse & { message?: string }, { status: 200 });
    }
    
    // Log if running in development mode on weekend
    if (isDevelopment && isWeekend(currentTime)) {
      console.log(`Cron: Running in DEVELOPMENT mode on weekend (${currentTime.toDateString()}). Weekend check bypassed for testing.`);
    }
    
    // Get all pending jobs
    const pendingJobs = memoryStore.getPendingJobs();
    
    // Filter jobs that are ready to send
    // In development mode: ALL pending jobs are ready (ignore scheduled time)
    // In production mode: Only jobs where scheduledAt <= now
    const readyJobs = isDevelopment 
      ? pendingJobs // All pending jobs in development
      : pendingJobs.filter(job => {
          const scheduledTime = new Date(job.scheduledAt);
          return scheduledTime <= currentTime;
        });
    
    if (isDevelopment) {
      const allJobs = memoryStore.getAllJobs();
      console.log(`Cron: DEVELOPMENT mode - Total jobs: ${allJobs.length}, Pending: ${pendingJobs.length}, Processing: ${readyJobs.length}`);
      if (allJobs.length > 0) {
        console.log('Cron: Job statuses:', allJobs.map(j => `${j.company} (${j.status})`).join(', '));
      }
    }
    
    console.log(`Cron: Found ${readyJobs.length} jobs ready to send`);
    
    // Process each ready job
    for (const job of readyJobs) {
      try {
        // Get resume path
        const resumePath = getResumePath();
        
        // Attempt to send email with resume attachment
        await emailService.sendEmail(job.email, job.emailSubject, job.emailBody, resumePath);
        
        // Update job status to sent
        memoryStore.updateJob(job.id, {
          status: 'sent',
          processedAt: new Date().toISOString()
        });
        
        processedCount++;
        console.log(`Cron: Successfully sent email for job ${job.id}`);
        
      } catch (error) {
        // Update job status to failed with error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        memoryStore.updateJob(job.id, {
          status: 'failed',
          processedAt: new Date().toISOString(),
          error: errorMessage
        });
        
        errors.push(`Job ${job.id}: ${errorMessage}`);
        logError(error as Error, 'Email sending failed', {
          jobId: job.id,
          company: job.company,
          position: job.position
        });
        
        processedCount++;
      }
    }
    
    // Return summary
    const response: CronResponse = {
      processed: processedCount,
      errors
    };
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    logError(error as Error, 'Cron endpoint error');
    return NextResponse.json(
      { 
        processed: 0, 
        errors: ['Internal server error'] 
      } as CronResponse,
      { status: 500 }
    );
  }
}
