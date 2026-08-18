// Helper for getting dynamic socket connection URL
export const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development Vite dev server runs on 5173, backend on 5000 or current host
  if (import.meta.env.DEV) {
    const port = window.location.port === '5173' ? '5000' : window.location.port;
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return window.location.origin;
};
