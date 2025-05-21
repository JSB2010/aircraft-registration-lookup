const axios = require('axios');

// FlightAware AeroAPI configuration
const FLIGHTAWARE_API_URL = 'https://aeroapi.flightaware.com/aeroapi';

/**
 * Get aircraft details by flight number and date using FlightAware AeroAPI
 * @param {string} flightNumber - The flight number (e.g., BA123)
 * @param {string} date - The date in YYYY-MM-DD format
 * @param {string} apiKey - The FlightAware AeroAPI key
 * @returns {Promise<Object>} - Aircraft details
 */
async function getAircraftByFlightAndDate(flightNumber, date, apiKey) {
  try {
    // Format the date as YYYY-MM-DD if not already formatted
    const startDate = new Date(date);
    const formattedStartDate = startDate.toISOString().split('T')[0];

    // Create end date (one day after start date)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // First, try to get scheduled flights for this flight number
    // This might work better for future flights
    let options = {
      method: 'GET',
      url: `${FLIGHTAWARE_API_URL}/schedules/${flightNumber}`,
      headers: {
        'x-apikey': apiKey
      },
      params: {
        start: formattedStartDate,
        end: formattedEndDate,
        max_pages: 1
      }
    };

    try {
      const schedulesResponse = await axios.request(options);

      // If we have scheduled flights, use the first one that matches our date
      if (schedulesResponse.data && schedulesResponse.data.scheduled && schedulesResponse.data.scheduled.length > 0) {
        // Find a scheduled flight that matches our date
        const matchingFlight = schedulesResponse.data.scheduled.find(flight => {
          const scheduledDeparture = new Date(flight.scheduled_out || flight.scheduled_departure.date_time);
          const flightDate = new Date(scheduledDeparture);
          return flightDate.toISOString().split('T')[0] === formattedStartDate;
        });

        if (matchingFlight) {
          // If we found a matching flight, try to get more details about it
          if (matchingFlight.fa_flight_id) {
            options = {
              method: 'GET',
              url: `${FLIGHTAWARE_API_URL}/flights/${matchingFlight.fa_flight_id}`,
              headers: {
                'x-apikey': apiKey
              }
            };

            const flightResponse = await axios.request(options);
            if (flightResponse.data) {
              return processFlightData(flightResponse.data);
            }
          }

          // If we couldn't get more details, use the scheduled flight data
          return processScheduledFlightData(matchingFlight);
        }
      }
    } catch (scheduleError) {
      console.log('Error fetching scheduled flights, falling back to regular flight search:', scheduleError.message);
    }

    // If we couldn't find scheduled flights, fall back to the regular flight search
    options = {
      method: 'GET',
      url: `${FLIGHTAWARE_API_URL}/flights/${flightNumber}`,
      headers: {
        'x-apikey': apiKey
      },
      params: {
        start: formattedStartDate,
        end: formattedEndDate,
        max_pages: 1
      }
    };

    const response = await axios.request(options);

    // Check if the flight data contains aircraft information
    if (response.data && response.data.flights && response.data.flights.length > 0) {
      const flightData = response.data.flights[0]; // Taking the first matching flight
      return processFlightData(flightData);
    } else {
      // Check if the date is in the future
      const searchDate = new Date(date);
      const currentDate = new Date();

      if (searchDate > currentDate) {
        // For future dates, provide a more helpful message
        const daysInFuture = Math.ceil((searchDate - currentDate) / (1000 * 60 * 60 * 24));

        if (daysInFuture > 7) {
          throw new Error(`No flight data available yet. FlightAware typically only has data for flights within 7 days of departure. Your flight is ${daysInFuture} days in the future.`);
        } else {
          throw new Error('No flight data available yet. The aircraft assignment may not be finalized this far in advance.');
        }
      } else {
        throw new Error('No flight data available for the given flight number and date.');
      }
    }
  } catch (error) {
    console.error('Error fetching aircraft data from FlightAware:', error.response?.data || error.message);

    // Handle specific API error codes
    if (error.response?.status === 404) {
      throw new Error('Flight not found. For future flights, please verify the flight exists and aircraft information may only be available closer to the departure date.');
    } else if (error.response?.status === 429) {
      throw new Error('Too many requests. API rate limit exceeded.');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error('API authentication error. Please check your API key.');
    }

    throw new Error('An error occurred while fetching the aircraft data from FlightAware');
  }
}

/**
 * Process flight data from FlightAware API
 * @param {Object} flightData - Flight data from FlightAware API
 * @returns {Object} - Processed aircraft details
 */
