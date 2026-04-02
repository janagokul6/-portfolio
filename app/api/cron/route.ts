/**
 * Cron API Route
 * Executes scheduled email sending. Supports external cron (e.g. cron-job.org):
 * - Optional CRON_SECRET for auth (header or query)
 * - In-memory lock to prevent overlapping runs
 * - Jobs processed in order by scheduledAt
 * - Every hit is logged to MongoDB for the timeline UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDay, addDays, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { CronResponse, CronLogSource, CronLogStatus } from '@/lib/types';
import { dbStore } from '@/lib/services/dbStore';
import { emailService } from '@/lib/services/email';
import { cronLogStore } from '@/lib/services/cronLogStore';
import { logError } from '@/lib/utils/validation';
import { getResumePath } from '@/lib/utils/emailFormatter';

/** Prevents overlapping runs when external cron hits while a run is in progress */
let cronRunInProgress = false;

/**
 * Validate optional CRON_SECRET. If env is set, request must provide it via
 * Authorization: Bearer <secret>, X-Cron-Secret: <secret>, or ?secret=<secret>.
 */
function validateCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get('authorization');
  const bearer = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const headerSecret = request.headers.get('x-cron-secret');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const provided = bearer ?? headerSecret ?? querySecret ?? '';
  return provided === secret;
}

/**
 * Detect if the request came from an external cron (has secret) or UI
 */
function detectSource(request: NextRequest): CronLogSource {
  const auth = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');
  const querySecret = request.nextUrl.searchParams.get('secret');
  // If any cron secret was provided, it's an external cron hit
  if (auth || headerSecret || querySecret) return 'cron';
  return 'ui';
}

function isWeekend(date: Date): boolean {
  const day = getDay(date);
  return day === 0 || day === 6;
}

function moveToNextMonday(date: Date): Date {
  let result = new Date(date);
  while (isWeekend(result)) {
    result = addDays(result, 1);
  }
  return result;
}

export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { processed: 0, errors: ['Unauthorized'] } as CronResponse,
      { status: 401 }
    );
  }

  if (cronRunInProgress) {
    return NextResponse.json(
      { processed: 0, errors: [], message: 'Cron run already in progress' } as CronResponse & { message?: string },
      { status: 200 }
    );
  }

  const hitSource = detectSource(request);
  const startTime = Date.now();

  cronRunInProgress = true;
  try {
    const currentTime = new Date();
    const errors: string[] = [];
    let processedCount = 0;
    let postponedCount = 0;
    let logStatus: CronLogStatus = 'success';
    let logMessage: string | undefined;

    const isDevelopment = process.env.NODE_ENV === 'development';

    // Check if today is a weekend (skip check in development mode)
    if (!isDevelopment && isWeekend(currentTime)) {
      console.log(`Cron: Today is a weekend (${currentTime.toDateString()}). Skipping email sending.`);

      // Get all pending jobs that are ready to send
      const pendingJobs = await dbStore.getPendingJobs();
      const readyJobs = pendingJobs.filter(job => {
        const scheduledTime = new Date(job.scheduledAt);
        return scheduledTime <= currentTime;
      });

      // Postpone weekend jobs to next Monday
      for (const job of readyJobs) {
        const nextMonday = moveToNextMonday(currentTime);
        const postponedTime = setHours(nextMonday, 10);
        const finalTime = setMinutes(setSeconds(setMilliseconds(postponedTime, 0), 0), 0);

        await dbStore.updateJob(job.id, {
          scheduledAt: finalTime.toISOString()
        });

        postponedCount++;
        console.log(`Cron: Postponed job ${job.id} to ${finalTime.toISOString()}`);
      }

      logMessage = `Weekend detected. Postponed ${postponedCount} jobs to next Monday.`;

      // Log the hit
      await cronLogStore.logCronHit({
        hitAt: currentTime.toISOString(),
        source: hitSource,
        durationMs: Date.now() - startTime,
        processed: 0,
        errors: [],
        status: 'skipped',
        message: logMessage,
      });

      return NextResponse.json({
        processed: 0,
        errors: [],
        message: logMessage
      } as CronResponse & { message?: string }, { status: 200 });
    }

    // Log if running in development mode on weekend
    if (isDevelopment && isWeekend(currentTime)) {
      console.log(`Cron: Running in DEVELOPMENT mode on weekend (${currentTime.toDateString()}). Weekend check bypassed for testing.`);
    }

    // Get all pending jobs
    const pendingJobs = await dbStore.getPendingJobs();

    // Filter jobs that are ready to send
    const readyJobs = isDevelopment
      ? pendingJobs
      : pendingJobs.filter(job => {
        const scheduledTime = new Date(job.scheduledAt);
        return scheduledTime <= currentTime;
      });

    // Process in chronological order (oldest scheduled first)
    readyJobs.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    if (isDevelopment) {
      const allJobs = await dbStore.getAllJobs();
      console.log(`Cron: DEVELOPMENT mode - Total jobs: ${allJobs.length}, Pending: ${pendingJobs.length}, Processing: ${readyJobs.length}`);
      if (allJobs.length > 0) {
        console.log('Cron: Job statuses:', allJobs.map(j => `${j.company} (${j.status})`).join(', '));
      }
    }

    console.log(`Cron: Found ${readyJobs.length} jobs ready to send`);

    // Process each ready job
    for (const job of readyJobs) {
      try {
        const resumePath = getResumePath();
        await emailService.sendEmail(job.email, job.emailSubject, job.emailBody, resumePath);

        await dbStore.updateJob(job.id, {
          status: 'sent',
          processedAt: new Date().toISOString()
        });

        processedCount++;
        console.log(`Cron: Successfully sent email for job ${job.id}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await dbStore.updateJob(job.id, {
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

    // Determine log status
    if (errors.length > 0 && processedCount > errors.length) {
      logStatus = 'partial';
    } else if (errors.length > 0) {
      logStatus = 'error';
    } else {
      logStatus = 'success';
    }

    if (readyJobs.length === 0) {
      logMessage = 'No jobs ready to send';
    } else {
      logMessage = `Processed ${processedCount} jobs${errors.length > 0 ? ` (${errors.length} failed)` : ''}`;
    }

    // Log the hit
    await cronLogStore.logCronHit({
      hitAt: currentTime.toISOString(),
      source: hitSource,
      durationMs: Date.now() - startTime,
      processed: processedCount,
      errors,
      status: logStatus,
      message: logMessage,
    });

    // Return summary
    const response: CronResponse = {
      processed: processedCount,
      errors
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logError(error as Error, 'Cron endpoint error');

    // Log the error hit
    try {
      await cronLogStore.logCronHit({
        hitAt: new Date().toISOString(),
        source: hitSource,
        durationMs: Date.now() - startTime,
        processed: 0,
        errors: [error instanceof Error ? error.message : 'Internal server error'],
        status: 'error',
        message: 'Cron run failed with exception',
      });
    } catch (logErr) {
      console.error('Failed to log cron hit:', logErr);
    }

    return NextResponse.json(
      { processed: 0, errors: ['Internal server error'] } as CronResponse,
      { status: 500 }
    );
  } finally {
    cronRunInProgress = false;
  }
}
