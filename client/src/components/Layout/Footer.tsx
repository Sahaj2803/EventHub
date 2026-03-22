import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="footer"
      sx={{
        color: isDark ? theme.palette.text.primary : theme.palette.text.secondary,
        py: { xs: 5, md: 6 },
        mt: 'auto',
        background: isDark ? 'rgba(15, 20, 40, 0.4)' : 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(10px)',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(148, 163, 184, 0.18)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                background: isDark
                  ? 'linear-gradient(90deg, #ffffff, #c7b9ff, #ffb6d9)'
                  : 'linear-gradient(90deg, #312e81, #2563eb, #db2777)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              EventHub
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9, maxWidth: 280 }}>
              Your destination for discovering, saving, and managing standout event experiences.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <IconButton color="inherit" size="small"><Facebook /></IconButton>
              <IconButton color="inherit" size="small"><Twitter /></IconButton>
              <IconButton color="inherit" size="small"><Instagram /></IconButton>
              <IconButton color="inherit" size="small"><LinkedIn /></IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/events" color="inherit" underline="hover">Browse Events</Link>
              <Link href="/events/create" color="inherit" underline="hover">Create Event</Link>
              <Link href="/about" color="inherit" underline="hover">About Us</Link>
              <Link href="/contact" color="inherit" underline="hover">Contact</Link>
              <Link href="/help" color="inherit" underline="hover">Help Center</Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Popular Categories
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/events?category=music" color="inherit" underline="hover">Music & Concerts</Link>
              <Link href="/events?category=sports" color="inherit" underline="hover">Sports</Link>
              <Link href="/events?category=technology" color="inherit" underline="hover">Technology</Link>
              <Link href="/events?category=business" color="inherit" underline="hover">Business</Link>
              <Link href="/events?category=education" color="inherit" underline="hover">Education</Link>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Contact Info
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email fontSize="small" />
                <Typography variant="body2">support@eventhub.com</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" />
                <Typography variant="body2">+1 (555) 123-4567</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn fontSize="small" sx={{ mt: 0.5 }} />
                <Typography variant="body2">
                  123 Event Street
                  <br />
                  New York, NY 10001
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.24)' }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.8, textAlign: 'center' }}>
            Copyright {currentYear} EventHub. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 3 }, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/privacy" color="inherit" underline="hover" variant="body2">Privacy Policy</Link>
            <Link href="/terms" color="inherit" underline="hover" variant="body2">Terms of Service</Link>
            <Link href="/cookies" color="inherit" underline="hover" variant="body2">Cookie Policy</Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
