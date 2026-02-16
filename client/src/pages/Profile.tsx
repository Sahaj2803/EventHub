// @ts-nocheck
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  NavigateNext,
  Person,
  Email,
  Phone,
  LocationOn,
  Notifications,
  Security,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../services/api';
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const profileSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  phone: yup.string().optional(),
  address: yup.object({
    street: yup.string().optional(),
    city: yup.string().optional(),
    state: yup.string().optional(),
    zipCode: yup.string().optional(),
    country: yup.string().optional(),
  }),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().required('New password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required('Please confirm your password'),
});

type ProfileFormData = yup.InferType<typeof profileSchema>;
type PasswordFormData = yup.InferType<typeof passwordSchema>;

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setValue: setProfileValue,
    watch: watchProfile,
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || '',
      },
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => authAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setIsEditing(false);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authAPI.changePassword(data),
    onSuccess: () => {
      resetPassword();
    },
  });

  const handleProfileUpdate = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handlePasswordChange = (data: PasswordFormData) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const handleCancelEdit = () => {
    resetProfile();
    setIsEditing(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Implement avatar upload functionality
      console.log('Upload avatar:', file);
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
          <Typography color="text.primary">Profile</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Profile Settings
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your account information and preferences
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Profile Summary */}
            <Grid xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  src={user?.avatar}
                  sx={{ width: 120, height: 120, mx: 'auto' }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                  component="label"
                >
                  <PhotoCamera />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </IconButton>
              </Box>
              
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {user?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Chip
                label={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                color="primary"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Account Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">
                    {user?.email}
                  </Typography>
                </Box>
                {user?.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">
                      {user.phone}
                    </Typography>
                  </Box>
                )}
                {user?.address?.city && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">
                      {user.address.city}, {user.address.country}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Profile Settings */}
          <Grid xs={12} md={8}>
            <Paper elevation={2}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
              >
                <Tab label="Personal Information" />
                <Tab label="Security" />
                <Tab label="Preferences" />
              </Tabs>

              {/* Personal Information Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Personal Information
                    </Typography>
                    {!isEditing ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          form="profile-form"
                          variant="contained"
                          startIcon={<Save />}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <CircularProgress size={20} />
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {updateProfileMutation.error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {updateProfileMutation.error.message}
                    </Alert>
                  )}

                  {updateProfileMutation.isSuccess && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      Profile updated successfully!
                    </Alert>
                  )}

                  <Box component="form" id="profile-form" onSubmit={handleProfileSubmit(handleProfileUpdate)}>
                    <Grid container spacing={3}>
                      <Grid xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                        {...registerProfile('name')}
                        error={!!profileErrors.name}
                        helperText={profileErrors.name?.message}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        {...registerProfile('email')}
                        error={!!profileErrors.email}
                        helperText={profileErrors.email?.message}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        {...registerProfile('phone')}
                        error={!!profileErrors.phone}
                        helperText={profileErrors.phone?.message}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Country"
                        {...registerProfile('address.country')}
                        error={!!profileErrors.address?.country}
                        helperText={profileErrors.address?.country?.message}
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />,
                        }}
                      />
                    </Grid>
                    <Grid xs={12}>
                      <TextField
                        fullWidth
                        label="Street Address"
                        {...registerProfile('address.street')}
                        error={!!profileErrors.address?.street}
                        helperText={profileErrors.address?.street?.message}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="City"
                        {...registerProfile('address.city')}
                        error={!!profileErrors.address?.city}
                        helperText={profileErrors.address?.city?.message}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="State/Province"
                        {...registerProfile('address.state')}
                        error={!!profileErrors.address?.state}
                        helperText={profileErrors.address?.state?.message}
                        disabled={!isEditing}
                      />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="ZIP/Postal Code"
                        {...registerProfile('address.zipCode')}
                        error={!!profileErrors.address?.zipCode}
                        helperText={profileErrors.address?.zipCode?.message}
                        disabled={!isEditing}
                      />
                    </Grid>
                  </Grid>
                  </Box>
                </Box>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Change Password
                  </Typography>
                  
                  {changePasswordMutation.error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {changePasswordMutation.error.message}
                    </Alert>
                  )}

                  {changePasswordMutation.isSuccess && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      Password changed successfully!
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handlePasswordSubmit(handlePasswordChange)}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Password"
                          type="password"
                          {...registerPassword('currentPassword')}
                          error={!!passwordErrors.currentPassword}
                          helperText={passwordErrors.currentPassword?.message}
                          InputProps={{
                            startAdornment: <Security sx={{ mr: 1, color: 'action.active' }} />,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="New Password"
                          type="password"
                          {...registerPassword('newPassword')}
                          error={!!passwordErrors.newPassword}
                          helperText={passwordErrors.newPassword?.message}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          type="password"
                          {...registerPassword('confirmPassword')}
                          error={!!passwordErrors.confirmPassword}
                          helperText={passwordErrors.confirmPassword?.message}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? (
                            <CircularProgress size={20} />
                          ) : (
                            'Change Password'
                          )}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </TabPanel>

              {/* Preferences Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Notification Preferences
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="SMS Notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Event Updates"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Booking Confirmations"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Marketing Emails"
                    />
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Privacy Settings
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Make profile public"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="Show email to other users"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Allow event recommendations"
                    />
                  </Box>
                </Box>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile;
