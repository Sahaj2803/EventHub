import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  IconButton,
  Paper,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Delete, NavigateNext } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNavigate } from 'react-router-dom';

const Favorites: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { favorites, removeFavorite, clearFavorites, loading, error } = useFavorites();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const items = Object.values(favorites);

  const handleRemoveFavorite = async (eventId: string) => {
    setRemovingId(eventId);
    try {
      await removeFavorite(eventId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearFavorites = async () => {
    setClearing(true);
    try {
      await clearFavorites();
    } finally {
      setClearing(false);
    }
  };

  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #020617 0%, #111827 40%, #312e81 100%)'
          : 'linear-gradient(135deg, #eef6ff 0%, #eef2ff 42%, #fae8ff 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="/"
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
          >
            Home
          </Link>
          <Typography color="text.primary">Favorites</Typography>
        </Breadcrumbs>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.25, md: 3 },
            mb: 3,
            borderRadius: 4,
            border: `1px solid ${isDark ? alpha('#e2e8f0', 0.08) : alpha('#0f172a', 0.08)}`,
            background: isDark
              ? `linear-gradient(180deg, ${alpha('#0f172a', 0.84)} 0%, ${alpha('#111827', 0.78)} 100%)`
              : `linear-gradient(180deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8fbff', 0.96)} 100%)`,
          }}
        >
        <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>Saved Events</Typography>
            <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.74) : '#64748b' }}>
              Keep track of events you want to revisit later.
            </Typography>
          </Box>
          {items.length > 0 && (
            <Button 
              color="error" 
              onClick={handleClearFavorites}
              disabled={clearing}
              startIcon={clearing ? <CircularProgress size={20} /> : null}
            >
              {clearing ? 'Clearing...' : 'Clear All'}
            </Button>
          )}
        </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" gutterBottom>No favorites yet</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Tap the heart icon on any event to save it here.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/events')}>Browse Events</Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {items.map((ev) => (
              <Grid item xs={12} sm={6} md={4} key={ev._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4, overflow: 'hidden' }}>
                  <CardMedia component="img" height="180" image={ev.image || '/placeholder-event.jpg'} alt={ev.title} />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {ev.categoryName || 'Event'}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }} gutterBottom>
                      {ev.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                      <Button variant="contained" onClick={() => navigate(`/events/${ev._id}`)} sx={{ borderRadius: 999 }}>
                        View
                      </Button>
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemoveFavorite(ev._id)}
                        disabled={removingId === ev._id}
                      >
                        {removingId === ev._id ? <CircularProgress size={20} /> : <Delete />}
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Favorites;


