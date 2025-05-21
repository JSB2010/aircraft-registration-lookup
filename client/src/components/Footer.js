import React, { useContext } from 'react';
import { Box, Typography, IconButton, Tooltip, useTheme, Divider } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import GitHubIcon from '@mui/icons-material/GitHub';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import { ColorModeContext } from '../App';

const Footer = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        textAlign: 'center',
        borderTop: theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.08)'
          : '1px solid rgba(0, 0, 0, 0.08)',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.8))'
          : 'linear-gradient(rgba(248, 250, 252, 0), rgba(248, 250, 252, 0.8))',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          gap: { xs: 1, sm: 2 }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            background: theme.palette.mode === 'dark'
              ? 'rgba(99, 102, 241, 0.1)'
              : 'rgba(79, 70, 229, 0.05)',
            px: 2,
            py: 0.5,
            borderRadius: '20px',
            mb: { xs: 1, sm: 0 }
          }}
        >
          <FlightTakeoffIcon
            sx={{
              fontSize: '0.9rem',
              mr: 1,
              color: theme.palette.primary.main
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #6366f1 30%, #818cf8 90%)'
                : 'linear-gradient(45deg, #4f46e5 30%, #6366f1 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Future Flight
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Aircraft Lookup
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Toggle light/dark mode">
            <IconButton
              onClick={colorMode.toggleColorMode}
              color="inherit"
              size="small"
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
              {theme.palette.mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="View source code">
            <IconButton
              color="inherit"
              component="a"
              href="https://github.com/JSB2010/aircraft-registration-lookup"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
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
              <GitHubIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider
        sx={{
          width: '60px',
          mx: 'auto',
          my: 1.5,
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
        }}
      />

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'inline-block',
          px: 1.5,
          py: 0.5,
          borderRadius: '12px',
          background: theme.palette.mode === 'dark'
            ? 'rgba(99, 102, 241, 0.08)'
            : 'rgba(79, 70, 229, 0.05)',
        }}
      >
        Powered by FlightAware API • AeroDataBox API available as backup
      </Typography>
    </Box>
  );
};

export default Footer;
