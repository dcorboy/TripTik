import { formatInTimezone } from '../config/timezone.js';

/**
 * Analyzes trip data and returns formatted text output
 * @param {Object} trip - The trip object
 * @param {Array} legs - Array of leg objects for the trip
 * @returns {string} - Formatted analysis output
 */
export function analyzeTrip(trip, legs) {
  let output = [];
  
  if (legs.length === 0) {
    output.push("No legs found for this trip.");
  } else {
    output.push("Legs in this trip:");
    legs.forEach((leg, index) => {
      const departureTime = formatInTimezone(leg.departure_datetime, leg.departure_timezone || 'America/New_York');
      const arrivalTime = formatInTimezone(leg.arrival_datetime, leg.arrival_timezone || 'America/New_York');
      output.push(`${index + 1}. ${leg.name}`);
      output.push(`   Departure: ${departureTime}`);
      output.push(`   Arrival: ${arrivalTime}`);
      output.push('');
    });
  }
  
  return output.join('\n');
} 