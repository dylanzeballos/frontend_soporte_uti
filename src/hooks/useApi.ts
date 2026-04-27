import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Ticket } from '@/features/tickets/schemas/ticket.schema';
import type { CreateTicketInput, UpdateTicketStatusInput, AssignTicketInput } from '@/features/tickets/schemas/ticket.schema';
import type { UpdateTicketInput } from '@/features/tickets/schemas/ticket.schema';
import type { TicketFilter } from '@/features/tickets/schemas/ticket.schema';
import type { User, CreateUserInput } from '@/features/users/schemas';
import type { LoginInput } from '@/features/auth/schemas/login.schema';
import type { CreateRoleInput } from '@/features/roles/schemas';
import type { CreateServiceInput } from '@/features/services/schemas';
import type { CreateUnitInput, Unit, UpdateUnitInput } from '@/features/units/schemas';

export interface ServiceItem {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface RoleItem {
  id: number;
  name: string;
  description?: string | null;
}

interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
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

  const list = useCallback(async (filters?: Partial<TicketFilter>): Promise<Ticket[]> => {
    setIsLoading(true);
    const query = new URLSearchParams();
    const safeLimit = filters?.limit ? Math.min(filters.limit, 100) : undefined;
    if (filters?.page) query.set('page', String(filters.page));
    if (safeLimit) query.set('limit', String(safeLimit));
    if (filters?.status) query.set('status', filters.status);
    if (filters?.priority) query.set('priority', filters.priority);
    if (filters?.assignedToId) query.set('assignedToId', String(filters.assignedToId));
    if (filters?.createdById) query.set('createdById', String(filters.createdById));
    if (filters?.excludeCreatedById) query.set('excludeCreatedById', String(filters.excludeCreatedById));
    if (filters?.search) query.set('search', filters.search);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const result = await fetchApi<Ticket[] | { data: Ticket[] } | PaginatedResponse<Ticket> | null>(`/tickets${suffix}`);
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
    setIsLoading(true);
    try {
      const result = await fetchApi<Ticket>(`/tickets/${id}/status`, 'PATCH', data);
      return ensureData(result, 'No se pudo cambiar el estado del ticket');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const assign = useCallback(async (id: number, data: AssignTicketInput) => {
    setIsLoading(true);
    try {
      const result = await fetchApi<Ticket>(`/tickets/${id}/assign`, 'PATCH', data);
      return ensureData(result, 'No se pudo asignar el ticket');
    } finally {
      setIsLoading(false);
    }
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
    const result = await fetchApi<ServiceItem[] | { data: ServiceItem[] } | PaginatedResponse<ServiceItem> | null>('/services?isActive=true');
    setIsLoading(false);
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result) {
      return (result.data as ServiceItem[]) ?? [];
    }
    return [];
  }, []);

  const findOne = useCallback(async (id: number): Promise<ServiceItem | null> => {
    return await fetchApi<ServiceItem>(`/services/${id}`);
  }, []);

  const create = useCallback(async (data: CreateServiceInput) => {
    setIsLoading(true);
    const result = await fetchApi<ServiceItem>('/services', 'POST', data);
    setIsLoading(false);
    return result;
  }, []);

  const update = useCallback(async (id: number, data: CreateServiceInput) => {
    setIsLoading(true);
    const result = await fetchApi<ServiceItem>(`/services/${id}`, 'PATCH', data);
    setIsLoading(false);
    return result;
  }, []);

  const remove = useCallback(async (id: number) => {
    setIsLoading(true);
    const result = await fetchApi<{ message: string }>(`/services/${id}`, 'DELETE');
    setIsLoading(false);
    return result;
  }, []);

  return { list, findOne, create, update, remove, isLoading };
}

export function useRoles() {
  const [isLoading, setIsLoading] = useState(false);

  const list = useCallback(async (): Promise<RoleItem[]> => {
    setIsLoading(true);
    const result = await fetchApi<RoleItem[] | { data: RoleItem[] } | PaginatedResponse<RoleItem> | null>('/roles');
    setIsLoading(false);
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result) {
      return (result.data as RoleItem[]) ?? [];
    }
    return [];
  }, []);

  const findOne = useCallback(async (id: number): Promise<RoleItem | null> => {
    return await fetchApi<RoleItem>(`/roles/${id}`);
  }, []);

  const create = useCallback(async (data: CreateRoleInput) => {
    setIsLoading(true);
    const result = await fetchApi<RoleItem>('/roles', 'POST', data);
    setIsLoading(false);
    return result;
  }, []);

  const update = useCallback(async (id: number, data: CreateRoleInput) => {
    setIsLoading(true);
    const result = await fetchApi<RoleItem>(`/roles/${id}`, 'PATCH', data);
    setIsLoading(false);
    return result;
  }, []);

  const remove = useCallback(async (id: number) => {
    setIsLoading(true);
    const result = await fetchApi<{ message: string }>(`/roles/${id}`, 'DELETE');
    setIsLoading(false);
    return result;
  }, []);

  return { list, findOne, create, update, remove, isLoading };
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

export function useUnits() {
  const [isLoading, setIsLoading] = useState(false);

  const list = useCallback(async (): Promise<Unit[]> => {
    setIsLoading(true);
    const result = await fetchApi<Unit[] | { data: Unit[] } | null>('/units?isActive=true');
    setIsLoading(false);
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result) {
      return (result.data as Unit[]) ?? [];
    }
    return [];
  }, []);

  const findOne = useCallback(async (id: number): Promise<Unit | null> => {
    return await fetchApi<Unit>(`/units/${id}`);
  }, []);

  const create = useCallback(async (data: CreateUnitInput) => {
    setIsLoading(true);
    const result = await fetchApi<Unit>('/units', 'POST', data);
    setIsLoading(false);
    return result;
  }, []);

  const update = useCallback(async (id: number, data: UpdateUnitInput) => {
    setIsLoading(true);
    const result = await fetchApi<Unit>(`/units/${id}`, 'PATCH', data);
    setIsLoading(false);
    return result;
  }, []);

  const remove = useCallback(async (id: number) => {
    setIsLoading(true);
    const result = await fetchApi<{ message: string }>(`/units/${id}`, 'DELETE');
    setIsLoading(false);
    return result;
  }, []);

  return { list, findOne, create, update, remove, isLoading };
}
