import { z } from 'zod';

export const createUnitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre de la unidad es requerido')
    .max(120, 'El nombre no puede superar los 120 caracteres'),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
