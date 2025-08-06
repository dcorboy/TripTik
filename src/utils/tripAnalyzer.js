/**
 * Analyzes trip data and returns formatted text output
 * @param {Object} trip - The trip object
 * @param {Array} legs - Array of leg objects for the trip
 * @returns {string} - Formatted analysis output
 */
export function analyzeTrip(trip, legs) {
  let output = [];
  
  // For now, just list the leg names
  if (legs.length === 0) {
    output.push("No legs found for this trip.");
  } else {
    output.push("Legs in this trip:");
    legs.forEach((leg, index) => {
      output.push(`${index + 1}. ${leg.name}`);
    });
  }
  
  return output.join('\n');
} 