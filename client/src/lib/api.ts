import axios from 'axios';

declare global {
  interface Window {
    janwariDesktop?: {
      apiBaseUrl?: string;
      preferHostedApi?: boolean;
      runtimeMode?: string;
    };
  }
}

const runtimeApiBaseUrl = window.janwariDesktop?.apiBaseUrl?.trim();
const API_BASE_URL = runtimeApiBaseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ji_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ji_token');
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
