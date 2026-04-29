import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, normalizeCollectionResponse } from '@/lib/api';
import type { Component, CreateComponentInput, UpdateComponentInput } from '@/features/components/schemas';

const COMPONENTS_KEY = 'components';

export function useComponentsQuery() {
  return useQuery({
    queryKey: [COMPONENTS_KEY],
    queryFn: async () => {
      const response = await apiRequest<Component[] | { data?: Component[]; items?: Component[] }>({
        url: '/components?isActive=true',
      });
      return normalizeCollectionResponse(response);
    },
  });
}

export function useComponentQuery(id: number) {
  return useQuery({
    queryKey: [COMPONENTS_KEY, id],
    queryFn: () => apiRequest<Component>({ url: `/components/${id}` }),
    enabled: !!id,
  });
}

export function useCreateComponentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateComponentInput) =>
      apiRequest<Component>({ url: '/components', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPONENTS_KEY] });
    },
  });
}

export function useUpdateComponentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateComponentInput }) =>
      apiRequest<Component>({ url: `/components/${id}`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPONENTS_KEY] });
    },
  });
}

export function useDeleteComponentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>({ url: `/components/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPONENTS_KEY] });
    },
  });
}
