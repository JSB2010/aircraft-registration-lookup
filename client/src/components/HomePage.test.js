import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import HomePage from './HomePage';
import { ColorModeContext } from '../App'; // Assuming HomePage uses this
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock ColorModeContext
const mockToggleColorMode = jest.fn();

const renderWithProviders = (ui) => {
  return render(
    <MemoryRouter>
      <ColorModeContext.Provider value={{ mode: 'dark', toggleColorMode: mockToggleColorMode }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {ui}
        </LocalizationProvider>
      </ColorModeContext.Provider>
    </MemoryRouter>
  );
};

describe('HomePage Component', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    mockNavigate.mockClear();
    localStorage.clear();
  });

  test('renders form elements correctly', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByLabelText(/flight number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/flight date/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /find my aircraft/i })).toBeInTheDocument();
  });

  test('allows inputting flight number and date', () => {
    renderWithProviders(<HomePage />);
    const flightNumberInput = screen.getByLabelText(/flight number/i);
    const dateInput = screen.getByLabelText(/flight date/i); // DatePicker uses label for input

    fireEvent.change(flightNumberInput, { target: { value: 'BA123' } });
    expect(flightNumberInput.value).toBe('BA123');

    // Date input is harder to test directly with fireEvent.change for DatePicker
    // We'll check its presence and that the form submission logic uses the default date
  });

  test('form submission with valid data navigates to details page', async () => {
    renderWithProviders(<HomePage />);
    const flightNumberInput = screen.getByLabelText(/flight number/i);
    const searchButton = screen.getByRole('button', { name: /find my aircraft/i });

    fireEvent.change(flightNumberInput, { target: { value: 'AA100' } });
    // Assuming default date is today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/aircraft/AA100/${formattedDate}/flightaware`);
    });
  });

  test('form submission with invalid flight number shows error', async () => {
    renderWithProviders(<HomePage />);
    const flightNumberInput = screen.getByLabelText(/flight number/i);
    const searchButton = screen.getByRole('button', { name: /find my aircraft/i });

    fireEvent.change(flightNumberInput, { target: { value: 'INVALID' } });
    fireEvent.click(searchButton);

    expect(await screen.findByText(/please enter a valid flight number/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('form submission with empty flight number shows error', async () => {
    renderWithProviders(<HomePage />);
    const searchButton = screen.getByRole('button', { name: /find my aircraft/i });

    fireEvent.click(searchButton);

    expect(await screen.findByText(/please enter a valid flight number/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('displays recent searches from localStorage and allows clicking them', async () => {
    const recentSearches = [
      { flightNumber: 'DL456', date: '2023-10-01', apiProvider: 'flightaware' },
      { flightNumber: 'UA789', date: '2023-09-30', apiProvider: 'aerodatabox' },
    ];
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));

    renderWithProviders(<HomePage />);

    expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
    expect(screen.getByText('DL456')).toBeInTheDocument();
    expect(screen.getByText('UA789')).toBeInTheDocument();
    expect(screen.getByText('FlightAware')).toBeInTheDocument(); // From DL456
    expect(screen.getByText('AeroDataBox')).toBeInTheDocument(); // From UA789

    const recentSearchButton = screen.getByText('DL456').closest('div[class*="MuiCard-root"]');
    expect(recentSearchButton).toBeInTheDocument();
    if (recentSearchButton) {
        fireEvent.click(recentSearchButton);
    }


    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/aircraft/DL456/2023-10-01/flightaware');
    });
  });

  test('saves new search to recent searches in localStorage', async () => {
    renderWithProviders(<HomePage />);
    const flightNumberInput = screen.getByLabelText(/flight number/i);
    const searchButton = screen.getByRole('button', { name: /find my aircraft/i });

    fireEvent.change(flightNumberInput, { target: { value: 'SW200' } });
    fireEvent.click(searchButton);

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/aircraft/SW200/${formattedDate}/flightaware`);
    });

    const storedSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    expect(storedSearches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ flightNumber: 'SW200', date: formattedDate, apiProvider: 'flightaware' }),
      ])
    );
  });

   test('API provider switch button works and text updates', () => {
    renderWithProviders(<HomePage />);

    const switchButton = screen.getByRole('button', { name: /switch to aerodatabox/i });
    expect(switchButton).toBeInTheDocument();
    fireEvent.click(switchButton);
    expect(screen.getByRole('button', { name: /switch to flightaware/i })).toBeInTheDocument();
    fireEvent.click(switchButton); // Click again to switch back
    expect(screen.getByRole('button', { name: /switch to aerodatabox/i })).toBeInTheDocument();
  });

  test('submitting form with AeroDataBox provider navigates correctly', async () => {
    renderWithProviders(<HomePage />);
    const flightNumberInput = screen.getByLabelText(/flight number/i);
    const searchButton = screen.getByRole('button', { name: /find my aircraft/i });
    const switchButton = screen.getByRole('button', { name: /switch to aerodatabox/i });

    fireEvent.click(switchButton); // Switch to AeroDataBox
    fireEvent.change(flightNumberInput, { target: { value: 'LH999' } });

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/aircraft/LH999/${formattedDate}/aerodatabox`);
    });

    // Check if preferredApiProvider is saved
    expect(localStorage.getItem('preferredApiProvider')).toBe('aerodatabox');
  });

});
