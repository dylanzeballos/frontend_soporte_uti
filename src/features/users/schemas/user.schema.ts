import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  email: z.email(),
  name: z.string(),
  role: z.enum(['admin', 'agent', 'user']),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createUserSchema = z.object({
  email: z.email('Email inválido'),
  name: z.string().min(1, 'Nombre requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  role: z.enum(['admin', 'agent', 'user']).default('user'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  role: z.enum(['admin', 'agent', 'user']).optional(),
  isActive: z.boolean().optional(),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserRole = User['role'];

export function hasRole(user: User | null, requiredRole: UserRole | UserRole[]): boolean {
  if (!user) return false;
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  return user.role === requiredRole;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

export function isAgent(user: User | null): boolean {
  return user?.role === 'admin' || user?.role === 'agent';
}