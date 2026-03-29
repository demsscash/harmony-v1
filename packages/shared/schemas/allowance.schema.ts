import { z } from 'zod';
import { AdvantageType } from '@prisma/client';

const allowanceBaseSchema = z.object({
    name: z.string().min(2, 'Le nom de l\'avantage doit contenir au moins 2 caractères'),
    type: z.nativeEnum(AdvantageType),
    amount: z.number().positive('Le montant doit être positif').optional(),
    percentage: z.number().min(0).max(100, 'Le pourcentage ne peut pas dépasser 100').optional(),
    isTaxable: z.boolean().default(false),
});

export const createAllowanceSchema = allowanceBaseSchema.refine(data => {
    if (data.percentage && data.percentage > 0 && !data.amount) return false;
    return true;
}, {
    message: 'Le montant est requis pour un avantage fixe, le pourcentage pour un avantage en pourcentage',
    path: ['amount', 'percentage']
});

export const updateAllowanceSchema = allowanceBaseSchema.partial();

export type CreateAllowanceInput = z.infer<typeof createAllowanceSchema>;
export type UpdateAllowanceInput = z.infer<typeof updateAllowanceSchema>;
