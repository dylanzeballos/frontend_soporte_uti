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
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.8fr)]">
        <div className="editorial-surface rounded-md px-6 py-6 sm:px-8 sm:py-8">
          <div className="editorial-kicker">Tickets</div>
          <div className="mt-5 space-y-4">
            <h1 className="editorial-display max-w-4xl">Elige el flujo correcto antes de entrar al formulario</h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Separamos la experiencia para que el usuario final vea una solicitud limpia y el equipo administrativo trabaje con una superficie enfocada en clasificacion y seguimiento.
            </p>
          </div>
        </div>

        <div className="editorial-inset rounded-md p-5 sm:p-6">
          <p className="editorial-label mb-4">Criterio</p>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">Solicitud</p>
              <p className="text-sm leading-6 text-muted-foreground">Para clientes o usuarios que necesitan pedir ayuda.</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">Gestion admin</p>
              <p className="text-sm leading-6 text-muted-foreground">Para agentes o administradores que gestionan el backlog.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {ticketViews.map((view) => (
          <Card
            key={view.href}
            className="rounded-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]"
          >
            <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-accent px-2.5 py-2 text-accent-foreground shadow-[var(--shadow-1)]">
                  <view.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle>{view.title}</CardTitle>
                  <CardDescription className="leading-6">{view.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-1 sm:px-7 sm:pb-7">
              <Button variant="outline" onClick={() => navigate(view.href)}>
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
