// Utility to classify pasted leg text and parse it into a leg object.
// Designed for easy extension: add new parser classes and update classifyTextAndGetParser.

class BaseLegParser {
  parse(text, { currentTimezone, tripId }) {
    const nowIso = new Date().toISOString();
    return {
      name: 'Unknown Leg',
      departure_datetime: nowIso,
      departure_location: '',
      departure_timezone: currentTimezone,
      arrival_datetime: nowIso,
      arrival_location: '',
      arrival_timezone: currentTimezone,
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
    return {
      name: 'Demo-Parsed',
      departure_datetime: nowIso,
      departure_location: '',
      departure_timezone: currentTimezone,
      arrival_datetime: nowIso,
      arrival_location: '',
      arrival_timezone: currentTimezone,
      carrier,
      confirmation: text,
      trip_id: tripId,
    };
  }
}

// GmailParser
// Supports
//   Leg Description
//   Departure Date
//   Departure Time
//   Arrival Date
//   Arrival Time
//   NO Departure Location
//   NO Arrival Location
//   Flight Number
//   NO Confirmation
class GmailParser extends BaseLegParser {
  parse(text, { currentTimezone, tripId }) {
    const nowIso = new Date().toISOString();
    const lines = String(text).split(/\r?\n/).map(l => l.trim());
    const firstLine = lines[0] || '';
    // Timezone context: initialize from the user's timezone if available via caller; use currentTimezone as given
    const timezoneContext = currentTimezone;

    // Capture the carrier code and number that follow the en dash on the first line
    const carrierMatch = firstLine.match(/[–—]\s+([A-Za-z]{2,4}\s+\d{1,5})/);
    const carrier = carrierMatch ? carrierMatch[1].trim() : '';
    // Name is everything before the dash
    const headerName = (firstLine.split(/[–—]/)[0] || '').trim();

    // Helpers local to this function
    const monthLookup = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    const normalizeSpaces = (s) => s.replace(/[\u00A0\u202F]/g, ' ').replace(/\s+/g, ' ').trim();
    const parseGmailDateTime = (raw) => {
      const s = normalizeSpaces(raw);
      console.log(`s: ${s}`);
      // Ex: "Jul 29, 8:15 AM" or "Wed, Aug 6, 9:25 PM"
      const m = s.match(/^(?:[A-Za-z]{3},\s*)?([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{1,2}):(\d{2})\s*([AP])M$/i);
      console.log(`m: ${m}`);
      if (!m) return null;
      const [, monAbbrev, dayStr, hourStr, minuteStr, ampm] = m;
      const monthIndex = monthLookup[monAbbrev];
      if (monthIndex == null) return null;
      const year = new Date().getFullYear();
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const isPM = ampm.toUpperCase() === 'P';
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      const wallClockDate = new Date(year, monthIndex, parseInt(dayStr, 10), hour, minute, 0, 0);
      console.log(`wallClockDate: ${wallClockDate}`);
      // Convert wall-clock in timezoneContext to UTC ISO
      // Inline conversion equivalent to localToUTC to avoid external changes
      const y = wallClockDate.getFullYear();
      const mi = wallClockDate.getMonth();
      const d = wallClockDate.getDate();
      const H = wallClockDate.getHours();
      const M = wallClockDate.getMinutes();
      const naiveUtcMs = Date.UTC(y, mi, d, H, M, 0, 0);
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneContext,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
      console.log(`dtf: ${dtf}`);
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
      departure_timezone: timezoneContext,
      arrival_datetime: arrivalISO,
      arrival_location: '',
      arrival_timezone: timezoneContext,
      carrier,
      confirmation: confirmationValue,
      description: 'Gmail parsed',
      trip_id: tripId,
    };
  }
}

// UnitedEmailParser
// Supports
//   Leg Description
//   Departure Date
//   Departure Time
//   INFERRED Arrival Date
//   Arrival Time
//   NO Departure Location
//   NO Arrival Location
//   Flight Number
//   NO Confirmation
class UnitedEmailParser extends BaseLegParser {
  parse(text, { currentTimezone, tripId }) {
    const lines = String(text).split(/\r?\n/).map(l => l.trim());
    const idxName = lines.findIndex(l => /^Flight to\b/.test(l));
    const nameLine = idxName >= 0 ? lines[idxName] : '';

    // Timezone contexts initialized to currentTimezone
    const departureTimezoneContext = currentTimezone;
    const arrivalTimezoneContext = currentTimezone;

    // Parse date line (immediately after name line): "Jul 29, 2025"
    const dateLine = idxName >= 0 && idxName + 1 < lines.length ? lines[idxName + 1] : '';
    const dateMatch = dateLine.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
    const monthLookup = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    let baseYear, baseMonthIndex, baseDay;
    if (dateMatch) {
      baseMonthIndex = monthLookup[dateMatch[1]];
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

    // Helper: parse hh:mm AM/PM to 24h
    const parseTime = (t) => {
      const mm = String(t || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AP])M$/i);
      if (!mm) return { hour: 0, minute: 0 };
      let hour = parseInt(mm[1], 10);
      const minute = parseInt(mm[2], 10);
      const isPM = mm[3].toUpperCase() === 'P';
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      return { hour, minute };
    };

