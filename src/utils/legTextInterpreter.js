// Utility to classify pasted leg text and parse it into a leg object.
// Designed for easy extension: add new parser classes and update classifyTextAndGetParser.

import { getTimezoneForLocation } from './locationTimezone.js';
import { 
  toIsoInZone, 
  parseTime, 
  parseDate, 
  extractAirportCode, 
  extractAirportCodeFromWeb, 
  extractCityDesc, 
  MONTH_LOOKUP, 
  normalizeSpaces 
} from './parserUtils.js';

class BaseLegParser {
  parse(text, { currentTimezone, tripId }) {
    const nowIso = new Date().toISOString();
    
    // Timezone contexts initialized to currentTimezone
    let departureTimezoneContext = currentTimezone;
    let arrivalTimezoneContext = currentTimezone;
    
    return {
      name: 'Unknown Leg',
      departure_datetime: nowIso,
      departure_location: '',
      departure_timezone: departureTimezoneContext,
      arrival_datetime: nowIso,
      arrival_location: '',
      arrival_timezone: arrivalTimezoneContext,
      carrier: '',
      confirmation: null,
      trip_id: tripId,
    };
  }
}

class DemoFlightParser extends BaseLegParser {
  parse(text, { currentTimezone, tripId }) {
    const nowIso = new Date().toISOString();
    // Expect format like: "Flight <Carrier> ..."
    const tokens = String(text).trim().split(/\s+/);
    const carrier = tokens.length >= 2 ? tokens[1] : '';
    
    // Timezone contexts initialized to currentTimezone
    let departureTimezoneContext = currentTimezone;
    let arrivalTimezoneContext = currentTimezone;
    
    return {
      name: 'Demo-Parsed',
      departure_datetime: nowIso,
      departure_location: '',
      departure_timezone: departureTimezoneContext,
      arrival_datetime: nowIso,
      arrival_location: '',
      arrival_timezone: arrivalTimezoneContext,
      carrier,
      confirmation: text,
      trip_id: tripId,
    };
  }
}

// GmailParser
// Summary at the top of Gmail for travel email from carrier
// Supports
//   Leg Description
//   Departure Date
//   Departure Time
//   Arrival Date
//   Arrival Time
//   NO Departure Location
//   NO Arrival Location
//   Flight Number
//   Confirmation
class GmailParser extends BaseLegParser {
  parse(text, { currentTimezone, tripId }) {
    const nowIso = new Date().toISOString();
    const lines = String(text).split(/\r?\n/).map(l => l.trim());
    const firstLine = lines[0] || '';
    
    // Timezone contexts initialized to currentTimezone
    let departureTimezoneContext = currentTimezone;
    let arrivalTimezoneContext = currentTimezone;

    // Capture the carrier code and number that follow the en dash on the first line
    const carrierMatch = firstLine.match(/[–—]\s+([A-Za-z]{2,4}\s+\d{1,5})/);
    const carrier = carrierMatch ? carrierMatch[1].trim() : '';
    // Name is everything before the dash
    const headerName = (firstLine.split(/[–—]/)[0] || '').trim();

    const parseGmailDateTime = (raw) => {
      const s = normalizeSpaces(raw);
      console.log(`s: ${s}`);
      // Ex: "Jul 29, 8:15 AM" or "Wed, Aug 6, 9:25 PM"
      const m = s.match(/^(?:[A-Za-z]{3},\s*)?([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{1,2}):(\d{2})\s*([AP])M$/i);
      console.log(`m: ${m}`);
      if (!m) return null;
      const [, monAbbrev, dayStr, hourStr, minuteStr, ampm] = m;
      const monthIndex = MONTH_LOOKUP[monAbbrev];
      if (monthIndex == null) return null;
      const year = new Date().getFullYear();
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const isPM = ampm.toUpperCase() === 'P';
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      
      // Use departure timezone context for take-off, arrival timezone context for landing
      const timezoneContext = raw.includes('Take-off') ? departureTimezoneContext : arrivalTimezoneContext;
      return toIsoInZone(timezoneContext, year, monthIndex, parseInt(dayStr, 10), hour, minute);
    };

    let departureISO = nowIso;
    let arrivalISO = nowIso;
    let confirmationValue = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^Take-off\b/i.test(line) && i + 1 < lines.length) {
        const candidate = lines[i + 1];
        const parsed = parseGmailDateTime(candidate);
        console.log(`Take Off: ${parsed}`);
        if (parsed) departureISO = parsed;
      } else if (/^Landing\b/i.test(line) && i + 1 < lines.length) {
        const candidate = lines[i + 1];
        const parsed = parseGmailDateTime(candidate);
        console.log(`Landing: ${parsed}`);
        if (parsed) arrivalISO = parsed;
      } else if (/^Confirmation number\b/i.test(line) && i + 1 < lines.length) {
        console.log(`confirmation number: ${lines[i + 1]}`);
        confirmationValue = normalizeSpaces(lines[i + 1]);
      }
    }

