// Load environment variables from root directory first, then from server directory
require('dotenv').config({ path: '../.env.local' });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const flightawareService = require('./services/flightawareService');

const app = express();
const PORT = process.env.PORT || 5001;

// Simple in-memory cache
const cache = {
  data: {},
  set: function(key, value, ttl = 3600000) { // Default TTL: 1 hour
    this.data[key] = {
      value,
      expiry: Date.now() + ttl
    };
  },
  get: function(key) {
    const item = this.data[key];
    if (!item) return null;

    if (Date.now() > item.expiry) {
      delete this.data[key];
      return null;
    }

    return item.value;
  },
  clear: function() {
    this.data = {};
  }
};

// Middleware
// Configure CORS to allow requests from all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Add CORS preflight handling
app.options('*', cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// AeroDataBox API endpoint
const AERODATABOX_API_HOST = 'aerodatabox.p.rapidapi.com';
const AERODATABOX_API_URL = 'https://aerodatabox.p.rapidapi.com/flights';

// Fix for incorrect path routing - redirect /apicraft to /api/aircraft
app.get('/apicraft/:flightNumber/:date', (req, res) => {
  res.redirect(`/api/aircraft/${req.params.flightNumber}/${req.params.date}`);
});

// Route to get aircraft registration by flight number and date
app.get('/api/aircraft/:flightNumber/:date', async (req, res) => {
  try {
    const { flightNumber, date } = req.params;

    // Format the date as YYYY-MM-DD if not already formatted
    const formattedDate = new Date(date).toISOString().split('T')[0];

    // Create a cache key
    const cacheKey = `flight_${flightNumber}_${formattedDate}`;

    // Check if we have a cached response
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`Cache miss for ${cacheKey}, fetching from API`);

    const options = {
      method: 'GET',
      url: `${AERODATABOX_API_URL}/number/${flightNumber}/${formattedDate}`,
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': AERODATABOX_API_HOST
      }
    };

    const response = await axios.request(options);

    // Check if the flight data contains aircraft information
    if (response.data && response.data.length > 0) {
      const flightData = response.data[0]; // Taking the first matching flight

      // Extract aircraft details
      const aircraftDetails = {
        registration: flightData.aircraft?.reg || 'Not available',
        model: flightData.aircraft?.model || 'Not available',
        airline: flightData.airline?.name || 'Not available',
        flightNumber: flightData.number,
        departure: {
          airport: flightData.departure?.airport?.name || 'Not available',
          scheduledTime: flightData.departure?.scheduledTime || 'Not available',
          terminal: flightData.departure?.terminal || 'Not available',
          gate: flightData.departure?.gate || 'Not available'
        },
        arrival: {
          airport: flightData.arrival?.airport?.name || 'Not available',
          scheduledTime: flightData.arrival?.scheduledTime || 'Not available',
          terminal: flightData.arrival?.terminal || 'Not available',
          gate: flightData.arrival?.gate || 'Not available'
        },
        status: flightData.status || 'Not available',
        dataSource: 'AeroDataBox API'
      };

      // Cache the response
      const flightDate = new Date(formattedDate);
      const today = new Date();
      const daysDifference = Math.floor((flightDate - today) / (1000 * 60 * 60 * 24));
      const cacheTTL = daysDifference <= 3 ? 1800000 : 43200000;
      cache.set(cacheKey, aircraftDetails, cacheTTL);

      return res.json(aircraftDetails);
    } else {
      return res.status(404).json({
        message: 'No flight data available for the given flight number and date.'
      });
    }
  } catch (error) {
    console.error('Error fetching aircraft data:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'An error occurred while fetching the aircraft data'
    });
  }
});

// Fix for incorrect path routing - redirect /flightaware to /api/flightaware
app.get('/flightaware/aircraft/:flightNumber/:date', (req, res) => {
  res.redirect(`/api/flightaware/aircraft/${req.params.flightNumber}/${req.params.date}`);
});

// Route to get aircraft registration by flight number and date using FlightAware AeroAPI
app.get('/api/flightaware/aircraft/:flightNumber/:date', async (req, res) => {
  try {
    const { flightNumber, date } = req.params;

    // Format the date as YYYY-MM-DD if not already formatted
    const formattedDate = new Date(date).toISOString().split('T')[0];

    // Create a cache key
    const cacheKey = `flightaware_${flightNumber}_${formattedDate}`;

    // Check if we have a cached response
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`Cache miss for ${cacheKey}, fetching from FlightAware API`);

    // Check if FlightAware API key is available
    if (!process.env.FLIGHTAWARE_API_KEY) {
      return res.status(500).json({
        message: 'FlightAware API key is not configured.'
      });
    }

    // Get aircraft data from FlightAware
    const aircraftDetails = await flightawareService.getAircraftByFlightAndDate(
      flightNumber,
      formattedDate,
      process.env.FLIGHTAWARE_API_KEY
    );

    // Cache the response
    const flightDate = new Date(formattedDate);
    const today = new Date();
    const daysDifference = Math.floor((flightDate - today) / (1000 * 60 * 60 * 24));
    const cacheTTL = daysDifference <= 3 ? 1800000 : 43200000;
    cache.set(cacheKey, aircraftDetails, cacheTTL);

    return res.json(aircraftDetails);
  } catch (error) {
    console.error('Error fetching aircraft data from FlightAware:', error.message);
    return res.status(error.response?.status || 500).json({
      message: error.message || 'An error occurred while fetching the aircraft data from FlightAware'
    });
  }
});

// Server health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    message: 'Server is running!',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    apis: {
      aerodatabox: process.env.RAPIDAPI_KEY ? 'configured' : 'not configured',
      flightaware: process.env.FLIGHTAWARE_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
