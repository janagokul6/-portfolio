/**
 * Open Tracking API Route
 * Serves a 1x1 transparent GIF and records the open event.
 * Called automatically when a recruiter's email client loads the tracking pixel.
 *
 * GET /api/track/open?id={jobId}
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import JobModel from '@/lib/db/models/Job';

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('id');

  // Always return the pixel, even if tracking fails — never break the email
  const pixelResponse = () =>
    new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': String(TRANSPARENT_GIF.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  if (!jobId) {
    return pixelResponse();
  }

  try {
    await connectDB();

    const now = new Date().toISOString();

    // Atomic update: increment openCount, set opened=true, set openedAt on first open
    await JobModel.updateOne(
      { jobId, status: 'sent' },
      {
        $set: { opened: true },
        $inc: { openCount: 1 },
        $min: { openedAt: now }, // $min ensures only the earliest timestamp is kept
      }
    );
  } catch (error) {
    // Log but never fail — the pixel must always be served
    console.error('Open tracking error:', error);
  }

  return pixelResponse();
}