    return {
      name: headerName || 'Gmail-Parsed',
      departure_datetime: departureISO,
      departure_location: '',
      departure_timezone: departureTimezoneContext,
      arrival_datetime: arrivalISO,
      arrival_location: '',
      arrival_timezone: arrivalTimezoneContext,
      carrier,
      confirmation: confirmationValue,
      description: 'Gmail parsed',
      trip_id: tripId,
    };
  }
}

// UnitedEmailParser
// Email titled "Your United Airlines booking confirmation"
// Supports
//   Leg Description
//   Departure Date
//   Departure Time
//   INFERRED Arrival Date
//   Arrival Time
//   Departure Location
//   Arrival Location
//   Flight Number
//   NO Confirmation
class UnitedEmailParser extends BaseLegParser {
  parse(text, { currentTimezone, tripId }) {
    const lines = String(text).split(/\r?\n/).map(l => l.trim());
    const idxName = lines.findIndex(l => /^Flight to\b/.test(l));
    const nameLine = idxName >= 0 ? lines[idxName] : '';

    // Timezone contexts initialized to currentTimezone
    let departureTimezoneContext = currentTimezone;
    let arrivalTimezoneContext = currentTimezone;

    // Parse date line (immediately after name line): "Jul 29, 2025"
    const dateLine = idxName >= 0 && idxName + 1 < lines.length ? lines[idxName + 1] : '';
    const dateMatch = dateLine.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
    let baseYear, baseMonthIndex, baseDay;
    if (dateMatch) {
      baseMonthIndex = MONTH_LOOKUP[dateMatch[1]];
      baseDay = parseInt(dateMatch[2], 10);
      baseYear = parseInt(dateMatch[3], 10);
    } else {
      const now = new Date();
      baseYear = now.getFullYear();
      baseMonthIndex = now.getMonth();
      baseDay = now.getDate();
    }

    // Find times line after the date line: "8:15 AM 10:33 AM"
    const timeLineIdxStart = Math.max(0, (idxName >= 0 ? idxName + 2 : 0));
    const idxTimes = lines.findIndex((l, i) => i >= timeLineIdxStart && /(\d{1,2}:\d{2}\s*[AP]M)\s+(\d{1,2}:\d{2}\s*[AP]M)/i.test(l));
    let departTimeStr = null, arriveTimeStr = null;
    if (idxTimes >= 0) {
      const m = lines[idxTimes].match(/(\d{1,2}:\d{2}\s*[AP]M)\s+(\d{1,2}:\d{2}\s*[AP]M)/i);
      if (m) {
        departTimeStr = m[1];
        arriveTimeStr = m[2];
      }
    }

    const { hour: dH, minute: dM } = parseTime(departTimeStr);
    const { hour: aH, minute: aM } = parseTime(arriveTimeStr);

    const departureISO = toIsoInZone(departureTimezoneContext, baseYear, baseMonthIndex, baseDay, dH, dM);
    const arrivalISO = toIsoInZone(arrivalTimezoneContext, baseYear, baseMonthIndex, baseDay, aH, aM);

    // Departure and arrival locations after the times line
    const idxDepLoc = lines.findIndex((l, i) => i > (idxTimes >= 0 ? idxTimes : -1) && /^[A-Za-z]{3,4}$/.test(l));
    const idxArrLoc = lines.findIndex((l, i) => i > (idxDepLoc >= 0 ? idxDepLoc : -1) && /^[A-Za-z]{3,4}/.test(l));
    const depLoc = idxDepLoc >= 0 ? lines[idxDepLoc] : '';
    const arrLoc = idxArrLoc >= 0 ? lines[idxArrLoc] : '';

    // Carrier appears after a line starting with "Duration"
    const idxDuration = lines.findIndex(l => /^Duration\b/i.test(l));
    const carrier = (idxDuration >= 0 && idxDuration + 1 < lines.length) ? lines[idxDuration + 1].trim() : '';

    return {
      name: nameLine || 'United-Parsed',
      departure_datetime: departureISO,
      departure_location: depLoc,
      departure_timezone: departureTimezoneContext,
      arrival_datetime: arrivalISO,
      arrival_location: arrLoc,
      arrival_timezone: arrivalTimezoneContext,
      carrier,
      confirmation: null,
      trip_id: tripId,
    };
  }
}

