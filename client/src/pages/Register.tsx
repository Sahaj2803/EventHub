import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { alpha, useTheme } from '@mui/material/styles';
import {
  AutoAwesome,
  Email,
  Groups,
  Lock,
  Person,
  PersonAdd,
  RocketLaunch,
  Visibility,
  VisibilityOff,
  WorkspacePremium,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  role: yup
    .string()
    .oneOf(['user', 'organizer'], 'Please select a valid role')
    .required('Role is required'),
});

type RegisterFormData = yup.InferType<typeof schema>;

const Register: React.FC = () => {
  const theme = useTheme();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const isDark = theme.palette.mode === 'dark';
  const onboardingPoints = [
    {
      icon: <RocketLaunch fontSize="small" />,
      title: 'Fast onboarding',
      text: 'Create your account and get straight into discovery, booking, and saved events.',
    },
    {
      icon: <WorkspacePremium fontSize="small" />,
      title: 'Premium UX',
      text: 'A polished signup flow designed to stay clear and readable in every theme.',
    },
    {
      icon: <Groups fontSize="small" />,
      title: 'Flexible access',
      text: 'Choose the account type that matches how you want to use the platform.',
    },
  ];

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: isDark ? alpha('#020617', 0.72) : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      boxShadow: isDark ? `inset 0 0 0 1px ${alpha('#94a3b8', 0.14)}` : `0 8px 22px ${alpha('#0f172a', 0.08)}`,
      '& fieldset': {
        borderColor: isDark ? alpha('#e2e8f0', 0.14) : alpha('#0f172a', 0.12),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.52),
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
        borderWidth: '1px',
      },
    },
    '& .MuiInputBase-input': {
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    '& .MuiInputBase-input::placeholder': {
      color: isDark ? alpha('#e2e8f0', 0.72) : alpha('#0f172a', 0.5),
      opacity: 1,
    },
    '& .MuiInputLabel-root': {
      color: isDark ? alpha('#e2e8f0', 0.78) : alpha('#0f172a', 0.62),
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme.palette.primary.main,
    },
    '& .MuiFormHelperText-root': {
      color: isDark ? alpha('#cbd5e1', 0.84) : '#64748b',
      marginLeft: 0.5,
    },
    '& .MuiInputAdornment-root, & .MuiSvgIcon-root': {
      color: isDark ? alpha('#f8fafc', 0.78) : alpha('#0f172a', 0.64),
    },
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError('');
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(135deg, #020617 0%, #111827 38%, #3b0764 100%)'
          : 'linear-gradient(135deg, #f8fbff 0%, #eef4ff 40%, #fdf2f8 100%)',
        py: { xs: 4, md: 6 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: isDark
            ? 'radial-gradient(circle at 15% 18%, rgba(56, 189, 248, 0.18), transparent 28%), radial-gradient(circle at 85% 24%, rgba(236, 72, 153, 0.16), transparent 24%)'
            : 'radial-gradient(circle at 15% 18%, rgba(59, 130, 246, 0.18), transparent 28%), radial-gradient(circle at 85% 24%, rgba(236, 72, 153, 0.14), transparent 24%)',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: { xs: 4, md: 6 },
            border: `1px solid ${isDark ? alpha('#e2e8f0', 0.08) : alpha('#0f172a', 0.08)}`,
            background: isDark
              ? `linear-gradient(135deg, ${alpha('#0f172a', 0.94)} 0%, ${alpha('#111827', 0.9)} 100%)`
              : `linear-gradient(135deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#f8fbff', 0.92)} 100%)`,
            boxShadow: isDark
              ? '0 28px 80px rgba(2, 6, 23, 0.55)'
              : '0 28px 80px rgba(15, 23, 42, 0.14)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <Grid container>
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  height: '100%',
                  p: { xs: 3, md: 5 },
                  color: 'white',
                  position: 'relative',
                  background: 'linear-gradient(160deg, #0f172a 0%, #2563eb 45%, #ec4899 100%)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at 18% 20%, rgba(255,255,255,0.24), transparent 18%), radial-gradient(circle at 82% 28%, rgba(255,255,255,0.18), transparent 16%)',
                  }}
                />

                <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                  <Box>
                    <Chip
                      label="New Member Access"
                      icon={<AutoAwesome />}
                      sx={{
                        mb: 2,
                        px: 1,
                        color: 'white',
                        borderRadius: 999,
                        backgroundColor: alpha('#ffffff', 0.14),
                        '& .MuiChip-icon': { color: '#fef08a' },
                      }}
                    />
                    <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.05, mb: 2 }}>
                      Create your account and enter a sharper EventHub experience.
                    </Typography>
                    <Typography variant="body1" sx={{ color: alpha('#ffffff', 0.82), maxWidth: 420 }}>
                      Better discovery, cleaner bookings, and a polished onboarding experience from the very first screen.
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          height: '100%',
                          borderRadius: 3,
                          color: 'white',
                          backgroundColor: alpha('#ffffff', 0.12),
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <Typography variant="overline" sx={{ color: alpha('#ffffff', 0.7) }}>
                          Ready in
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          Minutes
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.8) }}>
                          smooth signup journey
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          height: '100%',
                          borderRadius: 3,
                          color: 'white',
                          backgroundColor: alpha('#ffffff', 0.12),
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <Typography variant="overline" sx={{ color: alpha('#ffffff', 0.7) }}>
                          Modes
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          2/2
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.8) }}>
                          light and dark optimized
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Stack spacing={1.5}>
                    {onboardingPoints.map((item) => (
                      <Box
                        key={item.title}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 3,
                          backgroundColor: alpha('#ffffff', 0.1),
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            display: 'grid',
                            placeItems: 'center',
                            backgroundColor: alpha('#ffffff', 0.14),
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.78) }}>
                            {item.text}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                sx={{
                  p: { xs: 3, sm: 4, md: 5 },
                  color: isDark ? '#f8fafc' : '#0f172a',
                  background: isDark
                    ? `linear-gradient(180deg, ${alpha('#0f172a', 0.82)} 0%, ${alpha('#111827', 0.72)} 100%)`
                    : `linear-gradient(180deg, ${alpha('#ffffff', 0.92)} 0%, ${alpha('#f8fbff', 0.96)} 100%)`,
                }}
              >
                <Chip
                  label="Create Account"
                  icon={<PersonAdd />}
                  sx={{
                    mb: 2.5,
                    borderRadius: 999,
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    backgroundColor: isDark ? alpha('#38bdf8', 0.14) : alpha('#2563eb', 0.08),
                    '& .MuiChip-icon': {
                      color: theme.palette.primary.main,
                    },
                  }}
                />

                <Typography variant="h4" component="h1" sx={{ fontWeight: 900, mb: 1 }}>
                  Join EventHub
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 4,
                    maxWidth: 540,
                    color: isDark ? alpha('#e2e8f0', 0.74) : '#475569',
                  }}
                >
                  Create your account to start with a cleaner, faster, and more polished EventHub experience.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        autoComplete="name"
                        autoFocus
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person />
                            </InputAdornment>
                          ),
                        }}
                        sx={fieldSx}
                        {...register('name')}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        autoComplete="email"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email />
                            </InputAdornment>
                          ),
                        }}
                        sx={fieldSx}
                        {...register('email')}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth sx={fieldSx} error={!!errors.role}>
                        <InputLabel>Account Type</InputLabel>
                        <Select label="Account Type" defaultValue="" {...register('role')}>
                          <MenuItem value="user">Event Attendee</MenuItem>
                          <MenuItem value="organizer">Event Organizer</MenuItem>
                        </Select>
                        {errors.role && (
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.75,
                              ml: 0.5,
                              color: theme.palette.error.main,
                            }}
                          >
                            {errors.role.message}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowPassword((prev) => !prev)}
                                edge="end"
                                sx={{ color: isDark ? alpha('#f8fafc', 0.8) : '#475569' }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={fieldSx}
                        {...register('password')}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle confirm password visibility"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                edge="end"
                                sx={{ color: isDark ? alpha('#f8fafc', 0.8) : '#475569' }}
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={fieldSx}
                        {...register('confirmPassword')}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword?.message}
                      />
                    </Grid>
                  </Grid>

                  <Paper
                    elevation={0}
                    sx={{
                      mt: 2.5,
                      p: 2,
                      borderRadius: 3,
                      border: `1px solid ${isDark ? alpha('#e2e8f0', 0.08) : alpha('#0f172a', 0.08)}`,
                      backgroundColor: isDark ? alpha('#0f172a', 0.52) : alpha('#ffffff', 0.86),
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
                      Account types
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.76) : '#475569' }}>
                        `Event Attendee`: browse events, save favorites, book tickets, and manage bookings.
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.76) : '#475569' }}>
                        `Event Organizer`: create and manage events with organizer tools and dashboard access.
                      </Typography>
                    </Stack>
                  </Paper>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      mt: 3,
                      py: 1.55,
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: '1rem',
                      background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 52%, #ec4899 100%)',
                      boxShadow: '0 18px 35px rgba(99, 102, 241, 0.26)',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #0284c7 0%, #4f46e5 52%, #db2777 100%)',
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                  </Button>

                  <Divider sx={{ my: 3, borderColor: isDark ? alpha('#e2e8f0', 0.1) : alpha('#0f172a', 0.08) }}>
                    <Typography variant="caption" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#64748b' }}>
                      Already a member?
                    </Typography>
                  </Divider>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.78) : '#475569' }}>
                      Already have an account?{' '}
                      <Link
                        component={RouterLink}
                        to="/login"
                        underline="hover"
                        sx={{
                          fontWeight: 800,
                          color: theme.palette.primary.main,
                        }}
                      >
                        Sign in here
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
