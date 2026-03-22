// @ts-nocheck
import React, { useState } from 'react';
import {
  Alert, Avatar, Box, Breadcrumbs, Button, Chip, CircularProgress, Container, Divider,
  FormControlLabel, IconButton, Link, Paper, Stack, Switch, Tab, Tabs, TextField, Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Cancel, Edit, Email, LocationOn, NavigateNext, Notifications, Person, Phone,
  PhotoCamera, Save, Security, StarBorder, VerifiedUser
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

const Profile: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const isDark = theme.palette.mode === 'dark';

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    watch,
  } = useForm({
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
  } = useForm({ resolver: yupResolver(passwordSchema) });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setIsEditing(false);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => resetPassword(),
  });

  const values = watch();
  const completion = Math.round(([
    values?.name, values?.email, values?.phone, values?.address?.city, values?.address?.country
  ].filter(Boolean).length / 5) * 100);

  const shellSx = {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    py: { xs: 4, md: 6 },
    background: isDark
      ? 'linear-gradient(135deg, #020617 0%, #111827 40%, #312e81 100%)'
      : 'linear-gradient(135deg, #eef6ff 0%, #eef2ff 42%, #fae8ff 100%)',
  };

  const panelSx = {
    borderRadius: { xs: 4, md: 5 },
    border: `1px solid ${isDark ? alpha('#e2e8f0', 0.08) : alpha('#0f172a', 0.08)}`,
    background: isDark
      ? `linear-gradient(180deg, ${alpha('#0f172a', 0.84)} 0%, ${alpha('#111827', 0.78)} 100%)`
      : `linear-gradient(180deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8fbff', 0.96)} 100%)`,
    backdropFilter: 'blur(18px)',
    boxShadow: isDark ? '0 24px 60px rgba(2, 6, 23, 0.44)' : '0 24px 60px rgba(15, 23, 42, 0.12)',
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: isDark ? alpha('#020617', 0.6) : alpha('#ffffff', 0.94),
      color: isDark ? '#f8fafc' : '#0f172a',
      '& fieldset': { borderColor: isDark ? alpha('#e2e8f0', 0.12) : alpha('#0f172a', 0.12) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.5) },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    },
    '& .MuiInputBase-input': { color: isDark ? '#f8fafc' : '#0f172a' },
    '& .MuiInputLabel-root': { color: isDark ? alpha('#e2e8f0', 0.78) : alpha('#0f172a', 0.62) },
    '& .MuiFormHelperText-root': { color: isDark ? alpha('#cbd5e1', 0.8) : '#64748b', ml: 0.5 },
  };

  const infoCards = [
    { icon: <Email fontSize="small" />, label: 'Email', value: values?.email || user?.email || 'Not added yet' },
    { icon: <Phone fontSize="small" />, label: 'Phone', value: values?.phone || user?.phone || 'Not added yet' },
    {
      icon: <LocationOn fontSize="small" />,
      label: 'Location',
      value: values?.address?.city ? `${values.address.city}${values.address.country ? `, ${values.address.country}` : ''}` : 'Not added yet',
    },
  ];

  return (
    <Box sx={shellSx}>
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: isDark
        ? 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 24%), radial-gradient(circle at 82% 14%, rgba(236, 72, 153, 0.16), transparent 22%)'
        : 'radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 24%), radial-gradient(circle at 82% 14%, rgba(236, 72, 153, 0.12), transparent 22%)' }} />
      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3, color: isDark ? alpha('#e2e8f0', 0.72) : '#64748b' }}>
          <Link underline="hover" color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</Link>
          <Typography color={isDark ? '#f8fafc' : '#0f172a'}>Profile</Typography>
        </Breadcrumbs>

        <Paper elevation={0} sx={{ ...panelSx, p: { xs: 3, md: 4 }, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Chip label="Premium Account Hub" icon={<StarBorder />} sx={{ mb: 2, borderRadius: 999, color: isDark ? '#e2e8f0' : '#1e293b', backgroundColor: isDark ? alpha('#38bdf8', 0.14) : alpha('#2563eb', 0.08) }} />
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: isDark ? '#f8fafc' : '#0f172a' }}>
                Profile settings with a refined, premium layout.
              </Typography>
              <Typography variant="h6" sx={{ maxWidth: 760, color: isDark ? alpha('#e2e8f0', 0.74) : '#475569', fontWeight: 500 }}>
                Manage your account details, security, and preferences in a cleaner dashboard with better readability.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Grid container spacing={2}>
                <Grid size={6}><Paper elevation={0} sx={{ p: 2, borderRadius: 3, textAlign: 'center', backgroundColor: isDark ? alpha('#ffffff', 0.06) : alpha('#ffffff', 0.72) }}><Typography variant="overline" sx={{ color: isDark ? alpha('#cbd5e1', 0.74) : '#64748b' }}>Completion</Typography><Typography variant="h4" sx={{ fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>{completion}%</Typography></Paper></Grid>
                <Grid size={6}><Paper elevation={0} sx={{ p: 2, borderRadius: 3, textAlign: 'center', backgroundColor: isDark ? alpha('#ffffff', 0.06) : alpha('#ffffff', 0.72) }}><Typography variant="overline" sx={{ color: isDark ? alpha('#cbd5e1', 0.74) : '#64748b' }}>Status</Typography><Typography variant="h6" sx={{ fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>Active</Typography></Paper></Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3.5}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper elevation={0} sx={{ ...panelSx, p: 3.25, height: '100%' }}>
              <Box sx={{ p: 3, borderRadius: 4, color: 'white', textAlign: 'center', background: 'linear-gradient(160deg, #0f172a 0%, #2563eb 46%, #ec4899 100%)' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <Avatar src={user?.avatar} sx={{ width: 112, height: 112, fontSize: '2.5rem', border: '3px solid rgba(255,255,255,0.24)' }}>
                    {values?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <IconButton component="label" sx={{ position: 'absolute', bottom: 0, right: -6, color: 'white', backgroundColor: alpha('#ffffff', 0.18) }}>
                    <PhotoCamera />
                    <input type="file" hidden accept="image/*" onChange={(e) => console.log('Upload avatar:', e.target.files?.[0])} />
                  </IconButton>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>{values?.name || user?.name}</Typography>
                <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.8), mb: 1.5 }}>{values?.email || user?.email}</Typography>
              </Box>

              <Stack spacing={1.5} sx={{ mt: 3 }}>
                {infoCards.map((item) => (
                  <Paper key={item.label} elevation={0} sx={{ p: 1.6, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.74) }}>
                    <Box sx={{ width: 38, height: 38, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: theme.palette.primary.main, backgroundColor: isDark ? alpha('#38bdf8', 0.12) : alpha('#2563eb', 0.08) }}>{item.icon}</Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#64748b' }}>{item.label}</Typography>
                      <Typography variant="body2" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>{item.value}</Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>

              <Paper elevation={0} sx={{ mt: 3, p: 2, borderRadius: 3, backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.74) }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75, color: isDark ? '#f8fafc' : '#0f172a' }}>Profile strength</Typography>
                <Box sx={{ height: 10, borderRadius: 999, backgroundColor: isDark ? alpha('#e2e8f0', 0.08) : alpha('#0f172a', 0.08), overflow: 'hidden', mb: 1 }}>
                  <Box sx={{ width: `${completion}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)' }} />
                </Box>
                <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.74) : '#475569' }}>Add a few more details to complete your profile.</Typography>
              </Paper>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper elevation={0} sx={{ ...panelSx, p: 3 }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth" TabIndicatorProps={{ style: { display: 'none' } }}
                sx={{ mb: 1, '& .MuiTabs-flexContainer': { gap: 1 }, '& .MuiTab-root': { minHeight: 54, borderRadius: 999, fontWeight: 800, color: isDark ? alpha('#e2e8f0', 0.72) : '#64748b', backgroundColor: isDark ? alpha('#ffffff', 0.04) : alpha('#ffffff', 0.68) }, '& .Mui-selected': { color: '#ffffff !important', background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)', boxShadow: '0 16px 30px rgba(99, 102, 241, 0.2)' } }}>
                <Tab label="Personal Info" />
                <Tab label="Security" />
                <Tab label="Preferences" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>Personal information</Typography>
                    <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.74) : '#64748b' }}>Update your main profile details from here.</Typography>
                  </Box>
                  {!isEditing ? (
                    <Button variant="contained" startIcon={<Edit />} onClick={() => setIsEditing(true)} sx={{ borderRadius: 999, px: 2.5, fontWeight: 800, background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)' }}>Edit Profile</Button>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" startIcon={<Cancel />} onClick={() => { resetProfile(); setIsEditing(false); }} sx={{ borderRadius: 999, fontWeight: 700 }}>Cancel</Button>
                      <Button type="submit" form="profile-form" variant="contained" startIcon={<Save />} disabled={updateProfileMutation.isPending} sx={{ borderRadius: 999, fontWeight: 800, background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)' }}>
                        {updateProfileMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
                      </Button>
                    </Stack>
                  )}
                </Box>

                {updateProfileMutation.error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }}>{updateProfileMutation.error.message}</Alert>}
                {updateProfileMutation.isSuccess && <Alert severity="success" sx={{ mb: 2.5, borderRadius: 3 }}>Profile updated successfully!</Alert>}

                <Box component="form" id="profile-form" onSubmit={handleProfileSubmit((data) => updateProfileMutation.mutate(data))}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Full Name" disabled={!isEditing} InputProps={{ startAdornment: <Person sx={{ mr: 1 }} /> }} sx={fieldSx} {...registerProfile('name')} error={!!profileErrors.name} helperText={profileErrors.name?.message} /></Grid>
                    <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Email Address" type="email" disabled={!isEditing} InputProps={{ startAdornment: <Email sx={{ mr: 1 }} /> }} sx={fieldSx} {...registerProfile('email')} error={!!profileErrors.email} helperText={profileErrors.email?.message} /></Grid>
                    <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Phone Number" disabled={!isEditing} InputProps={{ startAdornment: <Phone sx={{ mr: 1 }} /> }} sx={fieldSx} {...registerProfile('phone')} error={!!profileErrors.phone} helperText={profileErrors.phone?.message} /></Grid>
                    <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Country" disabled={!isEditing} InputProps={{ startAdornment: <LocationOn sx={{ mr: 1 }} /> }} sx={fieldSx} {...registerProfile('address.country')} error={!!profileErrors.address?.country} helperText={profileErrors.address?.country?.message} /></Grid>
                    <Grid size={{ xs: 12 }}><TextField fullWidth label="Street Address" disabled={!isEditing} sx={fieldSx} {...registerProfile('address.street')} error={!!profileErrors.address?.street} helperText={profileErrors.address?.street?.message} /></Grid>
                    <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="City" disabled={!isEditing} sx={fieldSx} {...registerProfile('address.city')} error={!!profileErrors.address?.city} helperText={profileErrors.address?.city?.message} /></Grid>
                    <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="State / Province" disabled={!isEditing} sx={fieldSx} {...registerProfile('address.state')} error={!!profileErrors.address?.state} helperText={profileErrors.address?.state?.message} /></Grid>
                    <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth label="ZIP / Postal Code" disabled={!isEditing} sx={fieldSx} {...registerProfile('address.zipCode')} error={!!profileErrors.address?.zipCode} helperText={profileErrors.address?.zipCode?.message} /></Grid>
                  </Grid>
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 1, color: isDark ? '#f8fafc' : '#0f172a' }}>Password and security</Typography>
                    <Typography variant="body2" sx={{ mb: 3, color: isDark ? alpha('#cbd5e1', 0.74) : '#64748b' }}>Update your password and review basic account security here.</Typography>
                    {changePasswordMutation.error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 3 }}>{changePasswordMutation.error.message}</Alert>}
                    {changePasswordMutation.isSuccess && <Alert severity="success" sx={{ mb: 2.5, borderRadius: 3 }}>Password changed successfully!</Alert>}
                    <Box component="form" onSubmit={handlePasswordSubmit((data) => changePasswordMutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword }))}>
                      <Stack spacing={2}>
                        <TextField fullWidth label="Current Password" type="password" InputProps={{ startAdornment: <Security sx={{ mr: 1 }} /> }} sx={fieldSx} {...registerPassword('currentPassword')} error={!!passwordErrors.currentPassword} helperText={passwordErrors.currentPassword?.message} />
                        <TextField fullWidth label="New Password" type="password" sx={fieldSx} {...registerPassword('newPassword')} error={!!passwordErrors.newPassword} helperText={passwordErrors.newPassword?.message} />
                        <TextField fullWidth label="Confirm New Password" type="password" sx={fieldSx} {...registerPassword('confirmPassword')} error={!!passwordErrors.confirmPassword} helperText={passwordErrors.confirmPassword?.message} />
                        <Button type="submit" variant="contained" disabled={changePasswordMutation.isPending} sx={{ mt: 1, py: 1.4, borderRadius: 999, fontWeight: 800, background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)' }}>
                          {changePasswordMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Change Password'}
                        </Button>
                      </Stack>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, height: '100%', color: isDark ? '#f8fafc' : '#0f172a', backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.72) }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>Security tips</Typography>
                      <Stack spacing={1.2}>
                        {[
                          'Use a strong password with letters, numbers, and symbols.',
                          'Avoid reusing the same password across multiple services.',
                          'Always sign out after using a shared device.',
                        ].map((tip) => (
                          <Box key={tip} sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
                            <VerifiedUser sx={{ fontSize: 18, color: theme.palette.primary.main, mt: 0.3 }} />
                            <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.76) : '#475569' }}>{tip}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, height: '100%', backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.72) }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: isDark ? '#f8fafc' : '#0f172a' }}>Notification preferences</Typography>
                      <Stack spacing={1.25}>
                        <FormControlLabel control={<Switch defaultChecked />} label="Email notifications" />
                        <FormControlLabel control={<Switch />} label="SMS notifications" />
                        <FormControlLabel control={<Switch defaultChecked />} label="Event updates" />
                        <FormControlLabel control={<Switch defaultChecked />} label="Booking confirmations" />
                        <FormControlLabel control={<Switch />} label="Marketing emails" />
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, height: '100%', backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.72) }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: isDark ? '#f8fafc' : '#0f172a' }}>Privacy settings</Typography>
                      <Stack spacing={1.25}>
                        <FormControlLabel control={<Switch defaultChecked />} label="Make profile public" />
                        <FormControlLabel control={<Switch />} label="Show email to other users" />
                        <FormControlLabel control={<Switch defaultChecked />} label="Allow event recommendations" />
                      </Stack>
                      <Divider sx={{ my: 2.5 }} />
                      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                        <Notifications sx={{ color: theme.palette.primary.main, mt: 0.3 }} />
                        <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.76) : '#475569' }}>
                          Review how your profile is shown and how recommendations are personalized.
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile;