// UnitedWebParser
// United website: My Trips > Info
// Supports
//   INFERRED Leg Description (concatenated from locations)
//   Departure Date
//   Departure Time
//   Arrival Date
//   Arrival Time
//   Departure Location
//   Arrival Location
//   Flight Number
//   NO Confirmation
class UnitedWebParser extends BaseLegParser {
  parse(text, { currentTimezone, tripId }) {
    const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    
    // Timezone contexts initialized to currentTimezone
    let departureTimezoneContext = currentTimezone;
    let arrivalTimezoneContext = currentTimezone;



    // Find departure date (first line after "Depart")
    const idxDepart = lines.findIndex(l => /^Depart\b/i.test(l));
    const depDateLine = idxDepart >= 0 && idxDepart + 1 < lines.length ? lines[idxDepart + 1] : '';
    const depDate = parseDate(depDateLine);

    // Find departure time (next line after departure date)
    const depTimeLine = idxDepart >= 0 && idxDepart + 2 < lines.length ? lines[idxDepart + 2] : '';
    const depTime = parseTime(depTimeLine);

    // Find departure location (next non-empty line after departure time)
    const depLocLine = idxDepart >= 0 && idxDepart + 3 < lines.length ? lines[idxDepart + 3] : '';
    const depLoc = extractAirportCodeFromWeb(depLocLine);

    // Update departure timezone context based on departure location
    if (depLoc) {
      const depTimezone = getTimezoneForLocation(depLoc);
      if (depTimezone) {
        departureTimezoneContext = depTimezone;
        console.log(`departureTimezoneContext: ${departureTimezoneContext}`);
      }
    }

    // Find departure location (next non-empty line after departure time)
    const depLocDescLine = idxDepart >= 0 && idxDepart + 4 < lines.length ? lines[idxDepart + 4] : '';
    const depLocDesc = depLocDescLine.split(',')[0] || '';

    // Find arrival date (first line after "Arrive")
    const idxArrive = lines.findIndex(l => /^Arrive\b/i.test(l));
    const arrDateLine = idxArrive >= 0 && idxArrive + 1 < lines.length ? lines[idxArrive + 1] : '';
    const arrDate = parseDate(arrDateLine);

    // Find arrival time (next line after arrival date)
    const arrTimeLine = idxArrive >= 0 && idxArrive + 2 < lines.length ? lines[idxArrive + 2] : '';
    const arrTime = parseTime(arrTimeLine);

    // Find arrival location (next non-empty line after arrival time)
    const arrLocLine = idxArrive >= 0 && idxArrive + 3 < lines.length ? lines[idxArrive + 3] : '';
    const arrLoc = extractAirportCodeFromWeb(arrLocLine);

    // Update arrival timezone context based on arrival location
    if (arrLoc) {
      const arrTimezone = getTimezoneForLocation(arrLoc);
      if (arrTimezone) {
        arrivalTimezoneContext = arrTimezone;
        console.log(`arrivalTimezoneContext: ${arrivalTimezoneContext}`);
      }
    }

    // Find departure location (next non-empty line after departure time)
    const arrLocDescLine = idxArrive >= 0 && idxArrive + 4 < lines.length ? lines[idxArrive + 4] : '';
    const arrLocDesc = arrLocDescLine.split(',')[0] || '';

    // Find carrier (line starting with "Flight" but not "Flight Info")
    const idxFlight = lines.findIndex(l => /^Flight\b/i.test(l) && !/^Flight Info\b/i.test(l));
    const carrier = idxFlight >= 0 ? lines[idxFlight].replace(/^Flight\s+/i, '').trim() : '';

    // Convert to ISO strings
    let departureISO = new Date().toISOString();
    let arrivalISO = new Date().toISOString();

    if (depDate && depTime.hour !== 0) {
      departureISO = toIsoInZone(departureTimezoneContext, depDate.year, depDate.monthIndex, depDate.day, depTime.hour, depTime.minute);
    }
    if (arrDate && arrTime.hour !== 0) {
      arrivalISO = toIsoInZone(arrivalTimezoneContext, arrDate.year, arrDate.monthIndex, arrDate.day, arrTime.hour, arrTime.minute);
    }

    return {
      name: depLocDesc + ' to ' + arrLocDesc,
      departure_datetime: departureISO,
      departure_location: depLoc,
      departure_timezone: departureTimezoneContext,
      arrival_datetime: arrivalISO,
      arrival_location: arrLoc,
      arrival_timezone: arrivalTimezoneContext,
      carrier,
      confirmation: null,
      trip_id: tripId,
    };
  }
}

