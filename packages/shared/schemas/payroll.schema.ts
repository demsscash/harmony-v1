import { z } from 'zod';
import { PayrollStatus, DeclarationType, DeclarationStatus } from '@prisma/client';

// ==========================================
// PAYROLL (PAIE)
// ==========================================

export const createPayrollSchema = z.object({
    month: z.number().int().min(1).max(12, 'Le mois doit être compris entre 1 et 12'),
    year: z.number().int().min(2000).max(2100, 'L\'année est invalide'),
});

export const updatePayrollStatusSchema = z.object({
    status: z.nativeEnum(PayrollStatus, {
        message: 'Statut de paie invalide'
    })
});

// ==========================================
// DECLARATIONS FISCALES
// ==========================================

export const createDeclarationSchema = z.object({
    type: z.nativeEnum(DeclarationType, {
        message: 'Type de déclaration invalide'
    }),
    period: z.string().min(4, 'La période doit être au format YYYY ou YYYY-MM ou YYYY-QX'),
    data: z.record(z.string(), z.any()).optional().default({}), // Structure flexible JSON pour les données pré-remplies
});

export const updateDeclarationStatusSchema = z.object({
    status: z.nativeEnum(DeclarationStatus, {
        message: 'Statut de déclaration invalide'
    })
});

export type CreatePayrollInput = z.infer<typeof createPayrollSchema>;
export type UpdatePayrollStatusInput = z.infer<typeof updatePayrollStatusSchema>;
export type CreateDeclarationInput = z.infer<typeof createDeclarationSchema>;
export type UpdateDeclarationStatusInput = z.infer<typeof updateDeclarationStatusSchema>;
