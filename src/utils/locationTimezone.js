// Airport code to IANA timezone mapping
const AIRPORT_TIMEZONES = {
  // US Airports
  'IAD': 'America/New_York',    // Washington Dulles
  'DCA': 'America/New_York',    // Washington Reagan
  'JFK': 'America/New_York',    // New York JFK
  'LGA': 'America/New_York',    // New York LaGuardia
  'EWR': 'America/New_York',    // Newark
  'BOS': 'America/New_York',    // Boston
  'PIT': 'America/New_York',    // Pittsburgh
  'PHL': 'America/New_York',    // Philadelphia
  'BWI': 'America/New_York',    // Baltimore
  'CLT': 'America/New_York',    // Charlotte
  'ATL': 'America/New_York',    // Atlanta
  'MIA': 'America/New_York',    // Miami
  'MCO': 'America/New_York',    // Orlando
  'FLL': 'America/New_York',    // Fort Lauderdale
  'TPA': 'America/New_York',    // Tampa
  'JAX': 'America/New_York',    // Jacksonville
  'CHS': 'America/New_York',    // Charleston
  'SAV': 'America/New_York',    // Savannah
  'ORF': 'America/New_York',    // Norfolk
  'RIC': 'America/New_York',    // Richmond
  
  // Central Time
  'ORD': 'America/Chicago',      // Chicago O'Hare
  'MDW': 'America/Chicago',      // Chicago Midway
  'DFW': 'America/Chicago',      // Dallas/Fort Worth
  'IAH': 'America/Chicago',      // Houston Intercontinental
  'HOU': 'America/Chicago',      // Houston Hobby
  'MSY': 'America/Chicago',      // New Orleans
  'BNA': 'America/Chicago',      // Nashville
  'MEM': 'America/Chicago',      // Memphis
  'STL': 'America/Chicago',      // St. Louis
  'MCI': 'America/Chicago',      // Kansas City
  'MSP': 'America/Chicago',      // Minneapolis
  'MKE': 'America/Chicago',      // Milwaukee
  'DSM': 'America/Chicago',      // Des Moines
  'OMA': 'America/Chicago',      // Omaha
  'OKC': 'America/Chicago',      // Oklahoma City
  'TUL': 'America/Chicago',      // Tulsa
  'LIT': 'America/Chicago',      // Little Rock
  'BHM': 'America/Chicago',      // Birmingham
  'JAN': 'America/Chicago',      // Jackson
  
  // Mountain Time
  'DEN': 'America/Denver',       // Denver
  'PHX': 'America/Phoenix',      // Phoenix
  'ABQ': 'America/Denver',       // Albuquerque
  'SLC': 'America/Denver',       // Salt Lake City
  'BOI': 'America/Boise',        // Boise
  'LAS': 'America/Los_Angeles',  // Las Vegas
  'RNO': 'America/Los_Angeles',  // Reno
  'TUS': 'America/Phoenix',      // Tucson
  'ELP': 'America/Denver',       // El Paso
  'COS': 'America/Denver',       // Colorado Springs
  'GJT': 'America/Denver',       // Grand Junction
  'ASE': 'America/Denver',       // Aspen
  'DRO': 'America/Denver',       // Durango
  
  // Pacific Time
  'LAX': 'America/Los_Angeles',  // Los Angeles
  'SFO': 'America/Los_Angeles',  // San Francisco
  'SAN': 'America/Los_Angeles',  // San Diego
  'OAK': 'America/Los_Angeles',  // Oakland
  'SJC': 'America/Los_Angeles',  // San Jose
  'SAC': 'America/Los_Angeles',  // Sacramento
  'SMF': 'America/Los_Angeles',  // Sacramento
  'ONT': 'America/Los_Angeles',  // Ontario
  'BUR': 'America/Los_Angeles',  // Burbank
  'LGB': 'America/Los_Angeles',  // Long Beach
  'PSP': 'America/Los_Angeles',  // Palm Springs
  'SEA': 'America/Los_Angeles',  // Seattle
  'PDX': 'America/Los_Angeles',  // Portland
  'GEG': 'America/Los_Angeles',  // Spokane
  'BOI': 'America/Boise',        // Boise
  'SLC': 'America/Denver',       // Salt Lake City
  
  // Alaska
  'ANC': 'America/Anchorage',    // Anchorage
  'FAI': 'America/Anchorage',    // Fairbanks
  'JNU': 'America/Anchorage',    // Juneau
  
  // Hawaii
  'HNL': 'Pacific/Honolulu',     // Honolulu
  'OGG': 'Pacific/Honolulu',     // Kahului
  'KOA': 'Pacific/Honolulu',     // Kona
  'LIH': 'Pacific/Honolulu',     // Lihue
  
  // Major International Airports
  'LHR': 'Europe/London',        // London Heathrow
  'LGW': 'Europe/London',        // London Gatwick
  'CDG': 'Europe/Paris',         // Paris Charles de Gaulle
  'FRA': 'Europe/Berlin',        // Frankfurt
  'AMS': 'Europe/Amsterdam',     // Amsterdam
  'MAD': 'Europe/Madrid',        // Madrid
  'BCN': 'Europe/Madrid',        // Barcelona
  'FCO': 'Europe/Rome',          // Rome
  'MXP': 'Europe/Rome',          // Milan
  'ZRH': 'Europe/Zurich',        // Zurich
  'VIE': 'Europe/Vienna',        // Vienna
  'BRU': 'Europe/Brussels',      // Brussels
  'ARN': 'Europe/Stockholm',     // Stockholm
  'CPH': 'Europe/Copenhagen',    // Copenhagen
  'OSL': 'Europe/Oslo',          // Oslo
  'HEL': 'Europe/Helsinki',      // Helsinki
  'WAW': 'Europe/Warsaw',        // Warsaw
  'PRG': 'Europe/Prague',        // Prague
  'BUD': 'Europe/Budapest',      // Budapest
  'ATH': 'Europe/Athens',        // Athens
  'IST': 'Europe/Istanbul',      // Istanbul
  'DME': 'Europe/Moscow',        // Moscow Domodedovo
  'SVO': 'Europe/Moscow',        // Moscow Sheremetyevo
  'LED': 'Europe/Moscow',        // St. Petersburg
  
  // Asia
  'NRT': 'Asia/Tokyo',           // Tokyo Narita
  'HND': 'Asia/Tokyo',           // Tokyo Haneda
  'ICN': 'Asia/Seoul',           // Seoul Incheon
  'GMP': 'Asia/Seoul',           // Seoul Gimpo
  'PEK': 'Asia/Shanghai',        // Beijing
  'PVG': 'Asia/Shanghai',        // Shanghai Pudong
  'SHA': 'Asia/Shanghai',        // Shanghai Hongqiao
  'CAN': 'Asia/Shanghai',        // Guangzhou
  'SZX': 'Asia/Shanghai',        // Shenzhen
  'HKG': 'Asia/Hong_Kong',       // Hong Kong
  'TPE': 'Asia/Taipei',          // Taipei
  'SIN': 'Asia/Singapore',       // Singapore
  'BKK': 'Asia/Bangkok',         // Bangkok
  'KUL': 'Asia/Kuala_Lumpur',    // Kuala Lumpur
  'CGK': 'Asia/Jakarta',         // Jakarta
  'MNL': 'Asia/Manila',          // Manila
  'DEL': 'Asia/Kolkata',         // Delhi
  'BOM': 'Asia/Kolkata',         // Mumbai
  'BLR': 'Asia/Kolkata',         // Bangalore
  'HYD': 'Asia/Kolkata',         // Hyderabad
  'CCU': 'Asia/Kolkata',         // Kolkata
  
  // Australia/Oceania
  'SYD': 'Australia/Sydney',     // Sydney
  'MEL': 'Australia/Melbourne',  // Melbourne
  'BNE': 'Australia/Brisbane',   // Brisbane
  'PER': 'Australia/Perth',      // Perth
  'ADL': 'Australia/Adelaide',   // Adelaide
  'AKL': 'Pacific/Auckland',     // Auckland
  'WLG': 'Pacific/Auckland',     // Wellington
  
  // Middle East
  'DXB': 'Asia/Dubai',           // Dubai
  'AUH': 'Asia/Dubai',           // Abu Dhabi
  'DOH': 'Asia/Qatar',           // Doha
  'RUH': 'Asia/Riyadh',          // Riyadh
  'JED': 'Asia/Riyadh',          // Jeddah
  'TLV': 'Asia/Jerusalem',       // Tel Aviv
  'AMM': 'Asia/Amman',           // Amman
  'BEY': 'Asia/Beirut',          // Beirut
  
  // Africa
  'JNB': 'Africa/Johannesburg',  // Johannesburg
  'CPT': 'Africa/Johannesburg',  // Cape Town
  'CAI': 'Africa/Cairo',         // Cairo
  'NBO': 'Africa/Nairobi',       // Nairobi
  'LAG': 'Africa/Lagos',         // Lagos
  'ACC': 'Africa/Accra',         // Accra
  'DAR': 'Africa/Dar_es_Salaam', // Dar es Salaam
  
  // South America
  'GRU': 'America/Sao_Paulo',    // São Paulo
  'GIG': 'America/Sao_Paulo',    // Rio de Janeiro
  'BSB': 'America/Sao_Paulo',    // Brasília
  'EZE': 'America/Argentina/Buenos_Aires', // Buenos Aires
  'SCL': 'America/Santiago',     // Santiago
  'LIM': 'America/Lima',         // Lima
  'BOG': 'America/Bogota',       // Bogotá
  'MEX': 'America/Mexico_City',  // Mexico City
  'GDL': 'America/Mexico_City',  // Guadalajara
  'MTY': 'America/Mexico_City',  // Monterrey
  'CUN': 'America/Cancun',       // Cancún
  'GUA': 'America/Guatemala',    // Guatemala City
  'SJO': 'America/Costa_Rica',   // San José
  'PTY': 'America/Panama',       // Panama City
  'CCS': 'America/Caracas',      // Caracas
  'UIO': 'America/Guayaquil',    // Quito
  'GYE': 'America/Guayaquil',    // Guayaquil
  'ASU': 'America/Asuncion',     // Asunción
  'MVD': 'America/Montevideo',   // Montevideo
};

/**
 * Get timezone for a location (airport code)
 * @param {string} location - Airport code (e.g., 'IAD', 'LAX')
 * @returns {string|null} - IANA timezone identifier or null if not found
 */
export function getTimezoneForLocation(location) {
  if (!location) return null;
  
  // Convert to uppercase and trim whitespace
  const airportCode = location.toUpperCase().trim();
  
  return AIRPORT_TIMEZONES[airportCode] || null;
}

/**
 * Check if a location has a known timezone
 * @param {string} location - Airport code
 * @returns {boolean} - True if timezone is available
 */
export function hasTimezoneForLocation(location) {
  return getTimezoneForLocation(location) !== null;
} 