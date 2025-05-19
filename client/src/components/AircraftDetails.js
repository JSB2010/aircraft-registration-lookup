import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Button,
  Divider,
  AppBar,
  Toolbar,
  Container,
  Chip,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useTheme,
  Fade,
  LinearProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import AirlinesIcon from '@mui/icons-material/Airlines';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AirplaneTicketIcon from '@mui/icons-material/AirplaneTicket';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ColorModeContext } from '../App';

const AircraftDetails = () => {
  const { flightNumber, date, apiProvider = 'aerodatabox' } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [aircraftData, setAircraftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setLoadingProgress((oldProgress) => {
        // Increase progress up to 90% while waiting for API response
        return Math.min(oldProgress + 10, 90);
      });
    }, 400);

    const fetchAircraftData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate a slight delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        // Use the appropriate API endpoint based on the selected provider
        // Get the base API URL from environment variable or use the current domain
        const baseApiUrl = process.env.REACT_APP_API_URL || '/api';

        const apiEndpoint = apiProvider === 'flightaware'
          ? `${baseApiUrl}/flightaware/aircraft/${flightNumber}/${date}`
          : `${baseApiUrl}/aircraft/${flightNumber}/${date}`;

        const response = await axios.get(apiEndpoint);
        setAircraftData(response.data);

        // Complete the progress bar
        setLoadingProgress(100);

        // Small delay before hiding the loading state
        setTimeout(() => {
          setLoading(false);
        }, 400);

      } catch (err) {
        console.error('Error fetching aircraft data:', err);

        // Check if this is a future flight date error
        const errorMessage = err.response?.data?.message || 'An error occurred while fetching the aircraft data';

        if (errorMessage.includes('FlightAware typically only has data for flights within')) {
          setError(`Flight information not available yet. FlightAware typically only provides aircraft data for flights within 7 days of departure.`);
        } else if (errorMessage.includes('aircraft assignment may not be finalized')) {
          setError(`Flight information not available yet. The aircraft assignment may not be finalized this far in advance.`);
        } else if (apiProvider === 'flightaware') {
          // For FlightAware API, provide a more helpful message
          const searchDate = new Date(date);
          const currentDate = new Date();
          const daysInFuture = Math.ceil((searchDate - currentDate) / (1000 * 60 * 60 * 24));

          if (daysInFuture > 0) {
            setError(`Unable to find aircraft information for ${flightNumber} on ${new Date(date).toLocaleDateString()}.
              FlightAware typically only has data for flights within 7 days of departure.
              Your flight is ${daysInFuture} days in the future.
              Try using the AeroDataBox API instead, which may have schedule information.`);
          } else {
            setError(`Unable to find aircraft information for ${flightNumber} on ${new Date(date).toLocaleDateString()}.
              FlightAware may not have data for this flight.
              Try using the AeroDataBox API instead.`);
          }
        } else {
          setError(errorMessage);
        }

        setLoading(false);
      }
    };

    fetchAircraftData();

    return () => {
      clearInterval(progressInterval);
    };
  }, [flightNumber, date, apiProvider]);

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr || dateTimeStr === 'Not available') return 'Not available';

    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateTimeStr;
    }
  };

  const getStatusColor = (status) => {
    if (!status || status === 'Not available') return 'default';

    status = status.toLowerCase();
    if (status.includes('scheduled')) return 'info';
    if (status.includes('active') || status.includes('en route')) return 'success';
    if (status.includes('landed') || status.includes('arrived')) return 'primary';
    if (status.includes('delayed') || status.includes('diverted')) return 'warning';
    if (status.includes('cancelled')) return 'error';

    return 'default';
  };

  // Determine what content to show based on loading and error states
  let content;
  if (loading) {
    content = (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={8}>
        <LinearProgress
          variant="determinate"
          value={loadingProgress}
          sx={{ width: '80%', mb: 3, height: 8, borderRadius: 4 }}
        />
        <Box display="flex" alignItems="center">
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body1">
            Loading aircraft data...
          </Typography>
        </Box>
      </Box>
    );
  } else if (error) {
    content = (
      <Alert
        severity="error"
        sx={{
          mb: 4,
          p: 2,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            fontSize: '2rem'
          }
        }}
      >
        <Typography variant="h6" gutterBottom>Unable to find aircraft information</Typography>
        <Typography variant="body2">{error}</Typography>
        <Box mt={2}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            Back to Search
          </Button>
        </Box>
      </Alert>
    );
  } else {
    content = (
      <Fade in={!loading} timeout={800}>
        <Box className="staggered-fade-in">
          <Box mb={4}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <AirlinesIcon
                  fontSize="large"
                  color="primary"
                  className="animated-aircraft"
                  sx={{ fontSize: 40 }}
                />
              </Grid>
              <Grid item xs>
                <Typography variant="h6" fontWeight={600}>{aircraftData.airline}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Flight {aircraftData.flightNumber}
                </Typography>
              </Grid>
              <Grid item>
                <Chip
                  label={aircraftData.status}
                  color={getStatusColor(aircraftData.status)}
                  icon={<AirplaneTicketIcon />}
                  sx={{ fontWeight: 500, px: 1 }}
                />
              </Grid>
            </Grid>
          </Box>

          <Card
            sx={{
              mb: 4,
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.4)'
                : '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'primary.main',
                  fontWeight: 600
                }}
              >
                <AirplanemodeActiveIcon sx={{ mr: 1 }} />
                Your Aircraft Details
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      height: '100%'
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Registration
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={600}
                      sx={{
                        letterSpacing: 1,
                        color: 'primary.main'
                      }}
                    >
                      {aircraftData.registration}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      height: '100%'
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Aircraft Model
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {aircraftData.model}
                    </Typography>
                  </Box>
                </Grid>

                {/* Additional FlightAware data if available */}
                {aircraftData.dataSource === 'FlightAware AeroAPI' && (
                  <>
                    {aircraftData.aircraftAge && aircraftData.aircraftAge !== 'Not available' && (
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            height: '100%'
                          }}
                        >
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Aircraft Age
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {aircraftData.aircraftAge} years
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {aircraftData.distance && aircraftData.distance.kilometers !== 'Not available' && (
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            height: '100%'
                          }}
                        >
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Flight Distance
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {aircraftData.distance.kilometers} km ({aircraftData.distance.miles} miles)
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.4)'
                    : '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <FlightTakeoffIcon
                      color="primary"
                      sx={{
                        mr: 1,
                        fontSize: 28,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    />
                    <Typography variant="h6" fontWeight={600}>Departure</Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      mb: 2
                    }}
                  >
                    {aircraftData.departure.airport}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      mb: 2
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Scheduled Time
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                      {formatDateTime(aircraftData.departure.scheduledTime)}
                    </Typography>
                  </Box>

                  {aircraftData.departure.terminal !== 'Not available' && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Terminal
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                        {aircraftData.departure.terminal}
                      </Typography>
                    </Box>
                  )}

                  {aircraftData.departure.gate !== 'Not available' && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Gate
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                        {aircraftData.departure.gate}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 20px rgba(0,0,0,0.4)'
                    : '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <FlightLandIcon
                      color="primary"
                      sx={{
                        mr: 1,
                        fontSize: 28,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                      }}
                    />
                    <Typography variant="h6" fontWeight={600}>Arrival</Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      mb: 2
                    }}
                  >
                    {aircraftData.arrival.airport}
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      mb: 2
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Scheduled Time
                    </Typography>
                    <Typography variant="body1" fontWeight={500} sx={{ mt: 0.5 }}>
                      {formatDateTime(aircraftData.arrival.scheduledTime)}
                    </Typography>
                  </Box>

                  {aircraftData.arrival.terminal !== 'Not available' && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Terminal
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                        {aircraftData.arrival.terminal}
                      </Typography>
                    </Box>
                  )}

                  {aircraftData.arrival.gate !== 'Not available' && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Gate
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                        {aircraftData.arrival.gate}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box mt={5} textAlign="center">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Back to Search
            </Button>
          </Box>
        </Box>
      </Fade>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            aria-label="back"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <AirplanemodeActiveIcon sx={{ mr: 2 }} className="animated-aircraft" />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Your Future Flight Aircraft
          </Typography>
          <Tooltip title={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: { xs: 3, md: 5 }, mb: 8 }}>
        <Paper
          elevation={3}
          className="glass-morphism"
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 3,
          }}
        >
          <Box mb={4}>
            <Typography
              variant="h5"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <span>Your Flight:</span>
              <Chip
                label={flightNumber}
                color="primary"
                sx={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  height: 32
                }}
              />
              <span>on</span>
              <Chip
                label={new Date(date).toLocaleDateString()}
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Data provided by:
              </Typography>
              <Chip
                label={apiProvider === 'flightaware' ? 'FlightAware API' : 'AeroDataBox API'}
                size="small"
                variant="outlined"
                sx={{ ml: 1, fontSize: '0.75rem' }}
              />
            </Box>
            <Divider sx={{ my: 2 }} />
          </Box>

          {content}
        </Paper>
      </Container>
    </Box>
  );
};

export default AircraftDetails;
