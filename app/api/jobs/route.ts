/**
 * Jobs API Route
 * Returns all job records from the database for history display
 */

import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/services/dbStore';
import { logError } from '@/lib/utils/validation';

export async function GET() {
    try {
        const jobs = await dbStore.getAllJobs();

        return NextResponse.json({ jobs }, { status: 200 });
    } catch (error) {
        logError(error as Error, 'Jobs endpoint error');
        return NextResponse.json(
            { jobs: [], error: 'Failed to fetch jobs' },
            { status: 500 }
        );
    }
}
