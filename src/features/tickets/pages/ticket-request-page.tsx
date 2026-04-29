import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardPenLine } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth-context';
import { TicketForm } from '@/features/tickets/components';
import type { TicketFormValues } from '@/features/tickets/schemas/ticket.schema';
import { useServicesQuery } from '@/features/services/hooks';
import { useCreateTicketMutation } from '@/features/tickets/hooks';

export function TicketRequestPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formKey, setFormKey] = useState(0);
  const createMutation = useCreateTicketMutation();
  const servicesQuery = useServicesQuery();

  const { data: services = [], isLoading: servicesLoading } = servicesQuery;

  const serviceOptions = services.map((service) => ({
    value: service.id,
    label: service.name,
  }));

  const handleSubmit = async (values: TicketFormValues) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        status: 'open',
        priority: 'medium',
        assignedToId: null,
        emitterId: user?.id ?? null,
        slaMinutes: null,
      });
      toast.success('Solicitud enviada correctamente');
      setFormKey((current) => current + 1);
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['my-tickets', user?.id] });
      navigate('/tickets');
    } catch {
      // Error handled by mutation
    }
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
