import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  MoreVert,
  Edit,
  Delete,
  Visibility,
  TrendingUp,
  People,
  AttachMoney,
  CalendarToday,
  NavigateNext,
  Event,
  BookOnline,
  Add,
  PersonAdd,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI, bookingsAPI, usersAPI, categoriesAPI } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [categoryForm, setCategoryForm] = useState({
    _id: '',
    name: '',
    description: '',
    color: '#3B82F6',
  });

  // Fetch admin statistics
  const { data: userStats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: () => usersAPI.getStats(),
  });

  // Fetch all events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => eventsAPI.getAll({ limit: 50 }),
  });

  // Fetch all users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersAPI.getAll({ limit: 50 }),
  });

  // Fetch all bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => bookingsAPI.getAll({ limit: 50 }),
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesAPI.getAll(),
  });

  const refreshAdminData = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
  };

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => eventsAPI.delete(eventId),
    onSuccess: () => {
      refreshAdminData();
      setDeleteDialogOpen(false);
      setAnchorEl(null);
      setSelectedItem(null);
      setFeedback({ type: 'success', message: 'Event deleted successfully.' });
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete event.'
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.delete(userId),
    onSuccess: () => {
      refreshAdminData();
      setDeleteDialogOpen(false);
      setAnchorEl(null);
      setSelectedItem(null);
      setFeedback({ type: 'success', message: 'User deleted successfully.' });
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete user.'
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => categoriesAPI.delete(categoryId),
    onSuccess: () => {
      refreshAdminData();
      setDeleteDialogOpen(false);
      setAnchorEl(null);
      setSelectedItem(null);
      setFeedback({ type: 'success', message: 'Category deleted successfully.' });
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete category.'
      });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      usersAPI.updateRole(userId, { role }),
    onSuccess: () => {
      refreshAdminData();
      setRoleDialogOpen(false);
      setAnchorEl(null);
      setSelectedItem(null);
      setFeedback({ type: 'success', message: 'User role updated successfully.' });
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update user role.'
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: typeof newUser) => usersAPI.create(payload),
    onSuccess: () => {
      refreshAdminData();
      setAddUserDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
      setFeedback({ type: 'success', message: 'User created successfully.' });
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create user.'
      });
    },
  });

  const resetStatsMutation = useMutation({
    mutationFn: () => usersAPI.resetStats(),
    onSuccess: () => {
      refreshAdminData();
      setResetDialogOpen(false);
      setFeedback({ type: 'success', message: 'Admin stats reset successfully.' });
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to reset admin stats.'
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (payload: { name: string; description: string; color: string }) => categoriesAPI.create(payload),
    onSuccess: () => {
      refreshAdminData();
      setCategoryDialogOpen(false);
      setCategoryForm({
        _id: '',
        name: '',
        description: '',
        color: '#3B82F6',
      });
      setFeedback({ type: 'success', message: 'Category created successfully.' });
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create category.'
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (payload: { _id: string; name: string; description: string; color: string }) =>
      categoriesAPI.update(payload._id, {
        name: payload.name,
        description: payload.description,
        color: payload.color,
      }),
    onSuccess: () => {
      refreshAdminData();
      setCategoryDialogOpen(false);
      setSelectedItem(null);
      setCategoryForm({
        _id: '',
        name: '',
        description: '',
        color: '#3B82F6',
      });
      setFeedback({ type: 'success', message: 'Category updated successfully.' });
    },
    onError: (error: any) => {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update category.'
      });
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: any, type: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem({ ...item, type });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteItem = () => {
    if (selectedItem) {
      setDeleteDialogOpen(true);
    }
    setAnchorEl(null);
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      if (selectedItem.type === 'event') {
        deleteEventMutation.mutate(selectedItem._id);
      } else if (selectedItem.type === 'user') {
        deleteUserMutation.mutate(selectedItem._id);
      } else if (selectedItem.type === 'category') {
        deleteCategoryMutation.mutate(selectedItem._id);
      }
    }
  };

  const handleChangeRole = () => {
    if (selectedItem) {
      setNewRole(selectedItem.role);
      setRoleDialogOpen(true);
    }
    setAnchorEl(null);
  };

  const handleConfirmRoleChange = () => {
    if (selectedItem) {
      updateUserRoleMutation.mutate({
        userId: selectedItem._id,
        role: newRole,
      });
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const closeRoleDialog = () => {
    setRoleDialogOpen(false);
    setSelectedItem(null);
  };

  const closeViewUserDialog = () => {
    setViewUserDialogOpen(false);
    setSelectedItem(null);
  };

  const handleCreateUser = () => {
    createUserMutation.mutate(newUser);
  };

  const openViewUserDialog = () => {
    setViewUserDialogOpen(true);
    setAnchorEl(null);
  };

  const openCreateCategoryDialog = () => {
    setCategoryForm({
      _id: '',
      name: '',
      description: '',
      color: '#3B82F6',
    });
    setCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = () => {
    if (!selectedItem) return;

    setCategoryForm({
      _id: selectedItem._id,
      name: selectedItem.name || '',
      description: selectedItem.description || '',
      color: selectedItem.color || '#3B82F6',
    });
    setCategoryDialogOpen(true);
    setAnchorEl(null);
  };

  const closeCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setSelectedItem(null);
    setCategoryForm({
      _id: '',
      name: '',
      description: '',
      color: '#3B82F6',
    });
  };

  const handleCategorySubmit = () => {
    if (categoryForm._id) {
      updateCategoryMutation.mutate(categoryForm);
      return;
    }

    createCategoryMutation.mutate({
      name: categoryForm.name,
      description: categoryForm.description,
      color: categoryForm.color,
    });
  };

  const formatCurrency = (value: number) => `$${Number(value || 0).toFixed(2)}`;

  const users = usersData?.data?.users ?? [];
  const events = eventsData?.data?.events ?? [];
  const bookings = bookingsData?.data?.bookings ?? [];
  const categories = categoriesData?.data?.categories ?? [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'confirmed':
      case 'paid':
        return 'success';
      case 'draft':
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'failed':
        return 'error';
      case 'completed':
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
          <Typography color="text.primary">Admin Dashboard</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '2rem', md: '3rem' } }}>
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage users, events, and system settings
          </Typography>
        </Box>

        {feedback && (
          <Alert
            severity={feedback.type}
            sx={{ mb: 3 }}
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="warning"
            onClick={() => setResetDialogOpen(true)}
            fullWidth={isMobile}
          >
            Reset Admin Stats
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {userStats?.data.totalUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <Event />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {eventsData?.data.pagination.totalEvents || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Events
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <BookOnline />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {userStats?.data.totalBookings || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Bookings
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <AttachMoney />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(userStats?.data.totalRevenue || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Revenue Breakdown Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(userStats?.data.platformRevenue || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Platform Revenue (70%)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(userStats?.data.organizerRevenue || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Organizer Revenue (30%)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <BookOnline />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {userStats?.data.totalTicketsSold || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tickets Sold
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <CalendarToday />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(userStats?.data.avgTicketPrice || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. Ticket Price
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Admin Tabs */}
        <Paper elevation={2}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons="auto"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Users" />
            <Tab label="Events" />
            <Tab label="Bookings" />
            <Tab label="Categories" />
          </Tabs>

          {/* Users Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  User Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setAddUserDialogOpen(true)}
                  fullWidth={isMobile}
                >
                  Add User
                </Button>
              </Box>

              {usersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Joined</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user: any) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar src={user.avatar} sx={{ mr: 2, width: 40, height: 40 }}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {user?.name || 'Unnamed User'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {user?._id?.slice(-8) || 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {user.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              color={user.role === 'admin' ? 'error' : user.role === 'organizer' ? 'warning' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(user.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.isVerified ? 'Verified' : 'Unverified'}
                              color={user.isVerified ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, user, 'user')}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          {/* Events Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Event Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/events/create')}
                  fullWidth={isMobile}
                >
                  Create Event
                </Button>
              </Box>

              {eventsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Event</TableCell>
                        <TableCell>Organizer</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Tickets Sold</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {events.map((event: any) => (
                        <TableRow key={event._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {event?.title || 'Deleted Event'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                              {event?.category?.name || "No Category"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                            {event?.organizer?.name || "No Organizer"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {event?.dateTime?.start ? formatDate(event.dateTime.start) : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={event.status}
                              color={getStatusColor(event.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {event?.capacity?.sold || 0}
                              {event?.capacity?.total ? ` / ${event.capacity.total}` : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, event, 'event')}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          {/* Bookings Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Booking Management
              </Typography>

              {bookingsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Booking ID</TableCell>
                        <TableCell>Event</TableCell>
                        <TableCell>Attendee</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookings.map((booking: any) => (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {booking?.bookingReference || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {booking?.event?.title || 'Deleted Event'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {booking?.attendeeInfo?.name || 'Unknown Attendee'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking?.attendeeInfo?.email || 'No email'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              ${booking.totalAmount}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={booking.status}
                              color={getStatusColor(booking.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {booking?.createdAt ? formatDate(booking.createdAt) : 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          {/* Categories Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Category Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openCreateCategoryDialog}
                  fullWidth={isMobile}
                >
                  Add Category
                </Button>
              </Box>

              <Grid container spacing={2}>
                {categories.map((category: any) => (
                  <Grid item xs={12} sm={6} md={4} key={category._id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1.5,
                            mb: 2,
                          }}
                        >
                          <Chip
                            label={category.name}
                            sx={{
                              bgcolor: category.color,
                              color: 'white',
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, category, 'category')}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {category.description || 'No description'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.eventCount || 0} events
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </TabPanel>
        </Paper>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {selectedItem?.type === 'event' && (
            <>
              <MenuItem onClick={() => navigate(`/events/${selectedItem._id}`)}>
                <Visibility sx={{ mr: 1 }} />
                View Event
              </MenuItem>
              <MenuItem onClick={() => navigate(`/events/${selectedItem._id}/edit`)}>
                <Edit sx={{ mr: 1 }} />
                Edit Event
              </MenuItem>
              <MenuItem onClick={handleDeleteItem} sx={{ color: 'error.main' }}>
                <Delete sx={{ mr: 1 }} />
                Delete Event
              </MenuItem>
            </>
          )}
          {selectedItem?.type === 'user' && (
            <>
              <MenuItem onClick={openViewUserDialog}>
                <Visibility sx={{ mr: 1 }} />
                View Profile
              </MenuItem>
              <MenuItem onClick={handleChangeRole}>
                <Edit sx={{ mr: 1 }} />
                Change Role
              </MenuItem>
              <MenuItem onClick={handleDeleteItem} sx={{ color: 'error.main' }}>
                <Delete sx={{ mr: 1 }} />
                Delete User
              </MenuItem>
            </>
          )}
          {selectedItem?.type === 'category' && (
            <>
              <MenuItem onClick={openEditCategoryDialog}>
                <Edit sx={{ mr: 1 }} />
                Edit Category
              </MenuItem>
              <MenuItem onClick={handleDeleteItem} sx={{ color: 'error.main' }}>
                <Delete sx={{ mr: 1 }} />
                Delete Category
              </MenuItem>
            </>
          )}
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={closeDeleteDialog}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this {selectedItem?.type}? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              disabled={deleteEventMutation.isPending || deleteUserMutation.isPending || deleteCategoryMutation.isPending}
            >
              {(deleteEventMutation.isPending || deleteUserMutation.isPending || deleteCategoryMutation.isPending) ? (
                <CircularProgress size={20} />
              ) : (
                'Delete'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Role Change Dialog */}
        <Dialog
          open={roleDialogOpen}
          onClose={closeRoleDialog}
        >
          <DialogTitle>Change User Role</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>New Role</InputLabel>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                label="New Role"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="organizer">Organizer</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeRoleDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRoleChange}
              variant="contained"
              disabled={updateUserRoleMutation.isPending}
            >
              {updateUserRoleMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                'Change Role'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={addUserDialogOpen}
          onClose={() => setAddUserDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New User</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <TextField
                label="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="organizer">Organizer</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              variant="contained"
              disabled={
                createUserMutation.isPending ||
                !newUser.name.trim() ||
                !newUser.email.trim() ||
                !newUser.password.trim()
              }
            >
              {createUserMutation.isPending ? <CircularProgress size={20} /> : 'Create User'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={viewUserDialogOpen}
          onClose={closeViewUserDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>User Details</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 1.5, mt: 1 }}>
              <Typography><strong>Name:</strong> {selectedItem?.name || 'N/A'}</Typography>
              <Typography><strong>Email:</strong> {selectedItem?.email || 'N/A'}</Typography>
              <Typography><strong>Role:</strong> {selectedItem?.role || 'N/A'}</Typography>
              <Typography><strong>Phone:</strong> {selectedItem?.phone || 'N/A'}</Typography>
              <Typography><strong>Status:</strong> {selectedItem?.isVerified ? 'Verified' : 'Unverified'}</Typography>
              <Typography><strong>Joined:</strong> {selectedItem?.createdAt ? formatDate(selectedItem.createdAt) : 'N/A'}</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeViewUserDialog}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={categoryDialogOpen}
          onClose={closeCategoryDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{categoryForm._id ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <TextField
                label="Category Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                multiline
                rows={4}
                fullWidth
              />
              <TextField
                label="Color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, color: e.target.value }))}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCategoryDialog}>Cancel</Button>
            <Button
              onClick={handleCategorySubmit}
              variant="contained"
              disabled={
                createCategoryMutation.isPending ||
                updateCategoryMutation.isPending ||
                !categoryForm.name.trim() ||
                !categoryForm.description.trim()
              }
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending)
                ? <CircularProgress size={20} />
                : (categoryForm._id ? 'Update Category' : 'Create Category')}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={resetDialogOpen}
          onClose={() => setResetDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Reset Admin Stats</DialogTitle>
          <DialogContent>
            <Typography>
              This will reset the summary counters for bookings, revenue, tickets sold, and average ticket price. Existing records will remain available in the tables.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => resetStatsMutation.mutate()}
              color="warning"
              variant="contained"
              disabled={resetStatsMutation.isPending}
            >
              {resetStatsMutation.isPending ? <CircularProgress size={20} /> : 'Reset'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
