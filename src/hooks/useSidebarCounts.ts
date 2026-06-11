import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/hooks/useApi';

export interface SidebarCounts {
  unassigned: number;
  myAssignments: number;
  openTickets: number;
}

export function useSidebarCounts() {
  return useQuery<SidebarCounts>({
    queryKey: ['sidebar-counts'],
    queryFn: async () => {
      const result = await fetchApi<SidebarCounts>('/tickets/stats/counts');
      return result ?? { unassigned: 0, myAssignments: 0, openTickets: 0 };
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
