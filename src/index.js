import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// TODO (Savvas): wrap <App /> in <BrowserRouter> from react-router-dom so
// the routes in App.js work.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
