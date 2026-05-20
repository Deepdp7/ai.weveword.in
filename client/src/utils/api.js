import axios from 'axios';

const getApiBase = () => {
  const savedUrl = localStorage.getItem('kolomflow_api_url');
  if (savedUrl) return savedUrl;

  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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
    localStorage.removeItem('kolomflow_api_url');
  } else {
    localStorage.setItem('kolomflow_api_url', url);
  }
  window.location.reload();
};

export default api;
