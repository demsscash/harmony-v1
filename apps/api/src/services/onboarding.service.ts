import { PrismaClient, OnboardingTemplate, OnboardingTask } from '@prisma/client';
import { z } from 'zod';
import { onboardingTemplateSchema } from '../schemas/onboarding.schema';

const prisma = new PrismaClient();

export class OnboardingService {
    // ==========================================
    // TEMPLATES
    // ==========================================

    static async getTemplates(tenantId: string) {
        return prisma.onboardingTemplate.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async createTemplate(tenantId: string, data: z.infer<typeof onboardingTemplateSchema>) {
        return prisma.onboardingTemplate.create({
            data: {
                tenantId,
                name: data.name,
                tasks: data.tasks as any
            }
        });
    }

    static async updateTemplate(tenantId: string, id: string, data: z.infer<typeof onboardingTemplateSchema>) {
        const template = await prisma.onboardingTemplate.findFirst({
            where: { id, tenantId }
        });
        if (!template) throw new Error('Template introuvable');

        return prisma.onboardingTemplate.update({
            where: { id },
            data: {
                name: data.name,
                tasks: data.tasks as any
            }
        });
    }

    static async deleteTemplate(tenantId: string, id: string) {
        const template = await prisma.onboardingTemplate.findFirst({
            where: { id, tenantId }
        });
        if (!template) throw new Error('Template introuvable');

        await prisma.onboardingTemplate.delete({ where: { id } });
        return true;
    }

    // ==========================================
    // EMPLOYEE TASKS
    // ==========================================

    static async getEmployeeTasks(tenantId: string, employeeId: string) {
        // verify employee belongs to tenant
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, tenantId }
        });
        if (!employee) throw new Error('Employé introuvable');

        return prisma.onboardingTask.findMany({
            where: { employeeId },
            orderBy: { order: 'asc' },
            include: {
                employee: { select: { firstName: true, lastName: true } }
            }
        });
    }

    static async applyTemplateToEmployee(tenantId: string, employeeId: string, templateId: string) {
        // 1. Verify employee & template
        const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
        if (!employee) throw new Error('Employé introuvable');

        const template = await prisma.onboardingTemplate.findFirst({ where: { id: templateId, tenantId } });
        if (!template) throw new Error('Template introuvable');

        // 2. Clear existing unresolved tasks? For now, we just append to avoid deleting manual tasks.
        // If we wanted to clear, we would do: await prisma.onboardingTask.deleteMany({ where: { employeeId, isCompleted: false } });

        const tasksData = template.tasks as any[];

        // Find highest order to append safely
        const lastTask = await prisma.onboardingTask.findFirst({
            where: { employeeId },
            orderBy: { order: 'desc' },
            select: { order: true }
        });
        let startingOrder = (lastTask?.order ?? -1) + 1;

        // 3. Create tasks
        const createdTasks = await prisma.$transaction(
            tasksData.map((t: any) => prisma.onboardingTask.create({
                data: {
                    employeeId,
                    title: t.title,
                    description: t.description,
                    assignedTo: t.assignedTo,
                    order: startingOrder + (t.order || 0)
                }
            }))
        );

        // 4. Log timeline event
        await prisma.employeeTimeline.create({
            data: {
                employeeId,
                event: 'ONBOARDING_ASSIGNED',
                description: `Template d'onboarding appliqué : ${template.name}`,
                performedBy: 'SYSTEM'
            }
        });

        return createdTasks;
    }

    static async updateTask(tenantId: string, employeeId: string, taskId: string, data: Partial<OnboardingTask>) {
        const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
        if (!employee) throw new Error('Accès refusé');

        const task = await prisma.onboardingTask.findFirst({ where: { id: taskId, employeeId } });
        if (!task) throw new Error('Tâche introuvable');

        return prisma.onboardingTask.update({
            where: { id: taskId },
            data: {
                isCompleted: data.isCompleted,
                completedAt: data.isCompleted && !task.isCompleted ? new Date() : (data.isCompleted === false ? null : undefined),
                title: data.title,
                description: data.description,
                dueDate: data.dueDate
            }
        });
    }

    static async createManualTask(tenantId: string, employeeId: string, data: any) {
        const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
        if (!employee) throw new Error('Accès refusé');

        const lastTask = await prisma.onboardingTask.findFirst({
            where: { employeeId },
            orderBy: { order: 'desc' },
            select: { order: true }
        });
        let nextOrder = (lastTask?.order ?? -1) + 1;

        return prisma.onboardingTask.create({
            data: {
                employeeId,
                title: data.title,
                description: data.description,
                order: nextOrder
            }
        });
    }

    static async deleteTask(tenantId: string, employeeId: string, taskId: string) {
        const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
        if (!employee) throw new Error('Accès refusé');

        const task = await prisma.onboardingTask.findFirst({ where: { id: taskId, employeeId } });
        if (!task) throw new Error('Tâche introuvable');

        await prisma.onboardingTask.delete({ where: { id: taskId } });
        return true;
    }
}
