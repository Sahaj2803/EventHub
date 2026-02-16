import { createTheme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

// Generate theme for a refreshed, modern UI. Supports light and dark modes.
export const getTheme = (mode: ThemeMode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#6C5CE7', light: '#8E79FF', dark: '#4B3DB5' },
      secondary: { main: '#FF6B6B', light: '#FF8A8A', dark: '#E55757' },
      background: mode === 'dark'
        ? { default: '#0b1020', paper: '#0f1428' }
        : { default: '#f7f8fc', paper: '#ffffff' },
      text: mode === 'dark'
        ? { primary: '#E6E9F5', secondary: '#B9C0DA' }
        : { primary: '#0d1324', secondary: '#42507a' },
      success: { main: '#22c55e' },
      warning: { main: '#f59e0b' },
      error: { main: '#ef4444' },
      info: { main: '#38bdf8' },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontWeight: 800 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { fontWeight: 700 },
    },
    shape: { borderRadius: 14 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: mode === 'dark'
            ? {
                background:
                  'radial-gradient(1200px 600px at -10% -20%, rgba(124, 58, 237, 0.25), transparent 60%),\\\n             radial-gradient(1200px 600px at 110% 120%, rgba(236, 72, 153, 0.25), transparent 60%),\\\n             linear-gradient(180deg, #0b1020 0%, #0b1020 100%)',
                color: '#E6E9F5',
              }
            : {},
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            fontWeight: 700,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'rgba(15, 20, 40, 0.6)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          },
        },
      },
    },
  });

export default getTheme;


