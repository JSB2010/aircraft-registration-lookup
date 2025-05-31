import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AircraftDetails from './AircraftDetails';
import { ColorModeContext } from '../App';
import { server } from '../mocks/server'; // MSW server
import { http, HttpResponse } from 'msw'; // For overriding handlers

// Mock ColorModeContext
const mockToggleColorMode = jest.fn();

const renderWithProviders = (initialEntries = ['/aircraft/FA123/2023-01-01/flightaware']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ColorModeContext.Provider value={{ mode: 'dark', toggleColorMode: mockToggleColorMode }}>
        <Routes>
          <Route path="/aircraft/:flightNumber/:date/:apiProvider" element={<AircraftDetails />} />
          <Route path="/aircraft/:flightNumber/:date" element={<AircraftDetails />} /> {/* For default provider */}
        </Routes>
      </ColorModeContext.Provider>
    </MemoryRouter>
  );
};

describe('AircraftDetails Component', () => {
  test('renders loading state initially', () => {
    renderWithProviders();
    expect(screen.getByRole('status', { name: /loading aircraft information/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // For LinearProgress
  });

  test('renders aircraft details successfully after loading (FlightAware)', async () => {
    renderWithProviders(['/aircraft/FAGOOD/2023-01-01/flightaware']);

    // Wait for loading to complete and data to be displayed
    await waitFor(() => {
      expect(screen.getByText(/flight fagood/i)).toBeInTheDocument(); // Main heading
    });

    expect(screen.getByText(/MockAir/i)).toBeInTheDocument(); // Airline from mock
    expect(screen.getByText(/N\d{5}M/)).toBeInTheDocument(); // Registration from mock (regex for random part)
    expect(screen.getByText(/Boeing 737-800/i)).toBeInTheDocument(); // Model from mock
    expect(screen.getByText(/Mockville International \(MVI\)/i)).toBeInTheDocument(); // Departure airport
    expect(screen.getByText(/Destination City \(DCI\)/i)).toBeInTheDocument(); // Arrival airport

    // Check for map section (assuming flight is active in mock)
    expect(screen.getByText(/live flight position/i)).toBeInTheDocument();
    // Check for map container by its fixed height (Leaflet doesn't add specific roles easily)
    const mapContainer = document.querySelector('.leaflet-container');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveStyle('height: 400px');
  });

  test('renders aircraft details successfully (AeroDataBox)', async () => {
    renderWithProviders(['/aircraft/ADGOOD/2023-01-02/aerodatabox']);

    await waitFor(() => {
      expect(screen.getByText(/flight adgood/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/AeroMock/i)).toBeInTheDocument();
    expect(screen.getByText(/A\d{5}X/)).toBeInTheDocument(); // Registration from mock
    expect(screen.getByText(/Airbus A320neo/i)).toBeInTheDocument();
    expect(screen.getByText(/AeroPort Origin \(APO\)/i)).toBeInTheDocument();
    expect(screen.getByText(/AeroDestination \(ADS\)/i)).toBeInTheDocument();

    // Map should not be present for AeroDataBox mock if it doesn't have position data
    // or if status is not 'En Route' (which it is for FlightAware mock)
    // The AeroDataBox mock has 'Scheduled' status, so map should not render
    expect(screen.queryByText(/live flight position/i)).not.toBeInTheDocument();
    expect(document.querySelector('.leaflet-container')).not.toBeInTheDocument();
  });


  test('renders error state if FlightAware API returns an error', async () => {
    // Override the default handler for this specific test
    server.use(
      http.get('/api/flightaware/aircraft/FAFAIL/2023-01-03', () => {
        return HttpResponse.json({ message: 'Mocked FlightAware API Error' }, { status: 500 });
      })
    );

    renderWithProviders(['/aircraft/FAFAIL/2023-01-03/flightaware']);

    await waitFor(() => {
      // Check for a generic error message part, as the full message might vary
      expect(screen.getByText(/unable to find aircraft information/i)).toBeInTheDocument();
    });
     // Check for the specific error message from the mock
    expect(await screen.findByText(/Mocked FlightAware API Error/i)).toBeInTheDocument();
  });

  test('renders error state if AeroDataBox API returns an error', async () => {
    server.use(
      http.get('/api/aircraft/ADBFAIL/2023-01-04', () => {
        return HttpResponse.json({ message: 'Mocked AeroDataBox API Error' }, { status: 500 });
      })
    );
    renderWithProviders(['/aircraft/ADBFAIL/2023-01-04/aerodatabox']);
    await waitFor(() => {
      expect(screen.getByText(/unable to find aircraft information/i)).toBeInTheDocument();
    });
    expect(await screen.findByText(/Mocked AeroDataBox API Error/i)).toBeInTheDocument();
  });

  test('handles FlightAware API returning empty data gracefully', async () => {
     // Specific handler for a flight number that returns empty data
    server.use(
      http.get('/api/flightaware/aircraft/FAEMPTY/2023-01-05', () => {
        return HttpResponse.json(null, { status: 200 });
      })
    );
    renderWithProviders(['/aircraft/FAEMPTY/2023-01-05/flightaware']);
    await waitFor(() => {
        // Check for a message indicating no data or an error state
        // This depends on how your component handles empty but successful responses
        expect(screen.getByText(/unable to find aircraft information/i)).toBeInTheDocument();
        // Or a more specific message like:
        expect(screen.getByText(/No data received from API/i)).toBeInTheDocument();
    });
  });

  test('displays specific message for future flights from FlightAware', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10); // 10 days in the future
    const formattedFutureDate = futureDate.toISOString().split('T')[0];

    // Mock handler for a future flight that might trigger the specific message
    // The default mock handler might already return a generic error,
    // but this ensures we test the path that leads to "FlightAware typically only has data..."
    server.use(
      http.get(`/api/flightaware/aircraft/FAFUTURE/${formattedFutureDate}`, () => {
        return HttpResponse.json(
          { message: 'FlightAware typically only has data for flights within 7 days of departure.' },
          { status: 404 } // Or whatever status your API returns for this
        );
      })
    );

    renderWithProviders([`/aircraft/FAFUTURE/${formattedFutureDate}/flightaware`]);

    await waitFor(() => {
      expect(screen.getByText(/Flight information not available yet/i)).toBeInTheDocument();
      expect(screen.getByText(/FlightAware typically only provides aircraft data for flights within 7 days of departure./i)).toBeInTheDocument();
    });
  });

});
