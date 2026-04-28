import type { QueryClient } from '@tanstack/react-query';

import type { Ticket, TicketStatus } from '@/features/tickets/schemas/ticket.schema';

const ticketQueryKeys = [['tickets'], ['my-tickets'], ['kanban-tickets']] as const;

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

export function invalidateTicketCaches(queryClient: QueryClient) {
  for (const queryKey of ticketQueryKeys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}
