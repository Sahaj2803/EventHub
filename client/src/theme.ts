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
          body:
            mode === 'dark'
              ? {
                  background:
                    'radial-gradient(1200px 600px at -10% -20%, rgba(124, 58, 237, 0.25), transparent 60%),\\\n             radial-gradient(1200px 600px at 110% 120%, rgba(236, 72, 153, 0.25), transparent 60%),\\\n             linear-gradient(180deg, #0b1020 0%, #0b1020 100%)',
                  color: '#E6E9F5',
                }
              : {
                  background:
                    'radial-gradient(900px 520px at -10% -10%, rgba(56, 189, 248, 0.18), transparent 55%),\\\n             radial-gradient(1000px 520px at 110% 0%, rgba(99, 102, 241, 0.12), transparent 50%),\\\n             linear-gradient(180deg, #f7f8fc 0%, #eef2ff 100%)',
                  color: '#0d1324',
                },
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
              mode === 'dark'
                ? 'linear-gradient(160deg, rgba(22, 28, 52, 0.92), rgba(12, 17, 36, 0.88))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,248,255,0.96))',
            backdropFilter: 'blur(10px)',
            border:
              mode === 'dark'
                ? '1px solid rgba(148, 163, 184, 0.14)'
                : '1px solid rgba(148, 163, 184, 0.18)',
            color: mode === 'dark' ? '#E6E9F5' : '#0d1324',
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background:
              mode === 'dark'
                ? 'linear-gradient(160deg, rgba(24, 31, 57, 0.94), rgba(13, 19, 39, 0.9))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,255,0.96))',
            boxShadow:
              mode === 'dark'
                ? '0 12px 30px rgba(0,0,0,0.35)'
                : '0 16px 36px rgba(15, 23, 42, 0.08)',
            color: mode === 'dark' ? '#E6E9F5' : '#0d1324',
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background:
              mode === 'dark'
                ? 'rgba(15, 20, 40, 0.72)'
                : 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(10px)',
            boxShadow:
              mode === 'dark'
                ? '0 8px 20px rgba(0,0,0,0.35)'
                : '0 8px 24px rgba(15, 23, 42, 0.08)',
            borderBottom:
              mode === 'dark'
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(148, 163, 184, 0.18)',
            color: mode === 'dark' ? '#E6E9F5' : '#0d1324',
          },
        },
      },
    },
  });

export default getTheme;


