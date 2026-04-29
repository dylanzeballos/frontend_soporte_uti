import { z } from 'zod';

const nullableIdSchema = z.number().int().positive().nullable();
const nullableMinutesSchema = z.number().int().min(1, 'El SLA debe ser mayor a 0').nullable();

export const ticketStatusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed', 'cancelled']);
export const ticketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const ticketStatusOptions = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'cancelled', label: 'Cancelado' },
] as const satisfies ReadonlyArray<{ value: z.infer<typeof ticketStatusEnum>; label: string }>;

export const ticketPriorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
] as const satisfies ReadonlyArray<{ value: z.infer<typeof ticketPriorityEnum>; label: string }>;

const ticketUserReferenceSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

const ticketServiceReferenceSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const ticketReportReferenceSchema = z.object({
  id: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ticketSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  status: ticketStatusEnum,
  priority: ticketPriorityEnum,
  assignedToId: nullableIdSchema,
  createdById: z.number(),
  emitterId: nullableIdSchema,
  serviceId: nullableIdSchema,
  slaMinutes: nullableMinutesSchema,
  assignedTo: ticketUserReferenceSchema.nullable().optional(),
  createdBy: ticketUserReferenceSchema.optional(),
  emitter: ticketUserReferenceSchema.nullable().optional(),
  service: ticketServiceReferenceSchema.nullable().optional(),
  report: ticketReportReferenceSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  resolvedAt: z.string().nullable().optional(),
});

export const ticketFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'El titulo debe tener al menos 5 caracteres')
    .max(200, 'El titulo no puede exceder 200 caracteres'),
  description: z
    .string()
    .trim()
    .min(10, 'La descripcion debe tener al menos 10 caracteres')
    .max(5000, 'La descripcion no puede exceder 5000 caracteres'),
  status: ticketStatusEnum,
  priority: ticketPriorityEnum,
  assignedToId: nullableIdSchema,
  emitterId: nullableIdSchema,
  serviceId: nullableIdSchema,
  slaMinutes: nullableMinutesSchema,
});

export const createTicketSchema = ticketFormSchema;

export const updateTicketSchema = ticketFormSchema;

export const patchTicketSchema = ticketFormSchema.partial();

export const ticketRequestSchema = ticketFormSchema.refine(
  (value) => value.serviceId !== null,
  {
    message: 'Selecciona un servicio para continuar',
    path: ['serviceId'],
  },
);

export const ticketAdminSchema = ticketFormSchema;

export const updateTicketStatusSchema = z.object({
  status: ticketStatusEnum,
  comment: z
    .string()
    .trim()
    .max(600, 'El comentario no puede exceder 600 caracteres')
    .optional(),
});

export const assignTicketSchema = z.object({
  assignedToId: z.number().int().positive(),
});

export const ticketFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  assignedToId: z.number().int().positive().optional(),
  unassigned: z.boolean().optional(),
  createdById: z.number().int().positive().optional(),
  excludeCreatedById: z.number().int().positive().optional(),
  search: z.string().trim().optional(),
  includeTotal: z.boolean().optional(),
});

export type TicketStatus = z.infer<typeof ticketStatusEnum>;
export type TicketPriority = z.infer<typeof ticketPriorityEnum>;
export type Ticket = z.infer<typeof ticketSchema>;
export type TicketFormValues = z.infer<typeof ticketFormSchema>;
export type TicketRequestValues = z.infer<typeof ticketRequestSchema>;
export type TicketAdminValues = z.infer<typeof ticketAdminSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type TicketFilter = z.infer<typeof ticketFilterSchema>;

export function getStatusLabel(status: TicketStatus): string {
  const labels: Record<TicketStatus, string> = {
    open: 'Abierto',
    in_progress: 'En progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
    cancelled: 'Cancelado',
  };

  return labels[status];
}

export function getPriorityLabel(priority: TicketPriority): string {
  const labels: Record<TicketPriority, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };

  return labels[priority];
}

export function getStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    open: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    in_progress: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    resolved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    closed: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
    cancelled: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  };

  return colors[status];
}

export function getPriorityColor(priority: TicketPriority): string {
  const colors: Record<TicketPriority, string> = {
    low: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
    medium: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    high: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    urgent: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  };

  return colors[priority];
}
