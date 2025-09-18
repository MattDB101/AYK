import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { AuthContextProvider } from './context/AuthContext';
import { MuiThemeProvider, createTheme } from '@material-ui/core/styles';
import { CartProvider } from './context/cartContext';

const theme = createTheme({
  typography: {
    h1: {
      fontFamily: 'Kallisto, sans-serif',
      fontSize: '1rem',
      //marginLeft: '0px',
    },
    h2: {
      fontFamily: 'Sofachrome, sans-serif',
    },
    h4: {
      fontFamily: 'Kallisto, sans-serif',
    },

    body1: {
      fontFamily: 'Kallisto, sans-serif',
    },
    body2: {
      fontFamily: 'Kallisto, sans-serif',
    },
    fontFamily: 'Kallisto, sans-serif',
  },
  palette: {
    primary: {
      main: '#043d4e',
    },
    secondary: {
      main: '#97c83c',
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <AuthContextProvider>
      <MuiThemeProvider theme={theme}>
        <CartProvider>
          <App />
        </CartProvider>
      </MuiThemeProvider>
    </AuthContextProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
