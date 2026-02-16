import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { WalletProvider } from './contexts/WalletContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ScrollToTopFab from './components/common/ScrollToTopFab';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import WalletPageWrapper from './components/Wallet/WalletPageWrapper';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import getTheme, { ThemeMode } from './theme';
import { ThemeModeProvider } from './contexts/ThemeModeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// WalletProviderWrapper component to handle user authentication
const WalletProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Handle both _id and id fields for backward compatibility
  const userId = user?._id || user?.id || '';
  
  return <WalletProvider userId={userId}>{children}</WalletProvider>;
};

// theme is now centralized in ./theme

function App() {
  const [mode, setMode] = React.useState<ThemeMode>(() => (localStorage.getItem('themeMode') as ThemeMode) || 'dark');
  const theme = React.useMemo(() => getTheme(mode), [mode]);
  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    localStorage.setItem('themeMode', next);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <WalletProviderWrapper>
            <FavoritesProvider>
            <ThemeModeProvider mode={mode} toggleMode={toggleMode}>
            <Router>
              <CssBaseline />
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar />
                <Box component="main" sx={{ flexGrow: 1 }}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetail />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    {/* Protected Routes */}
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                      <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/events/create" element={
                      <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                        <CreateEvent />
                      </ProtectedRoute>
                    } />
                    <Route path="/events/:id/edit" element={
                      <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                        <EditEvent />
                      </ProtectedRoute>
                    } />
                    <Route path="/bookings" element={
                      <ProtectedRoute>
                        <Bookings />
                      </ProtectedRoute>
                    } />
                    <Route path="/wallet" element={
                      <ProtectedRoute>
                        <WalletPageWrapper />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Box>
                <Footer />
              </Box>
              <ScrollToTopFab />
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </Router>
            </ThemeModeProvider>
            </FavoritesProvider>
            </WalletProviderWrapper>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
