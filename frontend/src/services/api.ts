import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For web browser testing: use localhost
// For physical device testing: use your computer's IP address
// Find your IP by running: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_BASE_URL = 'https://mizaan-production.up.railway.app/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback registered by AuthContext so the interceptor can trigger a logout
let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedCallback(fn: () => void) {
  _onUnauthorized = fn;
}

// Request interceptor - adds token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and notify AuthContext
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: async (email: string, username: string, password: string) => {
    const response = await api.post('/auth/register', { email, username, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Prayer Times API calls
export const prayerTimesAPI = {
  getTodayPrayerTimes: async () => {
    const response = await api.get('/prayer-times');
    return response.data;
  },

  getPrayerTimesForDate: async (date: string) => {
    const response = await api.get(`/prayer-times/${date}`);
    return response.data;
  },
};

// User Settings API calls
export const userAPI = {
  updateSettings: async (settings: {
    location?: string;
    timezone?: string;
    calculation_method?: string;
  }) => {
    const response = await api.put('/users/settings', settings);
    return response.data;
  },

  updateNotificationToken: async (token: string) => {
    const response = await api.put('/users/notification-token', { token });
    return response.data;
  },

  updateNotificationSettings: async (settings: {
    notifications_enabled?: boolean;
    prayer_reminders_enabled?: boolean;
    missed_prayer_alerts?: boolean;
    friend_activity_alerts?: boolean;
    reminder_minutes_before?: number;
  }) => {
    const response = await api.put('/users/notification-settings', settings);
    return response.data;
  },
};

export default api;
