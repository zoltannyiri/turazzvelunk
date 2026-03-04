import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'

const reportClientError = async ({ message, stack, url }) => {
  try {
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/errors/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, stack, url })
    });
  } catch (err) {
    // Do not throw from error reporting.
  }
};

const setupClientErrorLogging = () => {
  let lastErrorKey = '';
  let lastErrorAt = 0;

  const shouldReport = (key) => {
    const now = Date.now();
    if (key === lastErrorKey && now - lastErrorAt < 2000) return false;
    lastErrorKey = key;
    lastErrorAt = now;
    return true;
  };

  window.addEventListener('error', (event) => {
    const message = event?.error?.message || event?.message || 'Client error';
    const stack = event?.error?.stack || '';
    const url = window.location?.href || '';
    const key = `${message}|${url}`;
    if (shouldReport(key)) {
      reportClientError({ message, stack, url });
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event?.reason?.message || 'Unhandled promise rejection';
    const stack = event?.reason?.stack || '';
    const url = window.location?.href || '';
    const key = `${message}|${url}`;
    if (shouldReport(key)) {
      reportClientError({ message, stack, url });
    }
  });
};

setupClientErrorLogging();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
