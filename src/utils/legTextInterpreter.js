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
    const carrierMatch = firstLine.match(/–\s+([A-Za-z]{2,4}\s+\d{1,5})/);
    const carrier = carrierMatch ? carrierMatch[1].trim() : '';

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
        confirmationValue = normalizeSpaces(lines[i + 1]);
      }
    }

    return {
      name: 'Gmail-Parsed',
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

function classifyTextAndGetParser(text) {
  if (typeof text !== 'string') return new BaseLegParser();
  const trimmed = text.trim();
  if (trimmed.length === 0) return new BaseLegParser();

  // Gmail format: first line ends with "– <AA> <123>"
  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() || '';
  if (/–\s+[A-Za-z]{2,4}\s+\d{1,5}$/.test(firstLine)) {
    return new GmailParser();
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

