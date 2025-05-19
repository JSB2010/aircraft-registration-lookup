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

        // Check if the response is HTML (Cloudflare Pages might return HTML instead of JSON)
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          console.error('Received HTML response instead of JSON');
          throw new Error('API endpoint returned HTML instead of JSON. This may indicate a routing issue with Cloudflare Pages.');
        }

        console.log('Health data:', response.data);
        setHealthData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error checking health:', err);
        setError(`Error checking API health: ${err.message}`);
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
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
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
