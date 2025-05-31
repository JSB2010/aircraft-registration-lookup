import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; // Footer might contain Links
import Footer from './Footer';
import { ColorModeContext } from '../App'; // Assuming Footer uses this

// Mock ColorModeContext
const mockToggleColorMode = jest.fn();

const renderWithProviders = (ui) => {
  return render(
    <MemoryRouter>
      <ColorModeContext.Provider value={{ mode: 'dark', toggleColorMode: mockToggleColorMode }}>
        {ui}
      </ColorModeContext.Provider>
    </MemoryRouter>
  );
};

describe('Footer Component', () => {
  test('renders footer text and copyright', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(/Future Flight/i)).toBeInTheDocument();
    expect(screen.getByText(/© \d{4} Aircraft Lookup/i)).toBeInTheDocument(); // Year will change
  });

  test('renders theme toggle button', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByRole('button', { name: /toggle light\/dark mode/i })).toBeInTheDocument();
  });

  test('renders GitHub link with correct attributes', () => {
    renderWithProviders(<Footer />);
    const githubLink = screen.getByRole('link', { name: /view source code/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/JSB2010/aircraft-registration-lookup');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('renders API attribution text', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText(/Powered by FlightAware API/i)).toBeInTheDocument();
    expect(screen.getByText(/AeroDataBox API available as backup/i)).toBeInTheDocument();
  });
});
