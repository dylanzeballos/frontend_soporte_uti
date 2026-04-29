import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface CorporationItem {
  id: number;
  name: string;
  isActive?: boolean;
}

const CORPORATIONS_KEY = 'corporations';

export function useCorporationsQuery() {
  return useQuery({
    queryKey: [CORPORATIONS_KEY],
    queryFn: async () => {
      const response = await apiRequest<CorporationItem[]>({ url: '/corporations?isActive=true' });
      return Array.isArray(response) ? response : [];
    },
  });
}

export function useCorporationQuery(id: number) {
  return useQuery({
    queryKey: [CORPORATIONS_KEY, id],
    queryFn: () => apiRequest<CorporationItem>({ url: `/corporations/${id}` }),
    enabled: !!id,
  });
}
