/**
 * Timezone configuration for the application
 * The timezone can be changed dynamically by calling setUserTimezone()
 */
let USER_TIMEZONE = 'America/New_York'; // User's timezone

/**
 * Parse a short GMT offset like "GMT-05:00" or "UTC+01:30" into minutes
 */
function parseShortOffsetToMinutes(offsetLabel) {
  if (!offsetLabel) return 0;
  const clean = String(offsetLabel)
    .replace('UTC', '')
    .replace('GMT', '')
    .replace('−', '-') // Unicode minus to ASCII hyphen
    .trim();
  // Support formats: -05:00, +0530, -5, -5:30, +05, etc.
  const match = clean.match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  return sign * (hours * 60 + minutes);
}

/**
 * Get timezone offset minutes for a given UTC instant in a specific IANA zone
 * Returns minutes to add to UTC to get local time (e.g., New York in winter -> -300)
 */
function getTimeZoneOffsetMinutesAt(timezone, utcMs) {
  // Compute offset by comparing the tz wall-clock parts at this UTC instant
  // against the same parts interpreted as UTC.
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = dtf.formatToParts(new Date(utcMs));
  const get = (type) => parts.find(p => p.type === type)?.value;
  const y = Number(get('year'));
  const m = Number(get('month'));
  const d = Number(get('day'));
  const H = Number(get('hour'));
  const M = Number(get('minute'));
  const S = Number(get('second'));
  const constructedMs = Date.UTC(y, (m || 1) - 1, d || 1, H || 0, M || 0, S || 0, 0);
  const offsetMinutes = Math.round((constructedMs - utcMs) / 60000);
  
  return offsetMinutes;
}

/**
 * Convert UTC datetime to local datetime in specified timezone
 * @param {string} timezone - IANA timezone identifier
 * @param {string} utcDateTime - UTC datetime string (ISO format)
 * @returns {Date} - Local datetime as Date object
 */
export function utcToLocal(timezone, utcDateTime) {
  if (!utcDateTime) return null;
  
  const utcDate = new Date(utcDateTime);
  

  // Use Intl to get the target timezone wall-clock parts for this UTC instant
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = dtf.formatToParts(utcDate);
  const get = (type) => parts.find(p => p.type === type)?.value;
  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  const hour = Number(get('hour'));
  const minute = Number(get('minute'));
  const second = Number(get('second'));
  // Construct a local Date using those wall-clock parts (in system zone) solely for UI
  const localWallClockDate = new Date(year, month - 1, day, hour, minute, second, 0);
  

  return localWallClockDate;
}

/**
 * Convert local datetime in specified timezone to UTC
 * @param {string} timezone - IANA timezone identifier
 * @param {Date|string} localDateTime - Local datetime as Date object or string
 * @returns {string} - UTC datetime string (ISO format)
 */
export function localToUTC(timezone, localDateTime) {
  if (!localDateTime) return null;
  
  let localDate;
  if (localDateTime instanceof Date) {
    localDate = localDateTime;
  } else if (typeof localDateTime === 'string') {
    // If it's a datetime string, parse it
    localDate = new Date(localDateTime);
  } else {
    return null;
  }
  
  // Extract wall-clock components from the provided Date object
  const year = localDate.getFullYear();
  const monthIndex = localDate.getMonth(); // 0-based
  const day = localDate.getDate();
  const hours = localDate.getHours();
  const minutes = localDate.getMinutes();
  const seconds = localDate.getSeconds();

  // Build a naive UTC timestamp from wall-clock components
  const naiveUtcMs = Date.UTC(year, monthIndex, day, hours, minutes, seconds, 0);
  // Determine the timezone offset (minutes to add to UTC to get local) at that instant
  const offsetMinutes = getTimeZoneOffsetMinutesAt(timezone, naiveUtcMs);
  // Convert wall-clock in zone to actual UTC by subtracting the offset
  const trueUtcMs = naiveUtcMs - offsetMinutes * 60000;
  const utcDate = new Date(trueUtcMs);
  
  
  return utcDate.toISOString();
}

/**
 * Set the user's timezone
 * @param {string} timezone - IANA timezone identifier
 */
export function setUserTimezone(timezone) {
  USER_TIMEZONE = timezone;
}

/**
 * Get the current user timezone
 * @returns {string} - Current timezone identifier
 */
export function getUserTimezone() {
  return USER_TIMEZONE;
}

/**
 * Format a date/time string to a specific timezone
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} timezone - IANA timezone identifier
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date/time string
 */
export function formatInTimezone(dateTimeString, timezone, options = {}) {
  if (!dateTimeString) return 'Not specified';
  
  const date = new Date(dateTimeString);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: timezone
  };
  
  return date.toLocaleString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format just the time portion in a specific timezone
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} - Formatted time string
 */
export function formatTimeInTimezone(dateTimeString, timezone) {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: timezone
  });
}

/**
 * Format just the date portion in a specific timezone
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} - Formatted date string
 */
export function formatDateInTimezone(dateTimeString, timezone) {
  if (!dateTimeString) return 'Not specified';
  
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezone
  });
}

/**
 * Format a date/time string to the user's timezone
 * @param {string} dateTimeString - ISO datetime string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date/time string
 */
export function formatInUserTimezone(dateTimeString, options = {}) {
  return formatInTimezone(dateTimeString, USER_TIMEZONE, options);
}

/**
 * Format just the time portion in user timezone
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} - Formatted time string
 */
export function formatTimeInUserTimezone(dateTimeString) {
  return formatTimeInTimezone(dateTimeString, USER_TIMEZONE);
}

/**
 * Format just the date portion in user timezone
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} - Formatted date string
 */
export function formatDateInUserTimezone(dateTimeString) {
  return formatDateInTimezone(dateTimeString, USER_TIMEZONE);
} 