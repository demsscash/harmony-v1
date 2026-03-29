import { Request, Response } from 'express';
import { z } from 'zod';
import { OnboardingService } from '../services/onboarding.service';
import {
    onboardingTemplateSchema,
    applyTemplateSchema,
    updateTaskSchema
} from '../schemas/onboarding.schema';

export class OnboardingController {

    // ==========================================
    // TEMPLATES CRUD
    // ==========================================

    static async getTemplates(req: Request, res: Response) {
        try {
            const tenantId = req.tenant!.id;
            const templates = await OnboardingService.getTemplates(tenantId);
            res.json({ success: true, data: templates });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async createTemplate(req: Request, res: Response) {
        try {
            const tenantId = req.tenant!.id;
            const validatedData = onboardingTemplateSchema.parse(req.body);
            const template = await OnboardingService.createTemplate(tenantId, validatedData);
            res.status(201).json({ success: true, data: template });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, errors: error.issues });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateTemplate(req: Request, res: Response) {
        try {
            const tenantId = req.tenant!.id;
            const { id } = req.params as { id: string };
            const validatedData = onboardingTemplateSchema.parse(req.body);
            const template = await OnboardingService.updateTemplate(tenantId, id, validatedData);
            res.json({ success: true, data: template });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, errors: error.issues });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async deleteTemplate(req: Request, res: Response) {
        try {
            const tenantId = req.tenant!.id;
            const { id } = req.params as { id: string };
            await OnboardingService.deleteTemplate(tenantId, id);
            res.json({ success: true, message: 'Template supprimé' });
        } catch (error: any) {
            if (error.message === 'Template introuvable') {
                return res.status(404).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ==========================================
    // EMPLOYEE TASKS
    // ==========================================

    static async applyTemplate(req: Request, res: Response) {
        try {
            const tenantId = req.tenant!.id;
            const { id: employeeId } = req.params as { id: string };
            const validatedData = applyTemplateSchema.parse(req.body);

            const tasks = await OnboardingService.applyTemplateToEmployee(tenantId, employeeId, validatedData.templateId);
            res.status(201).json({ success: true, data: tasks, message: 'Template appliqué avec succès' });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, errors: error.issues });
            }
            res.status(400).json({ success: false, error: error.message });
        }
    }

    static async getEmployeeTasks(req: Request, res: Response) {
        try {
            const tenantId = req.tenant!.id;
            const { id: employeeId } = req.params as { id: string };
            // Employees can view their own tasks, or HR/Admins can view all 
            // req.user!.role check applied in middleware usually, but we can do it here if needed
            if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== employeeId) {
                return res.status(403).json({ success: false, error: 'Accès non autorisé' });
            }

            const tasks = await OnboardingService.getEmployeeTasks(tenantId, employeeId);
            res.json({ success: true, data: tasks });
        } catch (error: any) {
            res.status(404).json({ success: false, error: error.message });
        }
    }

    static async createManualTask(req: Request, res: Response) {
        try {
            const tenantId = req.tenant!.id;
            const { id: employeeId } = req.params as { id: string };
            // Title is required at least
            if (!req.body.title) return res.status(400).json({ success: false, error: "Titre requis" });

            const task = await OnboardingService.createManualTask(tenantId, employeeId, {
                title: req.body.title,
                description: req.body.description
            });
            res.status(201).json({ success: true, data: task });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

    static async updateTask(req: Request, res: Response) {
        try {
            const tenantId = req.tenant!.id;
            const { id: employeeId, taskId } = req.params as { id: string, taskId: string };

            // Allow employees to update THEIR tickets' completions
            if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== employeeId) {
                return res.status(403).json({ success: false, error: 'Accès non autorisé' });
            }

            const validatedData = updateTaskSchema.parse(req.body);

            const updatedTask = await OnboardingService.updateTask(tenantId, employeeId, taskId, validatedData as any);
            res.json({ success: true, data: updatedTask });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ success: false, errors: error.issues });
            }
            res.status(400).json({ success: false, error: error.message });
        }
    }

    static async deleteTask(req: Request, res: Response) {
        try {
            const tenantId = req.tenant!.id;
            const { id: employeeId, taskId } = req.params as { id: string, taskId: string };
            await OnboardingService.deleteTask(tenantId, employeeId, taskId);
            res.json({ success: true, message: 'Tâche supprimée' });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
}
