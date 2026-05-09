import React from 'react';
import ReactDOM from 'react-dom/client';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import './index.css';

const theme = createTheme({
  palette: {
    primary:    { main: '#1a73e8' },
    error:      { main: '#ea4335' },
    warning:    { main: '#f57c00' },
    success:    { main: '#34a853' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text:       { primary: '#202124', secondary: '#5f6368' },
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", sans-serif',
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 24, boxShadow: 'none', '&:hover': { boxShadow: '0 1px 3px rgba(0,0,0,.25)' } },
        containedPrimary: { background: '#1a73e8', '&:hover': { background: '#1557b0' } },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
