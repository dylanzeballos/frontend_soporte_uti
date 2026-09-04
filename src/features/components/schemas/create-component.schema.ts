import { z } from 'zod';

export const createComponentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre del componente es requerido')
    .max(120, 'El nombre no puede superar los 120 caracteres'),
  description: z
    .string()
    .trim()
    .max(255, 'La descripcion no puede superar los 255 caracteres')
    .optional()
    .or(z.literal('')),
});

export type CreateComponentInput = z.infer<typeof createComponentSchema>;
