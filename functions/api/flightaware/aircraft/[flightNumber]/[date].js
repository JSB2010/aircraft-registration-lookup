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
    let schedulesData;
    try {
      console.log('Trying FlightAware scheduled flights endpoint...');
      const scheduledUrl = `${FLIGHTAWARE_API_URL}/schedules/${flightNumber}`;

      const scheduledUrlWithParams = new URL(scheduledUrl);
      scheduledUrlWithParams.searchParams.append('start', formattedDate);
      scheduledUrlWithParams.searchParams.append('end', formattedEndDate);
      scheduledUrlWithParams.searchParams.append('max_pages', '1');

      console.log('FlightAware scheduled API request URL with params:', scheduledUrlWithParams.toString());

      const schedulesResponse = await fetch(
        scheduledUrlWithParams.toString(),
        {
          method: 'GET',
          headers: { 'x-apikey': FLIGHTAWARE_API_KEY }
        }
      );

      if (schedulesResponse.ok) {
        schedulesData = await schedulesResponse.json();
        console.log('FlightAware /schedules endpoint successful.');
        // We will try to use fa_flight_id from this data later
      } else {
        const statusText = schedulesResponse.statusText || 'Unknown error';
        console.error(`FlightAware /schedules endpoint responded with status: ${schedulesResponse.status} (${statusText})`);

        // Try to get more details from the response
        let errorDetails = '';
        try { errorDetails = await schedulesResponse.text(); } catch (e) { /* ignore */ }
        apiError = `FlightAware /schedules endpoint failed: ${schedulesResponse.status}. Details: ${errorDetails}`;
        console.error(apiError);
      }
    } catch (error) {
      apiError = `Error calling FlightAware /schedules endpoint: ${error.message}`;
      console.error(apiError);
    }

    let finalFlightData; // This will hold the data from /flights/{fa_flight_id} or /flights/{ident}
    let usedFaFlightId = false;

    // If /schedules was successful and returned data
    if (schedulesData && schedulesData.scheduled && schedulesData.scheduled.length > 0) {
      const matchingScheduledFlight = schedulesData.scheduled.find(f => {
        const scheduledTime = f.scheduled_out || (f.scheduled_departure ? f.scheduled_departure.date_time : null);
        if (!scheduledTime) return false;
        return new Date(scheduledTime).toISOString().split('T')[0] === formattedDate;
      });

      if (matchingScheduledFlight && matchingScheduledFlight.fa_flight_id) {
        console.log(`Found fa_flight_id: ${matchingScheduledFlight.fa_flight_id} from /schedules endpoint.`);
        try {
          const faFlightIdUrl = `${FLIGHTAWARE_API_URL}/flights/${matchingScheduledFlight.fa_flight_id}`;
          console.log('Fetching details using fa_flight_id URL:', faFlightIdUrl);
          const faFlightIdResponse = await fetch(faFlightIdUrl, {
            method: 'GET',
            headers: { 'x-apikey': FLIGHTAWARE_API_KEY }
          });

          if (faFlightIdResponse.ok) {
            // The response from /flights/{fa_flight_id} is an array with one flight object
            const flightDetailsArray = await faFlightIdResponse.json();
            if (flightDetailsArray && flightDetailsArray.flights && flightDetailsArray.flights.length > 0) {
                 finalFlightData = flightDetailsArray.flights[0]; // Use the single flight from the array
                 usedFaFlightId = true;
                 console.log('Successfully fetched flight details using fa_flight_id.');
            } else {
                console.warn('Fetched with fa_flight_id, but response had no flights. Response:', flightDetailsArray);
                // Fallback to using the scheduled data if fa_flight_id call was empty
                finalFlightData = matchingScheduledFlight;
                apiError = (apiError ? apiError + " | " : "") + `fa_flight_id call for ${matchingScheduledFlight.fa_flight_id} returned no flights.`;
            }
          } else {
            const statusText = faFlightIdResponse.statusText || 'Unknown error';
            let errorDetails = '';
            try { errorDetails = await faFlightIdResponse.text(); } catch (e) { /* ignore */ }
            const faIdError = `Failed to fetch details using fa_flight_id ${matchingScheduledFlight.fa_flight_id}: ${faFlightIdResponse.status} (${statusText}). Details: ${errorDetails}`;
            console.error(faIdError);
            apiError = (apiError ? apiError + " | " : "") + faIdError;
            // Fallback: use the data from /schedules if /flights/{fa_flight_id} fails
            finalFlightData = matchingScheduledFlight;
          }
        } catch (faIdFetchError) {
          const faIdError = `Error fetching with fa_flight_id ${matchingScheduledFlight.fa_flight_id}: ${faIdFetchError.message}`;
          console.error(faIdError);
          apiError = (apiError ? apiError + " | " : "") + faIdError;
          finalFlightData = matchingScheduledFlight; // Fallback
        }
      } else if (matchingScheduledFlight) {
         // Has matching scheduled flight but no fa_flight_id, use this data.
         finalFlightData = matchingScheduledFlight;
         console.log('Using matching scheduled flight data (no fa_flight_id available).');
      }
    }

    // If no data from /schedules or fa_flight_id path, try /flights/{flightNumber}
    if (!finalFlightData) {
      console.log('No data from /schedules or fa_flight_id path, trying /flights/{flightNumber} endpoint...');
      try {
        const flightsUrl = `${FLIGHTAWARE_API_URL}/flights/${flightNumber}`;
        const flightsUrlWithParams = new URL(flightsUrl);
        flightsUrlWithParams.searchParams.append('start', formattedDate);
        flightsUrlWithParams.searchParams.append('end', formattedEndDate);
        flightsUrlWithParams.searchParams.append('max_pages', '1');

        console.log('FlightAware /flights/{flightNumber} API request URL:', flightsUrlWithParams.toString());
        const flightsResponse = await fetch(flightsUrlWithParams.toString(), {
          method: 'GET',
          headers: { 'x-apikey': FLIGHTAWARE_API_KEY }
        });

        if (flightsResponse.ok) {
          const flightsData = await flightsResponse.json();
          if (flightsData && flightsData.flights && flightsData.flights.length > 0) {
            // Pick the most relevant flight (e.g., first one, or closest to date if multiple)
            // For simplicity, taking the first one that is not cancelled.
            finalFlightData = flightsData.flights.find(f => !f.cancelled) || flightsData.flights[0];
            console.log('Successfully fetched data from /flights/{flightNumber} endpoint.');
          } else {
            const noFlightsError = 'No flights found in /flights/{flightNumber} response.';
            console.log(noFlightsError);
            apiError = (apiError ? apiError + " | " : "") + noFlightsError;
          }
        } else {
          const statusText = flightsResponse.statusText || 'Unknown error';
          let errorDetails = '';
          try { errorDetails = await flightsResponse.text(); } catch (e) { /* ignore */ }
          const flightsError = `FlightAware /flights/{flightNumber} endpoint failed: ${flightsResponse.status} (${statusText}). Details: ${errorDetails}`;
          console.error(flightsError);
          apiError = (apiError ? apiError + " | " : "") + flightsError;
        }
      } catch (error) {
        const flightsCatchError = `Error calling FlightAware /flights/{flightNumber} endpoint: ${error.message}`;
        console.error(flightsCatchError);
        apiError = (apiError ? apiError + " | " : "") + flightsCatchError;
      }
    }

    // If after all attempts, no data is found, throw an error
    if (!finalFlightData) {
      throw new Error(apiError || 'Failed to fetch flight data from FlightAware after all attempts.');
    }

    // Process the finalFlightData
    // Determine if the data is primarily from a scheduled record or a full flight record
    // 'usedFaFlightId' being true implies it's a full flight record.
    // If finalFlightData has 'fa_flight_id' and not usedFaFlightId, it's likely from schedules.
    const isPrimarilyScheduledData = !usedFaFlightId && finalFlightData.fa_flight_id && !finalFlightData.last_position;

    let result;
    if (isPrimarilyScheduledData) {
      console.log('Processing data as primarily scheduled data.');
      result = {
          flightNumber: finalFlightData.ident || finalFlightData.flight_number || flightNumber,
          airline: finalFlightData.operator || finalFlightData.operator_name || 'Unknown Airline',
          registration: finalFlightData.registration || 'Not available',
          model: finalFlightData.aircraft_type || 'Not available',
          status: 'Scheduled', // Explicitly 'Scheduled' as it's from schedules endpoint
          departure: {
            airport: finalFlightData.origin?.name || finalFlightData.origin || 'Not available',
            scheduledTime: finalFlightData.scheduled_out || (finalFlightData.scheduled_departure ? finalFlightData.scheduled_departure.date_time : 'Not available'),
            terminal: finalFlightData.origin_terminal || 'Not available',
            gate: finalFlightData.origin_gate || 'Not available',
            icao: (typeof finalFlightData.origin === 'string') ? finalFlightData.origin : finalFlightData.origin?.code_icao || 'Not available',
            iata: finalFlightData.origin_iata || 'Not available'
          },
          arrival: {
            airport: finalFlightData.destination?.name || finalFlightData.destination || 'Not available',
            scheduledTime: finalFlightData.scheduled_in || (finalFlightData.scheduled_arrival ? finalFlightData.scheduled_arrival.date_time : 'Not available'),
            terminal: finalFlightData.destination_terminal || 'Not available',
            gate: finalFlightData.destination_gate || 'Not available',
            icao: (typeof finalFlightData.destination === 'string') ? finalFlightData.destination : finalFlightData.destination?.code_icao || 'Not available',
            iata: finalFlightData.destination_iata || 'Not available'
          },
          dataSource: 'FlightAware AeroAPI (Scheduled)',
          // Include other fields available from scheduled data if needed
          distance: {
            kilometers: finalFlightData.route_distance?.kilometers || 'Not available',
            miles: finalFlightData.route_distance?.miles || (finalFlightData.route_distance?.kilometers ? Math.round(finalFlightData.route_distance.kilometers * 0.621371) : 'Not available')
          },
      };
    } else {
      console.log('Processing data as full flight data (from /flights/{id} or /flights/{fa_flight_id}).');
      result = {
        flightNumber: finalFlightData.ident || finalFlightData.flight_number || flightNumber,
        airline: finalFlightData.operator || 'Not available',
        registration: finalFlightData.registration || 'Not available',
        model: finalFlightData.aircraft_type || 'Not available',
        status: getFlightStatus(finalFlightData), // Use helper for status
        departure: {
          airport: finalFlightData.origin?.name || 'Not available',
          scheduledTime: finalFlightData.scheduled_out || 'Not available',
          actualTime: finalFlightData.actual_out || 'Not available', // Added from server logic
          terminal: finalFlightData.origin?.terminal || 'Not available',
          gate: finalFlightData.origin?.gate || 'Not available',
          icao: finalFlightData.origin?.code_icao || 'Not available',
          iata: finalFlightData.origin?.code_iata || 'Not available'
        },
        arrival: {
          airport: finalFlightData.destination?.name || 'Not available',
          scheduledTime: finalFlightData.scheduled_in || 'Not available',
          actualTime: finalFlightData.actual_in || 'Not available', // Added from server logic
          terminal: finalFlightData.destination?.terminal || 'Not available',
          gate: finalFlightData.destination?.gate || 'Not available',
          icao: finalFlightData.destination?.code_icao || 'Not available',
          iata: finalFlightData.destination?.code_iata || 'Not available'
        },
        dataSource: usedFaFlightId ? 'FlightAware AeroAPI (fa_flight_id)' : 'FlightAware AeroAPI (ident)',
        aircraftAge: finalFlightData.aircraft_age || 'Not available',
        distance: {
          kilometers: finalFlightData.route_distance?.kilometers || 'Not available',
          miles: finalFlightData.route_distance?.miles || (finalFlightData.route_distance?.kilometers ? Math.round(finalFlightData.route_distance.kilometers * 0.621371) : 'Not available')
        },
        speed: finalFlightData.last_position?.groundspeed || 'Not available', // Corrected field name
        altitude: finalFlightData.last_position?.altitude ? finalFlightData.last_position.altitude * 100 : 'Not available', // Corrected: often in 100s of feet
        last_position: finalFlightData.last_position, // Keep the whole object for map
        aircraftOwner: finalFlightData.owner || 'Not available',
        operatorIcao: finalFlightData.operator_icao || 'Not available',
        filedRoute: finalFlightData.route || 'Not available',
        flightDuration: {
          scheduled: finalFlightData.scheduled_elapsed_time || 'Not available',
          actual: finalFlightData.actual_elapsed_time || 'Not available'
        },
        delayInfo: {
          departure: finalFlightData.departure_delay || 'Not available',
          arrival: finalFlightData.arrival_delay || 'Not available'
        },
        baggageClaim: finalFlightData.destination?.baggage_claim || 'Not available',
        progress: finalFlightData.progress_percent || 'Not available',
        lastUpdated: finalFlightData.last_position?.timestamp ? new Date(finalFlightData.last_position.timestamp * 1000).toISOString() : 'Not available',
      };
    }

    return new Response(JSON.stringify(result), { headers, status: 200 });
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
