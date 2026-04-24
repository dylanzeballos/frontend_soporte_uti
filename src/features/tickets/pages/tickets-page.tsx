import { ArrowRight, ClipboardList, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ticketViews = [
  {
    title: 'Solicitar ticket',
    description:
      'Vista pensada para el usuario que reporta una incidencia o solicita soporte. Solo muestra los campos necesarios para registrar la solicitud.',
    href: '/tickets/request',
    cta: 'Abrir solicitud',
    icon: ClipboardList,
  },
  {
    title: 'Gestion admin',
    description:
      'Vista pensada para cuando el area administrativa recibe el ticket y necesita clasificarlo, asignarlo y definir prioridad o SLA.',
    href: '/tickets/admin',
    cta: 'Abrir gestion',
    icon: ShieldCheck,
  },
] as const;

export function TicketsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Tickets
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vistas de Tickets</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Separé el flujo en dos experiencias distintas para que no se mezclen los campos de solicitud con los de recepcion y gestion administrativa.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {ticketViews.map((view) => (
          <Card
            key={view.href}
            className="border border-primary/10 bg-[linear-gradient(180deg,rgba(128,0,28,0.05),transparent_35%),var(--card)] shadow-sm"
          >
            <CardHeader className="border-b border-primary/10">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <view.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle>{view.title}</CardTitle>
                  <CardDescription className="leading-6">{view.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Button
                className="transition-transform duration-200 hover:-translate-y-0.5"
                onClick={() => navigate(view.href)}
              >
                {view.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
