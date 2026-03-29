import { z } from 'zod';

export const createLeaveTypeSchema = z.object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').toUpperCase(),
    defaultDays: z.number().int().nonnegative('Le nombre de jours par défaut doit être positif'),
    isPaid: z.boolean().default(true),
    requiresJustification: z.boolean().default(false),
    color: z.string().optional().nullable(),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

export const createLeaveSchema = z.object({
    employeeId: z.string().uuid('ID de l\'employé invalide').optional(),
    leaveTypeId: z.string().uuid('ID du type de congé invalide'),
    startDate: z.string().datetime('La date de début doit être valide (ISO 8601)'),
    endDate: z.string().datetime('La date de fin doit être valide (ISO 8601)'),
    totalDays: z.number().positive('Le nombre total de jours doit être positif').optional(),
    reason: z.string().optional().nullable(),
    justificationUrl: z.string().url('L\'URL du justificatif doit être valide').optional().nullable(),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'La date de fin doit être postérieure ou égale à la date de début',
    path: ['endDate']
});

export const updateLeaveSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    totalDays: z.number().positive().optional(),
    reason: z.string().optional().nullable(),
    justificationUrl: z.string().url().optional().nullable(),
}).refine(data => {
    if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
}, {
    message: 'La date de fin doit être postérieure ou égale à la date de début',
    path: ['endDate']
});

export const processLeaveSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
    rejectionReason: z.string().optional().nullable()
}).refine(data => {
    if (data.status === 'REJECTED' && !data.rejectionReason) {
        return false;
    }
    return true;
}, {
    message: 'Le motif de refus est obligatoire',
    path: ['rejectionReason']
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type UpdateLeaveInput = z.infer<typeof updateLeaveSchema>;
export type ProcessLeaveInput = z.infer<typeof processLeaveSchema>;
