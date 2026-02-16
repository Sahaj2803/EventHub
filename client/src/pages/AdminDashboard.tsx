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
  LinearProgress,
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
  AdminPanelSettings,
  Add,
  PersonAdd,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI, bookingsAPI, usersAPI, categoriesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');

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

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => eventsAPI.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setDeleteDialogOpen(false);
      setAnchorEl(null);
      setSelectedItem(null);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => usersAPI.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteDialogOpen(false);
      setAnchorEl(null);
      setSelectedItem(null);
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      usersAPI.updateRole(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setRoleDialogOpen(false);
      setAnchorEl(null);
      setSelectedItem(null);
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: any, type: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem({ ...item, type });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleDeleteItem = () => {
    if (selectedItem) {
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleConfirmDelete = () => {
    if (selectedItem) {
      if (selectedItem.type === 'event') {
        deleteEventMutation.mutate(selectedItem._id);
      } else if (selectedItem.type === 'user') {
        deleteUserMutation.mutate(selectedItem._id);
      }
    }
  };

  const handleChangeRole = () => {
    if (selectedItem) {
      setNewRole(selectedItem.role);
      setRoleDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleConfirmRoleChange = () => {
    if (selectedItem) {
      updateUserRoleMutation.mutate({
        userId: selectedItem._id,
        role: newRole,
      });
    }
  };

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
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage users, events, and system settings
          </Typography>
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
                      {bookingsData?.data.pagination.totalBookings || 0}
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
                      ${userStats?.data.totalRevenue || 0}
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
                      ${userStats?.data.platformRevenue || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Platform Revenue (50%)
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
                      ${userStats?.data.organizerRevenue || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Organizer Revenue (50%)
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
                      ${userStats?.data.totalRevenue ? (userStats.data.totalRevenue / Math.max(userStats.data.totalTicketsSold, 1)).toFixed(2) : 0}
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
            variant="fullWidth"
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  User Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/admin/users/create')}
                >
                  Add User
                </Button>
              </Box>

              {usersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
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
                      {usersData?.data.users.map((user: any) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar src={user.avatar} sx={{ mr: 2, width: 40, height: 40 }}>
                                {user.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {user.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {user._id.slice(-8)}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Event Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/events/create')}
                >
                  Create Event
                </Button>
              </Box>

              {eventsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
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
                      {eventsData?.data.events.map((event: any) => (
                        <TableRow key={event._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {event.title}
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
                              {formatDate(event.dateTime.start)}
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
                              {event.capacity.sold}
                              {event.capacity.total && ` / ${event.capacity.total}`}
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
                <TableContainer>
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
                      {bookingsData?.data.bookings.map((booking: any) => (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {booking.bookingReference}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {booking.event.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {booking.attendeeInfo.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.attendeeInfo.email}
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
                              {formatDate(booking.createdAt)}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Category Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/admin/categories/create')}
                >
                  Add Category
                </Button>
              </Box>

              <Grid container spacing={2}>
                {categoriesData?.data.categories.map((category: any) => (
                  <Grid item xs={12} sm={6} md={4} key={category._id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                          {category.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.eventCount} events
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
              <MenuItem onClick={() => navigate(`/admin/users/${selectedItem._id}`)}>
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
              <MenuItem onClick={() => navigate(`/admin/categories/${selectedItem._id}/edit`)}>
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
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this {selectedItem?.type}? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              disabled={deleteEventMutation.isPending || deleteUserMutation.isPending}
            >
              {(deleteEventMutation.isPending || deleteUserMutation.isPending) ? (
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
          onClose={() => setRoleDialogOpen(false)}
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
            <Button onClick={() => setRoleDialogOpen(false)}>
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
      </Container>
    </Box>
  );
};

export default AdminDashboard;
