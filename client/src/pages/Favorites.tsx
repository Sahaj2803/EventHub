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
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Delete, NavigateNext } from '@mui/icons-material';
import { useFavorites } from '../contexts/FavoritesContext';
import { useNavigate } from 'react-router-dom';

const Favorites: React.FC = () => {
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
    <Box sx={{ py: 6 }}>
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

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Saved Events</Typography>
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
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia component="img" height="180" image={ev.image || '/placeholder-event.jpg'} alt={ev.title} />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {ev.categoryName || 'Event'}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }} gutterBottom>
                      {ev.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button variant="contained" onClick={() => navigate(`/events/${ev._id}`)}>View</Button>
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


