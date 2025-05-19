// This file is required for Cloudflare Pages Functions to work properly
export default {
  fetch(request, env, ctx) {
    return new Response("This is the API root. Please use specific endpoints like /api/health.");
  }
};
