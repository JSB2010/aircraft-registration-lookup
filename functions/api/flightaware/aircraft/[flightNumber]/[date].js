// FlightAware aircraft lookup endpoint as a Cloudflare Function
export async function onRequest(context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // Get parameters from URL
    const { flightNumber, date } = context.params;

    // Format the date as YYYY-MM-DD if not already formatted
    // Handle date parsing more carefully
    let formattedDate;
    try {
      // First, check if the date is already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        formattedDate = date;
      } else {
        // Parse the date and format it
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
        formattedDate = parsedDate.toISOString().split('T')[0];
      }
      console.log('Formatted date for FlightAware API:', formattedDate);

      // Create end date (one day after start date)
      const startDate = new Date(formattedDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      const formattedEndDate = endDate.toISOString().split('T')[0];
      console.log('End date for FlightAware API:', formattedEndDate);

    } catch (e) {
      console.error('Error formatting date:', e);
      // Default to today's date if there's an error
      formattedDate = new Date().toISOString().split('T')[0];
      console.log('Using default date:', formattedDate);
    }

    // Get API key from environment variables
    const FLIGHTAWARE_API_KEY = context.env.FLIGHTAWARE_API_KEY;

    // Log environment variables for debugging (without exposing the actual keys)
    console.log('Environment variables available:', {
      RAPIDAPI_KEY: context.env.RAPIDAPI_KEY ? 'Set' : 'Not set',
      FLIGHTAWARE_API_KEY: FLIGHTAWARE_API_KEY ? 'Set' : 'Not set'
    });

    if (!FLIGHTAWARE_API_KEY) {
      console.error('FLIGHTAWARE_API_KEY not configured');
      return new Response(
        JSON.stringify({
          message: 'FlightAware API key not configured'
        }),
        {
          headers,
          status: 500
        }
      );
    }

    // FlightAware API endpoint
    const FLIGHTAWARE_API_URL = 'https://aeroapi.flightaware.com/aeroapi';

    // Create end date (one day after start date)
    const startDate = new Date(formattedDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Try different approaches for the FlightAware API
    let response;
    let data;
    let apiError = null;

    // First, try to get scheduled flights for this flight number
    // This might work better for future flights
    try {
      console.log('Trying FlightAware scheduled flights endpoint...');
      const scheduledUrl = `${FLIGHTAWARE_API_URL}/schedules/${flightNumber}`;
      console.log('FlightAware scheduled API request URL:', scheduledUrl);

      // Build URL with query parameters
      const scheduledUrlWithParams = new URL(scheduledUrl);
      scheduledUrlWithParams.searchParams.append('start', formattedDate);
      scheduledUrlWithParams.searchParams.append('end', formattedEndDate);
      scheduledUrlWithParams.searchParams.append('max_pages', '1');

      console.log('FlightAware scheduled API request URL with params:', scheduledUrlWithParams.toString());

      response = await fetch(
        scheduledUrlWithParams.toString(),
        {
          method: 'GET',
          headers: {
            'x-apikey': FLIGHTAWARE_API_KEY
          }
        }
      );

      if (response.ok) {
        const searchData = await response.json();
        console.log('FlightAware flights endpoint successful');

        // Check if we have flights in the response
        if (searchData && searchData.flights && searchData.flights.length > 0) {
          data = searchData;
        } else {
          console.log('No flights found in search response');
        }
      } else {
        const statusText = response.statusText || 'Unknown error';
        console.error(`FlightAware flights endpoint responded with status: ${response.status} (${statusText})`);

        // Try to get more details from the response
        let errorDetails = '';
        try {
          const errorResponse = await response.text();
          errorDetails = errorResponse;
          console.error('Error response:', errorResponse);
        } catch (e) {
          console.error('Could not parse error response:', e);
        }

        apiError = `FlightAware flights endpoint responded with status: ${response.status}. Details: ${errorDetails}`;
      }
    } catch (error) {
      console.error('Error calling FlightAware flights endpoint:', error);
      apiError = `Error calling FlightAware flights endpoint: ${error.message}`;
    }

    // If the scheduled flights endpoint failed, fall back to the regular flight search
    if (!data && apiError) {
      try {
        console.log('Trying FlightAware flights endpoint...');
        const flightsUrl = `${FLIGHTAWARE_API_URL}/flights/${flightNumber}`;

        // Build URL with query parameters
        const flightsUrlWithParams = new URL(flightsUrl);
        flightsUrlWithParams.searchParams.append('start', formattedDate);
        flightsUrlWithParams.searchParams.append('end', formattedEndDate);
        flightsUrlWithParams.searchParams.append('max_pages', '1');

        console.log('FlightAware flights API request URL with params:', flightsUrlWithParams.toString());

        response = await fetch(
          flightsUrlWithParams.toString(),
          {
            method: 'GET',
            headers: {
              'x-apikey': FLIGHTAWARE_API_KEY
            }
          }
        );

        if (response.ok) {
          const flightsData = await response.json();
          console.log('FlightAware flights endpoint successful');
          console.log('Flights data:', JSON.stringify(flightsData).substring(0, 200) + '...');

          // Check if we have flights in the response
          if (flightsData && flightsData.flights && flightsData.flights.length > 0) {
            data = flightsData;
            console.log(`Found ${flightsData.flights.length} flights`);

            // Log the first flight
            console.log('First flight:', JSON.stringify(flightsData.flights[0]).substring(0, 200) + '...');
          } else {
            console.log('No flights found in response');
          }
        } else {
          const statusText = response.statusText || 'Unknown error';
          console.error(`FlightAware flights endpoint responded with status: ${response.status} (${statusText})`);

          // Try to get more details from the response
          let errorDetails = '';
          try {
            const errorResponse = await response.text();
            errorDetails = errorResponse;
            console.error('Error response:', errorResponse);
          } catch (e) {
            console.error('Could not parse error response:', e);
          }

          // Append this error to the previous one
          apiError += ` | FlightAware flights endpoint responded with status: ${response.status}. Details: ${errorDetails}`;
        }
      } catch (error) {
        console.error('Error calling FlightAware flights endpoint:', error);
        apiError += ` | Error calling FlightAware flights endpoint: ${error.message}`;
      }
    }

    // If both endpoints failed, throw an error
    if (!data) {
      throw new Error(apiError || 'Unknown error calling FlightAware API');
    }

    // Log the response data
    console.log('FlightAware API response data:', JSON.stringify(data).substring(0, 200) + '...');

    // Process the data based on which endpoint was successful
    let flightData = null;
    let isScheduledData = false;

    // Check if we have scheduled flight data
    if (data && data.scheduled && data.scheduled.length > 0) {
      // Find a scheduled flight that matches our date
      let bestMatch = null;

      for (const flight of data.scheduled) {
        const scheduledDeparture = new Date(flight.scheduled_out || (flight.scheduled_departure ? flight.scheduled_departure.date_time : null));
        const flightDate = new Date(scheduledDeparture);
        if (flightDate.toISOString().split('T')[0] === formattedDate) {
          bestMatch = flight;
          break;
        }
      }

      if (bestMatch) {
        flightData = bestMatch;
        isScheduledData = true;
        console.log('Using data from scheduled flights endpoint');
      } else {
        // If no exact match, use the first scheduled flight
        flightData = data.scheduled[0];
        isScheduledData = true;
        console.log('Using first scheduled flight (no exact date match)');
      }
    }
    // Check if we have flight data
    else if (data && data.flights && data.flights.length > 0) {
      // Find the flight that best matches our date
      const targetDate = new Date(formattedDate);
      let bestMatch = data.flights[0];
      let bestMatchDiff = Infinity;

      for (const flight of data.flights) {
        // Try to find a flight with a date close to our target date
        const flightDate = new Date(flight.scheduled_out || flight.estimated_out || (flight.filed_departure_time ? flight.filed_departure_time.epoch * 1000 : 0));
        if (flightDate.getTime() > 0) {
          const dateDiff = Math.abs(flightDate.getTime() - targetDate.getTime());
          if (dateDiff < bestMatchDiff) {
            bestMatch = flight;
            bestMatchDiff = dateDiff;
          }
        }
      }

      flightData = bestMatch;
      console.log('Using data from flights endpoint');
    }

    if (flightData) {
      // Extract relevant information
      let result;

      if (isScheduledData) {
        // Process scheduled flight data
        result = {
          flightNumber: flightData.ident || flightData.flight_number || flightNumber,
          airline: flightData.operator || flightData.operator_name || 'Unknown Airline',
          registration: flightData.registration || 'Not available',
          model: flightData.aircraft_type || 'Not available',
          status: 'Scheduled',
          departure: {
            airport: flightData.origin?.name || flightData.origin || 'Not available',
            scheduledTime: flightData.scheduled_out || (flightData.scheduled_departure ? flightData.scheduled_departure.date_time : 'Not available'),
            terminal: flightData.origin_terminal || 'Not available',
            gate: flightData.origin_gate || 'Not available',
            icao: (typeof flightData.origin === 'string') ? flightData.origin : flightData.origin?.code_icao || 'Not available',
            iata: flightData.origin_iata || 'Not available'
          },
          arrival: {
            airport: flightData.destination?.name || flightData.destination || 'Not available',
            scheduledTime: flightData.scheduled_in || (flightData.scheduled_arrival ? flightData.scheduled_arrival.date_time : 'Not available'),
            terminal: flightData.destination_terminal || 'Not available',
            gate: flightData.destination_gate || 'Not available',
            icao: (typeof flightData.destination === 'string') ? flightData.destination : flightData.destination?.code_icao || 'Not available',
            iata: flightData.destination_iata || 'Not available'
          },
          dataSource: 'FlightAware AeroAPI (Scheduled)'
        };

        // Add distance if available
        if (flightData.route_distance?.kilometers) {
          result.distance = {
            kilometers: flightData.route_distance.kilometers,
            miles: flightData.route_distance.miles || Math.round(flightData.route_distance.kilometers * 0.621371)
          };
        }
      } else {
        // Process regular flight data
        result = {
          flightNumber: flightData.ident || flightData.flight_number || flightNumber,
          airline: flightData.operator || 'Not available',
          registration: flightData.registration || 'Not available',
          model: flightData.aircraft_type || 'Not available',
          status: getFlightStatus(flightData),
          departure: {
            airport: flightData.origin?.name || 'Not available',
            scheduledTime: flightData.scheduled_out || 'Not available',
            terminal: flightData.origin?.terminal || 'Not available',
            gate: flightData.origin?.gate || 'Not available',
            icao: flightData.origin?.code_icao || 'Not available',
            iata: flightData.origin?.code_iata || 'Not available'
          },
          arrival: {
            airport: flightData.destination?.name || 'Not available',
            scheduledTime: flightData.scheduled_in || 'Not available',
            terminal: flightData.destination?.terminal || 'Not available',
            gate: flightData.destination?.gate || 'Not available',
            icao: flightData.destination?.code_icao || 'Not available',
            iata: flightData.destination?.code_iata || 'Not available'
          },
          dataSource: 'FlightAware AeroAPI'
        };

        // Add aircraft age if available
        if (flightData.aircraft_age) {
          result.aircraftAge = flightData.aircraft_age;
        }

        // Add distance if available
        if (flightData.route_distance?.kilometers) {
          result.distance = {
            kilometers: flightData.route_distance.kilometers,
            miles: flightData.route_distance.miles || Math.round(flightData.route_distance.kilometers * 0.621371)
          };
        }

        // Add speed and altitude if available
        if (flightData.last_position?.groundspeed) {
          result.speed = flightData.last_position.groundspeed;
        }

        if (flightData.last_position?.altitude) {
          result.altitude = flightData.last_position.altitude;
        }

        // Add aircraft owner if available
        if (flightData.owner) {
          result.aircraftOwner = flightData.owner;
        }

        // Add operator ICAO if available
        if (flightData.operator_icao) {
          result.operatorIcao = flightData.operator_icao;
        }

        // Add filed route if available
        if (flightData.route) {
          result.filedRoute = flightData.route;
        }

        // Add flight duration if available
        result.flightDuration = {
          scheduled: flightData.scheduled_elapsed_time || 'Not available',
          actual: flightData.actual_elapsed_time || 'Not available'
        };

        // Add delay information if available
        result.delayInfo = {
          departure: flightData.departure_delay || 'Not available',
          arrival: flightData.arrival_delay || 'Not available'
        };

        // Add baggage claim if available
        if (flightData.destination?.baggage_claim) {
          result.baggageClaim = flightData.destination.baggage_claim;
        }

        // Add flight progress if available
        if (flightData.progress_percent) {
          result.progress = flightData.progress_percent;
        }

        // Add position information if available
        if (flightData.last_position) {
          result.position = {
            latitude: flightData.last_position.latitude || 'Not available',
            longitude: flightData.last_position.longitude || 'Not available',
            heading: flightData.last_position.heading || 'Not available'
          };

          if (flightData.last_position.timestamp) {
            result.lastUpdated = new Date(flightData.last_position.timestamp * 1000).toISOString();
          }
        }
      }

      return new Response(JSON.stringify(result), {
        headers,
        status: 200
      });
    } else {
      // No flight data found
      console.log(`No flight data found for ${flightNumber} on ${formattedDate}`);

      // Check if the date is in the future
      const searchDate = new Date(formattedDate);
      const currentDate = new Date();
      const daysInFuture = Math.ceil((searchDate - currentDate) / (1000 * 60 * 60 * 24));

      let message = `No flight data found for ${flightNumber} on ${formattedDate}`;

      // Try to provide a helpful message based on the API errors
      if (apiError && apiError.includes('Undisclosed')) {
        message += `. The FlightAware API returned an error. This might be due to API rate limits or authentication issues. Please try again later or use the AeroDataBox API instead.`;
      } else if (apiError && apiError.includes('Invalid argument')) {
        message += `. The FlightAware API reported an issue with the date format. Please try a different date format or use the AeroDataBox API instead.`;
      } else if (apiError && apiError.includes('Internal error')) {
        message += `. The FlightAware API reported an internal error. This might be a temporary issue. Please try again later or use the AeroDataBox API instead.`;
      } else if (daysInFuture > 7) {
        message += `. This flight is ${daysInFuture} days in the future. FlightAware may not have data for flights more than 7 days ahead.`;
      } else if (daysInFuture > 0) {
        message += `. This flight is ${daysInFuture} days in the future. Please check again closer to the departure date.`;
      } else if (daysInFuture < 0) {
        message += `. This flight was ${Math.abs(daysInFuture)} days in the past. The data may no longer be available.`;
      }

      return new Response(
        JSON.stringify({
          message: message
        }),
        {
          headers,
          status: 404
        }
      );
    }
  } catch (error) {
    console.error('Error fetching aircraft data from FlightAware:', error);
    console.error('Error stack:', error.stack);

    return new Response(
      JSON.stringify({
        message: 'An error occurred while fetching the aircraft data from FlightAware',
        details: error.message
      }),
      {
        headers,
        status: 500
      }
    );
  }
}

// Helper function to determine flight status
function getFlightStatus(flightData) {
  if (flightData.cancelled) return 'Cancelled';
  if (flightData.actual_in) return 'Arrived';
  if (flightData.actual_off) return 'In Air';
  if (flightData.actual_out) return 'Departed';
  if (flightData.scheduled_out) return 'Scheduled';
  return 'Unknown';
}

// Helper function to calculate aircraft age if available
function getAircraftAge(flightData) {
  if (!flightData.aircraft_manufactured) return 'Not available';

  const manufactureYear = new Date(flightData.aircraft_manufactured).getFullYear();
  const currentYear = new Date().getFullYear();
  return (currentYear - manufactureYear).toString();
}
