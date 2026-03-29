import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
    email: z.string().email('Email Invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    role: z.nativeEnum(UserRole),
    isActive: z.boolean().optional(),
    employeeId: z.string().uuid().optional().nullable(),
});

export const updateUserSchema = z.object({
    email: z.string().email('Email Invalide').optional(),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
    employeeId: z.string().uuid().optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
