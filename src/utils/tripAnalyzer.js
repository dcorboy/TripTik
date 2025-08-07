import { formatInTimezone } from '../config/timezone.js';
import { formatFullDate, formatShortDate, formatTimeWithZone } from './dateFormatters.js';

const LAYOVER_THRESHOLD_HOURS = 8; // Stopovers longer than this will show detailed info

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
    return output.join('\n');
  }

  output.push("Full trip:");
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];
  
  if (firstLeg && lastLeg) {
    const departureDate = formatFullDate(firstLeg.departure_datetime, firstLeg.departure_timezone || 'America/New_York');
    const arrivalDate = formatFullDate(lastLeg.arrival_datetime, lastLeg.arrival_timezone || 'America/New_York');
    output.push(`${departureDate} - ${arrivalDate}`);
    
    const depTime = formatTimeWithZone(firstLeg.departure_datetime, firstLeg.departure_timezone || 'America/New_York');
    const depDate = formatShortDate(firstLeg.departure_datetime, firstLeg.departure_timezone || 'America/New_York');
    const depLocation = firstLeg.departure_location || '';
    const depCarrier = firstLeg.carrier || '';
    output.push(`DEP ${depLocation} ${depTime} ${depDate} (${depCarrier})`);
    
    const arrTime = formatTimeWithZone(lastLeg.arrival_datetime, lastLeg.arrival_timezone || 'America/New_York');
    const arrDate = formatShortDate(lastLeg.arrival_datetime, lastLeg.arrival_timezone || 'America/New_York');
    const arrLocation = lastLeg.arrival_location || '';
    const arrCarrier = lastLeg.carrier || '';
    output.push(`ARR ${arrLocation} ${arrTime} ${arrDate} (${arrCarrier})`);
    
    const duration = calculateDuration(firstLeg.departure_datetime, lastLeg.arrival_datetime, false); // No minutes for total trip
    output.push(`Duration: ${duration}`);
  }
  
  output.push('');
  output.push("Legs in this trip:");
  
  legs.forEach((leg, index) => {
    output.push(leg.name);
    
    const depTime = formatTimeWithZone(leg.departure_datetime, leg.departure_timezone || 'America/New_York');
    const depDate = formatShortDate(leg.departure_datetime, leg.departure_timezone || 'America/New_York');
    const depLocation = leg.departure_location || '';
    const depCarrier = leg.carrier || '';
    output.push(`DEP ${depLocation} ${depTime} ${depDate} (${depCarrier})`);
    
    const arrTime = formatTimeWithZone(leg.arrival_datetime, leg.arrival_timezone || 'America/New_York');
    const arrDate = formatShortDate(leg.arrival_datetime, leg.arrival_timezone || 'America/New_York');
    const arrLocation = leg.arrival_location || '';
    const arrCarrier = leg.carrier || '';
    output.push(`ARR ${arrLocation} ${arrTime} ${arrDate} (${arrCarrier})`);
    
    const legDuration = calculateDuration(leg.departure_datetime, leg.arrival_datetime, true); // Include minutes for leg duration
    output.push(`(${legDuration})`);
    output.push('');
    
    // Layover time (except for last leg)
    if (index < legs.length - 1) {
      const nextLeg = legs[index + 1];
      const layoverDuration = calculateDuration(leg.arrival_datetime, nextLeg.departure_datetime);
      const arrivalLocation = leg.arrival_location || 'Unknown';
      output.push(`Time in ${arrivalLocation}: ${layoverDuration}.`);
    }
    output.push('');
  });

  // Destination Details section for stopovers longer than threshold
  const longStopovers = [];
  for (let i = 0; i < legs.length - 1; i++) {
    const currentLeg = legs[i];
    const nextLeg = legs[i + 1];
    const stopoverDuration = calculateDuration(currentLeg.arrival_datetime, nextLeg.departure_datetime);
    
    // Check if stopover duration is longer than threshold
    const arrivalTime = new Date(currentLeg.arrival_datetime);
    const departureTime = new Date(nextLeg.departure_datetime);
    const durationHours = (departureTime - arrivalTime) / (1000 * 60 * 60);
    
    if (durationHours > LAYOVER_THRESHOLD_HOURS) {
      longStopovers.push({
        location: currentLeg.arrival_location || 'Unknown',
        arrivalLeg: currentLeg,
        departureLeg: nextLeg,
        duration: stopoverDuration
      });
    }
  }

  if (longStopovers.length > 0) {
    output.push("Destination Details:");
    longStopovers.forEach((stopover, index) => {
      output.push(`Detail for ${stopover.location}`);
      output.push(stopover.duration);
      
      // Show arrival leg
      const arrTime = formatTimeWithZone(stopover.arrivalLeg.arrival_datetime, stopover.arrivalLeg.arrival_timezone || 'America/New_York');
      const arrDate = formatShortDate(stopover.arrivalLeg.arrival_datetime, stopover.arrivalLeg.arrival_timezone || 'America/New_York');
      const arrLocation = stopover.arrivalLeg.arrival_location || '';
      const arrCarrier = stopover.arrivalLeg.carrier || '';
      output.push(`ARR ${arrLocation} ${arrTime} ${arrDate} (${arrCarrier})`);
      
      // Show departure leg
      const depTime = formatTimeWithZone(stopover.departureLeg.departure_datetime, stopover.departureLeg.departure_timezone || 'America/New_York');
      const depDate = formatShortDate(stopover.departureLeg.departure_datetime, stopover.departureLeg.departure_timezone || 'America/New_York');
      const depLocation = stopover.departureLeg.departure_location || '';
      const depCarrier = stopover.departureLeg.carrier || '';
      output.push(`DEP ${depLocation} ${depTime} ${depDate} (${depCarrier})`);
      
      if (index < longStopovers.length - 1) {
        output.push('');
      }
    });
  }

  return output.join('\n');
} 