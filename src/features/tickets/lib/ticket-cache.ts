import type { QueryClient } from '@tanstack/react-query';

import { invalidateReportCaches } from '@/features/reports/lib/report-cache';
import type { Ticket, TicketStatus } from '@/features/tickets/schemas/ticket.schema';

const ticketQueryKeys = [
  ['tickets'],
  ['my-tickets'],
  ['kanban-tickets'],
  ['technician-dashboard', 'assignments'],
  ['technician-dashboard', 'pending'],
  ['technician-assignments'],
  ['technician-pending'],
] as const;

function updateTicketInList(
  tickets: Ticket[] | undefined,
  matcher: (ticket: Ticket) => boolean,
  updater: (ticket: Ticket) => Ticket,
) {
  if (!tickets) {
    return tickets;
  }

  return tickets.map((ticket) => (matcher(ticket) ? updater(ticket) : ticket));
}

function prependTicketToList(
  tickets: Ticket[] | undefined,
  createdTicket: Ticket,
) {
  if (!tickets) {
    return tickets;
  }

  if (tickets.some((ticket) => ticket.id === createdTicket.id)) {
    return tickets;
  }

  return [createdTicket, ...tickets];
}

export function syncUpdatedTicketCaches(
  queryClient: QueryClient,
  updatedTicket: Ticket,
) {
  for (const queryKey of ticketQueryKeys) {
    queryClient.setQueriesData<Ticket[]>({ queryKey }, (tickets) =>
      updateTicketInList(
        tickets,
        (ticket) => ticket.id === updatedTicket.id,
        () => updatedTicket,
      ),
    );
  }
}

export function syncTicketStatusCaches(
  queryClient: QueryClient,
  payload: {
    ticketId: number;
    title: string;
    status: TicketStatus;
    updatedAt?: string;
  },
) {
  for (const queryKey of ticketQueryKeys) {
    queryClient.setQueriesData<Ticket[]>({ queryKey }, (tickets) =>
      updateTicketInList(
        tickets,
        (ticket) => ticket.id === payload.ticketId,
        (ticket) => ({
          ...ticket,
          title: payload.title,
          status: payload.status,
          updatedAt: payload.updatedAt ?? new Date().toISOString(),
        }),
      ),
    );
  }
}

export function syncCreatedRequesterTicketCaches(
  queryClient: QueryClient,
  createdTicket: Ticket,
) {
  queryClient.setQueriesData<Ticket[]>({ queryKey: ['my-tickets'] }, (tickets) =>
    prependTicketToList(tickets, createdTicket),
  );

  queryClient.setQueriesData<Ticket[]>(
    { queryKey: ['tickets', 'dashboard'] },
    (tickets) => prependTicketToList(tickets, createdTicket),
  );
}

export function invalidateTicketCaches(queryClient: QueryClient) {
  for (const queryKey of ticketQueryKeys) {
    void queryClient.invalidateQueries({ queryKey });
  }

  invalidateReportCaches(queryClient);
}
