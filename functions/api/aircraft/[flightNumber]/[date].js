// Aircraft lookup endpoint as a Cloudflare Function
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
    const formattedDate = new Date(date).toISOString().split('T')[0];

    // Get API key from environment variables
    const RAPIDAPI_KEY = context.env.RAPIDAPI_KEY;

    // Log environment variables for debugging (without exposing the actual keys)
    console.log('Environment variables available:', {
      RAPIDAPI_KEY: RAPIDAPI_KEY ? 'Set' : 'Not set',
      FLIGHTAWARE_API_KEY: context.env.FLIGHTAWARE_API_KEY ? 'Set' : 'Not set'
    });

    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({
          message: 'API key not configured'
        }),
        {
          headers,
          status: 500
        }
      );
    }

    // AeroDataBox API endpoint
    const AERODATABOX_API_HOST = 'aerodatabox.p.rapidapi.com';
    const AERODATABOX_API_URL = 'https://aerodatabox.p.rapidapi.com/flights';

    // Make request to AeroDataBox API
    const response = await fetch(
      `${AERODATABOX_API_URL}/number/${flightNumber}/${formattedDate}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': AERODATABOX_API_HOST
        }
      }
    );

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      console.error(`API responded with status: ${response.status} (${statusText})`);

      // Try to get more details from the response
      let errorDetails = '';
      try {
        const errorResponse = await response.text();
        errorDetails = errorResponse;
        console.error('Error response:', errorResponse);
      } catch (e) {
        console.error('Could not parse error response:', e);
      }

      throw new Error(`API responded with status: ${response.status}. Details: ${errorDetails}`);
    }

    const data = await response.json();
    console.log('API response data:', JSON.stringify(data).substring(0, 200) + '...');

    // Check if the flight data contains aircraft information
    if (data && data.length > 0) {
      const flightData = data[0]; // Taking the first matching flight

      // Extract relevant information
      const result = {
        flightNumber: flightData.number,
        airline: flightData.airline?.name || 'Unknown Airline',
        registration: flightData.aircraft?.reg || 'Not available',
        model: flightData.aircraft?.model || 'Not available',
        status: flightData.status || 'Unknown',
        departure: {
          airport: flightData.departure?.airport?.name || 'Unknown',
          terminal: flightData.departure?.terminal || 'Not available',
          gate: flightData.departure?.gate || 'Not available',
          scheduledTime: flightData.departure?.scheduledTime || null,
          actualTime: flightData.departure?.actualTime || null
        },
        arrival: {
          airport: flightData.arrival?.airport?.name || 'Unknown',
          terminal: flightData.arrival?.terminal || 'Not available',
          gate: flightData.arrival?.gate || 'Not available',
          scheduledTime: flightData.arrival?.scheduledTime || null,
          actualTime: flightData.arrival?.actualTime || null
        },
        dataSource: 'AeroDataBox API'
      };

      return new Response(JSON.stringify(result), {
        headers,
        status: 200
      });
    } else {
      return new Response(
        JSON.stringify({
          message: `No flight data found for ${flightNumber} on ${formattedDate}`
        }),
        {
          headers,
          status: 404
        }
      );
    }
  } catch (error) {
    console.error('Error fetching aircraft data:', error);
    console.error('Error stack:', error.stack);

    return new Response(
      JSON.stringify({
        message: 'An error occurred while fetching the aircraft data',
        details: error.message
      }),
      {
        headers,
        status: 500
      }
    );
  }
}
