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
      void queryClient.invalidateQueries({ queryKey: ['my-tickets', user?.id] });
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
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-5 sm:px-8 sm:py-5">
        <div className="relative z-10">
          <div className="editorial-kicker">
            <ClipboardPenLine className="h-3.5 w-3.5" />
            Solicitud
          </div>
          <h1 className="mt-2 text-[clamp(1.9rem,2.9vw,2.9rem)] font-bold tracking-[-0.02em] text-foreground">
            Solicitar ticket
          </h1>
        </div>
      </section>

      <TicketForm
        key={formKey}
        variant="request"
        isSubmitting={createMutation.isPending}
        serviceOptions={serviceOptions}
        submitLabel="Enviar solicitud"
        className="rounded-[var(--radius-panel)]"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
