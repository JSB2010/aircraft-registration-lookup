// Health check endpoint as a Cloudflare Function
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

  // Get environment variables
  const { RAPIDAPI_KEY, FLIGHTAWARE_API_KEY } = context.env;

  // Create response
  const responseData = {
    status: 'UP',
    message: 'Server is running!',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    apis: {
      aerodatabox: RAPIDAPI_KEY ? 'configured' : 'not configured',
      flightaware: FLIGHTAWARE_API_KEY ? 'configured' : 'not configured'
    }
  };

  return new Response(JSON.stringify(responseData), {
    headers,
    status: 200
  });
}
