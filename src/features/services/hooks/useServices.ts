import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Service, CreateServiceInput } from '@/features/services/schemas';

export interface ServiceItem {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

const SERVICES_KEY = 'services';

export function useServicesQuery() {
  return useQuery({
    queryKey: [SERVICES_KEY],
    queryFn: async () => {
      const response = await apiRequest<Service[]>({ url: '/services?isActive=true' });
      return Array.isArray(response) ? response : [];
    },
  });
}

export function useServiceQuery(id: number) {
  return useQuery({
    queryKey: [SERVICES_KEY, id],
    queryFn: () => apiRequest<Service>({ url: `/services/${id}` }),
    enabled: !!id,
  });
}

export function useCreateServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceInput) =>
      apiRequest<Service>({ url: '/services', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] });
    },
  });
}

export function useUpdateServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateServiceInput }) =>
      apiRequest<Service>({ url: `/services/${id}`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] });
    },
  });
}

export function useDeleteServiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>({ url: `/services/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SERVICES_KEY] });
    },
  });
}
