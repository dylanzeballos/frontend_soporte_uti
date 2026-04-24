export { useTickets } from '@/hooks/useApi';
export type {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketFormValues,
  TicketRequestValues,
  TicketAdminValues,
  CreateTicketInput,
  UpdateTicketInput,
} from './schemas/ticket.schema';
export { TicketsPage, TicketRequestPage, TicketsAdminPage } from './pages';
export { TicketForm } from './components';
export type { TicketSelectOption } from './components';
export { getStatusLabel, getPriorityLabel, getStatusColor, getPriorityColor } from './schemas/ticket.schema';
