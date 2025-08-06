import { formatInUserTimezone } from '../config/timezone.js';

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
      const departureTime = formatInUserTimezone(leg.departure_datetime);
      const arrivalTime = formatInUserTimezone(leg.arrival_datetime);
      output.push(`${index + 1}. ${leg.name}`);
      output.push(`   Departure: ${departureTime}`);
      output.push(`   Arrival: ${arrivalTime}`);
      output.push('');
    });
  }
  
  return output.join('\n');
} 