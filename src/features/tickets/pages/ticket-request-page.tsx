import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardPenLine } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth-context';
import { TicketForm, type TicketSelectOption } from '@/features/tickets/components';
import type { TicketFormValues } from '@/features/tickets/schemas/ticket.schema';
import { useServices, useTickets } from '@/hooks/useApi';

export function TicketRequestPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { create } = useTickets();
  const { list: listServices } = useServices();
  const [formKey, setFormKey] = useState(0);

  const { data: serviceOptions = [] } = useQuery<TicketSelectOption[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const services = await listServices();
      return services.map((service) => ({
        value: service.id,
        label: service.name,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Solicitud enviada correctamente');
      setFormKey((current) => current + 1);
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handleSubmit = async (values: TicketFormValues) => {
    await createMutation.mutateAsync({
      ...values,
      status: 'open',
      priority: 'medium',
      assignedToId: null,
      emitterId: user?.id ?? null,
      slaMinutes: null,
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="editorial-surface rounded-md px-6 py-6 sm:px-8 sm:py-8">
        <div className="editorial-kicker">
          <ClipboardPenLine className="h-3.5 w-3.5" />
          Solicitud
        </div>
        <h1 className="mt-5 text-[clamp(1.8rem,2.9vw,2.8rem)] font-bold tracking-[-0.02em] text-foreground">
          Solicitar ticket
        </h1>
      </section>

      <TicketForm
        key={formKey}
        variant="request"
        isSubmitting={createMutation.isPending}
        serviceOptions={serviceOptions}
        submitLabel="Enviar solicitud"
        className="rounded-md"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
