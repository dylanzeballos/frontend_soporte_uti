import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, normalizeCollectionResponse, normalizePaginatedResponse } from '@/lib/api';
import type {
  Ticket,
  CreateTicketInput,
  UpdateTicketInput,
  UpdateTicketStatusInput,
  AssignTicketInput,
  TicketFilter,
} from '@/features/tickets/schemas';
import type { PaginatedResponse } from '@/lib/api';

const TICKETS_KEY = 'tickets';

export function useTicketsQuery() {
  return useQuery({
    queryKey: [TICKETS_KEY],
    queryFn: async () => {
      const response = await apiRequest<Ticket[] | { data?: Ticket[]; items?: Ticket[] }>({ url: '/tickets' });
      return normalizeCollectionResponse(response);
    },
  });
}

export function useFilteredTicketsQuery(filters?: Partial<TicketFilter> & { enabled?: boolean }) {
  const queryParams = new URLSearchParams();
  if (filters?.page) queryParams.set('page', String(filters.page));
  if (filters?.limit) queryParams.set('limit', String(Math.min(filters?.limit || 20, 100)));
  if (filters?.status) queryParams.set('status', filters.status);
  if (filters?.priority) queryParams.set('priority', filters.priority);
  if (filters?.assignedToId) queryParams.set('assignedToId', String(filters.assignedToId));
  if (typeof filters?.unassigned === 'boolean') queryParams.set('unassigned', String(filters.unassigned));
  if (filters?.createdById) queryParams.set('createdById', String(filters.createdById));
  if (filters?.excludeCreatedById) queryParams.set('excludeCreatedById', String(filters.excludeCreatedById));
  if (filters?.search) queryParams.set('search', filters.search);

  return useQuery({
    queryKey: [TICKETS_KEY, 'filtered', filters],
    queryFn: async (): Promise<PaginatedResponse<Ticket>> => {
      const response = await apiRequest<PaginatedResponse<Ticket> | Ticket[]>({ url: `/tickets?${queryParams.toString()}` });
      return normalizePaginatedResponse(response, filters?.page ?? 1, Math.min(filters?.limit ?? 20, 100));
    },
    enabled: filters?.enabled ?? true,
  });
}

export function useTicketQuery(id: number) {
  return useQuery({
    queryKey: [TICKETS_KEY, id],
    queryFn: () => apiRequest<Ticket>({ url: `/tickets/${id}` }),
    enabled: !!id,
  });
}

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTicketInput) =>
      apiRequest<Ticket>({ url: '/tickets', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_KEY] });
    },
  });
}

export function useUpdateTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketInput }) =>
      apiRequest<Ticket>({ url: `/tickets/${id}`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_KEY] });
    },
  });
}

export function useUpdateTicketStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketStatusInput }) =>
      apiRequest<Ticket>({ url: `/tickets/${id}/status`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_KEY] });
    },
  });
}

export function useAssignTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignTicketInput }) =>
      apiRequest<Ticket>({ url: `/tickets/${id}/assign`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_KEY] });
    },
  });
}
