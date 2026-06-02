/**
 * Generate Answer API Route
 *
 * POST /api/generate-answer
 * Generates an answer to a custom application form question based on the MasterProfile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import ProfileModel from '@/lib/db/models/Profile';
import { llmService } from '@/lib/services/llm';
import { logError } from '@/lib/utils/validation';

// ─── CORS Helper ─────────────────────────────────────────────────────────────
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

// ─── Auth Helper ─────────────────────────────────────────────────────────────
function isAuthorized(request: NextRequest): boolean {
  const expectedKey = process.env.EXTENSION_API_KEY;
  if (!expectedKey) return true;
  return request.headers.get('X-Api-Key') === expectedKey;
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const headers = corsHeaders();

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const { question, company, position } = body;

    if (!question || !company || !position) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: question, company, or position' },
        { status: 400, headers }
      );
    }

    await connectDB();
    const profile = await ProfileModel.findOne();
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Master Profile not found. Please create one in the dashboard.' },
        { status: 404, headers }
      );
    }

    // Convert profile to a readable string context for the LLM
    const profileContext = `
Name: ${profile.firstName} ${profile.lastName}
Location: ${profile.location}
Skills: ${profile.skills}
Work Experience:
${profile.workExperience.map(w => `- ${w.title} at ${w.company} (${w.startDate} - ${w.endDate}): ${w.description}`).join('\n')}
Education:
${profile.education.map(e => `- ${e.degree} in ${e.fieldOfStudy} at ${e.institution} (${e.startDate} - ${e.endDate})`).join('\n')}
    `.trim();

    const answer = await llmService.generateAnswer(question, company, position, profileContext);

    return NextResponse.json({ success: true, answer }, { status: 200, headers });
  } catch (error) {
    logError(error as Error, 'Generate Answer error');
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers });
  }
}
