import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all tenants (Super Admin only — auth enforced by route-level RBAC)
export const getAllTenants = async (req: Request, res: Response) => {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                _count: {
                    select: { users: true, employees: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: tenants });
    } catch (error) {
        console.error('GetAllTenants error:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des instances' });
    }
};


// Toggle Tenant Status (Kill Switch — auth enforced by route-level RBAC)
export const toggleTenantStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { isActive } = req.body;


        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, error: 'Le champ isActive doit être un booléen' });
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id },
            data: { isActive },
        });

        res.json({ success: true, data: { message: `Instance ${isActive ? 'activée' : 'suspendue'} avec succès`, tenant: updatedTenant } });
    } catch (error) {
        console.error('ToggleTenantStatus error:', error);
        res.status(500).json({ success: false, error: "Erreur lors de la modification du statut de l'instance" });
    }
};

// Create a new Tenant (SaaS Client)
export const createTenant = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, error: 'Accès refusé. Requis: SUPER_ADMIN' });
        }

        const { name, subdomain, adminEmail, adminPassword } = req.body;

        if (!name || !subdomain || !adminEmail || !adminPassword) {
            return res.status(400).json({ success: false, error: 'Champs requis manquants (name, subdomain, adminEmail, adminPassword)' });
        }

        // Check if subdomain exists
        const existingTenant = await prisma.tenant.findUnique({ where: { subdomain } });
        if (existingTenant) {
            return res.status(400).json({ success: false, error: 'Ce sous-domaine est déjà utilisé' });
        }

        // We require bcrypt directly or via a service. Let's require it dynamically to avoid top-level import issue if I just append
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Transaction to create Tenant + initial Admin User + default Settings
        const newTenant = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    subdomain: subdomain.toLowerCase(),
                    settings: {
                        create: {
                            fiscalYearStart: 1,
                            workDaysPerWeek: 5,
                            weekStartDay: 1,
                        }
                    }
                }
            });

            await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    email: adminEmail.toLowerCase(),
                    passwordHash: hashedPassword,
                    role: 'ADMIN',
                }
            });

            return tenant;
        });

        res.status(201).json({ success: true, data: { message: 'Instance créée avec succès', tenant: newTenant } });
    } catch (error) {
        console.error('CreateTenant error:', error);
        res.status(500).json({ success: false, error: "Erreur lors de la création de l'instance" });
    }
};

// Delete a Tenant completely
export const deleteTenant = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, error: 'Accès refusé. Requis: SUPER_ADMIN' });
        }

        const id = req.params.id as string;

        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant) {
            return res.status(404).json({ success: false, error: 'Instance non trouvée' });
        }

        await prisma.$transaction(async (tx) => {
            const employeeIds = (await tx.employee.findMany({ where: { tenantId: id }, select: { id: true } })).map((e: { id: string }) => e.id);

            await tx.employeeAdvantage.deleteMany({ where: { employeeId: { in: employeeIds } } });
            await tx.leaveBalance.deleteMany({ where: { employeeId: { in: employeeIds } } });
            await tx.leave.deleteMany({ where: { employeeId: { in: employeeIds } } });
            await tx.employeeTimeline.deleteMany({ where: { employeeId: { in: employeeIds } } });
            await tx.document.deleteMany({ where: { employeeId: { in: employeeIds } } });
            await tx.signatureRequest.deleteMany({ where: { employeeId: { in: employeeIds } } });
            await tx.payslip.deleteMany({ where: { employeeId: { in: employeeIds } } });
            await tx.payroll.deleteMany({ where: { tenantId: id } });
            await tx.declaration.deleteMany({ where: { tenantId: id } });

            await tx.onboardingTask.deleteMany({ where: { employeeId: { in: employeeIds } } });
            await tx.employee.deleteMany({ where: { tenantId: id } });
            await tx.department.deleteMany({ where: { tenantId: id } });
            await tx.gradeAdvantage.deleteMany({ where: { grade: { tenantId: id } } });
            await tx.grade.deleteMany({ where: { tenantId: id } });
            await tx.advantage.deleteMany({ where: { tenantId: id } });
            await tx.leaveType.deleteMany({ where: { tenantId: id } });
            await tx.onboardingTemplate.deleteMany({ where: { tenantId: id } });

            await tx.tenantSettings.deleteMany({ where: { tenantId: id } });
            await tx.user.deleteMany({ where: { tenantId: id } });

            await tx.tenant.delete({ where: { id } });
        });

        res.json({ success: true, data: { message: 'Instance supprimée définitivement' } });
    } catch (error) {
        console.error('DeleteTenant error:', error);
        res.status(500).json({ success: false, error: "Erreur lors de la suppression de l'instance" });
    }
};

// Update Tenant Billing Plan
export const updateTenantPlan = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, error: 'Accès refusé. Requis: SUPER_ADMIN' });
        }

        const { id } = req.params;
        const { plan } = req.body;

        const validPlans = ['Starter', 'Pro', 'Enterprise'];
        if (!plan || !validPlans.includes(plan)) {
            return res.status(400).json({ success: false, error: `Plan invalide. Valeurs acceptées: ${validPlans.join(', ')}` });
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: String(id) },
            data: { plan } as any,
        });

        res.json({ success: true, data: { message: `Plan mis à jour: ${plan}`, tenant: updatedTenant } });
    } catch (error) {
        console.error('UpdateTenantPlan error:', error);
        res.status(500).json({ success: false, error: "Erreur lors de la mise à jour du plan" });
    }
};

