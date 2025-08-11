// Shared utilities for leg text parsers

/**
 * Convert wall-clock time to UTC ISO string using given timezone context
 * @param {string} zone - Timezone (e.g., 'America/New_York')
 * @param {number} year - Year
 * @param {number} monthIndex - Month index (0-11)
 * @param {number} day - Day of month
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {string} ISO string in UTC
 */
export function toIsoInZone(zone, year, monthIndex, day, hour, minute) {
  const naiveUtcMs = Date.UTC(year, monthIndex, day, hour, minute, 0, 0);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = dtf.formatToParts(new Date(naiveUtcMs));
  const get = (type) => parts.find(p => p.type === type)?.value;
  const tzY = Number(get('year'));
  const tzM = Number(get('month'));
  const tzD = Number(get('day'));
  const tzH = Number(get('hour'));
  const tzMin = Number(get('minute'));
  const tzS = Number(get('second'));
  const constructedMs = Date.UTC(tzY, tzM - 1, tzD, tzH, tzMin, tzS, 0);
  const offsetMinutes = Math.round((constructedMs - naiveUtcMs) / 60000);
  const trueUtcMs = naiveUtcMs - offsetMinutes * 60000;
  return new Date(trueUtcMs).toISOString();
}

/**
 * Parse time string in format "hh:mm AM/PM" to 24-hour format
 * @param {string} timeStr - Time string (e.g., "8:15 AM")
 * @returns {Object} Object with hour and minute properties
 */
export function parseTime(timeStr) {
  const mm = String(timeStr || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AP])M$/i);
  if (!mm) return { hour: 0, minute: 0 };
  let hour = parseInt(mm[1], 10);
  const minute = parseInt(mm[2], 10);
  const isPM = mm[3].toUpperCase() === 'P';
  if (isPM && hour < 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return { hour, minute };
}

/**
 * Parse date string in format "Tue, Aug 12, 2025"
 * @param {string} dateStr - Date string
 * @returns {Object|null} Object with year, monthIndex, day properties or null if invalid
 */
export function parseDate(dateStr) {
  const match = dateStr.match(/^[A-Za-z]{3},\s*([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
  if (!match) return null;
  const monthLookup = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  const monthIndex = monthLookup[match[1]];
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  return { year, monthIndex, day };
}

/**
 * Extract airport code from location string
 * @param {string} locationStr - Location string (e.g., "City, State, Country (ABC)")
 * @returns {string} Airport code or empty string
 */
export function extractAirportCode(locationStr) {
  const match = locationStr.match(/\(([A-Za-z]{3})\)$/);
  return match ? match[1] : '';
}

/**
 * Extract airport code from United Web format
 * @param {string} line - Line containing airport code
 * @returns {string} Airport code or empty string
 */
export function extractAirportCodeFromWeb(line) {
  const trimmedLine = line.trim();
  console.log(`extractAirportCode: ${trimmedLine}`);
  
  // Match "M,C,OMCO" format (3 letters after the comma)
  const match = trimmedLine.match(/[A-Za-z],\s*[A-Za-z],\s*[A-Za-z],\s*[A-Za-z]\s*([A-Za-z]{4})/);
  console.log(`match: ${match}`);
  if (match) return match[1];
  
  // Match "M,C,O,DMCOD" format (4 letters after the comma)
  const altMatch = trimmedLine.match(/[A-Za-z],\s*[A-Za-z],\s*[A-Za-z]\s*([A-Za-z]{3})/);
  console.log(`altMatch: ${altMatch}`);
  return altMatch ? altMatch[1] : '';
}

/**
 * Extract city description from location string
 * @param {string} locationStr - Location string (e.g., "City, State, Country (ABC)")
 * @returns {string} City name
 */
export function extractCityDesc(locationStr) {
  const parts = locationStr.split(',');
  return parts[0] || '';
}

/**
 * Month name to index lookup
 */
export const MONTH_LOOKUP = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

/**
 * Normalize spaces in string (remove non-breaking spaces and normalize whitespace)
 * @param {string} str - Input string
 * @returns {string} Normalized string
 */
export function normalizeSpaces(str) {
  return str.replace(/[\u00A0\u202F]/g, ' ').replace(/\s+/g, ' ').trim();
} 