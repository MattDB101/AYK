import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Replace with your preferred primary color
    },
    // Optional: customize secondary or other colors
    secondary: {
      main: '#f50057',
    },
  },
});
