import { z } from 'zod';

export const unitSchema = z.object({
  id: z.number(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const updateUnitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre de la unidad es requerido')
    .max(120, 'El nombre no puede superar los 120 caracteres')
    .optional(),
  isActive: z.boolean().optional(),
});

export type Unit = z.infer<typeof unitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
