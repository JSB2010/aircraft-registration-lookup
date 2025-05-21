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
  Fade
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FlightIcon from '@mui/icons-material/Flight';
import SearchIcon from '@mui/icons-material/Search';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import InfoIcon from '@mui/icons-material/Info';
import { ColorModeContext } from '../App';

const HomePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState(new Date());
  const [apiProvider, setApiProvider] = useState(() => {
    const saved = localStorage.getItem('preferredApiProvider');
    return saved || 'flightaware'; // Default to FlightAware
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

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          borderRadius: { sm: '0 0 16px 16px' },
          backdropFilter: 'blur(10px)',
          background: theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.8)'
            : 'rgba(248, 250, 252, 0.8)',
          borderBottom: theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.05)'
            : '1px solid rgba(0, 0, 0, 0.05)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.2))'
                : 'linear-gradient(45deg, rgba(79, 70, 229, 0.1), rgba(99, 102, 241, 0.1))',
              px: 1.5,
              py: 0.5,
              borderRadius: '12px',
            }}
          >
            <AirplanemodeActiveIcon
              sx={{
                mr: 1.5,
                color: theme.palette.primary.main,
                filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))'
              }}
              className="animated-aircraft"
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)'
                  : 'linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.01em'
              }}
            >
              Future Flight
            </Typography>
          </Box>

          <Typography
            variant="body2"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 500,
              ml: 2,
              display: { xs: 'none', sm: 'block' },
              color: 'text.secondary'
            }}
          >
            Aircraft Lookup
          </Typography>

          <Tooltip title={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              onClick={colorMode.toggleColorMode}
              color="inherit"
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                }
              }}
            >
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
            <Box textAlign="center" mb={5} className="fade-in">
              <Box
                sx={{
                  position: 'relative',
                  display: 'inline-block',
                  mb: 3
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: theme.palette.mode === 'dark'
                      ? 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%)'
                      : 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, rgba(79, 70, 229, 0) 70%)',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 0
                  }}
                />
                <FlightIcon
                  sx={{
                    fontSize: { xs: 60, md: 80 },
                    color: 'primary.main',
                    filter: 'drop-shadow(0 8px 16px rgba(99, 102, 241, 0.4))',
                    position: 'relative',
                    zIndex: 1
                  }}
                  className="animated-aircraft"
                />
              </Box>

              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)'
                    : 'linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                  textShadow: theme.palette.mode === 'dark'
                    ? '0 2px 10px rgba(99, 102, 241, 0.3)'
                    : '0 2px 10px rgba(79, 70, 229, 0.2)',
                  position: 'relative'
                }}
              >
                Find Your Future Flight's Aircraft
              </Typography>

              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{
                  mb: 3,
                  maxWidth: { xs: '95%', sm: '80%', md: '70%' },
                  mx: 'auto',
                  fontSize: { xs: '0.95rem', md: '1.1rem' },
                  lineHeight: 1.6,
                  fontWeight: 400
                }}
              >
                Enter your flight details below to discover which aircraft you'll be flying on,
                powered by FlightAware's comprehensive aviation data
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FlightIcon
                              sx={{
                                color: theme.palette.primary.main,
                                opacity: 0.8
                              }}
                            />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: '12px',
                          '&.Mui-focused': {
                            boxShadow: theme.palette.mode === 'dark'
                              ? '0 0 0 2px rgba(99, 102, 241, 0.3)'
                              : '0 0 0 2px rgba(79, 70, 229, 0.2)'
                          }
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'dark'
                            ? 'rgba(99, 102, 241, 0.5)'
                            : 'rgba(79, 70, 229, 0.3)'
                        }
                      }}
                      error={errors.flightNumber}
                      required
                      fullWidth
                    />
                    {errors.flightNumber && (
                      <FormHelperText sx={{ ml: 1.5 }}>
                        Please enter a valid flight number (e.g., BA123)
                      </FormHelperText>
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
                          variant: "outlined",
                          InputProps: {
                            sx: {
                              borderRadius: '12px',
                              '&.Mui-focused': {
                                boxShadow: theme.palette.mode === 'dark'
                                  ? '0 0 0 2px rgba(99, 102, 241, 0.3)'
                                  : '0 0 0 2px rgba(79, 70, 229, 0.2)'
                              }
                            }
                          },
                          sx: {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.1)',
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.mode === 'dark'
                                ? 'rgba(99, 102, 241, 0.5)'
                                : 'rgba(79, 70, 229, 0.3)'
                            }
                          }
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>

              <Box mt={3} sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1
                  }}
                >
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    <InfoIcon fontSize="small" />
                    Powered by FlightAware API
                  </Typography>
                </Box>

                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    bottom: -30,
                    opacity: 0.6
                  }}
                >
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => {
                      setApiProvider(apiProvider === 'flightaware' ? 'aerodatabox' : 'flightaware');
                    }}
                    sx={{
                      fontSize: '0.7rem',
                      textTransform: 'none',
                      color: 'text.secondary'
                    }}
                  >
                    {apiProvider === 'flightaware' ? 'Switch to AeroDataBox (backup)' : 'Switch to FlightAware'}
                  </Button>
                </Box>
              </Box>

              <Box mt={4} textAlign="center">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SearchIcon />}
                  className="modern-button"
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)'
                      : 'linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(99, 102, 241, 0.5)'
                      : '0 4px 20px rgba(79, 70, 229, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-3px) scale(1.02)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 30px rgba(99, 102, 241, 0.6)'
                        : '0 8px 30px rgba(79, 70, 229, 0.4)',
                    }
                  }}
                >
                  Find My Aircraft
                </Button>
              </Box>
            </Box>

            {recentSearches.length > 0 && (
              <Box mt={6} className="fade-in">
                <Divider sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      px: 2,
                      py: 0.5,
                      borderRadius: '20px',
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(99, 102, 241, 0.1)'
                        : 'rgba(79, 70, 229, 0.08)',
                      border: theme.palette.mode === 'dark'
                        ? '1px solid rgba(99, 102, 241, 0.2)'
                        : '1px solid rgba(79, 70, 229, 0.15)',
                    }}
                  >
                    Recent Searches
                  </Typography>
                </Divider>
                <Grid container spacing={2}>
                  {recentSearches.map((search, index) => (
                    <Grid item xs={12} sm={6} md={4} key={`${search.flightNumber}-${search.date}-${index}`}>
                      <Card
                        className="glass-morphism"
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          position: 'relative',
                          '&:hover': {
                            transform: 'translateY(-4px) scale(1.02)',
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '4px',
                            height: '100%',
                            background: 'linear-gradient(to bottom, #6366f1, #818cf8)',
                            opacity: 0.8
                          }
                        }}
                        onClick={() => handleRecentSearchClick(search)}
                      >
                        <CardContent>
                          <Box display="flex" alignItems="center">
                            <FlightIcon
                              color="primary"
                              sx={{
                                mr: 1.5,
                                fontSize: '1.5rem',
                                filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.3))'
                              }}
                              className="animated-aircraft"
                            />
                            <Typography variant="subtitle1" fontWeight={700}>
                              {search.flightNumber}
                            </Typography>
                          </Box>
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            mt={1.5}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              {new Date(search.date).toLocaleDateString()}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                px: 1,
                                py: 0.25,
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                background: search.apiProvider === 'flightaware'
                                  ? 'rgba(99, 102, 241, 0.1)'
                                  : 'rgba(236, 72, 153, 0.1)',
                                color: search.apiProvider === 'flightaware'
                                  ? '#6366f1'
                                  : '#ec4899',
                                border: search.apiProvider === 'flightaware'
                                  ? '1px solid rgba(99, 102, 241, 0.2)'
                                  : '1px solid rgba(236, 72, 153, 0.2)',
                              }}
                            >
                              {search.apiProvider === 'flightaware' ? 'FlightAware' : 'AeroDataBox'}
                            </Typography>
                          </Box>
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
            This application uses the FlightAware API to retrieve detailed aircraft information.
            For flights in the near future, you can see which aircraft is assigned to your flight.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
            AeroDataBox API is available as a backup data source if needed.
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
