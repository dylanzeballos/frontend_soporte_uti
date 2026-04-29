import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { User, CreateUserInput, UpdateUserInput } from '@/features/users/schemas';
import type { PaginatedResponse } from '@/lib/api';

const USERS_KEY = 'users';

export function useUsersQuery(filters?: { page?: number; limit?: number; isActive?: boolean }) {
  const queryParams = new URLSearchParams();
  const page = filters?.page ?? 1;
  const limit = Math.min(filters?.limit ?? 20, 100);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (typeof filters?.isActive === 'boolean') queryParams.set('isActive', String(filters.isActive));

  return useQuery({
    queryKey: [USERS_KEY, filters],
    queryFn: async () => {
      const response = await apiRequest<User[] | PaginatedResponse<User>>({ url: `/users?${queryParams.toString()}` });
      if (Array.isArray(response)) {
        return { page, limit, total: response.length, data: response };
      }
      return response;
    },
  });
}

export function useUserQuery(id: number) {
  return useQuery({
    queryKey: [USERS_KEY, id],
    queryFn: () => apiRequest<User>({ url: `/users/${id}` }),
    enabled: !!id,
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      apiRequest<User>({ url: '/users', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserInput }) =>
      apiRequest<User>({ url: `/users/${id}`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<null>({ url: `/users/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}
