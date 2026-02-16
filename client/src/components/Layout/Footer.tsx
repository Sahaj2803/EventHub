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

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        color: 'text.primary',
        py: 6,
        mt: 'auto',
        background: 'rgba(15, 20, 40, 0.4)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold',
              background: 'linear-gradient(90deg, #ffffff, #c7b9ff, #ffb6d9)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              EventHub
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Your premier destination for discovering and managing events.
              Connect with amazing experiences and create unforgettable memories.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton color="inherit" size="small">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" size="small">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" size="small">
                <Instagram />
              </IconButton>
              <IconButton color="inherit" size="small">
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/events" color="inherit" underline="hover">
                Browse Events
              </Link>
              <Link href="/events/create" color="inherit" underline="hover">
                Create Event
              </Link>
              <Link href="/about" color="inherit" underline="hover">
                About Us
              </Link>
              <Link href="/contact" color="inherit" underline="hover">
                Contact
              </Link>
              <Link href="/help" color="inherit" underline="hover">
                Help Center
              </Link>
            </Box>
          </Grid>

          {/* Categories */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Popular Categories
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/events?category=music" color="inherit" underline="hover">
                Music & Concerts
              </Link>
              <Link href="/events?category=sports" color="inherit" underline="hover">
                Sports
              </Link>
              <Link href="/events?category=technology" color="inherit" underline="hover">
                Technology
              </Link>
              <Link href="/events?category=business" color="inherit" underline="hover">
                Business
              </Link>
              <Link href="/events?category=education" color="inherit" underline="hover">
                Education
              </Link>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Contact Info
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email fontSize="small" />
                <Typography variant="body2">
                  support@eventhub.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" />
                <Typography variant="body2">
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn fontSize="small" sx={{ mt: 0.5 }} />
                <Typography variant="body2">
                  123 Event Street<br />
                  New York, NY 10001
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, bgcolor: 'rgba(255,255,255,0.12)' }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © {currentYear} EventHub. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="/privacy" color="inherit" underline="hover" variant="body2">
              Privacy Policy
            </Link>
            <Link href="/terms" color="inherit" underline="hover" variant="body2">
              Terms of Service
            </Link>
            <Link href="/cookies" color="inherit" underline="hover" variant="body2">
              Cookie Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
