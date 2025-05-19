import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Button } from '@mui/material';
import axios from 'axios';
import { Link } from 'react-router-dom';

const HealthCheck = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the base API URL from environment variable or use the current domain
        const baseApiUrl = process.env.REACT_APP_API_URL || '/api';
        const healthEndpoint = `${baseApiUrl}/health`;

        console.log('Checking health at:', healthEndpoint);
        console.log('Environment:', {
          NODE_ENV: process.env.NODE_ENV,
          REACT_APP_API_URL: process.env.REACT_APP_API_URL
        });

        // First, try a direct fetch request to the API
        try {
          // Use a cache-busting query parameter to avoid caching issues
          const timestamp = new Date().getTime();
          const fetchResponse = await fetch(`${healthEndpoint}?t=${timestamp}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });

          console.log('Fetch response status:', fetchResponse.status);
          console.log('Fetch response type:', fetchResponse.headers.get('content-type'));

          // Try to parse the response as JSON regardless of content type
          try {
            const text = await fetchResponse.text();
            console.log('Fetch response text (first 100 chars):', text.substring(0, 100));

            // Try to parse as JSON
            try {
              const data = JSON.parse(text);
              console.log('Successfully parsed JSON data:', data);
              setHealthData(data);
              setLoading(false);
              return;
            } catch (jsonError) {
              console.error('Failed to parse response as JSON:', jsonError);
              if (text.includes('<!doctype html>')) {
                console.error('Response appears to be HTML instead of JSON');
                throw new Error('API endpoint returned HTML instead of JSON. This indicates a routing issue with Cloudflare Pages.');
              }
            }
          } catch (textError) {
            console.error('Failed to get response text:', textError);
          }

          console.log('Fetch response is not valid JSON, falling back to axios');
        } catch (fetchError) {
          console.error('Fetch request failed, falling back to axios:', fetchError);
        }

        // Fall back to axios if fetch fails
        const response = await axios.get(healthEndpoint, {
          timeout: 10000, // 10 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          validateStatus: status => status < 500 // Accept any status code less than 500
        });

        console.log('Health check response:', response.status);
        console.log('Health data type:', typeof response.data);
        console.log('Response headers:', response.headers);

        // Check if the response is HTML (Cloudflare Pages might return HTML instead of JSON)
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          console.error('Received HTML response instead of JSON');
          throw new Error('API endpoint returned HTML instead of JSON. This may indicate a routing issue with Cloudflare Pages. Try accessing the API directly at ' + healthEndpoint);
        }

        console.log('Health data:', response.data);
        setHealthData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error checking health:', err);

        // Create a more helpful error message
        let errorMessage = `Error checking API health: ${err.message}`;

        // Add troubleshooting information
        errorMessage += '\n\nTroubleshooting steps:';
        errorMessage += '\n1. Check if the API endpoint is correctly configured in Cloudflare Pages';
        errorMessage += '\n2. Verify that environment variables (API keys) are set in Cloudflare Pages';
        errorMessage += '\n3. Check browser console for more detailed error information';

        setError(errorMessage);
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    // Split error message by newlines to display as separate paragraphs
    const errorLines = error.split('\n');

    return (
      <Alert
        severity="error"
        sx={{
          mb: 3,
          '& .MuiAlert-message': {
            whiteSpace: 'pre-line'
          }
        }}
      >
        {errorLines.map((line, index) => (
          <Typography
            key={`error-line-${index}-${line.substring(0, 10)}`}
            variant={index === 0 ? "subtitle1" : "body2"}
            gutterBottom
          >
            {line}
          </Typography>
        ))}

        <Box mt={2}>
          <Button
            variant="outlined"
            size="small"
            color="error"
            component="a"
            href="/api/health"
            target="_blank"
            sx={{ mr: 1 }}
          >
            Try Direct API Access
          </Button>

          <Button
            variant="outlined"
            size="small"
            component={Link}
            to="/"
          >
            Back to Home
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>API Health Status</Typography>

      {healthData ? (
        <Box>
          <Typography variant="body1">
            <strong>Status:</strong> {healthData.status}
          </Typography>
          <Typography variant="body1">
            <strong>Message:</strong> {healthData.message}
          </Typography>
          <Typography variant="body1">
            <strong>Version:</strong> {healthData.version}
          </Typography>
          <Typography variant="body1">
            <strong>Timestamp:</strong> {healthData.timestamp}
          </Typography>

          <Box mt={2}>
            <Typography variant="h6">API Configuration</Typography>
            <Typography variant="body1">
              <strong>AeroDataBox API:</strong> {healthData.apis.aerodatabox}
            </Typography>
            <Typography variant="body1">
              <strong>FlightAware API:</strong> {healthData.apis.flightaware}
            </Typography>
          </Box>

          {healthData.request && (
            <Box mt={2}>
              <Typography variant="h6">Request Information</Typography>
              <Typography variant="body1">
                <strong>URL:</strong> {healthData.request.url}
              </Typography>
              <Typography variant="body1">
                <strong>Method:</strong> {healthData.request.method}
              </Typography>
              <Typography variant="body1">
                <strong>Host:</strong> {healthData.request.headers.host}
              </Typography>
              <Typography variant="body1">
                <strong>Origin:</strong> {healthData.request.headers.origin || 'Not available'}
              </Typography>
            </Box>
          )}

          <Box mt={3}>
            <Button component={Link} to="/" variant="contained" color="primary">
              Back to Search
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography>No health data available</Typography>
      )}
    </Paper>
  );
};

export default HealthCheck;
