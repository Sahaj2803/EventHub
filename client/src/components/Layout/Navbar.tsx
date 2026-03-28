import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  InputBase,
  alpha,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Switch,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountCircle,
  Dashboard,
  Event,
  BookOnline,
  Favorite,
  AdminPanelSettings,
  Logout,
  Menu as MenuIcon,
  Notifications,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../../contexts/ThemeModeContext';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.12)
      : alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? alpha(theme.palette.common.white, 0.18)
        : alpha(theme.palette.common.black, 0.08),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input::placeholder': {
    color: theme.palette.text.secondary,
    opacity: 1,
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleMode } = useThemeMode();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMobileMenuOpen(false);
    setAnchorEl(null);
  }, [location.pathname]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    handleMenuClose();
    navigate('/login', { replace: true });
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleMenuClose();
  };

  const menuItems = [
    { label: 'Profile', path: '/profile', icon: <AccountCircle />, roles: ['user', 'organizer', 'admin'] },
    { label: 'My Bookings', path: '/bookings', icon: <BookOnline />, roles: ['user', 'organizer', 'admin'] },
    { label: 'My Wallet', path: '/wallet', icon: <AccountBalanceWallet />, roles: ['user', 'organizer', 'admin'] },
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard />, roles: ['organizer'] },
    { label: 'Admin Panel', path: '/admin', icon: <AdminPanelSettings />, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || 'user')
  );

  const mobileMenu = (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      PaperProps={{
        sx: {
          width: { xs: '88vw', sm: 320 },
          maxWidth: 360,
        },
      }}
    >
      <Box sx={{ px: 2, py: 2.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            mb: 2,
            background:
              mode === 'dark'
                ? 'linear-gradient(90deg, #ffffff, #c7b9ff, #ffb6d9)'
                : 'linear-gradient(90deg, #312e81, #2563eb, #db2777)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          EventHub
        </Typography>
        <Search sx={{ m: 0, mb: 2, width: '100%' }}>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <form onSubmit={handleSearch}>
            <StyledInputBase
              placeholder="Search events..."
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              sx={{ width: '100%' }}
            />
          </form>
        </Search>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Theme
          </Typography>
          <Switch checked={mode === 'dark'} onChange={toggleMode} color="default" />
        </Box>
        <List>
          <ListItem component="button" onClick={() => handleNavigation('/events')}>
            <ListItemIcon>
              <Event />
            </ListItemIcon>
            <ListItemText primary="Events" />
          </ListItem>
          <ListItem component="button" onClick={() => handleNavigation('/favorites')}>
            <ListItemIcon>
              <Favorite />
            </ListItemIcon>
            <ListItemText primary="Favorites" />
          </ListItem>
          {isAuthenticated && (
            <>
              {filteredMenuItems.map((item) => (
                <ListItem key={item.path} component="button" onClick={() => handleNavigation(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              ))}
              <ListItem component="button" onClick={handleLogout}>
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItem>
            </>
          )}
          {!isAuthenticated && (
            <>
              <ListItem component="button" onClick={() => handleNavigation('/login')}>
                <ListItemIcon>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText primary="Login" />
              </ListItem>
              <ListItem component="button" onClick={() => handleNavigation('/register')}>
                <ListItemIcon>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText primary="Sign Up" />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ minHeight: { xs: 72, md: 80 }, gap: 1 }}>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 'bold',
              mr: isMobile ? 1 : 0,
              background:
                mode === 'dark'
                  ? 'linear-gradient(90deg, #ffffff, #c7b9ff, #ffb6d9)'
                  : 'linear-gradient(90deg, #312e81, #2563eb, #db2777)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}
            onClick={() => navigate('/')}
          >
            EventHub
          </Typography>

          {isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <Switch checked={mode === 'dark'} onChange={toggleMode} color="default" size="small" />
              </Tooltip>
              {isAuthenticated ? (
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  color="inherit"
                >
                  <Avatar src={user?.avatar} sx={{ width: 32, height: 32 }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              ) : (
                <Button color="inherit" onClick={() => navigate('/login')} sx={{ minWidth: 0, px: 1.5 }}>
                  Login
                </Button>
              )}
            </Box>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={() => navigate('/events')}
                sx={{ ml: 2 }}
              >
                Events
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/favorites')}
                sx={{ ml: 1 }}
                startIcon={<Favorite />}
              >
                Favorites
              </Button>

              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <form onSubmit={handleSearch}>
                  <StyledInputBase
                    placeholder="Search events..."
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  />
                </form>
              </Search>

              <Box sx={{ flexGrow: 1 }} />

              <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <Switch checked={mode === 'dark'} onChange={toggleMode} color="default" />
                </Box>
              </Tooltip>

              {isAuthenticated ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton color="inherit">
                    <Badge badgeContent={0} color="secondary">
                      <Notifications />
                    </Badge>
                  </IconButton>

                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenuOpen}
                    color="inherit"
                  >
                    <Avatar
                      src={user?.avatar}
                      sx={{ width: 32, height: 32 }}
                    >
                      {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>

                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                      sx: {
                        minWidth: 220,
                      },
                    }}
                  >
                    {filteredMenuItems.map((item) => (
                      <MenuItem key={item.path} onClick={() => handleNavigation(item.path)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.icon}
                          {item.label}
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem onClick={handleLogout}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Logout />
                        Logout
                      </Box>
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button color="inherit" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/register')}
                    sx={{
                      background: 'linear-gradient(90deg, #38bdf8, #a78bfa, #f472b6)',
                      '&:hover': { background: 'linear-gradient(90deg, #22d3ee, #c084fc, #fb7185)' },
                    }}
                  >
                    Sign Up
                  </Button>
                </Box>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>
      {mobileMenu}
    </>
  );
};

export default Navbar;
