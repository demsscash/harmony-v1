import { z } from 'zod';
import { assignAdvantageSchema } from './advantage.schema';

const gradeBaseSchema = z.object({
    name: z.string().min(2, 'Le nom du grade doit contenir au moins 2 caractères'),
    level: z.number().int().min(1, 'Le niveau doit être au moins de 1'),
    description: z.string().optional().nullable(),
    advantages: z.array(assignAdvantageSchema).optional(),
});

export const createGradeSchema = gradeBaseSchema;
export const updateGradeSchema = gradeBaseSchema.partial();

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
