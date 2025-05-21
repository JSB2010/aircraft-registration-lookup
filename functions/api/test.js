// Simple test endpoint to verify Cloudflare Functions are working
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

  // Log environment variables for debugging (without exposing the actual keys)
  console.log('Test endpoint - Environment variables available:', {
    RAPIDAPI_KEY: context.env.RAPIDAPI_KEY ? 'Set' : 'Not set',
    FLIGHTAWARE_API_KEY: context.env.FLIGHTAWARE_API_KEY ? 'Set' : 'Not set'
  });

  // Create response
  const responseData = {
    status: 'success',
    message: 'API test endpoint is working!',
    timestamp: new Date().toISOString(),
    environment: context.env.ENVIRONMENT || 'production',
    request: {
      url: context.request.url,
      method: context.request.method
    }
  };

  return new Response(JSON.stringify(responseData), {
    headers,
    status: 200
  });
}
