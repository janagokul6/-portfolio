/**
 * Sync API Route
 * Returns processed jobs for frontend synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyncResponse } from '@/lib/types';
import { memoryStore } from '@/lib/services/memoryStore';
import { logError } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    // Get all processed jobs (sent or failed)
    const processedJobs = memoryStore.getProcessedJobs();
    const pendingJobs = memoryStore.getPendingJobs();
    const allJobs = memoryStore.getAllJobs();
    
    console.log(`Sync: Total jobs: ${allJobs.length}, Pending: ${pendingJobs.length}, Processed: ${processedJobs.length}`);
    
    // Delete processed jobs from memory store
    for (const job of processedJobs) {
      memoryStore.deleteJob(job.id);
    }
    
    // Return processed jobs
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
