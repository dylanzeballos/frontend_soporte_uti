import type { QueryClient } from '@tanstack/react-query';

const reportQueryKeys = [
  ['reports'],
  ['ticket-report'],
  ['technician-reports'],
  ['technician-dashboard', 'reports'],
  ['admin-reports'],
] as const;

export function invalidateReportCaches(queryClient: QueryClient) {
  for (const queryKey of reportQueryKeys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}
