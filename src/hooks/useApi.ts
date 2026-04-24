import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Ticket } from '@/features/tickets/schemas/ticket.schema';
import type { CreateTicketInput, UpdateTicketStatusInput, AssignTicketInput } from '@/features/tickets/schemas/ticket.schema';
import type { UpdateTicketInput } from '@/features/tickets/schemas/ticket.schema';
import type { User, CreateUserInput } from '@/features/users/schemas';
import type { LoginInput } from '@/features/auth/schemas/login.schema';

export interface ServiceItem {
  id: number;
  name: string;
  isActive?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

const handleError = (error: Error) => {
  const message = error.message || 'Error de conexión';
  toast.error(message);
};

export async function fetchApi<T>(endpoint: string, method = 'GET', body?: unknown): Promise<T | null> {
  const token = getToken();

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      handleError(error);
      return null;
    }

    const data = await response.json().catch(() => null) as T;
    return data;
  } catch (error) {
    handleError(error as Error);
    return null;
  }
}

function ensureData<T>(response: T | null, fallbackMessage: string): T {
  if (response === null) {
    throw new Error(fallbackMessage);
  }

  return response;
}

export function useTickets() {
  const [isLoading, setIsLoading] = useState(false);

  const list = useCallback(async (): Promise<Ticket[]> => {
    setIsLoading(true);
    const result = await fetchApi<Ticket[] | { data: Ticket[] } | null>('/tickets');
    setIsLoading(false);
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result) {
      return (result.data as Ticket[]) ?? [];
    }
    return [];
  }, []);

  const create = useCallback(async (data: CreateTicketInput) => {
    setIsLoading(true);
    try {
      const result = await fetchApi<Ticket>('/tickets', 'POST', data);
      return ensureData(result, 'No se pudo crear el ticket');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, data: UpdateTicketInput) => {
    setIsLoading(true);
    try {
      const result = await fetchApi<Ticket>(`/tickets/${id}`, 'PATCH', data);
      return ensureData(result, 'No se pudo actualizar el ticket');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: number, data: UpdateTicketStatusInput) => {
    return await fetchApi<Ticket>(`/tickets/${id}/status`, 'PATCH', data);
  }, []);

  const assign = useCallback(async (id: number, data: AssignTicketInput) => {
    return await fetchApi<Ticket>(`/tickets/${id}/assign`, 'PATCH', data);
  }, []);

  return { list, create, update, updateStatus, assign, isLoading };
}

export function useUsers() {
  const [isLoading, setIsLoading] = useState(false);

  const list = useCallback(async (): Promise<User[]> => {
    setIsLoading(true);
    const result = await fetchApi<User[] | { data: User[] } | null>('/users');
    setIsLoading(false);
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result) {
      return (result.data as User[]) ?? [];
    }
    return [];
  }, []);

  const create = useCallback(async (data: CreateUserInput) => {
    setIsLoading(true);
    try {
      const result = await fetchApi<User>('/users', 'POST', data);
      return ensureData(result, 'No se pudo crear el usuario');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      await fetchApi<null>(`/users/${id}`, 'DELETE');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { list, create, remove, isLoading };
}

export function useServices() {
  const [isLoading, setIsLoading] = useState(false);

  const list = useCallback(async (): Promise<ServiceItem[]> => {
    setIsLoading(true);
    const result = await fetchApi<ServiceItem[] | { data: ServiceItem[] } | null>('/services');
    setIsLoading(false);
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result) {
      return (result.data as ServiceItem[]) ?? [];
    }
    return [];
  }, []);

  return { list, isLoading };
}

export function useAuthApi() {
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (data: LoginInput) => {
    setIsLoading(true);
    const result = await fetchApi<{ accessToken: string }>('/auth/login', 'POST', data);
    setIsLoading(false);
    return result;
  }, []);

  return { login, isLoading };
}
