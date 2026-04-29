import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Unit, CreateUnitInput, UpdateUnitInput } from '@/features/units/schemas';

const UNITS_KEY = 'units';

export function useUnitsQuery() {
  return useQuery({
    queryKey: [UNITS_KEY],
    queryFn: async () => {
      const response = await apiRequest<Unit[]>({ url: '/units?isActive=true' });
      return Array.isArray(response) ? response : [];
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
