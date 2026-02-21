/**
 * LLM Service for job detail extraction and email generation
 * Supports both OpenAI and Google Gemini
 */

import { ExtractedDetails, EmailDraft } from '@/lib/types';

/**
 * LLM Service interface
 */
export interface LLMService {
  extractJobDetails(image: string, prompt?: string): Promise<ExtractedDetails>;
  generateEmail(details: ExtractedDetails): Promise<EmailDraft>;
}

/**
 * Validate extracted details have all required fields
 */
function validateExtractedDetails(data: unknown): ExtractedDetails {
  const details = data as Partial<ExtractedDetails>;
  const requiredFields: (keyof ExtractedDetails)[] = ['email', 'company', 'position', 'region'];
  const missingFields = requiredFields.filter(field => !details[field] || details[field]?.trim() === '');
  
  if (missingFields.length > 0) {
    throw new Error(`Could not extract required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate email format (more flexible regex)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(details.email!.trim())) {
    throw new Error('Extracted email address is invalid');
  }
  
  return {
    email: details.email!.trim(),
    company: details.company!.trim(),
    position: details.position!.trim(),
    region: details.region!.trim()
  };
}

/**
 * OpenAI LLM Service Implementation
 */
class OpenAIService implements LLMService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async extractJobDetails(image: string, prompt?: string): Promise<ExtractedDetails> {
    const systemPrompt = `You are a job posting analyzer. Extract the following information from job posting screenshots:
- Recipient email address (recruiter or company email)
- Company name
- Position title
- Job location/region (country or city)

Return ONLY valid JSON in this exact format:
{
  "email": "recruiter@company.com",
  "company": "Company Name",
  "position": "Job Title",
  "region": "Location"
}`;

    const userPrompt = prompt 
      ? `${prompt}\n\nExtract job details from this screenshot.`
      : 'Extract job details from this screenshot.';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                { type: 'image_url', image_url: { url: image } }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }
      
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from response');
      }
      
      const extracted = JSON.parse(jsonMatch[0]);
      return validateExtractedDetails(extracted);
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM request timed out after 30 seconds');
      }
      throw error;
    }
  }
  
  async generateEmail(details: ExtractedDetails): Promise<EmailDraft> {
    const systemPrompt = `You are writing a casual, natural cold application email. This is the FIRST contact - you saw a job posting and are reaching out. Write like a real person would - conversational, brief, and genuine. NO placeholders, NO formal corporate language, NO templates. If you don't have specific information, just omit it - never use brackets like [name] or [date].

CRITICAL RULES:
- NEVER start with "I hope this message finds you well" or similar formal greetings
- NEVER end with "Best regards", "Sincerely", or any closing signature - the signature will be added separately
- Start directly with your message after a simple greeting
- End the body with your last sentence - no sign-off`;
    
    const userPrompt = `Write a short, natural cold application email for this job I saw posted:
Company: ${details.company}
Position: ${details.position}

SUBJECT LINE RULES:
- Keep it SHORT (3-6 words max)
- Make it curiosity-driven and personal
- Focus on value or interest, not just "Application for [Position]"
- Examples: "Excited about ${details.position}", "Quick question about ${details.position}", "Love to chat about ${details.position}"

BODY RULES:
- Keep it real and human - like you're genuinely interested and reaching out
- Mention you saw the posting and are interested
- Keep it brief. NO placeholders or brackets
- DO NOT include "I hope this message finds you well" or similar phrases
- DO NOT include any closing like "Best regards" or signature - just end with your last sentence

Return ONLY valid JSON in this exact format:
{
  "subject": "Email subject line",
  "body": "Email body content"
}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }
      
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from response');
      }
      
      const draft = JSON.parse(jsonMatch[0]);
      
      if (!draft.subject || !draft.body) {
        throw new Error('Email draft missing subject or body');
      }
      
      // Optional: Log warning if company/position not explicitly in body (but don't fail)
      const bodyLower = draft.body.toLowerCase();
      const hasCompany = bodyLower.includes(details.company.toLowerCase());
      const hasPosition = bodyLower.includes(details.position.toLowerCase());
      
      if (!hasCompany && !hasPosition) {
        console.warn(`Email body may not explicitly mention company "${details.company}" or position "${details.position}"`);
      }
      
      return draft as EmailDraft;
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM request timed out after 30 seconds');
      }
      throw error;
    }
  }
}

