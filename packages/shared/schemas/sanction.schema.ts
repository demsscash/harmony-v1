import { z } from 'zod';
import { SanctionType } from '@prisma/client';

export const createSanctionSchema = z.object({
    employeeId: z.string().uuid('ID employé invalide'),
    type: z.nativeEnum(SanctionType, { message: 'Type de sanction invalide' }),
    reason: z.string().min(3, 'La raison doit contenir au moins 3 caractères'),
    comment: z.string().optional(),
    date: z.string().or(z.date()),
    advantageId: z.string().uuid().optional().nullable(),
    deductionAmount: z.number().min(0, 'Le montant doit être positif'),
});

export const updateSanctionSchema = createSanctionSchema.partial();

export type CreateSanctionInput = z.infer<typeof createSanctionSchema>;
export type UpdateSanctionInput = z.infer<typeof updateSanctionSchema>;
