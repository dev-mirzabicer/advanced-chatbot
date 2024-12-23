// src/pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { StateProvider } from '../context/StateContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <StateProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </StateProvider>
  );
}

export default MyApp;
