// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
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
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Breadcrumbs,
  Link,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Search as SearchIcon,
  LocationOn,
  CalendarToday,
  People,
  FilterList,
  ViewList,
  ViewModule,
  NavigateNext,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { eventsAPI, categoriesAPI } from '../services/api';
import { Event } from '../types/event';
import EventCardActions from '../components/common/EventCardActions';

const Events: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  );
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch events with filters
  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['events', { page, search: searchQuery, category: selectedCategory, location, sortBy, sortOrder }],
    queryFn: () => eventsAPI.getAll({
      page,
      limit: 12,
      search: searchQuery || undefined,
      category: selectedCategory || undefined,
      location: location || undefined,
      sortBy,
      sortOrder,
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
    updateURL();
  };

  const handleFilterChange = () => {
    setPage(1);
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (location) params.set('location', location);
    if (sortBy !== 'dateTime.start') params.set('sortBy', sortBy);
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder);
    if (page > 1) params.set('page', page.toString());
    
    setSearchParams(params);
  };

  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventImage = (event: Event) => {
    const primaryImage = event.images.find(img => img.isPrimary);
    return primaryImage?.url || event.images[0]?.url || '/placeholder-event.jpg';
  };

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'grid' | 'list' | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            Home
          </Link>
          <Typography color="text.primary">Events</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Discover Events
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Find amazing events happening near you
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box component="form" onSubmit={handleSearch}>
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
                />
              </Grid>
              <Grid xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      handleFilterChange();
                    }}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categoriesData?.data.categories.map((category: any) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
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
                  onChange={(e) => {
                    setLocation(e.target.value);
                    handleFilterChange();
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid xs={12} md={2}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Additional Filters */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    handleFilterChange();
                  }}
                  label="Sort By"
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="title">Title</MenuItem>
                  <MenuItem value="createdAt">Newest</MenuItem>
                  <MenuItem value="views">Popularity</MenuItem>
                </Select>
              </FormControl>

              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={(e, newOrder) => {
                  if (newOrder !== null) {
                    setSortOrder(newOrder);
                    handleFilterChange();
                  }
                }}
                size="small"
              >
                <ToggleButton value="asc">Asc</ToggleButton>
                <ToggleButton value="desc">Desc</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="grid">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Paper>

        {/* Results */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load events. Please try again.
          </Alert>
        )}

        {isLoading ? (
          <>
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
          </>
        ) : (
          <>
            {/* Results Count */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" color="text.secondary">
                {eventsData?.data.pagination.totalEvents || 0} events found
              </Typography>
            </Box>

            {/* Events Grid/List */}
            <Grid container spacing={3}>
              {eventsData?.data.events.map((event: Event) => (
                <Grid xs={12} sm={viewMode === 'list' ? 12 : 6} md={viewMode === 'list' ? 12 : 4} key={event._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: viewMode === 'list' ? 'row' : 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' },
                    }}
                    onClick={() => handleEventClick(event._id)}
                  >
                    <CardMedia
                      component="img"
                      height={viewMode === 'list' ? 200 : 200}
                      width={viewMode === 'list' ? 300 : '100%'}
                      image={getEventImage(event)}
                      alt={event.title}
                      sx={{
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={event.category.name}
                          size="small"
                          sx={{
                            bgcolor: event.category.color,
                            color: 'white',
                            mr: 1,
                          }}
                        />
                        {event.featured && (
                          <Chip
                            label="Featured"
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {event.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: viewMode === 'list' ? 2 : 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {event.shortDescription || event.description.substring(0, 150)}...
                      </Typography>
                      
                      <Box sx={{ mt: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatDate(event.dateTime.start)} at {formatTime(event.dateTime.start)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">
                            {event.venue.address.city}, {event.venue.address.country}
                          </Typography>
                        </Box>
                        {event.pricing.tiers.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <People fontSize="small" color="action" />
                            <Typography variant="body2">
                              From ${event.pricing.tiers[0].price}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between', alignItems: 'center' }}>
                      <EventCardActions
                        eventId={event._id}
                        title={event.title}
                        image={getEventImage(event)}
                        categoryName={event.category.name}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event._id);
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
            {(eventsData?.data.pagination.totalPages ?? 0) > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={eventsData?.data.pagination.totalPages ?? 1}
                  page={page}
                  onChange={(_, newPage) => {
                    setPage(newPage);
                    updateURL();
                  }}
                  color="primary"
                  size="large"
                />
              </Box>
            )}

            {/* No Results */}
            {eventsData?.data.events.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" gutterBottom>
                  No events found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Try adjusting your search criteria or browse all events
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setLocation('');
                    setPage(1);
                    updateURL();
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Events;
