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
      trip_id: tripId,
    };
  }
}

function classifyTextAndGetParser(text) {
  if (typeof text !== 'string') return new BaseLegParser();
  const trimmed = text.trim();
  if (trimmed.length === 0) return new BaseLegParser();

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

