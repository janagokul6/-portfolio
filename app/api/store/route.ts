/**
 * Store status API
 * Returns current database store counts: total, pending, processed
 */

import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/services/dbStore';
import { StoreStatusResponse } from '@/lib/types';

export async function GET() {
  try {
    const allJobs = await dbStore.getAllJobs();
    const pendingJobs = await dbStore.getPendingJobs();
    const processedJobs = await dbStore.getProcessedJobs();

    const response: StoreStatusResponse = {
      total: allJobs.length,
      pending: pendingJobs.length,
      processed: processedJobs.length
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json(
      { total: 0, pending: 0, processed: 0 } as StoreStatusResponse,
      { status: 500 }
    );
  }
}
