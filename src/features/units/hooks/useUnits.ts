import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, normalizeCollectionResponse } from '@/lib/api';
import type { Unit, CreateUnitInput, UpdateUnitInput } from '@/features/units/schemas';

const UNITS_KEY = 'units';

type UnitsFilters = {
  isActive?: boolean;
  limit?: number;
};

function buildUnitsParams(filters?: UnitsFilters) {
  const queryParams = new URLSearchParams();
  if (typeof filters?.isActive === 'boolean') queryParams.set('isActive', String(filters.isActive));
  if (filters?.limit) queryParams.set('limit', String(Math.min(filters.limit, 100)));
  return queryParams.toString();
}

export function useUnitsQuery(filters: UnitsFilters = { isActive: true }) {
  const queryString = buildUnitsParams(filters);

  return useQuery({
    queryKey: [UNITS_KEY, filters],
    queryFn: async () => {
      const response = await apiRequest<Unit[] | { data?: Unit[]; items?: Unit[] }>({
        url: queryString ? `/units?${queryString}` : '/units',
      });
      return normalizeCollectionResponse(response);
    },
  });
}

export function useUnitQuery(id: number) {
  return useQuery({
    queryKey: [UNITS_KEY, id],
    queryFn: () => apiRequest<Unit>({ url: `/units/${id}` }),
    enabled: !!id,
  });
}

export function useCreateUnitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUnitInput) =>
      apiRequest<Unit>({ url: '/units', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNITS_KEY] });
    },
  });
}

export function useUpdateUnitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUnitInput }) =>
      apiRequest<Unit>({ url: `/units/${id}`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNITS_KEY] });
    },
  });
}

export function useDeleteUnitMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>({ url: `/units/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UNITS_KEY] });
    },
  });
}
