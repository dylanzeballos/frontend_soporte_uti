import { z } from 'zod';

export const reportComponentSchema = z.object({
  componentId: z.number().positive('El ID del componente es requerido'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  note: z.string().optional().nullable(),
});

export const reportSchema = z.object({
  id: z.number(),
  ticketId: z.number(),
  summary: z.string(),
  workPerformed: z.string().optional().nullable(),
  resolutionType: z.string().optional().nullable(),
  startedAt: z.string().optional().nullable(),
  finishedAt: z.string().optional().nullable(),
  createdById: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  components: z.array(reportComponentSchema).optional(),
});

export const createReportSchema = z.object({
  ticketId: z.number().int().positive('El ID del ticket es requerido'),
  summary: z.string().min(3, 'El resumen debe tener al menos 3 caracteres'),
  workPerformed: z.string().optional().nullable(),
  resolutionType: z.string().optional().nullable(),
  startedAt: z.string().optional().nullable(),
  finishedAt: z.string().optional().nullable(),
  components: z.array(reportComponentSchema).optional().default([]),
});

export const updateReportSchema = z.object({
  ticketId: z.number().int().positive().optional(),
  summary: z.string().min(3).optional(),
  workPerformed: z.string().optional().nullable(),
  resolutionType: z.string().optional().nullable(),
  startedAt: z.string().optional().nullable(),
  finishedAt: z.string().optional().nullable(),
  components: z.array(reportComponentSchema).optional(),
});

// Form validation schema (for string-based inputs from forms)
export const reportFormSchema = z.object({
  ticketId: z.string().min(1, 'El ticket es requerido'),
  summary: z.string().min(3, 'El resumen debe tener al menos 3 caracteres').max(500, 'Máximo 500 caracteres'),
  workPerformed: z.string().max(2000, 'Máximo 2000 caracteres').optional().nullable(),
  resolutionType: z.string().optional().nullable(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  components: z.array(
    z.object({
      componentId: z.number().positive('Selecciona un componente'),
      quantity: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
      note: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
    })
  ).default([]),
});

// Resolution type options
export const resolutionTypeOptions = [
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'network', label: 'Red' },
  { value: 'other', label: 'Otro' },
] as const;

export type Report = z.infer<typeof reportSchema>;
export type ReportFormValues = z.infer<typeof reportFormSchema>;
export type ReportComponent = z.infer<typeof reportComponentSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;

export interface ReportStatsResponse {
  totalReports: number;
  byStatus?: Array<{ status: string; count: number }>;
  byTechnician?: Array<{ userId: number; name: string; count: number }>;
  topComponents?: Array<{ componentId: number; name: string; usageCount: number; totalQuantity: number }>;
}

export interface PaginatedReportsResponse {
  page: number;
  limit: number;
  total: number;
  data: Report[];
}
