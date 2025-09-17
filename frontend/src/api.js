
import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studyhive_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('studyhive_token');
      localStorage.removeItem('studyhive_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper: get API base URL and origin for building asset links
export const getApiBaseUrl = () => API_BASE_URL;
export const getApiOrigin = () => {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch (e) {
    // Fallback if API_BASE_URL is relative or invalid
    return API_BASE_URL.replace(/\/?api$/, '');
  }
};

// Helper: build file URL from relative file path stored by backend (e.g., uploads/messages/..)
export const buildFileUrl = (relativePath = '') => {
  const origin = getApiOrigin();
  const cleanPath = relativePath.replace(/^\/+/, '');
  return `${origin}/${cleanPath}`;
};
