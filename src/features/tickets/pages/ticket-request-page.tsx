import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardPenLine } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth-context';
import { TicketForm, type TicketSelectOption } from '@/features/tickets/components';
import type { Ticket, TicketFormValues } from '@/features/tickets/schemas/ticket.schema';
import { useTickets } from '@/hooks/useApi';

function buildServiceOptions(tickets: Ticket[]): TicketSelectOption[] {
  const serviceMap = new Map<number, TicketSelectOption>();

  tickets.forEach((ticket) => {
    if (ticket.service) {
      serviceMap.set(ticket.service.id, {
        value: ticket.service.id,
        label: ticket.service.name,
      });
    }
  });

  return Array.from(serviceMap.values());
}

export function TicketRequestPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { list, create } = useTickets();
  const [formKey, setFormKey] = useState(0);

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: list,
  });

  const createMutation = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success('Solicitud enviada correctamente');
      setFormKey((current) => current + 1);
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const serviceOptions = buildServiceOptions(tickets);

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
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <ClipboardPenLine className="h-3.5 w-3.5" />
          Solicitud
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Solicitar ticket</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Esta vista es para el usuario que reporta un problema. Solo pide la informacion necesaria para registrar la solicitud y dejar la clasificacion interna al equipo admin.
          </p>
        </div>
      </section>

      <TicketForm
        key={formKey}
        variant="request"
        isSubmitting={createMutation.isPending}
        serviceOptions={serviceOptions}
        submitLabel="Enviar solicitud"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
