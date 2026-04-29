import { z } from 'zod';

export const componentSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

export const createComponentSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateComponentSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Schema for form validation
export const componentFormSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
  isActive: z.boolean(),
});

export type Component = z.infer<typeof componentSchema>;
export type ComponentFormValues = z.infer<typeof componentFormSchema>;
export type CreateComponentInput = z.infer<typeof createComponentSchema>;
export type UpdateComponentInput = z.infer<typeof updateComponentSchema>;

export interface PaginatedComponentsResponse {
  page: number;
  limit: number;
  total: number;
  data: Component[];
}
