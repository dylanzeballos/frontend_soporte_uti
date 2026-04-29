import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
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
      const response = await apiRequest<Ticket[]>({ url: '/tickets' });
      return Array.isArray(response) ? response : [];
    },
  });
}

export function useFilteredTicketsQuery(filters?: Partial<TicketFilter>) {
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
      if (Array.isArray(response)) {
        return { data: response, page: 1, limit: 100, total: response.length };
      }
      if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        return response as PaginatedResponse<Ticket>;
      }
      return { data: [], page: 1, limit: 100, total: 0 };
    },
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
