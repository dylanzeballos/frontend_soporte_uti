import { z } from 'zod';

import { ticketSchema } from '@/features/tickets/schemas/ticket.schema';

export const componentCatalogSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

const reportActorSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const reportUsedComponentSchema = z.object({
  id: z.number().optional(),
  componentId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  note: z.string().nullable().optional(),
  component: componentCatalogSchema.nullable().optional(),
});

export const reportSchema = z.object({
  id: z.number(),
  ticketId: z.number().int().positive(),
  summary: z.string(),
  workPerformed: z.string(),
  resolutionType: z.string().nullable().optional(),
  startedAt: z.string().nullable().optional(),
  finishedAt: z.string().nullable().optional(),
  createdById: z.number().int().positive().nullable().optional(),
  createdBy: reportActorSchema.nullable().optional(),
  ticket: ticketSchema.nullable().optional(),
  components: z.array(reportUsedComponentSchema).optional().default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

export const reportComponentFormSchema = z.object({
  componentId: z.number().int().positive('Selecciona un componente'),
  quantity: z
    .number({
      error: 'La cantidad es obligatoria',
    })
    .int('Ingresa un numero entero')
    .min(1, 'La cantidad debe ser mayor a 0'),
  note: z
    .string()
    .trim()
    .max(180, 'La nota no puede exceder 180 caracteres')
    .optional()
    .or(z.literal('')),
});

export const reportFormSchema = z
  .object({
    summary: z
      .string()
      .trim()
      .min(10, 'Resume el resultado en al menos 10 caracteres')
      .max(180, 'El resumen no puede exceder 180 caracteres'),
    workPerformed: z
      .string()
      .trim()
      .min(10, 'Describe el trabajo realizado en al menos 10 caracteres')
      .max(2500, 'El detalle no puede exceder 2500 caracteres'),
    resolutionType: z
      .string()
      .trim()
      .min(2, 'Indica el tipo de solucion')
      .max(60, 'El tipo de solucion no puede exceder 60 caracteres'),
    startedAt: z.string().optional().or(z.literal('')),
    finishedAt: z.string().optional().or(z.literal('')),
    components: z
      .array(reportComponentFormSchema)
      .max(8, 'Puedes registrar hasta 8 componentes por reporte'),
  })
  .superRefine((value, context) => {
    if (value.startedAt && value.finishedAt) {
      const startedAt = new Date(value.startedAt);
      const finishedAt = new Date(value.finishedAt);

      if (!Number.isNaN(startedAt.getTime()) && !Number.isNaN(finishedAt.getTime()) && finishedAt < startedAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La hora de finalizacion no puede ser anterior al inicio',
          path: ['finishedAt'],
        });
      }
    }

    const seenComponents = new Map<number, number>();

    value.components.forEach((component, index) => {
      const previousIndex = seenComponents.get(component.componentId);
      if (typeof previousIndex === 'number') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'No repitas el mismo componente',
          path: ['components', index, 'componentId'],
        });
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'No repitas el mismo componente',
          path: ['components', previousIndex, 'componentId'],
        });
        return;
      }

      seenComponents.set(component.componentId, index);
    });
  });

export type ComponentCatalogItem = z.infer<typeof componentCatalogSchema>;
export type ReportUsedComponent = z.infer<typeof reportUsedComponentSchema>;
export type Report = z.infer<typeof reportSchema>;
export type ReportComponentFormValue = z.infer<typeof reportComponentFormSchema>;
export type ReportFormValues = z.infer<typeof reportFormSchema>;

export interface ReportFilter {
  page?: number;
  limit?: number;
  ticketId?: number;
  createdById?: number;
  componentId?: number;
  ticketStatus?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ComponentCatalogFilter {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface ReportComponentPayload {
  componentId: number;
  quantity: number;
  note?: string;
}

export interface CreateReportInput {
  ticketId: number;
  summary: string;
  workPerformed: string;
  resolutionType?: string;
  startedAt?: string;
  finishedAt?: string;
  components?: ReportComponentPayload[];
}

export interface UpdateReportInput {
  summary?: string;
  workPerformed?: string;
  resolutionType?: string;
  startedAt?: string;
  finishedAt?: string;
  components?: ReportComponentPayload[];
}
