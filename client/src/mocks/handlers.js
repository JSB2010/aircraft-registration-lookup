import { http, HttpResponse } from 'msw';

// Helper to generate a realistic-looking FlightAware API response
const createMockFlightAwareResponse = (flightNumber, date) => ({
  flightNumber: flightNumber.toUpperCase(),
  ident: flightNumber.toUpperCase(), // FlightAware often uses 'ident'
  airline: 'MockAir',
  registration: `N${Math.floor(Math.random() * 90000) + 10000}M`,
  model: 'Boeing 737-800',
  status: 'En Route', // Or 'Scheduled', 'Landed', 'Cancelled'
  departure: {
    airport: 'Mockville International (MVI)',
    scheduledTime: `${date}T10:00:00Z`,
    actualTime: `${date}T10:05:00Z`,
    terminal: 'A',
    gate: '12',
  },
  arrival: {
    airport: 'Destination City (DCI)',
    scheduledTime: `${date}T12:00:00Z`,
    actualTime: null,
    terminal: 'B',
    gate: '34',
  },
  last_position: { // FlightAware specific for live tracking
    latitude: 34.0522,
    longitude: -118.2437,
    altitude: 30000, // Altitude in 100s of feet as per FlightAware typical data
    gs: 450, // Groundspeed in knots
    altitude_ft: 30000, // Adding for easier use in map popup
    groundspeed_kts: 450, // Adding for easier use in map popup
    heading: 270,
    timestamp: new Date().toISOString(),
  },
  dataSource: 'FlightAware AeroAPI',
  aircraftAge: '5 years',
  distance: { kilometers: '1500', miles: '932' },
  flightDuration: { scheduled: 120, actual: null }, // minutes
});

// Helper to generate a realistic-looking AeroDataBox API response
const createMockAeroDataBoxResponse = (flightNumber, date) => ({
  flightNumber: flightNumber.toUpperCase(),
  airline: 'AeroMock',
  registration: `A${Math.floor(Math.random() * 90000) + 10000}X`,
  model: 'Airbus A320neo',
  status: 'Scheduled',
  departure: {
    airport: 'AeroPort Origin (APO)',
    scheduledTime: `${date}T14:00:00Z`,
    terminal: '1',
    gate: 'C5',
  },
  arrival: {
    airport: 'AeroDestination (ADS)',
    scheduledTime: `${date}T16:30:00Z`,
    terminal: 'Main',
    gate: 'D10',
  },
  // AeroDataBox might not provide live position data in the same way
  // Or it might be under a different structure. For simplicity, we'll omit it
  // or provide a simplified version if tests need it.
  dataSource: 'AeroDataBox API',
});

export const handlers = [
  // Handler for the API test endpoint
  http.get('/api/test', () => {
    return HttpResponse.json({ status: 'ok', message: 'API is working' });
  }),

  // Handler for FlightAware API
  http.get('/api/flightaware/aircraft/:flightNumber/:date', ({ params }) => {
    const { flightNumber, date } = params;

    if (!flightNumber || !date) {
      return new HttpResponse(null, { status: 400, statusText: 'Bad Request' });
    }
    // Simulate a "not found" scenario for a specific flight number for testing errors
    if (flightNumber.toLowerCase() === 'faerror') {
      return HttpResponse.json(
        { message: 'Flight not found or error from FlightAware mock' },
        { status: 404 }
      );
    }
    if (flightNumber.toLowerCase() === 'faempty') {
        return HttpResponse.json(null, { status: 200 }); // Or an empty object {}
    }


    return HttpResponse.json(createMockFlightAwareResponse(flightNumber, date));
  }),

  // Handler for the generic/AeroDataBox API
  http.get('/api/aircraft/:flightNumber/:date', ({ params }) => {
    const { flightNumber, date } = params;

    if (!flightNumber || !date) {
        return new HttpResponse(null, { status: 400, statusText: 'Bad Request' });
    }
    // Simulate a "not found" scenario
    if (flightNumber.toLowerCase() === 'adberror') {
      return HttpResponse.json(
        { message: 'Flight not found or error from AeroDataBox mock' },
        { status: 404 }
      );
    }
     if (flightNumber.toLowerCase() === 'adbempty') {
        return HttpResponse.json(null, { status: 200 });
    }


    return HttpResponse.json(createMockAeroDataBoxResponse(flightNumber, date));
  }),
];
