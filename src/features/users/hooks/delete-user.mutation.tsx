import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useUsers } from '@/hooks/useApi';

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  const { remove } = useUsers();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      toast.success('Usuario archivado correctamente');
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}