import { formatInTimezone } from '../config/timezone.js';
import { formatFullDate } from './dateFormatters.js';

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
    output.push("Full trip:");
    
    // Get trip bounds from first and last legs
    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];
    
    if (firstLeg && lastLeg) {
      const departureDate = formatFullDate(
        firstLeg.departure_datetime, 
        firstLeg.departure_timezone || 'America/New_York'
      );
      const arrivalDate = formatFullDate(
        lastLeg.arrival_datetime, 
        lastLeg.arrival_timezone || 'America/New_York'
      );
      
      output.push(`${departureDate} - ${arrivalDate}`);
    }
    
    output.push('');
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