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
  const { flightNumber, date, apiProvider = 'flightaware' } = useParams();
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

    const checkApiAvailability = async () => {
      try {
        // Get the base API URL
        let baseApiUrl;
        if (process.env.NODE_ENV === 'production') {
          // In production, use the relative path for Cloudflare Pages Functions
          baseApiUrl = '/api';
        } else {
          // In development, use the environment variable or default to relative path
          baseApiUrl = process.env.REACT_APP_API_URL || '/api';
        }

        // First check if the test API endpoint is working
        const testEndpoint = `${baseApiUrl}/test`;
        console.log('Testing API availability with:', testEndpoint);

        const testResponse = await axios.get(testEndpoint, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });

        console.log('API test response:', testResponse.status, testResponse.data);

        if (testResponse.status !== 200 || !testResponse.data || !testResponse.data.status) {
          throw new Error('API test endpoint not working properly');
        }

        return { success: true, baseApiUrl };
      } catch (err) {
        console.error('API test failed:', err);
        return { success: false, error: err.message };
      }
    };

    const fetchAircraftData = async () => {
      // Define apiEndpoint outside the try block so it's accessible in the catch block
      let apiEndpoint;

      try {
        setLoading(true);
        setError(null);

        // Log environment information for debugging
        console.log('Environment:', {
          NODE_ENV: process.env.NODE_ENV,
          REACT_APP_API_URL: process.env.REACT_APP_API_URL,
          apiProvider,
          flightNumber,
          date
        });

        // Simulate a slight delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check if API is available
        const apiCheck = await checkApiAvailability();

        if (!apiCheck.success) {
          throw new Error(`API service is not available. This may be due to a deployment issue with Cloudflare Pages Functions. Error: ${apiCheck.error}`);
        }

        // Use the baseApiUrl from the API check
        const baseApiUrl = apiCheck.baseApiUrl;

        // Log the base API URL
        console.log('Base API URL:', baseApiUrl);

        apiEndpoint = apiProvider === 'flightaware'
          ? `${baseApiUrl}/flightaware/aircraft/${flightNumber}/${date}`
          : `${baseApiUrl}/aircraft/${flightNumber}/${date}`;

        console.log('Making API request to:', apiEndpoint);

        // Add a timeout to the axios request
        const response = await axios.get(apiEndpoint, {
          timeout: 10000, // 10 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        console.log('API response received:', response.status);

        // Check if the response is HTML (which would indicate a routing issue)
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          console.error('Received HTML response instead of JSON');
          throw new Error('API endpoint returned HTML instead of JSON. This indicates a routing issue with the static server or Cloudflare Pages.');
        }

        if (response.data) {
          console.log('API data received:', JSON.stringify(response.data).substring(0, 100) + '...');
          setAircraftData(response.data);
        } else {
          throw new Error('No data received from API');
        }

        // Complete the progress bar
        setLoadingProgress(100);

        // Small delay before hiding the loading state
        setTimeout(() => {
          setLoading(false);
        }, 400);

      } catch (err) {
        console.error('Error fetching aircraft data:', err);

        // Log detailed error information for debugging
        console.log('API Endpoint:', apiEndpoint);
        console.log('Error details:', {
          message: err.message,
          response: err.response ? {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data
          } : 'No response',
          stack: err.stack
        });

        // Check if this is a network error (common in Cloudflare environment)
        if (err.message === 'Network Error' || err.code === 'ECONNABORTED') {
          console.error('Network error detected - likely a CORS or connectivity issue');
          setError(`Network error: Unable to connect to the API. This may be due to CORS restrictions or API unavailability.`);
          setLoading(false);
          return;
        }

        // Check if this is a future flight date error
        let errorMessage = 'An error occurred while fetching the aircraft data';

        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        // Check for specific error messages
        if (errorMessage.includes('FlightAware typically only has data for flights within')) {
          setError(`Flight information not available yet. FlightAware typically only provides aircraft data for flights within 7 days of departure.`);
        } else if (errorMessage.includes('aircraft assignment may not be finalized')) {
          setError(`Flight information not available yet. The aircraft assignment may not be finalized this far in advance.`);
        } else if (errorMessage.includes('API key not configured')) {
          setError(`API key not configured. Please check the server configuration.`);
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
          setError(`Error: ${errorMessage}. Please try again later or try a different API provider.`);
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
      <Box sx={{ textAlign: 'center', py: 6 }} className="fade-in">
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
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: theme.palette.mode === 'dark'
                ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)'
                : 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0) 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 0
            }}
          />
          <CircularProgress
            size={70}
            thickness={4}
            sx={{
              color: theme.palette.primary.main,
              position: 'relative',
              zIndex: 1,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 0 20px rgba(99, 102, 241, 0.3)'
                : '0 0 20px rgba(79, 70, 229, 0.2)'
            }}
          />
        </Box>

        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)'
                : 'linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Loading Aircraft Information
          </Typography>
        </Box>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: '80%',
            mx: 'auto',
            mb: 4
          }}
        >
          Retrieving data for flight {flightNumber} on {new Date(date).toLocaleDateString()}
          {apiProvider === 'flightaware' ? ' from FlightAware' : ' from AeroDataBox'}
        </Typography>

        <Box
          sx={{
            width: '100%',
            maxWidth: '400px',
            mx: 'auto',
            px: 2
          }}
        >
          <LinearProgress
            variant="determinate"
            value={loadingProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)'
                  : 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
              }
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textAlign: 'right',
              mt: 1,
              opacity: 0.7
            }}
          >
            {loadingProgress}% Complete
          </Typography>
        </Box>
      </Box>
    );
  } else if (error) {
    content = (
      <Box className="fade-in">
        <Alert
          severity="error"
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            '& .MuiAlert-icon': {
              fontSize: '2.5rem',
              opacity: 0.8
            },
            background: theme.palette.mode === 'dark'
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(239, 68, 68, 0.08)',
            border: theme.palette.mode === 'dark'
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: theme.palette.error.main,
              mb: 1
            }}
          >
            Unable to find aircraft information
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.8)'
                : 'rgba(0, 0, 0, 0.7)',
              lineHeight: 1.6
            }}
          >
            {error}
          </Typography>

          <Box mt={3}>
            <Button
              variant="contained"
              size="medium"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              className="modern-button"
              sx={{
                borderRadius: '10px',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)'
                  : 'linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(99, 102, 241, 0.4)'
                  : '0 4px 12px rgba(79, 70, 229, 0.3)',
                px: 3,
                py: 1,
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 16px rgba(99, 102, 241, 0.6)'
                    : '0 6px 16px rgba(79, 70, 229, 0.4)',
                }
              }}
            >
              Back to Search
            </Button>
          </Box>
        </Alert>
      </Box>
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
                    {/* First row of additional data */}
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

                    {/* Aircraft Owner/Operator Information */}
                    {aircraftData.aircraftOwner && aircraftData.aircraftOwner !== 'Not available' && (
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
                            Aircraft Owner
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {aircraftData.aircraftOwner}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {/* Flight Duration */}
                    {aircraftData.flightDuration && (
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
                            Flight Duration
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {aircraftData.flightDuration.scheduled !== 'Not available'
                              ? `${Math.floor(aircraftData.flightDuration.scheduled / 60)}h ${aircraftData.flightDuration.scheduled % 60}m`
                              : 'Not available'}
                          </Typography>
                          {aircraftData.flightDuration.actual !== 'Not available' && (
                            <Typography variant="body2" color="text.secondary">
                              Actual: {Math.floor(aircraftData.flightDuration.actual / 60)}h {aircraftData.flightDuration.actual % 60}m
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    )}

                    {/* Filed Route */}
                    {aircraftData.filedRoute && aircraftData.filedRoute !== 'Not available' && (
                      <Grid item xs={12}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            height: '100%'
                          }}
                        >
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Filed Route
                          </Typography>
                          <Typography variant="body1" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                            {aircraftData.filedRoute}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {/* In-flight Information */}
                    {aircraftData.status === 'In Air' && (
                      <>
                        {/* Flight Progress */}
                        {aircraftData.progress && aircraftData.progress !== 'Not available' && (
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
                                Flight Progress
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ width: '100%', mr: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={parseInt(aircraftData.progress)}
                                    sx={{ height: 10, borderRadius: 5 }}
                                  />
                                </Box>
                                <Box sx={{ minWidth: 35 }}>
                                  <Typography variant="body2" color="text.secondary">{`${Math.round(aircraftData.progress)}%`}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                        )}

                        {/* Current Speed */}
                        {aircraftData.speed && aircraftData.speed !== 'Not available' && (
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
                                Current Speed
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {aircraftData.speed} knots
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {/* Current Altitude */}
                        {aircraftData.altitude && aircraftData.altitude !== 'Not available' && (
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
                                Current Altitude
                              </Typography>
                              <Typography variant="h6" fontWeight={600}>
                                {aircraftData.altitude} ft
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {/* Last Updated */}
                        {aircraftData.lastUpdated && aircraftData.lastUpdated !== 'Not available' && (
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
                                Last Updated
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {formatDateTime(aircraftData.lastUpdated)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </>
                    )}

                    {/* Delay Information */}
                    {aircraftData.delayInfo && (
                      (aircraftData.delayInfo.departure !== 'Not available' ||
                       aircraftData.delayInfo.arrival !== 'Not available') && (
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
                              Delay Information
                            </Typography>
                            {aircraftData.delayInfo.departure !== 'Not available' && (
                              <Typography variant="body1" fontWeight={500}>
                                Departure: {Math.floor(aircraftData.delayInfo.departure / 60)}h {aircraftData.delayInfo.departure % 60}m
                              </Typography>
                            )}
                            {aircraftData.delayInfo.arrival !== 'Not available' && (
                              <Typography variant="body1" fontWeight={500}>
                                Arrival: {Math.floor(aircraftData.delayInfo.arrival / 60)}h {aircraftData.delayInfo.arrival % 60}m
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      )
                    )}

                    {/* Baggage Claim */}
                    {aircraftData.baggageClaim && aircraftData.baggageClaim !== 'Not available' && (
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
                            Baggage Claim
                          </Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {aircraftData.baggageClaim}
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
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            aria-label="back"
            sx={{
              mr: 2,
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
            <ArrowBackIcon />
          </IconButton>

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
              Flight Details
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
            Aircraft Information
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

      <Container maxWidth="md" sx={{ mt: { xs: 3, md: 5 }, mb: 8 }}>
        <Paper
          elevation={3}
          className="glass-morphism"
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 3,
          }}
        >
          <Box mb={5} className="fade-in">
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexWrap: 'wrap',
                gap: { xs: 1, sm: 2 },
                mb: 2
              }}
            >
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)'
                    : 'linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mr: 1
                }}
              >
                Flight {flightNumber}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexWrap: 'wrap'
                }}
              >
                <Chip
                  label={new Date(date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                  variant="outlined"
                  sx={{
                    fontWeight: 500,
                    borderRadius: '8px',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(99, 102, 241, 0.1)'
                      : 'rgba(79, 70, 229, 0.05)',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(99, 102, 241, 0.3)'
                      : 'rgba(79, 70, 229, 0.2)',
                  }}
                  icon={<AccessTimeIcon fontSize="small" />}
                />

                <Chip
                  label={apiProvider === 'flightaware' ? 'FlightAware Data' : 'AeroDataBox Data'}
                  size="small"
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    background: apiProvider === 'flightaware'
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'rgba(79, 70, 229, 0.1)'
                      : theme.palette.mode === 'dark'
                        ? 'rgba(236, 72, 153, 0.15)'
                        : 'rgba(219, 39, 119, 0.1)',
                    color: apiProvider === 'flightaware'
                      ? theme.palette.mode === 'dark'
                        ? '#818cf8'
                        : '#4f46e5'
                      : theme.palette.mode === 'dark'
                        ? '#f472b6'
                        : '#db2777',
                    border: apiProvider === 'flightaware'
                      ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.2)'}`
                      : `1px solid ${theme.palette.mode === 'dark' ? 'rgba(236, 72, 153, 0.3)' : 'rgba(219, 39, 119, 0.2)'}`,
                  }}
                />
              </Box>
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 3,
                maxWidth: { xs: '100%', sm: '90%', md: '80%' },
                lineHeight: 1.6
              }}
            >
              Detailed information about your flight and the assigned aircraft.
              All data is provided by {apiProvider === 'flightaware' ? 'FlightAware' : 'AeroDataBox'} API.
            </Typography>

            <Divider
              sx={{
                mb: 3,
                borderColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              }}
            />
          </Box>

          {content}
        </Paper>
      </Container>
    </Box>
  );
};

export default AircraftDetails;