function processFlightData(flightData) {
  // Extract aircraft details
  const aircraftDetails = {
    registration: flightData.registration || 'Not available',
    model: flightData.aircraft_type || 'Not available',
    airline: flightData.operator || 'Not available',
    flightNumber: flightData.ident,
    departure: {
      airport: flightData.origin?.name || 'Not available',
      scheduledTime: flightData.scheduled_out || 'Not available',
      actualTime: flightData.actual_out || 'Not available',
      terminal: flightData.origin?.terminal || 'Not available',
      gate: flightData.origin?.gate || 'Not available',
      icao: flightData.origin?.code_icao || 'Not available',
      iata: flightData.origin?.code_iata || 'Not available'
    },
    arrival: {
      airport: flightData.destination?.name || 'Not available',
      scheduledTime: flightData.scheduled_in || 'Not available',
      actualTime: flightData.actual_in || 'Not available',
      terminal: flightData.destination?.terminal || 'Not available',
      gate: flightData.destination?.gate || 'Not available',
      icao: flightData.destination?.code_icao || 'Not available',
      iata: flightData.destination?.code_iata || 'Not available'
    },
    status: flightData.status || 'Scheduled',
    // Additional data provided by FlightAware
    aircraftAge: flightData.aircraft_age || 'Not available',
    distance: {
      kilometers: flightData.route_distance?.kilometers || 'Not available',
      miles: flightData.route_distance?.miles || 'Not available'
    },
    speed: flightData.last_position?.groundspeed || 'Not available',
    altitude: flightData.last_position?.altitude || 'Not available',
    dataSource: 'FlightAware AeroAPI',
    // Additional fields
    aircraftOwner: flightData.owner || 'Not available',
    operatorIcao: flightData.operator_icao || 'Not available',
    filedRoute: flightData.route || 'Not available',
    flightDuration: {
      scheduled: flightData.scheduled_elapsed_time || 'Not available',
      actual: flightData.actual_elapsed_time || 'Not available'
    },
    delayInfo: {
      departure: flightData.departure_delay || 'Not available',
      arrival: flightData.arrival_delay || 'Not available'
    },
    baggageClaim: flightData.destination?.baggage_claim || 'Not available',
    progress: flightData.progress_percent || 'Not available',
    lastUpdated: flightData.last_position?.timestamp ? new Date(flightData.last_position.timestamp * 1000).toISOString() : 'Not available',
    position: flightData.last_position ? {
      latitude: flightData.last_position.latitude || 'Not available',
      longitude: flightData.last_position.longitude || 'Not available',
      heading: flightData.last_position.heading || 'Not available'
    } : null
  };

  return aircraftDetails;
}

/**
 * Process scheduled flight data from FlightAware API
 * @param {Object} scheduledFlight - Scheduled flight data from FlightAware API
 * @returns {Object} - Processed aircraft details
 */
function processScheduledFlightData(scheduledFlight) {
  // Extract aircraft details from scheduled flight
  const aircraftDetails = {
    registration: scheduledFlight.registration || 'Not available',
    model: scheduledFlight.aircraft_type || 'Not available',
    airline: scheduledFlight.operator || 'Not available',
    flightNumber: scheduledFlight.ident,
    departure: {
      airport: scheduledFlight.origin?.name || scheduledFlight.origin || 'Not available',
      scheduledTime: scheduledFlight.scheduled_out ||
                    (scheduledFlight.scheduled_departure ? scheduledFlight.scheduled_departure.date_time : 'Not available'),
      terminal: scheduledFlight.origin_terminal || 'Not available',
      gate: scheduledFlight.origin_gate || 'Not available',
      icao: (typeof scheduledFlight.origin === 'string') ? scheduledFlight.origin : scheduledFlight.origin?.code_icao || 'Not available',
      iata: scheduledFlight.origin_iata || 'Not available'
    },
    arrival: {
      airport: scheduledFlight.destination?.name || scheduledFlight.destination || 'Not available',
      scheduledTime: scheduledFlight.scheduled_in ||
                    (scheduledFlight.scheduled_arrival ? scheduledFlight.scheduled_arrival.date_time : 'Not available'),
      terminal: scheduledFlight.destination_terminal || 'Not available',
      gate: scheduledFlight.destination_gate || 'Not available',
      icao: (typeof scheduledFlight.destination === 'string') ? scheduledFlight.destination : scheduledFlight.destination?.code_icao || 'Not available',
      iata: scheduledFlight.destination_iata || 'Not available'
    },
    status: 'Scheduled',
    // Additional data
    distance: {
      kilometers: scheduledFlight.route_distance?.kilometers || 'Not available',
      miles: scheduledFlight.route_distance?.miles || 'Not available'
    },
    dataSource: 'FlightAware AeroAPI (Scheduled)',
    // Additional fields
    aircraftOwner: scheduledFlight.owner || 'Not available',
    operatorIcao: scheduledFlight.operator_icao || 'Not available',
    filedRoute: scheduledFlight.route || 'Not available',
    flightDuration: {
      scheduled: scheduledFlight.scheduled_elapsed_time || 'Not available'
    },
    delayInfo: {
      departure: scheduledFlight.departure_delay || 'Not available',
      arrival: scheduledFlight.arrival_delay || 'Not available'
    },
    baggageClaim: scheduledFlight.destination?.baggage_claim || 'Not available'
  };

  return aircraftDetails;
}

module.exports = {
  getAircraftByFlightAndDate
};
