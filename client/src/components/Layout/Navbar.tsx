import React, { useState } from 'react';
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
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleMode } = useThemeMode();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
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
    { label: 'Dashboard', path: '/dashboard', icon: <Dashboard />, roles: ['organizer', 'admin'] },
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
    >
      <Box sx={{ width: 250, pt: 2 }}>
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
        </List>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
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
              flexGrow: isMobile ? 0 : 1, 
              cursor: 'pointer',
              fontWeight: 'bold',
              mr: isMobile ? 2 : 0,
              background: 'linear-gradient(90deg, #ffffff, #c7b9ff, #ffb6d9)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}
            onClick={() => navigate('/')}
          >
            EventHub
          </Typography>

          {!isMobile && (
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