/**
 * Google Gemini LLM Service Implementation
 */
class GeminiService implements LLMService {
  private apiKey: string;
  private baseURL = 'https://generativelanguage.googleapis.com/v1beta';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async extractJobDetails(image: string, prompt?: string): Promise<ExtractedDetails> {
    const systemPrompt = `You are a job posting analyzer. Extract the following information from job posting screenshots:
- Recipient email address (recruiter or company email)
- Company name
- Position title
- Job location/region (country or city)

Return ONLY valid JSON in this exact format:
{
  "email": "recruiter@company.com",
  "company": "Company Name",
  "position": "Job Title",
  "region": "Location"
}`;

    const userPrompt = prompt 
      ? `${prompt}\n\nExtract job details from this screenshot.`
      : 'Extract job details from this screenshot.';
    
    // Extract base64 data from data URL
    const base64Data = image.split(',')[1] || image;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(
        `${this.baseURL}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `${systemPrompt}\n\n${userPrompt}` },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Data
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500
            }
          }),
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No response from Gemini');
      }
      
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from response');
      }
      
      const extracted = JSON.parse(jsonMatch[0]);
      return validateExtractedDetails(extracted);
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM request timed out after 30 seconds');
      }
      throw error;
    }
  }
  
  async generateEmail(details: ExtractedDetails): Promise<EmailDraft> {
    const prompt = `You are writing a casual, natural cold application email. This is the FIRST contact - you saw a job posting and are reaching out. Write like a real person would - conversational, brief, and genuine. NO placeholders, NO formal corporate language, NO templates. If you don't have specific information, just omit it - never use brackets like [name] or [date].

CRITICAL RULES:
- NEVER start with "I hope this message finds you well" or similar formal greetings
- NEVER end with "Best regards", "Sincerely", or any closing signature - the signature will be added separately
- Start directly with your message after a simple greeting
- End the body with your last sentence - no sign-off

Write a short, natural cold application email for this job I saw posted:
Company: ${details.company}
Position: ${details.position}

SUBJECT LINE RULES:
- Keep it SHORT (3-6 words max)
- Make it curiosity-driven and personal
- Focus on value or interest, not just "Application for [Position]"
- Examples: "Excited about ${details.position}", "Quick question about ${details.position}", "Love to chat about ${details.position}"

BODY RULES:
- Keep it real and human - like you're genuinely interested and reaching out
- Mention you saw the posting and are interested
- Keep it brief. NO placeholders or brackets
- DO NOT include "I hope this message finds you well" or similar phrases
- DO NOT include any closing like "Best regards" or signature - just end with your last sentence

Return ONLY valid JSON in this exact format:
{
  "subject": "Email subject line",
  "body": "Email body content"
}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(
        `${this.baseURL}/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500
            }
          }),
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No response from Gemini');
      }
      
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from response');
      }
      
      const draft = JSON.parse(jsonMatch[0]);
      
      if (!draft.subject || !draft.body) {
        throw new Error('Email draft missing subject or body');
      }
      
      // Optional: Log warning if company/position not explicitly in body (but don't fail)
      const bodyLower = draft.body.toLowerCase();
      const hasCompany = bodyLower.includes(details.company.toLowerCase());
      const hasPosition = bodyLower.includes(details.position.toLowerCase());
      
      if (!hasCompany && !hasPosition) {
        console.warn(`Email body may not explicitly mention company "${details.company}" or position "${details.position}"`);
      }
      
      return draft as EmailDraft;
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LLM request timed out after 30 seconds');
      }
      throw error;
    }
  }
}

/**
 * Create LLM service based on environment configuration
 */
export function createLLMService(): LLMService {
  const provider = process.env.LLM_PROVIDER || 'openai';
  
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    return new GeminiService(apiKey);
  }
  
  // Default to OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAIService(apiKey);
}

/**
 * Default LLM service instance
 */
export const llmService = createLLMService();
