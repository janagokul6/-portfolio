/**
 * Click Tracking API Route
 * Records a link click event and redirects the user to the original URL.
 * Called when a recruiter clicks a tracked link in the email.
 *
 * GET /api/track/click?id={jobId}&url={encodedOriginalUrl}
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import JobModel from '@/lib/db/models/Job';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('id');
  const targetUrl = request.nextUrl.searchParams.get('url');

  // Validate the target URL to prevent open redirect attacks
  if (!targetUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Only allow http/https URLs
  let validatedUrl: URL;
  try {
    validatedUrl = new URL(targetUrl);
    if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL' },
      { status: 400 }
    );
  }

  // Record the click event if we have a job ID
  if (jobId) {
    try {
      await connectDB();

      const now = new Date().toISOString();

      // Atomic update: increment clickCount, set clicked=true, set clickedAt on first click
      await JobModel.updateOne(
        { jobId, status: 'sent' },
        {
          $set: { clicked: true },
          $inc: { clickCount: 1 },
          $min: { clickedAt: now }, // $min ensures only the earliest timestamp is kept
        }
      );
    } catch (error) {
      // Log but don't fail — always redirect the user
      console.error('Click tracking error:', error);
    }
  }

  // 302 redirect to the original URL
  return NextResponse.redirect(validatedUrl.toString(), 302);
}
