/**
 * Timezone configuration for the application
 * The timezone can be changed dynamically by calling setUserTimezone()
 */
let USER_TIMEZONE = 'America/New_York'; // User's timezone

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
 * Format a date/time string to the user's timezone
 * @param {string} dateTimeString - ISO datetime string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date/time string
 */
export function formatInUserTimezone(dateTimeString, options = {}) {
  if (!dateTimeString) return 'Not specified';
  
  const date = new Date(dateTimeString);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: USER_TIMEZONE
  };
  
  return date.toLocaleString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format just the time portion in user timezone
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} - Formatted time string
 */
export function formatTimeInUserTimezone(dateTimeString) {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: USER_TIMEZONE
  });
}

/**
 * Format just the date portion in user timezone
 * @param {string} dateTimeString - ISO datetime string
 * @returns {string} - Formatted date string
 */
export function formatDateInUserTimezone(dateTimeString) {
  if (!dateTimeString) return 'Not specified';
  
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: USER_TIMEZONE
  });
} 