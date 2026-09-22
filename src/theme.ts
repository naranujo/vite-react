import { createTheme } from '@mui/material/styles';

/** Tema MUI sobrio y moderno, orientado a desktop / notebooks / tablets. */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f4e79' },
    secondary: { main: '#c65911' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily:
      '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
});

/** Colores fijos para las clases (consistentes en scatter, frontera y matriz). */
export const CLASS_COLORS = {
  negative: '#1f77b4', // clase -1 / 0
  positive: '#d62728', // clase +1 / 1
} as const;
