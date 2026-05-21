/**
 * Centralised API URL resolution.
 *
 * Priority order:
 *  1. VITE_API_URL environment variable (set in Vercel dashboard)
 *  2. Auto-detect: localhost → local backend, any other host → Render backend
 *
 * This means the app works correctly in production even if VITE_API_URL is not
 * configured in Vercel, because it falls back to the live Render URL.
 */
const RENDER_BACKEND = 'https://vouch-project.onrender.com';
const LOCAL_BACKEND  = 'http://localhost:8000';

const getApiUrl = () => {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_API_URL || RENDER_BACKEND;
  }

  const hostname = window.location.hostname;
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local');

  const envUrl = import.meta.env.VITE_API_URL;

  if (isLocalhost) {
    // Local development environment
    return envUrl || LOCAL_BACKEND;
  } else {
    // Production/remote environment
    // Only use VITE_API_URL if it is set and does not point to a local hostname/IP
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') && !envUrl.includes('::1')) {
      return envUrl;
    }
    return RENDER_BACKEND;
  }
};

export const API_URL = getApiUrl();
export default API_URL;
