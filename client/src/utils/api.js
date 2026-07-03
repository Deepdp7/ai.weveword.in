import axios from 'axios';

const getApiBase = () => {
  let savedUrl = localStorage.getItem('waveword-ai_api_url');
  if (savedUrl) {
    // If the page is HTTPS, force the saved URL to be HTTPS as well to prevent Mixed Content
    if (window.location.protocol === 'https:' && savedUrl.startsWith('http://')) {
      savedUrl = savedUrl.replace('http://', 'https://');
    }
    return savedUrl;
  }

  // Use the current protocol (http or https) dynamically to prevent Mixed Content errors
  const protocol = window.location.protocol;
  return import.meta.env.VITE_API_URL || `${protocol}//${window.location.hostname}/api`;
};

export const API_BASE = getApiBase();

// Create default configured axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Configure defaults for global axios to ensure consistency
axios.defaults.baseURL = API_BASE;
axios.defaults.withCredentials = true;

export const setCustomApiUrl = (url) => {
  if (!url) {
    localStorage.removeItem('waveword-ai_api_url');
  } else {
    localStorage.setItem('waveword-ai_api_url', url);
  }
  window.location.reload();
};

export default api;
