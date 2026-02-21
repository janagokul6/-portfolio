/**
 * Scheduler service for calculating appropriate send times based on region
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds, getDay } from 'date-fns';

/**
 * Region to timezone mapping
 */
const REGION_TIMEZONES: Record<string, string> = {
  'India': 'Asia/Kolkata',
  'United States': 'America/New_York',
  'US': 'America/New_York',
  'USA': 'America/New_York',
  'Europe': 'Europe/London',
  'UK': 'Europe/London',
  'United Kingdom': 'Europe/London',
  'default': 'UTC'
};

/**
 * Send hour for each region (24-hour format)
 */
const SEND_HOURS: Record<string, number> = {
  'India': 11,        // 11 AM IST
  'default': 10       // 10 AM for other regions
};

/**
 * Scheduler Service interface
 */
export interface SchedulerService {
  calculateScheduledTime(region: string, currentTime?: Date): Date;
}

/**
 * Get timezone for a given region
 */
function getTimezoneForRegion(region: string): string {
  // Normalize region string
  const normalizedRegion = region.trim();
  
  // Check for exact match
  if (REGION_TIMEZONES[normalizedRegion]) {
    return REGION_TIMEZONES[normalizedRegion];
  }
  
  // Check for partial match (case-insensitive)
  const regionLower = normalizedRegion.toLowerCase();
  for (const [key, timezone] of Object.entries(REGION_TIMEZONES)) {
    if (regionLower.includes(key.toLowerCase()) || key.toLowerCase().includes(regionLower)) {
      return timezone;
    }
  }
  
  return REGION_TIMEZONES.default;
}

/**
 * Get send hour for a given region
 */
function getSendHourForRegion(region: string): number {
  const normalizedRegion = region.trim();
  
  // India gets 11 AM, everything else gets 10 AM
  if (normalizedRegion.toLowerCase().includes('india')) {
    return SEND_HOURS.India;
  }
  
  return SEND_HOURS.default;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = getDay(date);
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Move date to next business day if it's a weekend
 */
function moveToNextBusinessDay(date: Date): Date {
  let result = date;
  while (isWeekend(result)) {
    result = addDays(result, 1);
  }
  return result;
}

/**
 * Calculate the scheduled time for sending an email based on region
 * 
 * @param region - The geographic region for the job
 * @param currentTime - Optional current time (defaults to now)
 * @returns Date object representing the scheduled send time
 */
export function calculateScheduledTime(region: string, currentTime?: Date): Date {
  const now = currentTime || new Date();
  const timezone = getTimezoneForRegion(region);
  const sendHour = getSendHourForRegion(region);
  
  // Get current time in target timezone
  const zonedNow = toZonedTime(now, timezone);
  
  // Set target time to send hour (e.g., 10 AM or 11 AM)
  let scheduledTime = setHours(zonedNow, sendHour);
  scheduledTime = setMinutes(scheduledTime, 0);
  scheduledTime = setSeconds(scheduledTime, 0);
  scheduledTime = setMilliseconds(scheduledTime, 0);
  
  // If the target time has already passed today, schedule for tomorrow
  if (scheduledTime <= zonedNow) {
    scheduledTime = addDays(scheduledTime, 1);
  }
  
  // Skip weekends - move to next Monday if needed
  scheduledTime = moveToNextBusinessDay(scheduledTime);
  
  // Convert back to UTC for storage
  const utcScheduledTime = fromZonedTime(scheduledTime, timezone);
  
  return utcScheduledTime;
}

/**
 * Default scheduler service implementation
 */
export const schedulerService: SchedulerService = {
  calculateScheduledTime
};
