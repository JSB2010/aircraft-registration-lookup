require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const flightawareService = require('./services/flightawareService');

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// AeroDataBox API endpoint
const AERODATABOX_API_HOST = 'aerodatabox.p.rapidapi.com';
const AERODATABOX_API_URL = 'https://aerodatabox.p.rapidapi.com/flights';

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
        status: flightData.status || 'Not available'
      };

      // Add additional data if available
      if (flightData.aircraft?.age) {
        aircraftDetails.aircraftAge = flightData.aircraft.age;
      }

      if (flightData.greatCircleDistance?.km) {
        aircraftDetails.distance = {
          kilometers: flightData.greatCircleDistance.km,
          miles: flightData.greatCircleDistance.mile || Math.round(flightData.greatCircleDistance.km * 0.621371)
        };
      }

      if (flightData.departure?.airport?.icao && flightData.arrival?.airport?.icao) {
        aircraftDetails.departure.icao = flightData.departure.airport.icao;
        aircraftDetails.arrival.icao = flightData.arrival.airport.icao;
      }

      // Cache the response for 30 minutes (1800000 ms)
      // Use a shorter cache time for flights in the near future as they might get updated
      const flightDate = new Date(formattedDate);
      const today = new Date();
      const daysDifference = Math.floor((flightDate - today) / (1000 * 60 * 60 * 24));

      // If flight is within 3 days, cache for 30 minutes, otherwise cache for 12 hours
      const cacheTTL = daysDifference <= 3 ? 1800000 : 43200000;
      cache.set(cacheKey, aircraftDetails, cacheTTL);

      return res.json(aircraftDetails);
    } else {
      return res.status(404).json({
        message: 'No flight data available for the given flight number and date. For future flights, aircraft information may not be assigned until closer to departure.'
      });
    }
  } catch (error) {
    console.error('Error fetching aircraft data:', error.response?.data || error.message);

    // Handle specific API error codes
    if (error.response?.status === 404) {
      return res.status(404).json({
        message: 'Flight not found. For future flights, please verify the flight exists and aircraft information may only be available closer to the departure date.'
      });
    } else if (error.response?.status === 429) {
      return res.status(429).json({
        message: 'Too many requests. API rate limit exceeded.'
      });
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(401).json({
        message: 'API authentication error. Please check your API key.'
      });
    }

    return res.status(500).json({
      message: 'An error occurred while fetching the aircraft data'
    });
  }
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
        message: 'FlightAware API key is not configured. Please set the FLIGHTAWARE_API_KEY environment variable.'
      });
    }

    // Get aircraft data from FlightAware
    const aircraftDetails = await flightawareService.getAircraftByFlightAndDate(
      flightNumber,
      formattedDate,
      process.env.FLIGHTAWARE_API_KEY
    );

    // Cache the response for 30 minutes (1800000 ms)
    // Use a shorter cache time for flights in the near future as they might get updated
    const flightDate = new Date(formattedDate);
    const today = new Date();
    const daysDifference = Math.floor((flightDate - today) / (1000 * 60 * 60 * 24));

    // If flight is within 3 days, cache for 30 minutes, otherwise cache for 12 hours
    const cacheTTL = daysDifference <= 3 ? 1800000 : 43200000;
    cache.set(cacheKey, aircraftDetails, cacheTTL);

    return res.json(aircraftDetails);
  } catch (error) {
    console.error('Error fetching aircraft data from FlightAware:', error.message);

    // Pass through the detailed error message
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

// Cache management endpoint (admin only)
app.get('/api/admin/cache', (req, res) => {
  const cacheSize = Object.keys(cache.data).length;
  const cacheEntries = Object.entries(cache.data).map(([key, value]) => ({
    key,
    expires: new Date(value.expiry).toISOString(),
    timeToLive: Math.floor((value.expiry - Date.now()) / 1000) + ' seconds'
  }));

  res.json({
    cacheSize,
    entries: cacheEntries
  });
});

// Clear cache endpoint (admin only)
app.post('/api/admin/cache/clear', (req, res) => {
  cache.clear();
  res.json({
    status: 'success',
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
