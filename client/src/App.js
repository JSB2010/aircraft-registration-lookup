import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import HomePage from './components/HomePage';
import AircraftDetails from './components/AircraftDetails';
import NotFound from './components/NotFound';
import Footer from './components/Footer';
import './App.css';

// Create a color mode context
export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
  mode: 'dark'
});

function App() {
  const [mode, setMode] = useState('dark');

  // Update body class when mode changes
  useEffect(() => {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${mode}-mode`);
  }, [mode]);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode],
  );

  // Create a theme based on the mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#6366f1' : '#4f46e5', // Indigo
            light: '#818cf8',
            dark: '#4338ca',
          },
          secondary: {
            main: mode === 'dark' ? '#ec4899' : '#db2777', // Pink
            light: '#f472b6',
            dark: '#be185d',
          },
          background: {
            default: mode === 'dark' ? '#0f172a' : '#f8fafc', // Slate 900 / Slate 50
            paper: mode === 'dark' ? '#1e293b' : '#ffffff', // Slate 800 / White
          },
          text: {
            primary: mode === 'dark' ? '#f8fafc' : '#0f172a', // Slate 50 / Slate 900
            secondary: mode === 'dark' ? '#cbd5e1' : '#475569', // Slate 300 / Slate 600
          },
          error: {
            main: '#ef4444', // Red 500
          },
          warning: {
            main: '#f59e0b', // Amber 500
          },
          info: {
            main: '#3b82f6', // Blue 500
          },
          success: {
            main: '#10b981', // Emerald 500
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          },
          h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          },
          h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          },
          h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
          },
          h6: {
            fontSize: '1rem',
            fontWeight: 600,
          },
          subtitle1: {
            fontSize: '1rem',
            fontWeight: 500,
            letterSpacing: '0.00938em',
          },
          subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
            letterSpacing: '0.00714em',
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
            letterSpacing: '0.00938em',
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
            letterSpacing: '0.00714em',
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
                padding: '8px 16px',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: mode === 'dark' ? '0 4px 8px rgba(0,0,0,0.4)' : '0 4px 8px rgba(0,0,0,0.1)',
                },
              },
              containedPrimary: {
                background: mode === 'dark'
                  ? 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)'
                  : 'linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'dark'
                  ? '0 4px 20px rgba(0,0,0,0.4)'
                  : '0 4px 20px rgba(0,0,0,0.08)',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
              elevation1: {
                boxShadow: mode === 'dark'
                  ? '0 2px 8px rgba(0,0,0,0.4)'
                  : '0 2px 8px rgba(0,0,0,0.08)',
              },
              elevation3: {
                boxShadow: mode === 'dark'
                  ? '0 4px 20px rgba(0,0,0,0.5)'
                  : '0 4px 20px rgba(0,0,0,0.1)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                background: mode === 'dark'
                  ? 'rgba(15, 23, 42, 0.8)' // Slate 900 with opacity
                  : 'rgba(248, 250, 252, 0.8)', // Slate 50 with opacity
                backdropFilter: 'blur(10px)',
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 6,
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container maxWidth="lg" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/aircraft/:flightNumber/:date" element={<AircraftDetails />} />
              <Route path="/aircraft/:flightNumber/:date/:apiProvider" element={<AircraftDetails />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Box>
          <Footer />
        </Container>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