// UnitedEmailParser2
// United email subject "eTicket Itinerary and Receipt for Confirmation"
// Supports
//   INFERREDLeg Description (concatenated from locations)
//   Departure Date
//   Departure Time
//   Arrival Date
//   Arrival Time
//   Departure Location
//   Arrival Location
//   Flight Number
//   Confirmation (if included)
class UnitedEmailParser2 extends BaseLegParser {
  parse(text, { currentTimezone, tripId }) {
    const lines = String(text).split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    
    // Timezone contexts initialized to currentTimezone
    let departureTimezoneContext = currentTimezone;
    let arrivalTimezoneContext = currentTimezone;



    // Find confirmation number (optional)
    const idxConfirmation = lines.findIndex(l => /^Confirmation Number:\s*$/i.test(l));
    const confirmation = (idxConfirmation >= 0 && idxConfirmation + 1 < lines.length) ? lines[idxConfirmation + 1].trim() : null;

    // Find flight line with carrier
    const idxFlight = lines.findIndex(l => /^Flight\s+\d{1,2}\s+of\s+\d{1,2}\s+([A-Za-z]{2}\d{1,4})/i.test(l));
    const carrierMatch = idxFlight >= 0 ? lines[idxFlight].match(/^Flight\s+\d{1,2}\s+of\s+\d{1,2}\s+([A-Za-z]{2}\d{1,4})/i) : null;
    const carrier = carrierMatch ? carrierMatch[1] : '';

    // Find the three lines with departure/arrival info
    const infoStartIdx = idxFlight >= 0 ? idxFlight + 1 : 0;
    const dateLine = infoStartIdx < lines.length ? lines[infoStartIdx] : '';
    const timeLine = infoStartIdx + 1 < lines.length ? lines[infoStartIdx + 1] : '';
    const locationLine = infoStartIdx + 2 < lines.length ? lines[infoStartIdx + 2] : '';

    // Parse departure and arrival dates
    const dateParts = dateLine.split(/\s{2,}/);
    const depDateStr = dateParts[0] || '';
    const arrDateStr = dateParts[1] || '';
    const depDate = parseDate(depDateStr);
    const arrDate = parseDate(arrDateStr);

    // Parse departure and arrival times
    const timeParts = timeLine.split(/\s{2,}/);
    const depTimeStr = timeParts[0] || '';
    const arrTimeStr = timeParts[1] || '';
    const depTime = parseTime(depTimeStr);
    const arrTime = parseTime(arrTimeStr);

    // Parse departure and arrival locations
    const locationParts = locationLine.split(/\s{2,}/);
    const depLocationStr = locationParts[0] || '';
    const arrLocationStr = locationParts[1] || '';
    const depLoc = extractAirportCode(depLocationStr);
    const arrLoc = extractAirportCode(arrLocationStr);
    const depLocDesc = extractCityDesc(depLocationStr);
    const arrLocDesc = extractCityDesc(arrLocationStr);

    // Update timezone contexts based on airport locations
    if (depLoc) {
      const depTimezone = getTimezoneForLocation(depLoc);
      if (depTimezone) {
        departureTimezoneContext = depTimezone;
      }
    }
    if (arrLoc) {
      const arrTimezone = getTimezoneForLocation(arrLoc);
      if (arrTimezone) {
        arrivalTimezoneContext = arrTimezone;
      }
    }

    // Convert to ISO strings
    let departureISO = new Date().toISOString();
    let arrivalISO = new Date().toISOString();

    if (depDate && depTime.hour !== 0) {
      departureISO = toIsoInZone(departureTimezoneContext, depDate.year, depDate.monthIndex, depDate.day, depTime.hour, depTime.minute);
    }
    if (arrDate && arrTime.hour !== 0) {
      arrivalISO = toIsoInZone(arrivalTimezoneContext, arrDate.year, arrDate.monthIndex, arrDate.day, arrTime.hour, arrTime.minute);
    }

    // Create leg description by concatenating city descriptions
    const legDescription = [depLocDesc, arrLocDesc].filter(Boolean).join(' to ');

    return {
      name: legDescription || 'United-Email2-Parsed',
      departure_datetime: departureISO,
      departure_location: depLoc,
      departure_timezone: departureTimezoneContext,
      arrival_datetime: arrivalISO,
      arrival_location: arrLoc,
      arrival_timezone: arrivalTimezoneContext,
      carrier,
      confirmation,
      trip_id: tripId,
    };
  }
}

