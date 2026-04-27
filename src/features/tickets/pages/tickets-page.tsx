import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ClipboardPenLine, FileClock, FolderKanban, Ticket as TicketIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/components/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
  type Ticket,
} from '@/features/tickets/schemas/ticket.schema';
import { isAgent } from '@/features/users/schemas';
import { useTickets } from '@/hooks/useApi';

const adminTicketViews = [
  {
    title: 'Solicitar ticket',
    description: 'Registrar una nueva solicitud de soporte.',
    href: '/tickets/request',
    cta: 'Solicitar',
    icon: ClipboardPenLine,
  },
  {
    title: 'Ver solicitudes',
    description: 'Revisar y gestionar los tickets recibidos.',
    href: '/tickets/admin',
    cta: 'Ver tickets',
    icon: FolderKanban,
  },
] as const;

function formatTicketDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function UserTicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { list } = useTickets();

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['my-tickets', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => list({ createdById: user?.id, limit: 50 }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Mis solicitudes</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            Tus tickets
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Revisa el estado de tus solicitudes y crea una nueva cuando lo necesites.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/tickets/request')} className="min-w-52 justify-center">
              Nueva solicitud
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Card className="ticket-list-shell rounded-[var(--radius-panel)]">
        <CardHeader className="px-6 pb-0 pt-6 sm:px-8 sm:pt-8">
          <div className="space-y-2">
            <CardTitle>Estado de tus solicitudes</CardTitle>
            <CardDescription>
              Aqui solo ves los tickets registrados desde tu cuenta.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 pb-6 pt-6 sm:px-8 sm:pb-8">
          {isLoading ? (
            <div className="editorial-inset rounded-md py-14 text-center text-muted-foreground">
              Cargando solicitudes...
            </div>
          ) : tickets.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="ticket-record-card rounded-[var(--radius-panel)]">
                  <CardHeader className="px-5 pb-0 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                        <CardDescription className="line-clamp-2 leading-6">
                          {ticket.description}
                        </CardDescription>
                      </div>

                      <div className="ticket-entry-icon h-11 w-11 shrink-0 rounded-full">
                        <TicketIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>{getPriorityLabel(ticket.priority)}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="grid gap-3 px-5 pb-5 pt-4 text-sm">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="editorial-inset rounded-md p-3.5">
                        <div className="editorial-label">Servicio</div>
                        <div className="mt-1 font-medium text-foreground">
                          {ticket.service?.name ?? 'Sin servicio'}
                        </div>
                      </div>
                      <div className="editorial-inset rounded-md p-3.5">
                        <div className="editorial-label">Estado actual</div>
                        <div className="mt-1 font-medium text-foreground">
                          {getStatusLabel(ticket.status)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>
                        <TicketIcon className="mr-1 inline h-3.5 w-3.5" />
                        #{ticket.id}
                      </span>
                      <span>
                        <FileClock className="mr-1 inline h-3.5 w-3.5" />
                        Actualizado {formatTicketDate(ticket.updatedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="editorial-inset rounded-md py-14 text-center">
              <p className="text-base font-medium text-foreground">Aun no registraste solicitudes</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Cuando crees un ticket, aqui podras ver su estado.
              </p>
              <div className="mt-5">
                <Button onClick={() => navigate('/tickets/request')} className="min-w-52 justify-center">
                  Crear solicitud
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TicketsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!isAgent(user)) {
    return <UserTicketsPage />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="lively-hero rounded-[var(--radius-panel)] px-6 py-7 sm:px-8 sm:py-9">
        <div className="relative z-10">
          <div className="editorial-kicker">Tickets</div>
          <h1 className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold tracking-[-0.02em] text-foreground">
            Tickets
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Solicita soporte o revisa las solicitudes desde un solo lugar.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {adminTicketViews.map((view) => (
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
