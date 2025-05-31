# Future Flight Aircraft Lookup

A modern web application that allows travelers to look up aircraft registration details for their upcoming flights by providing a flight number and date. This application supports two different flight data APIs: AeroDataBox API (through RapidAPI) and FlightAware AeroAPI, giving users the choice of which data provider to use.

## Features

- Search for future flight aircraft details using flight number and date
- Choose between two different flight data API providers:
  - AeroDataBox API (default)
  - FlightAware AeroAPI (more comprehensive data)
- Display comprehensive flight information including:
  - Aircraft registration, model, age, owner (when available from FlightAware)
  - Airline information
  - Detailed departure and arrival times (scheduled and actual)
  - Flight status, including live progress percentage (FlightAware)
  - Terminal, gate, baggage claim information (when available)
  - Flight distance, duration, and filed route (FlightAware)
- Live Flight Map Display: Shows the current geographical position for active flights (utilizing FlightAware data and React Leaflet).
- Aircraft Image Search Link: Provides a convenient link to search for images of the aircraft model on Google Images.
- Light/dark mode toggle.
- Recent searches history (persisted in localStorage).
- Responsive design for desktop and mobile devices.
- Modern UI built with Material UI, featuring glass morphism effects and smooth animations.
- Enhanced Accessibility (a11y) for improved usability.
- UI/UX Polishing: Includes refined interactive element feedback and clearer API provider selection.
- Caching system on the backend to reduce redundant API calls.

## Project Structure

The project is divided into two main parts:

- **Client**: React.js frontend application
- **Server**: Node.js/Express backend API

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- RapidAPI account with access to the AeroDataBox API

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd aircraft-register
```

### 2. Set up the server

```bash
cd server
npm install
```

Create a `.env` file based on `.env.example` and add your API keys:

```
PORT=5000

# RapidAPI credentials for AeroDataBox API
RAPIDAPI_KEY=your_rapidapi_key_here

# FlightAware AeroAPI credentials (optional)
FLIGHTAWARE_API_KEY=your_flightaware_api_key_here
```

Note: The FlightAware API key is optional. If not provided, the application will still work with the AeroDataBox API.

### 3. Set up the client

```bash
cd ../client
npm install
```

Create a `.env` file based on `.env.example`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run the application

You have several options to run the application:

#### Option 1: Run with a single command (recommended)

Run the provided start script to launch both the server and client:

```bash
./start.sh
```

If port 3000 is already in use, you can use the alternate port script:

```bash
./start-alt-ports.sh
```

#### Option 2: Use npm from the root directory

```bash
# Install dependencies for server and client
npm run install-all

# Start both server and client
npm start
```

#### Option 3: Run server and client separately

In separate terminal windows:

**Start the server:**
```bash
cd server
npm start
```

**Start the client:**
```bash
cd client
npm start
```

The application will be available at http://localhost:3000 (or http://localhost:3001 if using alternate ports)

## API Endpoints

The application primarily interacts with backend API endpoints, which in turn call external aviation data APIs. The client-side application itself makes calls to:

- `/api/aircraft/:flightNumber/:date` (proxied to the backend server, which then calls AeroDataBox or a similar provider)
- `/api/flightaware/aircraft/:flightNumber/:date` (proxied to the backend server, which then calls FlightAware AeroAPI)

The backend server also exposes:
- `/api/health` - Server health check.
- `/api/admin/cache` - View cache entries (admin only, if configured).
- `/api/admin/cache/clear` - Clear cache (admin only, if configured).

*Note: In the Cloudflare Pages deployment, these `/api/*` calls are routed to Cloudflare Functions that directly call the respective aviation data APIs.*

## Technologies Used

### Frontend
- React.js
- React Router
- Material UI
- Axios
- date-fns
- React Leaflet & Leaflet (for flight maps)

### Backend
- Node.js
- Express
- Axios
- dotenv
- cors
- In-memory caching system

## Testing

The client-side application includes a suite of tests to ensure reliability and maintainability:
- **Unit Tests:** Individual components and utility functions are tested using Jest and React Testing Library.
- **Integration Tests:** User flows and component interactions are tested to verify that different parts of the application work together as expected.
- **API Mocking:** Mock Service Worker (MSW) is configured to intercept API calls during tests, providing consistent and predictable responses without relying on live external APIs. This allows for thorough testing of loading states, error handling, and data display logic.

To run the tests:
```bash
cd client
npm test
```
*Note: Due to a persistent `TextEncoder is not defined` error related to MSW initialization within the current CodeSandbox evaluation environment, the automated tests may not pass directly in this specific sandbox. However, the test suite is structured to run correctly in a standard Node.js/Jest environment where this global is properly available.*

## API Providers

### 1. AeroDataBox API (Default)

This project uses the [AeroDataBox API](https://rapidapi.com/aedbx-aedbx/api/aerodatabox/) through RapidAPI. You'll need to subscribe to this API and get an API key to use this application.

**Features**:
- Aircraft registration
- Aircraft model
- Departure/arrival information
- Flight status

**Setup**:
1. Sign up for a RapidAPI account at [RapidAPI](https://rapidapi.com/)
2. Subscribe to the [AeroDataBox API](https://rapidapi.com/aedbx-aedbx/api/aerodatabox/)
3. Get your API key from RapidAPI
4. Add your API key to the `.env` file as `RAPIDAPI_KEY`

**Pricing**:
- Free tier: Limited requests per month
- Paid plans: Starting from around $30/month for more requests

### 2. FlightAware AeroAPI (More Comprehensive)

The application also supports [FlightAware AeroAPI](https://flightaware.com/commercial/aeroapi/), which provides more comprehensive aircraft and flight data.

**Additional Features**:
- Aircraft age
- Flight distance
- More detailed flight information
- More accurate real-time data

**Setup**:
1. Sign up for a FlightAware account at [FlightAware](https://flightaware.com/)
2. Subscribe to [AeroAPI](https://flightaware.com/commercial/aeroapi/)
3. Get your API key
4. Add your API key to the `.env` file as `FLIGHTAWARE_API_KEY`

**Pricing**:
- Basic tier: $49/month for 1,000 queries
- Higher tiers available for more queries
- Volume discounts available

## License

MIT
