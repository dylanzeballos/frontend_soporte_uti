import { ArrowRight, List, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const serviceViews = [
  {
    title: 'Lista de servicios',
    description: 'Revisa, edita y elimina servicios registrados.',
    href: '/admin/services/list',
    cta: 'Ver lista',
    icon: List,
  },
  {
    title: 'Registrar servicio',
    description: 'Crea un nuevo servicio en el sistema.',
    href: '/admin/services/create',
    cta: 'Registrar',
    icon: PlusCircle,
  },
] as const;

export function ServicesEntryPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Administracion</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            Servicios
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Elige una accion para gestionar servicios.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {serviceViews.map((view) => (
          <Card key={view.href} className="ticket-entry-card rounded-[var(--radius-panel)]">
            <CardHeader className="px-6 pt-6 sm:px-7 sm:pt-7">
              <div className="flex items-start gap-4">
                <div className="ticket-entry-icon">
                  <view.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">{view.title}</CardTitle>
                  <CardDescription className="leading-6">{view.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
              <Button onClick={() => navigate(view.href)} className="min-w-44 justify-center">
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
