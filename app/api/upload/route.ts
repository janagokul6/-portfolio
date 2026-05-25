/**
 * Upload API Route
 * Handles screenshot uploads and job creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { UploadRequest, UploadResponse, JobRecord } from '@/lib/types';
import { llmService } from '@/lib/services/llm';
import { dbStore } from '@/lib/services/dbStore';
import { calculateScheduledTime } from '@/lib/services/scheduler';
import { validateBase64Image, logError } from '@/lib/utils/validation';
import { addSignature } from '@/lib/utils/emailFormatter';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: UploadRequest = await request.json();
    const { image, promptText } = body;

    // Validate image data
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image data is required' } as UploadResponse,
        { status: 400 }
      );
    }

    const validation = validateBase64Image(image);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error } as UploadResponse,
        { status: 400 }
      );
    }

    // Extract job details using LLM
    let extractedDetails;
    try {
      extractedDetails = await llmService.extractJobDetails(image, promptText);
    } catch (error) {
      logError(error as Error, 'LLM extraction failed', { hasPrompt: !!promptText });
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to extract job details'
        } as UploadResponse,
        { status: 500 }
      );
    }
    console.log(extractedDetails)
    // Generate email draft using LLM
    let emailDraft;
    try {
      emailDraft = await llmService.generateEmail(extractedDetails, process.env.PORTFOLIO_URL);
      // Add signature locally (not from LLM)
      emailDraft.body = addSignature(emailDraft.body);
    } catch (error) {
      logError(error as Error, 'Email generation failed', {
        company: extractedDetails.company,
        position: extractedDetails.position
      });
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate email'
        } as UploadResponse,
        { status: 500 }
      );
    }

    // Calculate scheduled time based on region
    const scheduledAt = calculateScheduledTime(extractedDetails.region);

    // Create JobRecord
    const jobRecord: JobRecord = {
      id: uuidv4(),
      email: extractedDetails.email,
      company: extractedDetails.company,
      position: extractedDetails.position,
      region: extractedDetails.region,
      status: 'pending',
      emailSubject: emailDraft.subject,
      emailBody: emailDraft.body,
      scheduledAt: scheduledAt.toISOString(),
      createdAt: new Date().toISOString()
    };

    // Save to database
    try {
      await dbStore.saveJob(jobRecord);
    } catch (error) {
      logError(error as Error, 'Database save failed', { jobId: jobRecord.id });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save job record'
        } as UploadResponse,
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        jobRecord
      } as UploadResponse,
      { status: 200 }
    );

  } catch (error) {
    logError(error as Error, 'Upload endpoint error');
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      } as UploadResponse,
      { status: 500 }
    );
  }
}
