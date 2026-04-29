import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del rol o cargo es requerido')
    .max(120, 'El nombre no puede superar los 120 caracteres'),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}
