// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowOutward,
  CalendarToday,
  LocationOn,
  People,
  Search as SearchIcon,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesAPI, eventsAPI } from '../services/api';
import { Event } from '../types/event';
import EventCardActions from '../components/common/EventCardActions';

const Home: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);

  const isDark = theme.palette.mode === 'dark';

  const { data: featuredData } = useQuery({
    queryKey: ['featured-events'],
    queryFn: () => eventsAPI.getFeatured(),
  });

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

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  });

  const featuredEvents = featuredData?.data?.events ?? [];
  const allEvents = eventsData?.data?.events ?? [];
  const categories = categoriesData?.data?.categories ?? [];
  const uniqueCities = new Set(
    allEvents
      .map((event: Event) => event?.venue?.address?.city)
      .filter(Boolean)
  ).size;

  const heroStats = [
    { label: 'Live events', value: eventsData?.data?.pagination?.total || allEvents.length || 0 },
    { label: 'Categories', value: categories.length || 0 },
    { label: 'Cities covered', value: uniqueCities || 0 },
  ];

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

  const getEventSummary = (event: Event) => {
    const summary = event?.shortDescription || event?.description || 'A memorable event experience is waiting for you.';
    return summary.length > 108 ? `${summary.slice(0, 108)}...` : summary;
  };

  const sectionPanelSx = {
    borderRadius: { xs: 4, md: 5 },
    border: `1px solid ${isDark ? alpha('#e2e8f0', 0.08) : alpha('#0f172a', 0.08)}`,
    background: isDark
      ? `linear-gradient(180deg, ${alpha('#0f172a', 0.82)} 0%, ${alpha('#111827', 0.74)} 100%)`
      : `linear-gradient(180deg, ${alpha('#ffffff', 0.88)} 0%, ${alpha('#f8fbff', 0.96)} 100%)`,
    backdropFilter: 'blur(18px)',
    boxShadow: isDark ? '0 22px 60px rgba(2, 6, 23, 0.4)' : '0 22px 60px rgba(15, 23, 42, 0.12)',
  };

  const heroFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: isDark ? alpha('#020617', 0.55) : alpha('#ffffff', 0.94),
      color: isDark ? '#f8fafc' : '#0f172a',
      '& fieldset': {
        borderColor: isDark ? alpha('#e2e8f0', 0.14) : alpha('#0f172a', 0.12),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.48),
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiInputBase-input': {
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    '& .MuiInputBase-input::placeholder': {
      color: isDark ? alpha('#e2e8f0', 0.72) : alpha('#0f172a', 0.48),
      opacity: 1,
    },
    '& .MuiInputLabel-root': {
      color: isDark ? alpha('#e2e8f0', 0.78) : alpha('#0f172a', 0.6),
    },
    '& .MuiInputAdornment-root, & .MuiSvgIcon-root': {
      color: isDark ? alpha('#f8fafc', 0.78) : alpha('#0f172a', 0.64),
    },
  };

  const eventCardSx = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    borderRadius: 4,
    overflow: 'hidden',
    border: `1px solid ${alpha('#0f172a', 0.06)}`,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.96) 100%)',
    color: '#0f172a',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
    transition: 'transform 0.28s ease, box-shadow 0.28s ease',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 26px 52px rgba(15, 23, 42, 0.18)',
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(135deg, #020617 0%, #111827 40%, #312e81 100%)'
          : 'linear-gradient(135deg, #eef6ff 0%, #eef2ff 42%, #fae8ff 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: isDark
            ? 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.15), transparent 24%), radial-gradient(circle at 85% 14%, rgba(236, 72, 153, 0.16), transparent 20%)'
            : 'radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 26%), radial-gradient(circle at 85% 14%, rgba(236, 72, 153, 0.14), transparent 22%)',
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', pt: { xs: 4, md: 7 }, pb: { xs: 6, md: 10 } }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <Paper elevation={0} sx={{ ...sectionPanelSx, p: { xs: 3, md: 4 } }}>
            <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Chip
                  label="Curated Event Discovery"
                  icon={<Star />}
                  sx={{
                    mb: 2,
                    borderRadius: 999,
                    px: 1,
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    backgroundColor: isDark ? alpha('#38bdf8', 0.14) : alpha('#2563eb', 0.1),
                    '& .MuiChip-icon': { color: '#f59e0b' },
                  }}
                />
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4.6rem' },
                    lineHeight: 0.98,
                    fontWeight: 950,
                    letterSpacing: '-0.04em',
                    mb: 2,
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                >
                  Discover events that feel worth showing up for.
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    maxWidth: 650,
                    color: isDark ? alpha('#e2e8f0', 0.76) : '#475569',
                    mb: 3.5,
                    fontWeight: 500,
                  }}
                >
                  Browse events with cleaner filters, faster favorites, and a polished experience across light and dark mode.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3.5 }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowOutward />}
                    onClick={() => {
                      const upcomingSection = document.getElementById('upcoming-events');
                      upcomingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    sx={{
                      px: 3,
                      py: 1.35,
                      borderRadius: 999,
                      fontWeight: 800,
                      background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)',
                      boxShadow: '0 18px 35px rgba(99, 102, 241, 0.24)',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #0284c7 0%, #4f46e5 55%, #db2777 100%)',
                      },
                    }}
                  >
                    Explore Upcoming
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/favorites')}
                    sx={{
                      px: 3,
                      py: 1.35,
                      borderRadius: 999,
                      fontWeight: 800,
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderColor: isDark ? alpha('#e2e8f0', 0.18) : alpha('#0f172a', 0.12),
                      backgroundColor: isDark ? alpha('#ffffff', 0.04) : alpha('#ffffff', 0.7),
                    }}
                  >
                    View Favorites
                  </Button>
                </Stack>

                <Grid container spacing={2}>
                  {heroStats.map((stat) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: `1px solid ${isDark ? alpha('#e2e8f0', 0.08) : alpha('#0f172a', 0.06)}`,
                          backgroundColor: isDark ? alpha('#0f172a', 0.5) : alpha('#ffffff', 0.78),
                        }}
                      >
                        <Typography variant="overline" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#64748b' }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>
                          {stat.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: 4,
                    border: `1px solid ${isDark ? alpha('#e2e8f0', 0.09) : alpha('#0f172a', 0.07)}`,
                    background: isDark
                      ? `linear-gradient(180deg, ${alpha('#020617', 0.74)} 0%, ${alpha('#0f172a', 0.64)} 100%)`
                      : `linear-gradient(180deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#f8fbff', 0.94)} 100%)`,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: isDark ? '#f8fafc' : '#0f172a' }}>
                    Find your next plan
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: isDark ? alpha('#cbd5e1', 0.74) : '#64748b' }}>
                    Search by event name, category, and location to quickly narrow down upcoming events.
                  </Typography>

                  <Box component="form" onSubmit={handleSearch}>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        placeholder="Search events, artists, experiences..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={heroFieldSx}
                      />

                      <FormControl fullWidth sx={heroFieldSx}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          label="Category"
                        >
                          <MenuItem value="">All Categories</MenuItem>
                          {categories.map((category: any) => (
                            <MenuItem key={category._id} value={category._id}>
                              {category?.name || 'Unnamed'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        placeholder="Enter city or venue"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn />
                            </InputAdornment>
                          ),
                        }}
                        sx={heroFieldSx}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        sx={{
                          mt: 1,
                          py: 1.45,
                          borderRadius: 999,
                          fontWeight: 800,
                          background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #0284c7 0%, #4f46e5 55%, #db2777 100%)',
                          },
                        }}
                      >
                        Search Events
                      </Button>
                    </Stack>
                  </Box>

                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {featuredEvents.length > 0 && (
          <Box sx={{ mt: { xs: 5, md: 7 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2.5 }}>
              <Box>
                <Typography variant="overline" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#64748b' }}>
                  Spotlight
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>
                  Featured events
                </Typography>
              </Box>
              <Chip
                label={`${featuredEvents.length} handpicked`}
                icon={<Star />}
                sx={{
                  borderRadius: 999,
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  backgroundColor: isDark ? alpha('#ffffff', 0.06) : alpha('#ffffff', 0.68),
                }}
              />
            </Box>

            <Grid container spacing={3}>
              {featuredEvents.map((event: Event) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={event._id}>
                  <Card sx={eventCardSx} onClick={() => handleEventClick(event._id)}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia component="img" height="220" image={getEventImage(event)} alt={event?.title || 'Event'} />
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(180deg, rgba(15,23,42,0) 20%, rgba(15,23,42,0.72) 100%)',
                        }}
                      />
                      <Stack direction="row" spacing={1} sx={{ position: 'absolute', left: 16, right: 16, bottom: 16, flexWrap: 'wrap' }}>
                        <Chip
                          label={event?.category?.name || 'Uncategorized'}
                          size="small"
                          sx={{
                            bgcolor: event?.category?.color || '#0f172a',
                            color: 'white',
                            fontWeight: 700,
                          }}
                        />
                        <Chip
                          label="Featured"
                          size="small"
                          icon={<Star sx={{ color: '#facc15 !important' }} />}
                          sx={{
                            bgcolor: alpha('#0f172a', 0.76),
                            color: 'white',
                            fontWeight: 700,
                          }}
                        />
                      </Stack>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: '#0f172a' }}>
                        {event?.title || 'Untitled Event'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', mb: 2.25, minHeight: 42 }}>
                        {getEventSummary(event)}
                      </Typography>

                      <Stack spacing={1.1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday fontSize="small" sx={{ color: '#64748b' }} />
                          <Typography variant="body2" sx={{ color: '#334155' }}>
                            {formatDate(event?.dateTime?.start)} at {formatTime(event?.dateTime?.start)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn fontSize="small" sx={{ color: '#64748b' }} />
                          <Typography variant="body2" sx={{ color: '#334155' }}>
                            {event?.venue?.address?.city || 'Unknown City'}, {event?.venue?.address?.country || 'Unknown Country'}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, gap: 1.5, alignItems: 'center' }}>
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
                          borderRadius: 999,
                          fontWeight: 800,
                          background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)',
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
        )}

        <Box id="upcoming-events" sx={{ mt: { xs: 5, md: 7 } }}>
          <Paper elevation={0} sx={{ ...sectionPanelSx, p: { xs: 2.5, md: 3.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="overline" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#64748b' }}>
                  Fresh picks
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>
                  Upcoming events
                </Typography>
              </Box>
              <Chip
                label="Updated with filters"
                icon={<TrendingUp />}
                sx={{
                  borderRadius: 999,
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  backgroundColor: isDark ? alpha('#ffffff', 0.06) : alpha('#ffffff', 0.7),
                }}
              />
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                Failed to load events. Please try again.
              </Alert>
            )}

            {eventsLoading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 4,
                        backgroundColor: isDark ? alpha('#0f172a', 0.52) : alpha('#ffffff', 0.86),
                      }}
                    >
                      <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3, mb: 2 }} />
                      <Skeleton variant="text" height={34} width="70%" />
                      <Skeleton variant="text" height={24} />
                      <Skeleton variant="text" height={24} width="55%" />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <>
                <Grid container spacing={3}>
                  {allEvents.map((event: Event) => (
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={event._id}>
                      <Card sx={eventCardSx} onClick={() => handleEventClick(event._id)}>
                        <CardMedia component="img" height="220" image={getEventImage(event)} alt={event?.title || 'Event'} />

                        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
                            <Chip
                              label={event?.category?.name || 'Uncategorized'}
                              size="small"
                              sx={{
                                bgcolor: event?.category?.color || '#64748b',
                                color: 'white',
                                fontWeight: 700,
                              }}
                            />
                            {event?.pricing?.tiers?.length > 0 && (
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                From ${event?.pricing?.tiers?.[0]?.price ?? 0}
                              </Typography>
                            )}
                          </Box>

                          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, color: '#0f172a' }}>
                            {event?.title || 'Untitled Event'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569', mb: 2.25, minHeight: 42 }}>
                            {getEventSummary(event)}
                          </Typography>

                          <Stack spacing={1.05}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarToday fontSize="small" sx={{ color: '#64748b' }} />
                              <Typography variant="body2" sx={{ color: '#334155' }}>
                                {formatDate(event?.dateTime?.start)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn fontSize="small" sx={{ color: '#64748b' }} />
                              <Typography variant="body2" sx={{ color: '#334155' }}>
                                {event?.venue?.address?.city || 'Unknown City'}
                              </Typography>
                            </Box>
                            {event?.pricing?.tiers?.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <People fontSize="small" sx={{ color: '#64748b' }} />
                                <Typography variant="body2" sx={{ color: '#334155' }}>
                                  Flexible pricing available
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>

                        <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, gap: 1.5, alignItems: 'center' }}>
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
                              borderRadius: 999,
                              fontWeight: 800,
                              background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)',
                            }}
                          >
                            View Details
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

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
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
