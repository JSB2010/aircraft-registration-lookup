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

  try {
    // Get environment variables
    const { RAPIDAPI_KEY, FLIGHTAWARE_API_KEY } = context.env;

    // Log environment variables for debugging (without exposing the actual keys)
    console.log('Health check - Environment variables available:', {
      RAPIDAPI_KEY: RAPIDAPI_KEY ? 'Set' : 'Not set',
      FLIGHTAWARE_API_KEY: FLIGHTAWARE_API_KEY ? 'Set' : 'Not set'
    });

    // Log request information
    console.log('Health check - Request URL:', context.request.url);
    console.log('Health check - Request method:', context.request.method);
    console.log('Health check - Request headers:', {
      host: context.request.headers.get('host'),
      origin: context.request.headers.get('origin'),
      referer: context.request.headers.get('referer')
    });

    // Create response
    const responseData = {
      status: 'UP',
      message: 'Server is running!',
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      environment: context.env.ENVIRONMENT || 'production',
      apis: {
        aerodatabox: RAPIDAPI_KEY ? 'configured' : 'not configured',
        flightaware: FLIGHTAWARE_API_KEY ? 'configured' : 'not configured'
      },
      request: {
        url: context.request.url,
        method: context.request.method,
        headers: {
          host: context.request.headers.get('host'),
          origin: context.request.headers.get('origin'),
          referer: context.request.headers.get('referer')
        }
      },
      cloudflare: {
        cf: context.request.cf ? 'available' : 'not available',
        worker: 'Cloudflare Pages Function'
      }
    };

    return new Response(JSON.stringify(responseData), {
      headers,
      status: 200
    });
  } catch (error) {
    console.error('Health check error:', error);

    return new Response(JSON.stringify({
      status: 'ERROR',
      message: 'An error occurred in the health check function',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers,
      status: 500
    });
  }
}
