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

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? RENDER_BACKEND
    : LOCAL_BACKEND);

export default API_URL;
