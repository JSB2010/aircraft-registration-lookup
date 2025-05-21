// This file is used by serve-handler to customize routing
module.exports = {
  rewrites: [
    // Rewrite API requests to the API server in development
    { source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' },
    
    // For all other routes, serve the index.html file
    { source: '/**', destination: '/index.html' }
  ]
};
