import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'CASHIER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('ji_token'),
  isAuthenticated: !!localStorage.getItem('ji_token'),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data.data;

      localStorage.setItem('ji_token', token);

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const code = error.response?.data?.code;
      let message = error.response?.data?.error || 'Login failed. Please try again.';

      if (!error.response) {
        message = 'Could not reach the server. Check internet, DNS, or app configuration.';
      } else if (code === 'DATABASE_UNAVAILABLE') {
        message = 'Cloud database is unavailable. Please check internet or app configuration.';
      } else if (code === 'JWT_SECRET_MISSING') {
        message = 'App security configuration is incomplete. Please contact support.';
      }

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('ji_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('ji_token');
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data.data,
        isAuthenticated: true,
        token,
      });
    } catch {
      localStorage.removeItem('ji_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
