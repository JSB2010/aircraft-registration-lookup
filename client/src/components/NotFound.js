import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Paper, Container, Box, Fade } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import AirplanemodeActiveIcon from '@mui/icons-material/AirplanemodeActive';

const NotFound = () => {
  return (
    <Container maxWidth="md" sx={{ mt: { xs: 6, md: 12 } }}>
      <Fade in={true} timeout={800}>
        <Paper
          elevation={3}
          className="glass-morphism"
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Box className="fade-in">
            <AirplanemodeActiveIcon
              sx={{
                fontSize: 40,
                mb: 2,
                transform: 'rotate(45deg)',
                color: 'primary.main',
                opacity: 0.7
              }}
            />
            <ErrorOutlineIcon
              sx={{
                fontSize: { xs: 60, md: 80 },
                color: 'error.main',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.2))'
              }}
            />

            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '2.5rem' },
                background: 'linear-gradient(45deg, #ef4444 30%, #f87171 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              404 - Page Not Found
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: '80%', mx: 'auto' }}
            >
              The page you're looking for doesn't exist or has been moved.
            </Typography>

            <Button
              component={Link}
              to="/"
              variant="contained"
              color="primary"
              startIcon={<HomeIcon />}
              sx={{
                mt: 2,
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
                }
              }}
            >
              Back to Home
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default NotFound;
