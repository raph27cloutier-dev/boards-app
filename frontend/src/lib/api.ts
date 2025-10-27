import axios from 'axios';
import type {
  User,
  Event,
  RSVP,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  RecommendationRequest,
  ScoredEvent,
  InteractionRequest,
} from '../types';

// Get API URL from environment or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/signup', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },
};

// Events API
export const eventsAPI = {
  getAll: async (params?: {
    near?: string;
    radiusKm?: number;
    vibes?: string;
    when?: string;
    search?: string;
  }): Promise<Event[]> => {
    const response = await api.get<Event[]>('/api/events', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Event> => {
    const response = await api.get<Event>(`/api/events/${id}`);
    return response.data;
  },

  create: async (formData: FormData): Promise<Event> => {
    const response = await api.post<Event>('/api/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, formData: FormData): Promise<Event> => {
    const response = await api.put<Event>(`/api/events/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/events/${id}`);
  },

  rsvp: async (eventId: string, status: 'going' | 'interested' | 'maybe'): Promise<RSVP> => {
    const response = await api.post<RSVP>(`/api/events/${eventId}/rsvp`, { status });
    return response.data;
  },

  cancelRsvp: async (eventId: string): Promise<void> => {
    await api.delete(`/api/events/${eventId}/rsvp`);
  },

  getAttendees: async (eventId: string): Promise<RSVP[]> => {
    const response = await api.get<RSVP[]>(`/api/events/${eventId}/attendees`);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/api/users/${id}`);
    return response.data;
  },

  getEvents: async (id: string): Promise<Event[]> => {
    const response = await api.get<Event[]>(`/api/users/${id}/events`);
    return response.data;
  },
};

// Recommendations API
export const recoAPI = {
  getFeed: async (request: RecommendationRequest): Promise<ScoredEvent[]> => {
    const response = await api.post<ScoredEvent[]>('/api/reco/feed', request);
    return response.data;
  },

  recordFeedback: async (data: InteractionRequest): Promise<void> => {
    await api.post('/api/reco/feedback', data);
  },
};

// Helper function to get user location
export const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // Default to Montreal downtown
      resolve({ lat: 45.5017, lng: -73.5673 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Default to Montreal downtown on error
        resolve({ lat: 45.5017, lng: -73.5673 });
      }
    );
  });
};

export default api;