function classifyTextAndGetParser(text) {
  if (typeof text !== 'string') return new BaseLegParser();
  const trimmed = text.trim();
  if (trimmed.length === 0) return new BaseLegParser();

  // Gmail format: first line ends with "– <AA> <123>"
  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() || '';
  if (/–\s+[A-Za-z]{2,4}\s+\d{1,5}$/.test(firstLine)) {
    return new GmailParser();
  }

  // United email: any line starting with "Flight to "
  const hasUnitedHeader = trimmed.split(/\r?\n/).some(l => /^Flight to\b/.test(l.trim()))
  if (hasUnitedHeader) {
    return new UnitedEmailParser();
  }

  // United web: any line starting with "Depart"
  const hasUnitedWebHeader = trimmed.split(/\r?\n/).some(l => /^Depart\b/i.test(l.trim()))
  if (hasUnitedWebHeader) {
    return new UnitedWebParser();
  }

  // United email 2: any line starting with "Flight X of Y"
  const hasUnitedEmail2Header = trimmed.split(/\r?\n/).some(l => /^Flight\s+\d{1,2}\s+of\s+\d{1,2}\b/i.test(l.trim()))
  if (hasUnitedEmail2Header) {
    console.log('using UnitedEmailParser2');
    return new UnitedEmailParser2();
  }

  // Demo classifier: first non-whitespace token is "Flight" (case-insensitive)
  const firstTokenMatch = trimmed.match(/^([^\s]+)/);
  const firstToken = firstTokenMatch ? firstTokenMatch[1] : '';
  if (firstToken && firstToken.toLowerCase() === 'flight') {
    return new DemoFlightParser();
  }

  return new BaseLegParser();
}

export function parseLegFromText(text, currentTimezone, tripId) {
  const parser = classifyTextAndGetParser(text);
  return parser.parse(text, { currentTimezone, tripId });
}

export { BaseLegParser };

