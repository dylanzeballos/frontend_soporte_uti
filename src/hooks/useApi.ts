import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Ticket } from '@/features/tickets/schemas/ticket.schema';
import type { CreateTicketInput, UpdateTicketStatusInput, AssignTicketInput } from '@/features/tickets/schemas/ticket.schema';
import type { UpdateTicketInput } from '@/features/tickets/schemas/ticket.schema';
import type { TicketFilter } from '@/features/tickets/schemas/ticket.schema';
import type { User, CreateUserInput, UpdateUserInput } from '@/features/users/schemas';
import type { LoginInput } from '@/features/auth/schemas/login.schema';
import type { CreateRoleInput } from '@/features/roles/schemas';
import type { CreateServiceInput } from '@/features/services/schemas';
import type { CreateUnitInput, Unit, UpdateUnitInput } from '@/features/units/schemas';
import type {
  ComponentCatalogFilter,
  ComponentCatalogItem,
  CreateReportInput,
  Report,
  ReportFilter,
  UpdateReportInput,
} from '@/features/reports/schemas';

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

export interface CorporationItem {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

type ApiCollectionResponse<T> =
  | T[]
  | PaginatedResponse<T>
  | {
      data?: T[] | PaginatedResponse<T> | null;
      items?: T[];
      page?: number;
      limit?: number;
      total?: number;
    }
  | null;

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

function normalizeCollection<T>(result: ApiCollectionResponse<T>): T[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if ('items' in result && Array.isArray(result.items)) return result.items;
  if ('data' in result) {
    if (Array.isArray(result.data)) return result.data;
    if (result.data && typeof result.data === 'object' && 'data' in result.data) {
      return result.data.data ?? [];
    }
  }
  return [];
}

function normalizePaginated<T>(
  result: ApiCollectionResponse<T>,
  fallbackPage: number,
  fallbackLimit: number
): PaginatedResponse<T> {
  if (!result) {
    return { page: fallbackPage, limit: fallbackLimit, total: 0, data: [] };
  }

  if (Array.isArray(result)) {
    return { page: fallbackPage, limit: fallbackLimit, total: result.length, data: result };
  }

  if ('data' in result && result.data && typeof result.data === 'object' && !Array.isArray(result.data) && 'data' in result.data) {
    return {
      page: typeof result.data.page === 'number' ? result.data.page : fallbackPage,
      limit: typeof result.data.limit === 'number' ? result.data.limit : fallbackLimit,
      total: typeof result.data.total === 'number' ? result.data.total : (result.data.data?.length ?? 0),
      data: result.data.data ?? [],
    };
  }

  const data = normalizeCollection(result);
  return {
    page: typeof result.page === 'number' ? result.page : fallbackPage,
    limit: typeof result.limit === 'number' ? result.limit : fallbackLimit,
    total: typeof result.total === 'number' ? result.total : data.length,
    data,
  };
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
    if (typeof filters?.unassigned === 'boolean') query.set('unassigned', String(filters.unassigned));
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

  const listPaginated = useCallback(async (filters?: { page?: number; limit?: number; isActive?: boolean }): Promise<PaginatedResponse<User>> => {
    setIsLoading(true);
    try {
      const page = filters?.page && filters.page > 0 ? filters.page : 1;
      const limit = filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (typeof filters?.isActive === 'boolean') {
        query.set('isActive', String(filters.isActive));
      }

      const result = await fetchApi<ApiCollectionResponse<User>>(`/users?${query.toString()}`);
      return normalizePaginated(result, page, limit);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const list = useCallback(async (filters?: { page?: number; limit?: number; isActive?: boolean }): Promise<User[]> => {
    const result = await listPaginated(filters);
    return result.data;
  }, [listPaginated]);

  const findOne = useCallback(async (id: number): Promise<User | null> => {
    return await fetchApi<User>(`/users/${id}`);
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

  const update = useCallback(async (id: number, data: UpdateUserInput) => {
    setIsLoading(true);
    try {
      const result = await fetchApi<User>(`/users/${id}`, 'PATCH', data);
      return ensureData(result, 'No se pudo actualizar el usuario');
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

  return { list, listPaginated, findOne, create, update, remove, isLoading };
}

export function useCorporations() {
  const [isLoading, setIsLoading] = useState(false);

  const list = useCallback(async (): Promise<CorporationItem[]> => {
    setIsLoading(true);
    try {
      const result = await fetchApi<ApiCollectionResponse<CorporationItem>>('/corporations?isActive=true');
      return normalizeCollection(result);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findOne = useCallback(async (id: number): Promise<CorporationItem | null> => {
    return await fetchApi<CorporationItem>(`/corporations/${id}`);
  }, []);

  return { list, findOne, isLoading };
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

export function useComponents() {
  const [isLoading, setIsLoading] = useState(false);

  const list = useCallback(async (filters?: ComponentCatalogFilter): Promise<ComponentCatalogItem[]> => {
    setIsLoading(true);
    const query = new URLSearchParams();
    const safeLimit = filters?.limit ? Math.min(filters.limit, 100) : undefined;
    if (filters?.page) query.set('page', String(filters.page));
    if (safeLimit) query.set('limit', String(safeLimit));
    if (typeof filters?.isActive === 'boolean') query.set('isActive', String(filters.isActive));
    if (filters?.search) query.set('search', filters.search);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const result = await fetchApi<ComponentCatalogItem[] | { data: ComponentCatalogItem[] } | PaginatedResponse<ComponentCatalogItem> | null>(`/components${suffix}`);
    setIsLoading(false);
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result) {
      return (result.data as ComponentCatalogItem[]) ?? [];
    }
    return [];
  }, []);

  return { list, isLoading };
}

export function useReports() {
  const [isLoading, setIsLoading] = useState(false);

  const list = useCallback(async (filters?: Partial<ReportFilter>): Promise<Report[]> => {
    setIsLoading(true);
    const query = new URLSearchParams();
    const safeLimit = filters?.limit ? Math.min(filters.limit, 100) : undefined;
    if (filters?.page) query.set('page', String(filters.page));
    if (safeLimit) query.set('limit', String(safeLimit));
    if (filters?.ticketId) query.set('ticketId', String(filters.ticketId));
    if (filters?.createdById) query.set('createdById', String(filters.createdById));
    if (filters?.componentId) query.set('componentId', String(filters.componentId));
    if (filters?.ticketStatus) query.set('ticketStatus', filters.ticketStatus);
    if (filters?.fromDate) query.set('fromDate', filters.fromDate);
    if (filters?.toDate) query.set('toDate', filters.toDate);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const result = await fetchApi<Report[] | { data: Report[] } | PaginatedResponse<Report> | null>(`/reports${suffix}`);
    setIsLoading(false);
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (result && typeof result === 'object' && 'data' in result) {
      return (result.data as Report[]) ?? [];
    }
    return [];
  }, []);

  const findOne = useCallback(async (id: number): Promise<Report | null> => {
    return await fetchApi<Report>(`/reports/${id}`);
  }, []);

  const findByTicketId = useCallback(async (ticketId: number): Promise<Report | null> => {
    const reports = await list({ ticketId, limit: 1 });
    const match = reports[0];
    if (!match?.id) {
      return null;
    }

    return await findOne(match.id);
  }, [findOne, list]);

  const create = useCallback(async (data: CreateReportInput) => {
    setIsLoading(true);
    try {
      const result = await fetchApi<Report>('/reports', 'POST', data);
      return ensureData(result, 'No se pudo crear el reporte');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, data: UpdateReportInput) => {
    setIsLoading(true);
    try {
      const result = await fetchApi<Report>(`/reports/${id}`, 'PATCH', data);
      return ensureData(result, 'No se pudo actualizar el reporte');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { list, findOne, findByTicketId, create, update, isLoading };
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
