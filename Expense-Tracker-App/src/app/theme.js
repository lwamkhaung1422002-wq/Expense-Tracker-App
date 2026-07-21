import { createTheme } from '@mui/material'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3B5BFF' },
    success: { main: '#22C55E' },
    error: { main: '#FF4D4F' },
    warning: { main: '#F59E0B' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    h4: { fontSize: '2.25rem', lineHeight: 1.08, fontWeight: 750, letterSpacing: '-0.02em' },
    h5: { fontSize: '1.35rem', lineHeight: 1.18, fontWeight: 750, letterSpacing: '-0.012em' },
    h6: { fontSize: '1.02rem', lineHeight: 1.25, fontWeight: 700, letterSpacing: '-0.006em' },
    subtitle1: { fontSize: '0.98rem', lineHeight: 1.45 },
    body1: { fontSize: '0.95rem', lineHeight: 1.5, letterSpacing: 0 },
    body2: { fontSize: '0.86rem', lineHeight: 1.45, letterSpacing: 0 },
    caption: { fontSize: '0.72rem', lineHeight: 1.35 },
    button: { fontSize: '0.9rem', fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E5EAF2',
          borderRadius: 20,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
        },
      },
    },
    MuiButton: { styleOverrides: { root: { borderRadius: 12, boxShadow: 'none' } } },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 12, background: '#FFFFFF', fontSize: '0.95rem' },
          '& .MuiInputLabel-root': { fontSize: '0.9rem' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 12, background: '#FFFFFF', fontSize: '0.95rem' },
      },
    },
  },
})
