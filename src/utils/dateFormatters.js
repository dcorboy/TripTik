/**
 * Helper functions for date and time formatting
 */
import { utcToLocal } from '../config/timezone.js';

/**
 * Format date as "Tuesday, March 25th"
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} - Formatted date string
 */
export function formatFullDate(dateTimeString, timezone) {
  if (!dateTimeString) return '';
  
  const localDate = utcToLocal(timezone, dateTimeString);
  if (!localDate) return '';
  
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  
  const formatted = localDate.toLocaleDateString('en-US', options);
  
  // Add ordinal suffix (1st, 2nd, 3rd, etc.)
  const day = localDate.getDate();
  const suffix = getOrdinalSuffix(day);
  
  return formatted.replace(/\d+$/, day + suffix);
}

/**
 * Format date as "Tue Mar 25"
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} - Formatted date string
 */
export function formatShortDate(dateTimeString, timezone) {
  if (!dateTimeString) return '';
  
  const localDate = utcToLocal(timezone, dateTimeString);
  if (!localDate) return '';
  
  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  };
  
  return localDate.toLocaleDateString('en-US', options);
}

/**
 * Format date as "3/25 Tue"
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} - Formatted date string
 */
export function formatCompactDate(dateTimeString, timezone) {
  if (!dateTimeString) return '';
  
  const localDate = utcToLocal(timezone, dateTimeString);
  if (!localDate) return '';
  
  const month = localDate.getMonth() + 1;
  const day = localDate.getDate();
  const weekday = localDate.toLocaleDateString('en-US', {
    weekday: 'short'
  });
  
  return `${month}/${day} ${weekday}`;
}

/**
 * Format time as "7:23pm (ET)"
 * @param {string} dateTimeString - ISO datetime string
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} - Formatted time string
 */
export function formatTimeWithZone(dateTimeString, timezone) {
  if (!dateTimeString) return '';
  
  const localDate = utcToLocal(timezone, dateTimeString);
  if (!localDate) return '';
  
  const time = localDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Get timezone abbreviation
  const timezoneAbbr = getTimezoneAbbreviation(timezone);
  
  return `${time} (${timezoneAbbr})`;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param {number} day - Day of the month
 * @returns {string} - Ordinal suffix
 */
function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Get timezone abbreviation
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} - Timezone abbreviation
 */
function getTimezoneAbbreviation(timezone) {
  const abbreviations = {
    'America/New_York': 'ET',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'America/Los_Angeles': 'PT',
    'America/Anchorage': 'AKT',
    'Pacific/Honolulu': 'HT',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Europe/Berlin': 'CET',
    'Asia/Tokyo': 'JST',
    'Asia/Shanghai': 'CST',
    'Australia/Sydney': 'AEST',
    'Pacific/Auckland': 'NZST'
  };
  
  return abbreviations[timezone] || timezone.split('/').pop().substring(0, 3).toUpperCase();
} 