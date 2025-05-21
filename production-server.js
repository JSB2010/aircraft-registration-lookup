// Custom server for production that handles both static files and API requests
const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from .env.local and .env files
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_SERVER_URL = 'http://localhost:5001';

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Add CORS preflight handling
app.options('*', cors());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API proxy middleware
app.use('/api', async (req, res) => {
  try {
    // Fix the URL to include /api prefix
    let apiUrl = `${API_SERVER_URL}${req.url}`;
    console.log(`Proxying API request to: ${apiUrl}`);

    // Forward the request to the API server
    const response = await axios({
      method: req.method,
      url: apiUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      validateStatus: () => true // Accept any status code
    });

    // Forward the response back to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('API proxy error:', error.message);
    res.status(500).json({
      message: 'Error proxying API request',
      details: error.message
    });
  }
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// For all other requests, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
