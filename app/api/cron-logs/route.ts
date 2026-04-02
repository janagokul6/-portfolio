/**
 * Cron Logs API Route
 * Returns recent cron hit logs for the frontend timeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { cronLogStore } from '@/lib/services/cronLogStore';
import { logError } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
    try {
        const daysParam = request.nextUrl.searchParams.get('days');
        const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10), 1), 7) : 3;

        const logs = await cronLogStore.getRecentLogs(days);

        return NextResponse.json({ logs }, { status: 200 });
    } catch (error) {
        logError(error as Error, 'Cron logs endpoint error');
        return NextResponse.json(
            { logs: [], error: 'Failed to fetch cron logs' },
            { status: 500 }
        );
    }
}
