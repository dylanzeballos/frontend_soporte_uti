import { useQuery } from '@tanstack/react-query';


export interface SidebarCounts {
  unassigned: number;
  myAssignments: number;
  openTickets: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function fetchCountsSilently(): Promise<SidebarCounts> {
  const token = localStorage.getItem('accessToken');
  if (!token) return { unassigned: 0, myAssignments: 0, openTickets: 0 };

  try {
    const response = await fetch(`${API_URL}/tickets/stats/counts`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    if (!response.ok) return { unassigned: 0, myAssignments: 0, openTickets: 0 };
    const data = await response.json();
    return {
      unassigned: data.unassigned ?? 0,
      myAssignments: data.myAssignments ?? 0,
      openTickets: data.openTickets ?? 0,
    };
  } catch {
    return { unassigned: 0, myAssignments: 0, openTickets: 0 };
  }
}

export function useSidebarCounts() {
  return useQuery<SidebarCounts>({
    queryKey: ['sidebar-counts'],
    queryFn: fetchCountsSilently,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
