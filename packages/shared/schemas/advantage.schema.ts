import { z } from 'zod';
import { AdvantageType } from '@prisma/client';

export const createAdvantageSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    type: z.nativeEnum(AdvantageType, {
        message: 'Type d\'avantage invalide',
    }),
    amount: z.number().nullable().optional(),
    isPercentage: z.boolean().default(false),
    isTaxable: z.boolean().default(true),
    description: z.string().optional()
});

export const updateAdvantageSchema = createAdvantageSchema.partial();

// Schéma spécifique pour l'assignation d'un avantage à un Grade
export const assignAdvantageSchema = z.object({
    advantageId: z.string().uuid('ID d\'avantage invalide'),
    customAmount: z.number().nullable().optional()
});

export type CreateAdvantageInput = z.infer<typeof createAdvantageSchema>;
export type UpdateAdvantageInput = z.infer<typeof updateAdvantageSchema>;
export type AssignAdvantageInput = z.infer<typeof assignAdvantageSchema>;
