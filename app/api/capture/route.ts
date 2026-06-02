/**
 * Capture API Route — Chrome Extension Text-Based Intake
 *
 * Accepts raw page text scraped by the Chrome Extension (instead of a base64 image).
 * Reuses all existing services: LLM, dbStore, scheduler, emailFormatter.
 *
 * POST /api/capture
 * Headers: X-Api-Key: <EXTENSION_API_KEY>
 * Body: { pageText, pageUrl?, manualEmail? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { CaptureRequest, CaptureResponse, JobRecord } from '@/lib/types';
import { llmService } from '@/lib/services/llm';
import { dbStore } from '@/lib/services/dbStore';
import { calculateScheduledTime } from '@/lib/services/scheduler';
import { logError } from '@/lib/utils/validation';
import { addSignature } from '@/lib/utils/emailFormatter';

// ─── CORS helper — allows requests from chrome-extension:// origins ───────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const expectedKey = process.env.EXTENSION_API_KEY;
  // If no key is configured, allow all (dev mode / not set up yet)
  if (!expectedKey) return true;
  const providedKey = request.headers.get('X-Api-Key');
  return providedKey === expectedKey;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const headers = corsHeaders();

  // Auth check
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized. Invalid or missing API key.' } as CaptureResponse,
      { status: 401, headers }
    );
  }

  try {
    const body: CaptureRequest = await request.json();
    const { pageText, pageUrl, manualEmail } = body;

    // ── Validate input ──────────────────────────────────────────────────────
    if (!pageText || typeof pageText !== 'string' || pageText.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: 'pageText is required and must be at least 100 characters. Make sure you are on a job posting page.' } as CaptureResponse,
        { status: 400, headers }
      );
    }

    // ── Extract job details from text ───────────────────────────────────────
    let extractedDetails;
    try {
      extractedDetails = await llmService.extractJobDetailsFromText(pageText, pageUrl);
    } catch (error) {
      logError(error as Error, 'Text extraction failed', { pageUrl });
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to extract job details from the page.' } as CaptureResponse,
        { status: 500, headers }
      );
    }

    // ── Handle missing email ────────────────────────────────────────────────
    if (!extractedDetails.email && !manualEmail) {
      // Tell the extension popup to show the manual email input
      return NextResponse.json(
        {
          success: false,
          requiresEmail: true,
          company:  extractedDetails.company,
          position: extractedDetails.position,
          region:   extractedDetails.region,
          error: 'Could not find a recruiter email on this page. Please enter it manually.',
        } as CaptureResponse,
        { status: 200, headers }
      );
    }

    // Use manual email if provided (overrides even if LLM found one)
    if (manualEmail) {
      extractedDetails = { ...extractedDetails, email: manualEmail };
    }

    // Validate the final email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(extractedDetails.email)) {
      return NextResponse.json(
        { success: false, error: `Invalid email address: "${extractedDetails.email}". Please enter a valid email manually.` } as CaptureResponse,
        { status: 400, headers }
      );
    }

    // ── Duplicate detection ─────────────────────────────────────────────────
    const allJobs = await dbStore.getAllJobs();
    const duplicate = allJobs.find(
      j =>
        j.company.toLowerCase() === extractedDetails.company.toLowerCase() &&
        j.position.toLowerCase() === extractedDetails.position.toLowerCase() &&
        j.email.toLowerCase() === extractedDetails.email.toLowerCase() &&
        (j.status === 'pending' || j.status === 'sent')
    );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          company:  extractedDetails.company,
          position: extractedDetails.position,
          error: `Already applied to "${extractedDetails.position}" at ${extractedDetails.company}.`,
        } as CaptureResponse,
        { status: 200, headers }
      );
    }

    // ── Generate email draft ────────────────────────────────────────────────
    let emailDraft;
    try {
      emailDraft = await llmService.generateEmail(extractedDetails, process.env.PORTFOLIO_URL);
      emailDraft.body = addSignature(emailDraft.body);
    } catch (error) {
      logError(error as Error, 'Email generation failed', {
        company:  extractedDetails.company,
        position: extractedDetails.position,
      });
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Failed to generate email draft.' } as CaptureResponse,
        { status: 500, headers }
      );
    }

    // ── Schedule and save ───────────────────────────────────────────────────
    const scheduledAt = calculateScheduledTime(extractedDetails.region);

    const jobRecord: JobRecord = {
      id:            uuidv4(),
      email:         extractedDetails.email,
      company:       extractedDetails.company,
      position:      extractedDetails.position,
      region:        extractedDetails.region,
      status:        'pending',
      emailSubject:  emailDraft.subject,
      emailBody:     emailDraft.body,
      scheduledAt:   scheduledAt.toISOString(),
      createdAt:     new Date().toISOString(),
      // Store the source URL for reference
      imageUrl:      pageUrl || undefined,
    };

    try {
      await dbStore.saveJob(jobRecord);
    } catch (error) {
      logError(error as Error, 'Database save failed', { jobId: jobRecord.id });
      return NextResponse.json(
        { success: false, error: 'Failed to save job record to database.' } as CaptureResponse,
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      { success: true, jobRecord } as CaptureResponse,
      { status: 200, headers }
    );

  } catch (error) {
    logError(error as Error, 'Capture endpoint error');
    return NextResponse.json(
      { success: false, error: 'Internal server error.' } as CaptureResponse,
      { status: 500, headers }
    );
  }
}
