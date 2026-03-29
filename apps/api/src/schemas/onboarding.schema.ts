import { z } from 'zod';

export const onboardingTaskSchema = z.object({
    title: z.string().min(2, 'Le titre est requis'),
    description: z.string().optional(),
    assignedTo: z.string().uuid().optional(),
    order: z.number().int().min(0)
});

export const onboardingTemplateSchema = z.object({
    name: z.string().min(2, 'Le nom du template est requis'),
    tasks: z.array(onboardingTaskSchema).min(1, 'Au moins une tâche est requise')
});

export const applyTemplateSchema = z.object({
    templateId: z.string().uuid('ID de template invalide')
});

export const updateTaskSchema = z.object({
    isCompleted: z.boolean().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional().nullable()
});
