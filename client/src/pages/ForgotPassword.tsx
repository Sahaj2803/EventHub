import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  Link,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { authAPI } from '../services/api';

const fieldSx = {
  '& .MuiInputBase-root': {
    color: '#0f172a',
  },
  '& .MuiInputBase-input::placeholder': {
    color: 'rgba(15, 23, 42, 0.55)',
    opacity: 1,
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(15, 23, 42, 0.72)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'primary.main',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(15, 23, 42, 0.18)',
  },
};

const paperSx = {
  p: 4,
  borderRadius: 3,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  color: '#0f172a',
};

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setMessage('');
      setResetLink('');

      const response = await authAPI.forgotPassword({ email });
      setMessage(response.data.message);
      if (response.data.resetLink) {
        setResetLink(response.data.resetLink);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Forgot password request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={paperSx}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#0f172a' }}>
              Forgot Password
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569' }}>
              Apna email enter karo, hum reset link bhej denge.
            </Typography>
          </Box>

          {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              margin="normal"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={fieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !email.trim()}
              sx={{ mt: 2, mb: 3, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
            </Button>
          </Box>

          {resetLink && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Email service local par configured nahi hai. Is link se direct reset kar lo:
              <Box sx={{ mt: 1, wordBreak: 'break-all' }}>
                <Link href={resetLink}>{resetLink}</Link>
              </Box>
            </Alert>
          )}

          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <ArrowBack fontSize="small" />
              Back to Login
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
