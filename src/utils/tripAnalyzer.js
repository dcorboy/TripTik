import { formatInTimezone } from '../config/timezone.js';
import { formatFullDate, formatShortDate, formatTimeWithZone } from './dateFormatters.js';

/**
 * Calculate duration between two dates
 * @param {string} startDateTime - ISO datetime string
 * @param {string} endDateTime - ISO datetime string
 * @param {boolean} includeMinutes - Whether to include minutes in the output
 * @returns {string} - Formatted duration string
 */
function calculateDuration(startDateTime, endDateTime, includeMinutes = false) {
  if (!startDateTime || !endDateTime) return '';
  
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const diffMs = end - start;
  
  if (diffMs <= 0) return '0 minutes';
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let duration = '';
  if (diffDays > 0) {
    // Multi-day duration: show days and hours, no minutes
    duration += `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffHours > 0) {
      duration += `, ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
  } else if (diffHours > 0) {
    // Less than a day but more than an hour: show hours and minutes
    duration += `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    if (includeMinutes && diffMinutes > 0) {
      duration += `, ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
  } else {
    // Less than an hour: show only minutes
    duration += `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }
  
  return duration;
}

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
      
      // Add departure and arrival summary
      const depTime = formatTimeWithZone(
        firstLeg.departure_datetime,
        firstLeg.departure_timezone || 'America/New_York'
      );
      const depDate = formatShortDate(
        firstLeg.departure_datetime,
        firstLeg.departure_timezone || 'America/New_York'
      );
      const depLocation = firstLeg.departure_location || '';
      const depCarrier = firstLeg.carrier || '';
      
      const arrTime = formatTimeWithZone(
        lastLeg.arrival_datetime,
        lastLeg.arrival_timezone || 'America/New_York'
      );
      const arrDate = formatShortDate(
        lastLeg.arrival_datetime,
        lastLeg.arrival_timezone || 'America/New_York'
      );
      const arrLocation = lastLeg.arrival_location || '';
      const arrCarrier = lastLeg.carrier || '';
      
      output.push(`DEP ${depLocation} ${depTime} ${depDate} (${depCarrier})`);
      output.push(`ARR ${arrLocation} ${arrTime} ${arrDate} (${arrCarrier})`);
      
      // Calculate and display duration (no minutes for total trip)
      const duration = calculateDuration(firstLeg.departure_datetime, lastLeg.arrival_datetime, false);
      output.push(`Duration: ${duration}`);
    }
    
    output.push('');
    output.push("Legs in this trip:");
    legs.forEach((leg, index) => {
      // Leg name
      output.push(leg.name);
      
      // Departure info
      const depTime = formatTimeWithZone(
        leg.departure_datetime,
        leg.departure_timezone || 'America/New_York'
      );
      const depDate = formatShortDate(
        leg.departure_datetime,
        leg.departure_timezone || 'America/New_York'
      );
      const depLocation = leg.departure_location || '';
      const depCarrier = leg.carrier || '';
      output.push(`DEP ${depLocation} ${depTime} ${depDate} (${depCarrier})`);
      
      // Arrival info
      const arrTime = formatTimeWithZone(
        leg.arrival_datetime,
        leg.arrival_timezone || 'America/New_York'
      );
      const arrDate = formatShortDate(
        leg.arrival_datetime,
        leg.arrival_timezone || 'America/New_York'
      );
      const arrLocation = leg.arrival_location || '';
      const arrCarrier = leg.carrier || '';
      output.push(`ARR ${arrLocation} ${arrTime} ${arrDate} (${arrCarrier})`);
      
      // Leg duration
      const legDuration = calculateDuration(leg.departure_datetime, leg.arrival_datetime, true);
      output.push(`(${legDuration})`);
      
      // Layover time (except for last leg)
      if (index < legs.length - 1) {
        const nextLeg = legs[index + 1];
        const layoverDuration = calculateDuration(leg.arrival_datetime, nextLeg.departure_datetime);
        output.push(`Duration: ${layoverDuration}.`);
      }
      
      output.push('');
    });
  }
  
  return output.join('\n');
} 