# Deploying to Cloudflare Pages

This document provides instructions for deploying the Aircraft Registration Lookup application to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account
2. GitHub repository connected to Cloudflare Pages

## Setup Steps

### 1. Configure Environment Variables

In the Cloudflare Pages dashboard, add the following environment variables:

- `RAPIDAPI_KEY`: Your RapidAPI key for AeroDataBox API (check the .env.local file for the value)
- `FLIGHTAWARE_API_KEY`: Your FlightAware API key (check the .env.local file for the value)

**Important**: These environment variables need to be added to both:
- Production environment
- Preview environment (if you want to use preview deployments)

### 2. Configure Build Settings

In the Cloudflare Pages project settings:

1. Set the build command: `npm run build`
2. Set the build output directory: `build`
3. Set the root directory: `/` (or leave blank)
4. Add the environment variables mentioned above
5. Enable "Functions" in the Pages settings

### 3. Deploy

With GitHub integration already set up, simply push changes to your repository and Cloudflare Pages will automatically build and deploy your application.

## Project Structure for Cloudflare Pages

The project has been structured to work with Cloudflare Pages:

- `build`: Contains the built React application (copied from client/build during build)
- `functions/`: Contains serverless functions for the API endpoints
- `wrangler.toml`: Configuration for Cloudflare Workers and Pages
- `client/public/_redirects`: Handles client-side routing
- `client/public/_headers`: Sets security headers

### Important Files for Cloudflare Pages

1. **functions/api/aircraft/[flightNumber]/[date].js**: Serverless function for AeroDataBox API
2. **functions/api/flightaware/aircraft/[flightNumber]/[date].js**: Serverless function for FlightAware API
3. **functions/api/health.js**: Health check endpoint
4. **functions/index.js**: Root API handler
5. **client/public/_redirects**: Configures routing for Cloudflare Pages
6. **client/public/_headers**: Sets security headers for Cloudflare Pages

## Testing Locally

To test the application locally with Wrangler:

```bash
# First build the client
npm run build

# Then run the local development server
wrangler pages dev build --binding RAPIDAPI_KEY=your_key --binding FLIGHTAWARE_API_KEY=your_key
```

## Troubleshooting

### API Endpoints Not Working

- Check that the environment variables are correctly set in the Cloudflare Pages dashboard
- Verify that the functions are correctly deployed
- Check the Cloudflare Pages logs for any errors
- Make sure the "Functions" feature is enabled in the Pages settings

### Client-Side Routing Issues

- Ensure that the `_redirects` file is correctly configured
- Make sure the build process is correctly copying the `_redirects` file to the build directory

### CORS Issues

- The serverless functions include CORS headers to allow requests from any origin
- If you're experiencing CORS issues, check the browser console for specific error messages

### Content Security Policy Issues

- The `_headers` file includes a Content Security Policy that allows connections to the API endpoints
- If you're experiencing CSP issues, check the browser console for specific error messages and update the `_headers` file accordingly

### Environment Variable Issues

- Make sure the environment variables are set for both production and preview environments
- The API keys should be set exactly as provided in the .env.local file

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
