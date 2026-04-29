import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, normalizeCollectionResponse } from '@/lib/api';
import type { Service, CreateServiceInput } from '@/features/services/schemas';

export interface ServiceItem {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

const SERVICES_KEY = 'services';

type ServicesFilters = {
  isActive?: boolean;
  limit?: number;
};

function buildServicesParams(filters?: ServicesFilters) {
  const queryParams = new URLSearchParams();
  if (typeof filters?.isActive === 'boolean') queryParams.set('isActive', String(filters.isActive));
  if (filters?.limit) queryParams.set('limit', String(Math.min(filters.limit, 100)));
  return queryParams.toString();
}

export function useServicesQuery(filters: ServicesFilters = { isActive: true }) {
  const queryString = buildServicesParams(filters);

  return useQuery({
    queryKey: [SERVICES_KEY, filters],
    queryFn: async () => {
      const response = await apiRequest<Service[] | { data?: Service[]; items?: Service[] }>({
        url: queryString ? `/services?${queryString}` : '/services',
      });
      return normalizeCollectionResponse(response);
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
