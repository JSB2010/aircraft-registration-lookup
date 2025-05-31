// Helper function to determine if a flight is considered active for map display
export const isFlightActive = (status) => {
  if (!status) return false;
  const lowerStatus = status.toLowerCase();
  // Consider various statuses that imply the aircraft is currently flying or recently landed/departed
  return lowerStatus.includes('in air') ||
         lowerStatus.includes('en route') ||
         lowerStatus.includes('departed') || // Included as it might still have live data shortly after departure
         lowerStatus.includes('approaching') ||
         lowerStatus.includes('landing'); // Included to show last known position on map
};

// Add any other utility functions here if needed
// For example, a date formatter if it was complex and used in multiple places:
/*
export const formatCustomDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString; // Return original if formatting fails
  }
};
*/
