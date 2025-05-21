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

    // Log the API request details
    const apiUrl = `${FLIGHTAWARE_API_URL}/flights/${flightNumber}?date=${formattedDate}`;
    console.log('FlightAware API request URL:', apiUrl);

    // Try different API endpoints if the first one fails
    let response;
    let data;
    let apiError = null;

    // First try the flights endpoint
    try {
      console.log('Trying FlightAware flights endpoint...');
      response = await fetch(
        apiUrl,
        {
          method: 'GET',
          headers: {
            'x-apikey': FLIGHTAWARE_API_KEY
          }
        }
      );

      if (response.ok) {
        data = await response.json();
        console.log('FlightAware flights endpoint successful');
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

    // If the flights endpoint failed, try the scheduled flights endpoint
    if (!data && apiError) {
      try {
        console.log('Trying FlightAware scheduled flights endpoint...');
        const scheduledApiUrl = `${FLIGHTAWARE_API_URL}/schedules/${flightNumber}?date=${formattedDate}`;
        console.log('FlightAware scheduled API request URL:', scheduledApiUrl);

        response = await fetch(
          scheduledApiUrl,
          {
            method: 'GET',
            headers: {
              'x-apikey': FLIGHTAWARE_API_KEY
            }
          }
        );

        if (response.ok) {
          data = await response.json();
          console.log('FlightAware scheduled flights endpoint successful');
        } else {
          const statusText = response.statusText || 'Unknown error';
          console.error(`FlightAware scheduled flights endpoint responded with status: ${response.status} (${statusText})`);

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
          apiError += ` | FlightAware scheduled flights endpoint responded with status: ${response.status}. Details: ${errorDetails}`;
        }
      } catch (error) {
        console.error('Error calling FlightAware scheduled flights endpoint:', error);
        apiError += ` | Error calling FlightAware scheduled flights endpoint: ${error.message}`;
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

    // Check if we have flight data
    if (data && data.flights && data.flights.length > 0) {
      flightData = data.flights[0]; // Taking the first matching flight
      console.log('Using data from flights endpoint');
    }
    // Check if we have scheduled flight data
    else if (data && data.scheduled && data.scheduled.length > 0) {
      flightData = data.scheduled[0]; // Taking the first matching scheduled flight
      isScheduledData = true;
      console.log('Using data from scheduled flights endpoint');
    }

    if (flightData) {
      // Extract relevant information
      const result = {
        flightNumber: flightData.ident || flightData.flight_number || flightNumber,
        airline: flightData.operator || flightData.operator_name || 'Unknown Airline',
        registration: flightData.registration || 'Not available',
        model: flightData.aircraft_type || 'Not available',
        status: isScheduledData ? 'Scheduled' : getFlightStatus(flightData),
        departure: {
          airport: isScheduledData
            ? flightData.origin?.name || flightData.origin?.airport_name || 'Unknown'
            : flightData.origin?.name || 'Unknown',
          terminal: flightData.origin?.terminal || 'Not available',
          gate: flightData.origin?.gate || 'Not available',
          scheduledTime: isScheduledData
            ? flightData.departuretime || null
            : flightData.scheduled_out || null,
          actualTime: isScheduledData ? null : flightData.actual_out || null
        },
        arrival: {
          airport: isScheduledData
            ? flightData.destination?.name || flightData.destination?.airport_name || 'Unknown'
            : flightData.destination?.name || 'Unknown',
          terminal: flightData.destination?.terminal || 'Not available',
          gate: flightData.destination?.gate || 'Not available',
          scheduledTime: isScheduledData
            ? flightData.arrivaltime || null
            : flightData.scheduled_in || null,
          actualTime: isScheduledData ? null : flightData.actual_in || null
        },
        dataSource: 'FlightAware AeroAPI',
        aircraftAge: isScheduledData ? 'Not available' : getAircraftAge(flightData)
      };

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

      if (daysInFuture > 7) {
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
