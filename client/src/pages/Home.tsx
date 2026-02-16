// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Search as SearchIcon,
  LocationOn,
  CalendarToday,
  People,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventsAPI, categoriesAPI } from '../services/api';
import { Event } from '../types/event';
import EventCardActions from '../components/common/EventCardActions';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);

  // Fetch featured events
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-events'],
    queryFn: () => eventsAPI.getFeatured(),
  });

  // Fetch all events with filters
  const { data: eventsData, isLoading: eventsLoading, error } = useQuery({
    queryKey: ['events', { page, search: searchQuery, category: selectedCategory, location }],
    queryFn: () =>
      eventsAPI.getAll({
        page,
        limit: 12,
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        location: location || undefined,
        upcoming: true,
      }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventImage = (event: Event) => {
    const primaryImage = event?.images?.find((img) => img.isPrimary);
    return primaryImage?.url || event?.images?.[0]?.url || '/placeholder-event.jpg';
  };

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 45%, #ec4899 100%)' }}>
      {/* Hero Section */}
      <Box sx={{ color: 'white', py: 10, textAlign: 'center' }}>
        <Container maxWidth="md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 900,
                background: 'linear-gradient(90deg, #fff, #e9d5ff, #fbcfe8)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent'
              }}
            >
              <motion.span
                animate={{ scale: [1, 1.03, 1], textShadow: ['0 0 0px rgba(49, 185, 153, 0.6)', '0 0 18px rgba(255, 255, 255, 0.9)', '0 0 0px rgba(204, 13, 45, 0.6)'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                Discover Amazing Events
              </motion.span>
            </Typography>
            <Typography variant="h5" sx={{ mb: 8, opacity: 0.99 }}>
              Find and book tickets for the best events in your area
            </Typography>
          </motion.div>

          {/* Search Form */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
          <Box component="form" onSubmit={handleSearch} sx={{ maxWidth: 900, mx: 'auto' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                      
                    ),
                  }}
                  sx={{ bgcolor: 'white', borderRadius: 1 }}
                />
              </Grid>
              <Grid xs={12} md={3}>
                <FormControl fullWidth sx={{ bgcolor: 'white', borderRadius: 1 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categoriesData?.data?.categories?.map((category: any) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category?.name || 'Unnamed'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: 'white', borderRadius: 1 }}
                />
              </Grid>
              <Grid xs={12} md={2}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{
                    background: 'linear-gradient(90deg, #38bdf8, #a78bfa, #f472b6)',
                    '&:hover': { background: 'linear-gradient(90deg, #22d3ee, #c084fc, #fb7185)' },
                    height: '56px',
                    borderRadius: 2,
                    boxShadow: '0 12px 24px rgba(0,0,0,0.25)'
                  }}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Box>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Featured Events */}
        {(featuredData?.data?.events?.length ?? 0) > 0 ? (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Star sx={{ color: 'warning.main', mr: 1 }} />
              <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: 'white' }}>
                Featured Events
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {(featuredData?.data?.events ?? []).map((event: Event) => (
                <Grid xs={12} sm={6} md={4} key={event._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      borderRadius: 4,
                      overflow: 'hidden',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                      background: 'linear-gradient(160deg, rgba(255,255,255,0.96), rgba(255,255,255,0.92))',
                      '&:hover': { transform: 'translateY(-6px) scale(1.01)', boxShadow: '0 30px 60px rgba(0,0,0,0.35)' },
                    }}
                    onClick={() => handleEventClick(event._id)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={getEventImage(event)}
                      alt={event?.title || 'Event'}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={event?.category?.name || 'Uncategorized'}
                          size="small"
                          sx={{
                            bgcolor: event?.category?.color || 'grey',
                            color: 'white',
                            mr: 1,
                          }}
                        />
                        {event?.featured && (
                          <Chip label="Featured" size="small" color="warning" icon={<Star />} />
                        )}
                      </Box>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 800 }}>
                        {event?.title || 'Untitled Event'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {event?.shortDescription || event?.description?.substring(0, 100) || ''}...
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatDate(event?.dateTime?.start)} at {formatTime(event?.dateTime?.start)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">
                          {event?.venue?.address?.city || 'Unknown City'},{' '}
                          {event?.venue?.address?.country || ''}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between', alignItems: 'center' }}>
                      <EventCardActions
                        eventId={event._id}
                        title={event?.title || 'Event'}
                        image={getEventImage(event)}
                        categoryName={event?.category?.name}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event._id);
                        }}
                        sx={{
                          background: 'linear-gradient(90deg, #38bdf8, #a78bfa, #f472b6)',
                          '&:hover': { background: 'linear-gradient(90deg, #22d3ee, #c084fc, #fb7185)' },
                          borderRadius: 2
                        }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 1 }} />
                <Skeleton variant="text" height={32} />
                <Skeleton variant="text" />
              </Grid>
            ))}
          </Grid>
        )}

        {/* All Events */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrendingUp sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h4" component="h2" sx={{ fontWeight: 900, color: 'white' }}>
              Upcoming Events
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Failed to load events. Please try again.
            </Alert>
          )}

          {eventsLoading ? (
            <Grid container spacing={3}>
              {Array.from({ length: 9 }).map((_, i) => (
                <Grid xs={12} sm={6} md={4} key={i}>
                  <Box>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 1 }} />
                    <Skeleton variant="text" height={32} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              <Grid container spacing={3}>
                {eventsData?.data?.events?.map((event: Event) => (
                  <Grid xs={12} sm={6} md={4} key={event._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        borderRadius: 4,
                        overflow: 'hidden',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.96), rgba(255,255,255,0.92))',
                        '&:hover': { transform: 'translateY(-6px) scale(1.01)', boxShadow: '0 30px 60px rgba(0,0,0,0.35)' },
                      }}
                      onClick={() => handleEventClick(event._id)}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={getEventImage(event)}
                        alt={event?.title || 'Event'}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip
                            label={event?.category?.name || 'Uncategorized'}
                            size="small"
                            sx={{
                              bgcolor: event?.category?.color || 'grey',
                              color: 'white',
                            }}
                          />
                        </Box>
                        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 800 }}>
                          {event?.title || 'Untitled Event'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {event?.shortDescription || event?.description?.substring(0, 100) || ''}...
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatDate(event?.dateTime?.start)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">
                            {event?.venue?.address?.city || 'Unknown City'}
                          </Typography>
                        </Box>
                        {event?.pricing?.tiers?.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <People fontSize="small" color="action" />
                            <Typography variant="body2">
                              From ${event?.pricing?.tiers?.[0]?.price ?? 0}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between', alignItems: 'center' }}>
                        <EventCardActions
                          eventId={event._id}
                          title={event?.title || 'Event'}
                          image={getEventImage(event)}
                          categoryName={event?.category?.name}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event._id);
                          }}
                          sx={{
                            background: 'linear-gradient(90deg, #38bdf8, #a78bfa, #f472b6)',
                            '&:hover': { background: 'linear-gradient(90deg, #22d3ee, #c084fc, #fb7185)' },
                            borderRadius: 2
                          }}
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {(eventsData?.data?.pagination?.totalPages ?? 0) > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={eventsData?.data?.pagination?.totalPages ?? 1}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
