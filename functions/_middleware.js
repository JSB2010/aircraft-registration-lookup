// Middleware for Cloudflare Functions
export async function onRequest(context) {
  // Log the request for debugging
  console.log('Request URL:', context.request.url);
  console.log('Request method:', context.request.method);
  console.log('Request headers:', {
    host: context.request.headers.get('host'),
    origin: context.request.headers.get('origin'),
    referer: context.request.headers.get('referer')
  });

  // Log environment variables for debugging (without exposing the actual keys)
  console.log('Environment variables available:', {
    RAPIDAPI_KEY: context.env.RAPIDAPI_KEY ? 'Set' : 'Not set',
    FLIGHTAWARE_API_KEY: context.env.FLIGHTAWARE_API_KEY ? 'Set' : 'Not set'
  });

  // Continue to the next middleware or function
  return await context.next();
}
