import { z } from 'zod';

export const ticketStatusEnum = z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']);
export const ticketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const ticketSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: ticketStatusEnum,
  priority: ticketPriorityEnum,
  assignedToId: z.number().nullable(),
  createdById: z.number(),
  assignedTo: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }).nullable(),
  createdBy: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createTicketSchema = z.object({
  title: z.string().min(5, 'Título muy corto').max(200, 'Título muy largo'),
  description: z.string().min(10, 'Descripción muy corta'),
  priority: ticketPriorityEnum.default('medium'),
});

export const updateTicketSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).optional(),
  priority: ticketPriorityEnum.optional(),
});

export const updateTicketStatusSchema = z.object({
  status: ticketStatusEnum,
  comment: z.string().optional(),
});

export const assignTicketSchema = z.object({
  assignedToId: z.number(),
});

export const ticketFilterSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  assignedToId: z.number().optional(),
  createdById: z.number().optional(),
  search: z.string().optional(),
});

export type TicketStatus = z.infer<typeof ticketStatusEnum>;
export type TicketPriority = z.infer<typeof ticketPriorityEnum>;
export type Ticket = z.infer<typeof ticketSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type TicketFilter = z.infer<typeof ticketFilterSchema>;

export function getStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    open: 'Abierto',
    in_progress: 'En progreso',
    pending: 'Pendiente',
    resolved: 'Resuelto',
    closed: 'Cerrado',
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: TicketPriority): string {
  const labels: Record<TicketPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return labels[priority] || priority;
}

export function getStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    open: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    pending: 'bg-orange-500',
    resolved: 'bg-green-500',
    closed: 'bg-gray-500',
  };
  return colors[status] || 'bg-gray-500';
}

export function getPriorityColor(priority: TicketPriority): string {
  const colors: Record<TicketPriority, string> = {
    low: 'bg-gray-400',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  };
  return colors[priority] || 'bg-gray-400';
}