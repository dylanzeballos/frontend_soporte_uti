import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message || error.message || 'Error de conexión';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Generic API request function
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<T>(config);
  return response.data?.data;
}

// Helper to normalize paginated responses
export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

export function normalizePaginatedResponse<T>(
  result: T[] | PaginatedResponse<T> | { data?: T[] | PaginatedResponse<T>; items?: T[] } | null,
  fallbackPage = 1,
  fallbackLimit = 20
): PaginatedResponse<T> {
  if (!result) {
    return { page: fallbackPage, limit: fallbackLimit, total: 0, data: [] };
  }

  if (Array.isArray(result)) {
    return { page: fallbackPage, limit: fallbackLimit, total: result.length, data: result };
  }

  if ('items' in result && Array.isArray(result.items)) {
    return {
      page: fallbackPage,
      limit: fallbackLimit,
      total: result.items.length,
      data: result.items,
    };
  }

  if ('data' in result) {
    const data = result.data;
    if (Array.isArray(data)) {
      return { page: fallbackPage, limit: fallbackLimit, total: data.length, data };
    }
    if (data && typeof data === 'object' && 'data' in data) {
      return {
        page: typeof data.page === 'number' ? data.page : fallbackPage,
        limit: typeof data.limit === 'number' ? data.limit : fallbackLimit,
        total: typeof data.total === 'number' ? data.total : (data.data?.length ?? 0),
        data: data.data ?? [],
      };
    }
  }

  return { page: fallbackPage, limit: fallbackLimit, total: 0, data: [] };
}

export function normalizeCollectionResponse<T>(
  result: T[] | { data?: T[]; items?: T[] } | null
): T[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if ('items' in result && Array.isArray(result.items)) return result.items;
  if ('data' in result && Array.isArray(result.data)) return result.data;
  return [];
}
