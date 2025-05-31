import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App'; // Your main App component
import { MemoryRouter } from 'react-router-dom'; // To handle routing
// MSW server is already set up in setupTests.js and will intercept calls

describe('App Integration Flow', () => {
  test('user can search for a flight and see details', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // 1. On HomePage
    expect(screen.getByText(/find your future flight's aircraft/i)).toBeInTheDocument();

    // 2. Enter flight number and date (using default date)
    const flightNumberInput = screen.getByLabelText(/flight number/i);
    fireEvent.change(flightNumberInput, { target: { value: 'INTTEST1' } });

    // 3. Click search
    const searchButton = screen.getByRole('button', { name: /find my aircraft/i });
    fireEvent.click(searchButton);

    // 4. Verify navigation to AircraftDetails page (mock API is called by MSW)
    // and loading state appears
    await waitFor(() => {
      // Check for elements that indicate AircraftDetails page is loading or loaded
      // The loading state is quick, so we might go straight to details
       expect(screen.getByRole('heading', { name: /flight inttest1/i })).toBeInTheDocument();
    });

    // 5. Verify some details are rendered on the AircraftDetails page
    // These details come from the mock handlers in handlers.js
    // For 'INTTEST1', it should use the FlightAware mock by default
    expect(await screen.findByText(/MockAir/i)).toBeInTheDocument(); // Airline
    expect(await screen.findByText(/N\d{5}M/)).toBeInTheDocument(); // Registration (regex for random part)
    expect(await screen.findByText(/Boeing 737-800/i)).toBeInTheDocument(); // Model
    expect(await screen.findByText(/Mockville International \(MVI\)/i)).toBeInTheDocument(); // Departure airport

    // Check for the map if the mock provides active flight data
    // The default FlightAware mock has "En Route" status and position data
    expect(await screen.findByText(/live flight position/i)).toBeInTheDocument();
    const mapContainer = document.querySelector('.leaflet-container');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveStyle('height: 400px');
  });

  test('user sees error on AircraftDetails if API fails for the integration flow', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    const flightNumberInput = screen.getByLabelText(/flight number/i);
    // Use a flight number that our mock handler for FlightAware is set to fail for
    fireEvent.change(flightNumberInput, { target: { value: 'FAERROR' } });

    const searchButton = screen.getByRole('button', { name: /find my aircraft/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /flight faerror/i })).toBeInTheDocument();
    });

    // Check that the error message from the mock handler is displayed
    expect(await screen.findByText(/Flight not found or error from FlightAware mock/i)).toBeInTheDocument();
    expect(screen.queryByText(/live flight position/i)).not.toBeInTheDocument(); // Map should not be there
  });
});
