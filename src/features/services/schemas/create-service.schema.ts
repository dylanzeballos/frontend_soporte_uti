import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del servicio es requerido')
    .max(120, 'El nombre no puede superar los 120 caracteres'),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