    const { hour: dH, minute: dM } = parseTime(departTimeStr);
    const { hour: aH, minute: aM } = parseTime(arriveTimeStr);

    // Convert wall-clock to UTC ISO using given timezone contexts
    const toIsoInZone = (zone, year, monthIndex, day, hour, minute) => {
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
    };

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
// Supports
//   NO Leg Description
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
    const departureTimezoneContext = currentTimezone;
    const arrivalTimezoneContext = currentTimezone;

    // Helper: parse hh:mm AM/PM to 24h
    const parseTime = (t) => {
      const mm = String(t || '').trim().match(/^(\d{1,2}):(\d{2})\s*([AP])M$/i);
      if (!mm) return { hour: 0, minute: 0 };
      let hour = parseInt(mm[1], 10);
      const minute = parseInt(mm[2], 10);
      const isPM = mm[3].toUpperCase() === 'P';
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      return { hour, minute };
    };

    // Helper: parse date like "Tue, Aug 12, 2025"
    const parseDate = (dateStr) => {
      const match = dateStr.match(/^[A-Za-z]{3},\s*([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/);
      if (!match) return null;
      const monthLookup = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
      const monthIndex = monthLookup[match[1]];
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      return { year, monthIndex, day };
    };

    // Helper: extract airport code from "M,C,OMCO" or "M,C,O,DMCOD" format
    const extractAirportCode = (line) => {
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
    };

    // Helper: convert wall-clock to UTC ISO using given timezone context
    const toIsoInZone = (zone, year, monthIndex, day, hour, minute) => {
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
    };

    // Find departure date (first line after "Depart")
    const idxDepart = lines.findIndex(l => /^Depart\b/i.test(l));
    const depDateLine = idxDepart >= 0 && idxDepart + 1 < lines.length ? lines[idxDepart + 1] : '';
    const depDate = parseDate(depDateLine);

    // Find departure time (next line after departure date)
    const depTimeLine = idxDepart >= 0 && idxDepart + 2 < lines.length ? lines[idxDepart + 2] : '';
    const depTime = parseTime(depTimeLine);

    // Find departure location (next non-empty line after departure time)
    const depLocLine = idxDepart >= 0 && idxDepart + 3 < lines.length ? lines[idxDepart + 3] : '';
    const depLoc = extractAirportCode(depLocLine);

    // Find arrival date (first line after "Arrive")
    const idxArrive = lines.findIndex(l => /^Arrive\b/i.test(l));
    const arrDateLine = idxArrive >= 0 && idxArrive + 1 < lines.length ? lines[idxArrive + 1] : '';
    const arrDate = parseDate(arrDateLine);

    // Find arrival time (next line after arrival date)
    const arrTimeLine = idxArrive >= 0 && idxArrive + 2 < lines.length ? lines[idxArrive + 2] : '';
    const arrTime = parseTime(arrTimeLine);

    // Find arrival location (next non-empty line after arrival time)
    const arrLocLine = idxArrive >= 0 && idxArrive + 3 < lines.length ? lines[idxArrive + 3] : '';
    const arrLoc = extractAirportCode(arrLocLine);

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
      name: 'United-Web-Parsed',
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

