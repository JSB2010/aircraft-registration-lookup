// Middleware for API routes
export async function onRequest(context) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Max-Age': '86400'
  };

  // Handle OPTIONS request for CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  // Get the response from the next handler
  const response = await context.next();

  // Add CORS headers to the response
  const newResponse = new Response(response.body, response);
  
  // Add CORS headers
  Object.keys(corsHeaders).forEach(key => {
    newResponse.headers.set(key, corsHeaders[key]);
  });

  // Ensure content type is set
  if (!newResponse.headers.has('Content-Type')) {
    newResponse.headers.set('Content-Type', 'application/json');
  }

  return newResponse;
}
