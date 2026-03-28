import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { alpha, useTheme } from '@mui/material/styles';
import {
  AutoAwesome,
  Email,
  Insights,
  Lock,
  Login as LoginIcon,
  Security,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

type LoginFormData = yup.InferType<typeof schema>;

const Login: React.FC = () => {
  const theme = useTheme();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
  });

  const isDark = theme.palette.mode === 'dark';
  const showcaseItems = [
    { icon: <AutoAwesome fontSize="small" />, title: 'Premium discovery', text: 'Curated events, smarter search, faster booking flow.' },
    { icon: <Insights fontSize="small" />, title: 'Live event pulse', text: 'Track trending categories and high-demand experiences instantly.' },
    { icon: <Security fontSize="small" />, title: 'Secure access', text: 'Protected account flow with reliable password reset support.' },
  ];

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: isDark ? alpha('#020617', 0.72) : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      boxShadow: isDark ? `inset 0 0 0 1px ${alpha('#94a3b8', 0.15)}` : `0 8px 22px ${alpha('#0f172a', 0.08)}`,
      '& fieldset': {
        borderColor: isDark ? alpha('#e2e8f0', 0.14) : alpha('#0f172a', 0.12),
      },
      '&:hover fieldset': {
        borderColor: alpha(theme.palette.primary.main, 0.55),
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

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      await login(data);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
          ? 'linear-gradient(135deg, #020617 0%, #111827 38%, #312e81 100%)'
          : 'linear-gradient(135deg, #f8fbff 0%, #edf4ff 45%, #f5ecff 100%)',
        py: { xs: 4, md: 6 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: isDark
            ? 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 28%), radial-gradient(circle at right center, rgba(244, 114, 182, 0.18), transparent 32%)'
            : 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.2), transparent 26%), radial-gradient(circle at right center, rgba(168, 85, 247, 0.18), transparent 32%)',
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
                  background: 'linear-gradient(160deg, #0f172a 0%, #1d4ed8 48%, #ec4899 100%)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.24), transparent 20%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.18), transparent 18%)',
                  }}
                />
                <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                  <Box>
                    <Chip
                      label="EventHub Access"
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
                      Sign in to your next premium event journey.
                    </Typography>
                    <Typography variant="body1" sx={{ color: alpha('#ffffff', 0.82), maxWidth: 420 }}>
                      One elegant dashboard for discovering experiences, saving favorites, and booking faster with confidence.
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
                          Faster booking
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          3x
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.8) }}>
                          smoother checkout feel
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
                          Favorite tracking
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          Live
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.8) }}>
                          synced across sessions
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Stack spacing={1.5}>
                    {showcaseItems.map((item) => (
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
                  label="Member Login"
                  icon={<LoginIcon />}
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
                  Welcome back
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 4,
                    maxWidth: 520,
                    color: isDark ? alpha('#e2e8f0', 0.74) : '#475569',
                  }}
                >
                  Sign in to access your saved events, bookings, and personalized event picks.
                </Typography>

                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 3,
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Stack spacing={2.25}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      autoComplete="email"
                      autoFocus
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

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
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
                  </Stack>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, mb: 3 }}>
                    <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.74) : '#64748b' }}>
                      Secure sign-in experience
                    </Typography>
                    <Link
                      component={RouterLink}
                      to="/forgot-password"
                      underline="hover"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
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
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                  </Button>

                  <Divider sx={{ my: 3, borderColor: isDark ? alpha('#e2e8f0', 0.1) : alpha('#0f172a', 0.08) }} />

                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.78) : '#475569' }}>
                      Don&apos;t have an account?{' '}
                      <Link
                        component={RouterLink}
                        to="/register"
                        underline="hover"
                        sx={{
                          fontWeight: 800,
                          color: theme.palette.primary.main,
                        }}
                      >
                        Create one now
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

export default Login;
