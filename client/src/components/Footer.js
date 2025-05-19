import React, { useContext } from 'react';
import { Box, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import GitHubIcon from '@mui/icons-material/GitHub';
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
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          © {new Date().getFullYear()} Future Flight Aircraft Lookup
        </Typography>
        
        <Tooltip title="Toggle light/dark mode">
          <IconButton onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="View source code">
          <IconButton 
            color="inherit" 
            component="a" 
            href="https://github.com/yourusername/aircraft-register" 
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Typography variant="caption" color="text.secondary">
        Powered by AeroDataBox API • Not for commercial use
      </Typography>
    </Box>
  );
};

export default Footer;
