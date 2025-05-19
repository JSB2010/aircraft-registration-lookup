import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Container,
  AppBar,
  Toolbar,
  InputAdornment,
  FormHelperText,
  FormControl,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  useTheme,
  IconButton,
  Tooltip,
  Fade,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FlightIcon from '@mui/icons-material/Flight';
import SearchIcon from '@mui/icons-material/Search';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from '../App';

const HomePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState(new Date());
  const [apiProvider, setApiProvider] = useState(() => {
    const saved = localStorage.getItem('preferredApiProvider');
    return saved || 'aerodatabox'; // Default to AeroDataBox
  });
  const [errors, setErrors] = useState({ flightNumber: false });
  const [errorMessage, setErrorMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recentSearches');
    return saved ? JSON.parse(saved) : [];
  });

  const validateFlightNumber = (value) => {
    // Simple validation for flight number format (e.g., BA123, LH456)
    // Flight numbers usually have 2-3 letters followed by 1-4 digits
    const flightNumberRegex = /^[A-Z0-9]{2,3}\d{1,4}$/i;
    return flightNumberRegex.test(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Reset errors
    setErrors({ flightNumber: false });

    // Validate flight number
    if (!flightNumber || !validateFlightNumber(flightNumber)) {
      setErrors({ ...errors, flightNumber: true });
      setErrorMessage('Please enter a valid flight number (e.g., BA123)');
      setOpenSnackbar(true);
      return;
    }

    // Format date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];

    // Save to recent searches
    const newSearch = {
      flightNumber,
      date: formattedDate,
      apiProvider // Save which API provider was used
    };

    const updatedSearches = [newSearch, ...recentSearches.filter(
      search => !(search.flightNumber === flightNumber && search.date === formattedDate)
    )].slice(0, 5); // Keep only the 5 most recent searches

    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    localStorage.setItem('preferredApiProvider', apiProvider);

    // Navigate to the aircraft details page with the flight number, date, and API provider as parameters
    navigate(`/aircraft/${flightNumber}/${formattedDate}/${apiProvider}`);
  };

  const handleRecentSearchClick = (search) => {
    // Use the saved API provider if available, otherwise use the current selected provider
    const provider = search.apiProvider || apiProvider;
    navigate(`/aircraft/${search.flightNumber}/${search.date}/${provider}`);
  };

  const handleApiProviderChange = (event) => {
    setApiProvider(event.target.value);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <AirplanemodeActiveIcon sx={{ mr: 2 }} className="animated-aircraft" />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Future Flight Aircraft Lookup
          </Typography>
          <Tooltip title={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 4, md: 8 }, mb: 4 }}>
        <Fade in={true} timeout={800}>
          <Paper
            elevation={3}
            className="glass-morphism"
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
            }}
          >
            <Box textAlign="center" mb={4} className="fade-in">
              <FlightIcon
                sx={{
                  fontSize: { xs: 50, md: 70 },
                  mb: 2,
                  color: 'primary.main',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }}
                className="animated-aircraft"
              />
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  fontWeight: 700,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)'
                    : 'linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}
              >
                Find Your Future Flight's Aircraft
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ mb: 2, maxWidth: '80%', mx: 'auto' }}
              >
                Enter a flight number and date to see which aircraft you'll be flying on
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate className="staggered-fade-in">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={errors.flightNumber}>
                    <TextField
                      id="flight-number"
                      label="Flight Number"
                      variant="outlined"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. BA123"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <FlightIcon />
                            </InputAdornment>
                          ),
                        }
                      }}
                      error={errors.flightNumber}
                      required
                      fullWidth
                    />
                    {errors.flightNumber && (
                      <FormHelperText>Please enter a valid flight number (e.g., BA123)</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Flight Date"
                      value={date}
                      onChange={(newDate) => setDate(newDate)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          variant: "outlined"
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>

              <Box mt={3}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ mb: 1, color: 'text.secondary' }}>
                    Data Provider
                  </FormLabel>
                  <RadioGroup
                    row
                    name="api-provider"
                    value={apiProvider}
                    onChange={handleApiProviderChange}
                  >
                    <FormControlLabel
                      value="aerodatabox"
                      control={<Radio />}
                      label="AeroDataBox API"
                    />
                    <FormControlLabel
                      value="flightaware"
                      control={<Radio />}
                      label="FlightAware API"
                    />
                  </RadioGroup>
                </FormControl>
              </Box>

              <Box mt={4} textAlign="center">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SearchIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  Find My Aircraft
                </Button>
              </Box>
            </Box>

            {recentSearches.length > 0 && (
              <Box mt={6}>
                <Divider sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Recent Searches
                  </Typography>
                </Divider>
                <Grid container spacing={2}>
                  {recentSearches.map((search, index) => (
                    <Grid item xs={12} sm={6} md={4} key={`${search.flightNumber}-${search.date}-${index}`}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.palette.mode === 'dark'
                              ? '0 8px 16px rgba(0,0,0,0.5)'
                              : '0 8px 16px rgba(0,0,0,0.1)'
                          }
                        }}
                        onClick={() => handleRecentSearchClick(search)}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center">
                            <FlightIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight={600}>
                              {search.flightNumber}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {new Date(search.date).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </Fade>

        <Box mt={4} textAlign="center" className="fade-in" sx={{ opacity: 0.8 }}>
          <Typography variant="body2" color="text.secondary">
            This application uses the AeroDataBox API to retrieve scheduled aircraft information.
            For flights in the near future, you can see which aircraft is assigned to your flight.
          </Typography>
        </Box>
      </Container>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HomePage;
