import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginCredentials, RegisterData, AuthResponse } from '../types/auth';
import { Event, CreateEventData, EventFilters } from '../types/event';
import { Booking, CreateBookingData, BookingFilters } from '../types/booking';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
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
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth API
  auth = {
    login: (credentials: LoginCredentials): Promise<AxiosResponse<AuthResponse>> =>
      this.api.post('/auth/login', credentials),
    
    register: (data: RegisterData): Promise<AxiosResponse<AuthResponse>> =>
      this.api.post('/auth/register', data),
    
    getCurrentUser: (): Promise<AxiosResponse<{ user: any }>> =>
      this.api.get('/auth/me'),
    
    updateProfile: (data: any): Promise<AxiosResponse<any>> =>
      this.api.put('/auth/profile', data),
    
    changePassword: (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<any>> =>
      this.api.put('/auth/change-password', data),
  };

  // Events API
  events = {
    getAll: (filters?: EventFilters): Promise<AxiosResponse<{ events: Event[]; pagination: any }>> =>
      this.api.get('/events', { params: filters }),
    
    getFeatured: (): Promise<AxiosResponse<{ events: Event[] }>> =>
      this.api.get('/events/featured'),
    
    getById: (id: string): Promise<AxiosResponse<{ event: Event }>> =>
      this.api.get(`/events/${id}`),
    
    create: (data: CreateEventData): Promise<AxiosResponse<{ event: Event }>> =>
      this.api.post('/events', data),
    
    update: (id: string, data: Partial<CreateEventData>): Promise<AxiosResponse<{ event: Event }>> =>
      this.api.put(`/events/${id}`, data),
    
    delete: (id: string): Promise<AxiosResponse<any>> =>
      this.api.delete(`/events/${id}`),
    
    like: (id: string): Promise<AxiosResponse<any>> =>
      this.api.post(`/events/${id}/like`),
  };

  // Bookings API
  bookings = {
    getAll: (filters?: BookingFilters): Promise<AxiosResponse<{ bookings: Booking[]; pagination: any }>> =>
      this.api.get('/bookings', { params: filters }),
    
    getById: (id: string): Promise<AxiosResponse<{ booking: Booking }>> =>
      this.api.get(`/bookings/${id}`),
    
    create: (data: CreateBookingData): Promise<AxiosResponse<{ booking: Booking }>> =>
      this.api.post('/bookings', data),
    
    confirm: (id: string, data: { paymentIntentId?: string; transactionId?: string }): Promise<AxiosResponse<{ booking: Booking }>> =>
      this.api.put(`/bookings/${id}/confirm`, data),
    
    cancel: (id: string, data: { reason?: string }): Promise<AxiosResponse<{ booking: Booking }>> =>
      this.api.put(`/bookings/${id}/cancel`, data),
    
    getByEvent: (eventId: string, filters?: BookingFilters): Promise<AxiosResponse<{ bookings: Booking[]; pagination: any }>> =>
      this.api.get(`/bookings/event/${eventId}`, { params: filters }),
    
    checkIn: (id: string): Promise<AxiosResponse<{ booking: Booking }>> =>
      this.api.put(`/bookings/${id}/checkin`),

    getQRCode: (id: string): Promise<AxiosResponse<{ qrCode: string }>> =>
      this.api.get(`/bookings/${id}/qrcode`),
  };

  // Categories API
  categories = {
    getAll: (): Promise<AxiosResponse<{ categories: any[] }>> =>
      this.api.get('/categories'),
    
    getById: (id: string): Promise<AxiosResponse<{ category: any }>> =>
      this.api.get(`/categories/${id}`),
    
    create: (data: any): Promise<AxiosResponse<{ category: any }>> =>
      this.api.post('/categories', data),
    
    update: (id: string, data: any): Promise<AxiosResponse<{ category: any }>> =>
      this.api.put(`/categories/${id}`, data),
    
    delete: (id: string): Promise<AxiosResponse<any>> =>
      this.api.delete(`/categories/${id}`),
    
    toggle: (id: string): Promise<AxiosResponse<{ category: any }>> =>
      this.api.put(`/categories/${id}/toggle`),
  };

  // Users API
  users = {
    getAll: (filters?: any): Promise<AxiosResponse<{ users: any[]; pagination: any }>> =>
      this.api.get('/users', { params: filters }),
    
    getById: (id: string): Promise<AxiosResponse<{ user: any }>> =>
      this.api.get(`/users/${id}`),
    
    getEvents: (id: string, filters?: any): Promise<AxiosResponse<{ events: Event[]; pagination: any }>> =>
      this.api.get(`/users/${id}/events`, { params: filters }),
    
    getBookings: (id: string, filters?: any): Promise<AxiosResponse<{ bookings: Booking[]; pagination: any }>> =>
      this.api.get(`/users/${id}/bookings`, { params: filters }),
    
    updateRole: (id: string, data: { role: string }): Promise<AxiosResponse<{ user: any }>> =>
      this.api.put(`/users/${id}/role`, data),
    
    delete: (id: string): Promise<AxiosResponse<any>> =>
      this.api.delete(`/users/${id}`),
    
    getStats: (): Promise<AxiosResponse<any>> =>
      this.api.get('/users/stats/overview'),
    
    getRevenue: (id: string): Promise<AxiosResponse<any>> =>
      this.api.get(`/users/${id}/revenue`),
  };

  // Wallet API
  wallet = {
    getWallet: (userId: string): Promise<AxiosResponse<{ wallet: any }>> =>
      this.api.get(`/users/${userId}/wallet`),
    
    recharge: (userId: string, data: { amount: number; paymentMethod: string; description?: string }): Promise<AxiosResponse<{ wallet: any; transactionId: string }>> =>
      this.api.post(`/users/${userId}/wallet/recharge`, data),
    
    getTransactions: (userId: string, filters?: { page?: number; limit?: number; type?: string }): Promise<AxiosResponse<{ transactions: any[]; pagination: any; wallet: any }>> =>
      this.api.get(`/users/${userId}/wallet/transactions`, { params: filters }),

    refreshAfterCancel: async (userId: string) => {
      const [wallet, transactions] = await Promise.all([
        this.api.get(`/users/${userId}/wallet`),
        this.api.get(`/users/${userId}/wallet/transactions`, { params: { page: 1, limit: 20 } })
      ]);
      return { wallet: wallet.data.wallet, transactions: transactions.data.transactions };
    }
  };

  // Favorites API
  favorites = {
    getAll: (filters?: { page?: number; limit?: number }): Promise<AxiosResponse<{ favorites: any[]; pagination: any }>> =>
      this.api.get('/favorites', { params: filters }),
    
    add: (eventId: string): Promise<AxiosResponse<{ message: string; favorite: any }>> =>
      this.api.post('/favorites', { eventId }),
    
    
    remove: (eventId: string): Promise<AxiosResponse<{ message: string }>> =>
      this.api.delete(`/favorites/${eventId}`),
    
    check: (eventId: string): Promise<AxiosResponse<{ isFavorite: boolean }>> =>
      this.api.get(`/favorites/check/${eventId}`),
    
    clear: (): Promise<AxiosResponse<{ message: string }>> =>
      this.api.delete('/favorites'),
  };
}

export const apiService = new ApiService();

// Export individual API services for convenience
export const authAPI = apiService.auth;
export const eventsAPI = apiService.events;
export const bookingsAPI = apiService.bookings;
export const categoriesAPI = apiService.categories;
export const usersAPI = apiService.users;
export const walletAPI = apiService.wallet;
export const favoritesAPI = apiService.favorites;
