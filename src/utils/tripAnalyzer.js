import { formatInTimezone, utcToLocal } from '../config/timezone.js';
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
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const diffMs = end - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let result = '';
  
  if (diffDays > 0) {
    result += `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) {
      result += `, ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }
    if (includeMinutes && diffMinutes > 0) {
      result += `, ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  } else if (diffHours > 0) {
    result += `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    if (includeMinutes && diffMinutes > 0) {
      result += `, ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  } else if (includeMinutes && diffMinutes > 0) {
    result += `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    result = '0 minutes';
  }
  
  return result;
}

function generateDailyBreakdown(arrivalLeg, departureLeg) {
  const arrival = new Date(arrivalLeg.arrival_datetime);
  const departure = new Date(departureLeg.departure_datetime);
  
  // Get timezone-adjusted dates using our utility
  const arrivalLocal = utcToLocal(arrivalLeg.arrival_timezone || 'America/New_York', arrivalLeg.arrival_datetime);
  const departureLocal = utcToLocal(departureLeg.departure_timezone || 'America/New_York', departureLeg.departure_datetime);
  
  const arrivalDate = new Date(arrivalLocal.getFullYear(), arrivalLocal.getMonth(), arrivalLocal.getDate());
  const departureDate = new Date(departureLocal.getFullYear(), departureLocal.getMonth(), departureLocal.getDate());
  
  const days = [];
  const currentDate = new Date(arrivalDate);
  
  while (currentDate <= departureDate) {
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    
    let dayLine = `${month}/${day} ${dayOfWeek}`;
    
    // Add arrival info for first day
    if (currentDate.getTime() === arrivalDate.getTime()) {
      const arrivalTime = formatTimeWithZone(arrivalLeg.arrival_datetime, arrivalLeg.arrival_timezone || 'America/New_York');
      const arrivalLocation = arrivalLeg.arrival_location || '';
      const arrivalCarrier = arrivalLeg.carrier || '';
      dayLine += ` ${arrivalTime} ARR ${arrivalLocation} (${arrivalCarrier})`;
    }
    
    // Add departure info for last day
    if (currentDate.getTime() === departureDate.getTime()) {
      const departureTime = formatTimeWithZone(departureLeg.departure_datetime, departureLeg.departure_timezone || 'America/New_York');
      const departureLocation = departureLeg.departure_location || '';
      const departureCarrier = departureLeg.carrier || '';
      dayLine += ` ${departureTime} DEP ${departureLocation} (${departureCarrier})`;
    }
    
    days.push(dayLine);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
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

  output.push("TripTik for " + trip.name);
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
  output.push("Leg Details:");
  
  legs.forEach((leg, index) => {
    const legDisplayName = leg.confirmation ? `${leg.name} (confirmation ${leg.confirmation})` : leg.name;
    output.push(legDisplayName);
    
    const depTime = formatTimeWithZone(leg.departure_datetime, leg.departure_timezone || 'America/New_York');
    const depDate = formatShortDate(leg.departure_datetime, leg.departure_timezone || 'America/New_York');
    const depLocation = leg.departure_location || '';
    const depCarrier = leg.carrier || '';
    output.push(`DEP ${depLocation} ${depTime} ${depDate} (${depCarrier})`);
    
    const arrTime = formatTimeWithZone(leg.arrival_datetime, leg.arrival_timezone || 'America/New_York');
    const arrDate = formatShortDate(leg.arrival_datetime, leg.arrival_timezone || 'America/New_York');
    const arrLocation = leg.arrival_location || '';
    const arrCarrier = leg.carrier || '';
    output.push(`ARR ${arrLocation} ${arrTime} ${arrDate}`);
    
    const legDuration = calculateDuration(leg.departure_datetime, leg.arrival_datetime, true); // Include minutes for leg duration
    output.push(`(${legDuration})`);
    output.push('');
    
    // Layover time (except for last leg)
    if (index < legs.length - 1) {
      const nextLeg = legs[index + 1];
      // Determine if this layover exceeds the long stopover threshold
      const arrivalTimeMs = new Date(leg.arrival_datetime).getTime();
      const nextDepartureTimeMs = new Date(nextLeg.departure_datetime).getTime();
      const layoverHours = (nextDepartureTimeMs - arrivalTimeMs) / (1000 * 60 * 60);
      const includeLayoverMinutes = layoverHours <= LAYOVER_THRESHOLD_HOURS;

      const layoverDuration = calculateDuration(
        leg.arrival_datetime,
        nextLeg.departure_datetime,
        includeLayoverMinutes
      );
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
    const stopoverDuration = calculateDuration(currentLeg.arrival_datetime, nextLeg.departure_datetime, false);
    
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
      
      // Generate daily breakdown
      const dailyLines = generateDailyBreakdown(
        stopover.arrivalLeg,
        stopover.departureLeg
      );
      
      dailyLines.forEach(line => {
        output.push(line);
      });
      
      if (index < longStopovers.length - 1) {
        output.push('');
      }
    });
  }

  return output.join('\n');
} 