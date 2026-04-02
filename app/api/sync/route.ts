/**
 * Sync API Route
 * Returns processed jobs from the database for frontend synchronization
 * Unlike the old in-memory version, processed jobs are NOT deleted since the DB is persistent
 */

import { NextResponse } from 'next/server';
import { SyncResponse } from '@/lib/types';
import { dbStore } from '@/lib/services/dbStore';
import { logError } from '@/lib/utils/validation';

export async function GET() {
  try {
    // Get all processed jobs (sent or failed)
    const processedJobs = await dbStore.getProcessedJobs();
    const pendingJobs = await dbStore.getPendingJobs();
    const allJobs = await dbStore.getAllJobs();

    console.log(`Sync: Total jobs: ${allJobs.length}, Pending: ${pendingJobs.length}, Processed: ${processedJobs.length}`);

    // Return processed jobs (no deletion — DB is the persistent store)
    const response: SyncResponse = {
      processedJobs
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logError(error as Error, 'Sync endpoint error');
    return NextResponse.json(
      { processedJobs: [] } as SyncResponse,
      { status: 500 }
    );
  }
}
