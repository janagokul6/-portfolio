/**
 * Portal Log API Route — Logs applications submitted through ATS portals
 *
 * Called automatically by the Chrome Extension's portal-detector.js when
 * it detects a successful application submission on Greenhouse, Lever, etc.
 *
 * POST /api/portal-log
 * Headers: X-Api-Key: <EXTENSION_API_KEY>
 * Body: { company, position, portalName, pageUrl? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { JobRecord } from '@/lib/types';
import { dbStore } from '@/lib/services/dbStore';
import { logError } from '@/lib/utils/validation';

// ─── CORS ────────────────────────────────────────────────────────────────────

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

// ─── Auth ────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const expectedKey = process.env.EXTENSION_API_KEY;
  if (!expectedKey) return true;
  return request.headers.get('X-Api-Key') === expectedKey;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface PortalLogRequest {
  company: string;
  position: string;
  portalName: string;
  pageUrl?: string;
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const headers = corsHeaders();

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized.' },
      { status: 401, headers }
    );
  }

  try {
    const body: PortalLogRequest = await request.json();
    const { company, position, portalName, pageUrl } = body;

    // Validate
    if (!company || !position || !portalName) {
      return NextResponse.json(
        { success: false, error: 'company, position, and portalName are required.' },
        { status: 400, headers }
      );
    }

    // Duplicate check — same company + position already logged as portal
    const allJobs = await dbStore.getAllJobs();
    const duplicate = allJobs.find(
      j =>
        j.company.toLowerCase() === company.toLowerCase() &&
        j.position.toLowerCase() === position.toLowerCase() &&
        j.status === 'applied_via_portal'
    );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          error: `Already logged portal application for "${position}" at ${company}.`,
        },
        { status: 200, headers }
      );
    }

    // Create the portal application record
    const jobRecord: JobRecord = {
      id:           uuidv4(),
      email:        '',                     // No email for portal applications
      company:      company.trim(),
      position:     position.trim(),
      region:       '',                     // Unknown from portal submission
      status:       'applied_via_portal',
      emailSubject: '',                     // No email drafted
      emailBody:    '',                     // No email drafted
      scheduledAt:  '',                     // Not scheduled
      createdAt:    new Date().toISOString(),
      source:       'portal',
      portalName:   portalName.toLowerCase(),
      imageUrl:     pageUrl || undefined,   // Store the portal URL for reference
    };

    await dbStore.saveJob(jobRecord);

    return NextResponse.json(
      { success: true, jobRecord },
      { status: 200, headers }
    );

  } catch (error) {
    logError(error as Error, 'Portal log endpoint error');
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500, headers }
    );
  }
}
