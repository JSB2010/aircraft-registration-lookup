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
    const formattedDate = new Date(date).toISOString().split('T')[0];

    // Get API key from environment variables
    const FLIGHTAWARE_API_KEY = context.env.FLIGHTAWARE_API_KEY;

    if (!FLIGHTAWARE_API_KEY) {
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

    // Make request to FlightAware API
    const response = await fetch(
      `${FLIGHTAWARE_API_URL}/flights/${flightNumber}?date=${formattedDate}`,
      {
        method: 'GET',
        headers: {
          'x-apikey': FLIGHTAWARE_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Check if the flight data contains aircraft information
    if (data && data.flights && data.flights.length > 0) {
      const flightData = data.flights[0]; // Taking the first matching flight

      // Extract relevant information
      const result = {
        flightNumber: flightData.ident,
        airline: flightData.operator || 'Unknown Airline',
        registration: flightData.registration || 'Not available',
        model: flightData.aircraft_type || 'Not available',
        status: getFlightStatus(flightData),
        departure: {
          airport: flightData.origin?.name || 'Unknown',
          terminal: flightData.origin?.terminal || 'Not available',
          gate: flightData.origin?.gate || 'Not available',
          scheduledTime: flightData.scheduled_out || null,
          actualTime: flightData.actual_out || null
        },
        arrival: {
          airport: flightData.destination?.name || 'Unknown',
          terminal: flightData.destination?.terminal || 'Not available',
          gate: flightData.destination?.gate || 'Not available',
          scheduledTime: flightData.scheduled_in || null,
          actualTime: flightData.actual_in || null
        },
        dataSource: 'FlightAware AeroAPI',
        aircraftAge: getAircraftAge(flightData)
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
    console.error('Error fetching aircraft data from FlightAware:', error);

    return new Response(
      JSON.stringify({
        message: 'An error occurred while fetching the aircraft data from FlightAware'
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
