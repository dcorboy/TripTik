/**
 * Timezone configuration for the application
 * The timezone can be changed dynamically by calling setUserTimezone()
 */
let USER_TIMEZONE = 'America/New_York'; // User's timezone

/**
 * Convert UTC datetime to local datetime in specified timezone
 * @param {string} timezone - IANA timezone identifier
 * @param {string} utcDateTime - UTC datetime string (ISO format)
 * @returns {Date} - Local datetime as Date object
 */
export function utcToLocal(timezone, utcDateTime) {
  if (!utcDateTime) return null;
  
  const utcDate = new Date(utcDateTime);
  
  // Create a date string in the target timezone format
  const localDateString = utcDate.toLocaleString('en-US', { timeZone: timezone });
  
  // Parse the local date string to get a Date object representing local time
  const localDate = new Date(localDateString);
  
  return localDate;
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
  
  // Create a date string representing this local time
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  const seconds = String(localDate.getSeconds()).padStart(2, '0');
  
  // Create a date string that represents the local time
  const localDateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  
  // Create a Date object from this string (this will be interpreted as local time)
  const localDateObj = new Date(localDateString);
  
  // Get the timezone offset for the target timezone
  const now = new Date();
  const targetOffset = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
  const localOffset = now.getTimezoneOffset();
  const offsetDiff = targetOffset - localOffset;
  
  // Adjust the local date by the timezone offset difference to get UTC
  const utcTime = localDateObj.getTime() + (offsetDiff * 60000);
  const utcDate = new Date(utcTime);
  
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
  
  const localDate = utcToLocal(timezone, dateTimeString);
  if (!localDate) return 'Not specified';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  
  return localDate.toLocaleString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format just the time portion in a specific timezone
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} - Formatted time string
 */
export function formatTimeInTimezone(dateTimeString, timezone) {
  if (!dateTimeString) return '';
  
  const localDate = utcToLocal(timezone, dateTimeString);
  if (!localDate) return '';
  
  return localDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
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
  
  const localDate = utcToLocal(timezone, dateTimeString);
  if (!localDate) return 'Not specified';
  
  return localDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
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