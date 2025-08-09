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
      // Ex: "Jul 29, 8:15 AM"
      const m = s.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{1,2}):(\d{2})\s*([AP])M$/i);
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
        if (parsed) departureISO = parsed;
      } else if (/^Landing\b/i.test(line) && i + 1 < lines.length) {
        const candidate = lines[i + 1];
        const parsed = parseGmailDateTime(candidate);
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

