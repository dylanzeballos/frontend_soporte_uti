import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Role, CreateRoleInput } from '@/features/roles/schemas';

export interface RoleItem {
  id: number;
  name: string;
  description?: string | null;
  permissions?: string[];
}

const ROLES_KEY = 'roles';

export function useRolesQuery() {
  return useQuery({
    queryKey: [ROLES_KEY],
    queryFn: async () => {
      const response = await apiRequest<Role[]>({ url: '/roles' });
      return Array.isArray(response) ? response : [];
    },
  });
}

export function useRoleQuery(id: number) {
  return useQuery({
    queryKey: [ROLES_KEY, id],
    queryFn: () => apiRequest<Role>({ url: `/roles/${id}` }),
    enabled: !!id,
  });
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleInput) =>
      apiRequest<Role>({ url: '/roles', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateRoleInput }) =>
      apiRequest<Role>({ url: `/roles/${id}`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<{ message: string }>({ url: `/roles/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROLES_KEY] });
    },
  });
}
