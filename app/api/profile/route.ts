/**
 * Profile API Route
 *
 * GET /api/profile
 * Returns the single master profile.
 *
 * POST /api/profile
 * Updates the single master profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import ProfileModel from '@/lib/db/models/Profile';
import { logError } from '@/lib/utils/validation';

// ─── CORS Helper ─────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// ─── Auth Helper ─────────────────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const expectedKey = process.env.EXTENSION_API_KEY;
  if (!expectedKey) return true;
  return request.headers.get('X-Api-Key') === expectedKey;
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const headers = corsHeaders();

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401, headers });
  }

  try {
    await connectDB();
    let profile = await ProfileModel.findOne();
    if (!profile) {
      profile = await ProfileModel.create({});
    }

    return NextResponse.json({ success: true, profile }, { status: 200, headers });
  } catch (error) {
    logError(error as Error, 'Profile GET error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers });
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const headers = corsHeaders();

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    await connectDB();
    
    // There is only ever one profile in this single-user system.
    let profile = await ProfileModel.findOne();
    if (!profile) {
      profile = new ProfileModel(body);
    } else {
      profile.set(body);
    }
    
    await profile.save();

    return NextResponse.json({ success: true, profile }, { status: 200, headers });
  } catch (error) {
    logError(error as Error, 'Profile POST error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers });
  }
}
