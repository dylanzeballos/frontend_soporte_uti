import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { Report, CreateReportInput, UpdateReportInput, ReportStatsResponse } from '@/features/reports/schemas';
import type { PaginatedResponse } from '@/lib/api';

const REPORTS_KEY = 'reports';

export function useReportsQuery() {
  return useQuery({
    queryKey: [REPORTS_KEY],
    queryFn: async () => {
      const response = await apiRequest<Report[]>({ url: '/reports' });
      return Array.isArray(response) ? response : [];
    },
  });
}

export function usePaginatedReportsQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: [REPORTS_KEY, 'paginated', page, limit],
    queryFn: async () => {
      const response = await apiRequest<Report[] | PaginatedResponse<Report>>({ url: `/reports?page=${page}&limit=${limit}` });
      if (Array.isArray(response)) {
        return { page, limit, total: response.length, data: response } as PaginatedResponse<Report>;
      }
      return response;
    },
  });
}

export function useReportQuery(id: number) {
  return useQuery({
    queryKey: [REPORTS_KEY, id],
    queryFn: () => apiRequest<Report>({ url: `/reports/${id}` }),
    enabled: !!id,
  });
}

export function useCreateReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportInput) =>
      apiRequest<Report>({ url: '/reports', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REPORTS_KEY] });
    },
  });
}

export function useUpdateReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateReportInput }) =>
      apiRequest<Report>({ url: `/reports/${id}`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REPORTS_KEY] });
    },
  });
}

export function useDeleteReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest<null>({ url: `/reports/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REPORTS_KEY] });
    },
  });
}

export function useReportStatsQuery() {
  return useQuery({
    queryKey: [REPORTS_KEY, 'stats'],
    queryFn: () => apiRequest<ReportStatsResponse>({ url: '/reports/stats' }),
  });
}
