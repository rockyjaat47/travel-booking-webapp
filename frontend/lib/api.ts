/**
 * API CLIENT
 * Axios instance with interceptors for authentication
 */

import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        // Call refresh endpoint
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
          { refreshToken }
        );
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        
        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API helper functions
export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  sendOtp: (phone: string, purpose: string) => api.post('/auth/otp/send', { phone, purpose }),
  verifyOtp: (phone: string, otp: string, purpose: string) => 
    api.post('/auth/otp/verify', { phone, otp, purpose }),
};

export const busApi = {
  search: (params: any) => api.get('/buses/search', { params }),
  getSchedule: (id: string) => api.get(`/buses/schedules/${id}`),
  getSeats: (id: string) => api.get(`/buses/schedules/${id}/seats`),
};

export const flightApi = {
  search: (params: any) => api.get('/flights/search', { params }),
  getSchedule: (id: string) => api.get(`/flights/schedules/${id}`),
  getFareRules: (id: string) => api.get(`/flights/schedules/${id}/fare-rules`),
};

export const hotelApi = {
  search: (params: any) => api.get('/hotels/search', { params }),
  getHotel: (id: string) => api.get(`/hotels/${id}`),
  getRoom: (id: string) => api.get(`/hotels/rooms/${id}`),
};

export const bookingApi = {
  create: (data: any) => api.post('/bookings', data),
  getAll: (params?: any) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  confirm: (id: string, data: any) => api.patch(`/bookings/${id}/confirm`, data),
  cancel: (id: string, reason: string) => api.post(`/bookings/${id}/cancel`, { reason }),
  getCancellationDetails: (id: string) => api.get(`/bookings/${id}/cancellation-details`),
  downloadTicket: (id: string) => api.get(`/bookings/${id}/ticket`),
};

export const paymentApi = {
  createOrder: (data: any) => api.post('/payments/create-order', data),
  verify: (data: any) => api.post('/payments/verify', data),
  getWallet: () => api.get('/payments/wallet'),
  addToWallet: (amount: number) => api.post('/payments/wallet/add', { amount }),
  verifyWalletTopup: (data: any) => api.post('/payments/wallet/verify', data),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/change-password', data),
  submitKyc: (data: any) => api.post('/users/kyc', data),
  getPassengers: () => api.get('/users/passengers'),
  addPassenger: (data: any) => api.post('/users/passengers', data),
  updatePassenger: (id: string, data: any) => api.put(`/users/passengers/${id}`, data),
  deletePassenger: (id: string) => api.delete(`/users/passengers/${id}`),
};

export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id: string, status: string) => api.patch(`/admin/users/${id}/status`, { status }),
  createAdmin: (data: any) => api.post('/admin/users/create-admin', data),
  
  getPartners: (params?: any) => api.get('/admin/partners', { params }),
  createPartner: (data: any) => api.post('/admin/partners', data),
  updatePartner: (id: string, data: any) => api.patch(`/admin/partners/${id}`, data),
  updatePartnerHoldQuota: (id: string, data: any) => api.patch(`/admin/partners/${id}/hold-quota`, data),
  
  getBookings: (params?: any) => api.get('/admin/bookings', { params }),
  updateBookingStatus: (id: string, status: string) => api.patch(`/admin/bookings/${id}/status`, { status }),
  
  getCancellations: (params?: any) => api.get('/admin/cancellations', { params }),
  processCancellation: (id: string, action: 'APPROVE' | 'REJECT') => 
    api.post(`/admin/cancellations/${id}/process`, { action }),
  
  getSalesReport: (params: any) => api.get('/reports/sales', { params }),
  getBookingReport: (params: any) => api.get('/reports/bookings', { params }),
  getRevenueReport: (params: any) => api.get('/reports/revenue', { params }),
  getUserReport: (params?: any) => api.get('/reports/users', { params }),
  getCancellationReport: (params: any) => api.get('/reports/cancellations', { params }),
};