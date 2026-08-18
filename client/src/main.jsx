import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Automatically route relative /api and /uploads requests to active backend URL
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://hub-8nyq.onrender.com');

if (API_BASE) {
  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    if (typeof resource === 'string') {
      if (resource.startsWith('/api') || resource.startsWith('/uploads')) {
        resource = `${API_BASE}${resource}`;
      }
    }
    return originalFetch.call(this, resource, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
