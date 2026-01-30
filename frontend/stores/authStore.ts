/**
 * AUTH STORE
 * Zustand store for authentication state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData } from '@/types';
import { api } from '@/lib/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  sendOtp: (phone: string, purpose: 'LOGIN' | 'SIGNUP' | 'PASSWORD_RESET') => Promise<void>;
  verifyOtp: (phone: string, otp: string, purpose: 'LOGIN' | 'SIGNUP' | 'PASSWORD_RESET') => Promise<boolean>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post('/auth/login', credentials);
          const { user, tokens } = response.data.data;
          
          // Store tokens
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      // Register action
      register: async (data) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post('/auth/register', data);
          const { user, tokens } = response.data.data;
          
          // Store tokens
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      // Logout from all devices
      logoutAll: async () => {
        try {
          await api.post('/auth/logout-all');
        } catch (error) {
          console.error('Logout all error:', error);
        } finally {
          // Clear tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      // Send OTP
      sendOtp: async (phone, purpose) => {
        set({ isLoading: true, error: null });
        
        try {
          await api.post('/auth/otp/send', { phone, purpose });
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Failed to send OTP',
            isLoading: false,
          });
          throw error;
        }
      },

      // Verify OTP
      verifyOtp: async (phone, otp, purpose) => {
        set({ isLoading: true, error: null });
        
        try {
          await api.post('/auth/otp/verify', { phone, otp, purpose });
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Invalid OTP',
            isLoading: false,
          });
          return false;
        }
      },

      // Refresh token
      refreshToken: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        
        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
        } catch (error) {
          // Clear tokens on refresh failure
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false });
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set user directly
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);