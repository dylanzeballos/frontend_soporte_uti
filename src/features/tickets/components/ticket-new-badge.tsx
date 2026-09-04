import { Badge } from '@/components/ui/badge';
import type { Ticket } from '@/features/tickets/schemas/ticket.schema';
import { isTicketNew } from '@/features/tickets/schemas/ticket.schema';

export function TicketNewBadge({ ticket }: { ticket: Pick<Ticket, 'status' | 'assignedToId'> }) {
  if (!isTicketNew(ticket)) return null;

  return (
    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400/40">
      Nuevo
    </Badge>
  );
}

export function getNewTicketBorderClass(ticket: Pick<Ticket, 'status' | 'assignedToId'>): string {
  return isTicketNew(ticket) ? 'ring-2 ring-emerald-400/30' : '';
}
