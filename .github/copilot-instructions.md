<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Aircraft Registration Lookup App

This is a React and Node.js application that uses the AeroDataBox RapidAPI to look up aircraft registration details based on flight number and date.

## Project Structure

- `/client`: React frontend built with Material UI
- `/server`: Express backend API that communicates with AeroDataBox API

## Important APIs and Endpoints

### Backend API
- `GET /api/aircraft/:flightNumber/:date` - Get aircraft registration details for the specified flight
- `GET /api/health` - Server health check endpoint

### AeroDataBox API
When working with the AeroDataBox API, remember:
- Flight numbers should be formatted correctly (e.g., BA123, LH456)
- Dates should be in YYYY-MM-DD format
- API responses include comprehensive flight information (registration, model, departure/arrival details)
- Error handling should account for rate limits, authentication errors, and missing flight data

## Coding Conventions

- Use modern JavaScript (ES6+) features
- Implement proper error handling for API requests
- Follow React best practices with functional components and hooks
- Use Material UI components for consistent styling
- Implement responsive design that works on all device sizes
