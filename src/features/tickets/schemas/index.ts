export { 
  ticketSchema, 
  ticketStatusEnum, 
  ticketPriorityEnum,
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  ticketFilterSchema
} from './ticket.schema';
export type { 
  Ticket, 
  TicketStatus, 
  TicketPriority,
  CreateTicketInput,
  UpdateTicketInput,
  UpdateTicketStatusInput,
  AssignTicketInput,
  TicketFilter
} from './ticket.schema';
export { getStatusLabel, getPriorityLabel, getStatusColor, getPriorityColor } from './ticket.schema';