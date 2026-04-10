import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        const departmentsRaw = await prisma.department.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { employees: true, children: true }
                },
                orgLevel: { select: { id: true, name: true, rank: true } },
                parent: { select: { id: true, name: true } },
            },
            orderBy: [{ orgLevel: { rank: 'asc' } }, { name: 'asc' }]
        });

        // Manually fetch managers since the relation is one-way from Employee to Department
        const managerIds = departmentsRaw.map(d => d.managerId).filter(id => id !== null) as string[];

        const managers = await prisma.employee.findMany({
            where: { id: { in: managerIds } },
            select: { id: true, firstName: true, lastName: true, email: true, photo: true }
        });

        const departments = departmentsRaw.map(d => ({
            ...d,
            manager: managers.find(m => m.id === d.managerId) || null
        }));

        res.json({ success: true, data: departments });
    } catch (error: any) {
        console.error("getDepartments error:", error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des départements' });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { name, description, managerId, parentId, orgLevelId } = req.body;

        const existing = await prisma.department.findFirst({
            where: { tenantId, name }
        });

        if (existing) {
            return res.status(409).json({ success: false, error: 'Un département avec ce nom existe déjà' });
        }

        const dept = await prisma.department.create({
            data: {
                tenantId,
                name,
                description,
                managerId: managerId || null,
                parentId: parentId || null,
                orgLevelId: orgLevelId || null,
            }
        });

        let manager = null;
        if (dept.managerId) {
            manager = await prisma.employee.findUnique({
                where: { id: dept.managerId },
                select: { id: true, firstName: true, lastName: true, email: true, photo: true }
            });
        }

        res.status(201).json({ success: true, data: { ...dept, manager } });
    } catch (error: any) {
        console.error("createDepartment error:", error);
        res.status(500).json({ success: false, error: 'Erreur lors de la création du département' });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const id = req.params.id as string;
        const { name, description, managerId, parentId, orgLevelId } = req.body;

        if (name) {
            const existing = await prisma.department.findFirst({
                where: { tenantId, name, id: { not: id } }
            });

            if (existing) {
                return res.status(409).json({ success: false, error: 'Un département avec ce nom existe déjà' });
            }
        }

        const existingDept = await prisma.department.findFirst({
            where: { id, tenantId }
        });

        if (!existingDept) {
            return res.status(404).json({ success: false, error: 'Département introuvable' });
        }

        const dept = await prisma.department.update({
            where: { id },
            data: {
                name,
                description,
                managerId: managerId === "" ? null : managerId,
                parentId: parentId === "" ? null : (parentId !== undefined ? parentId : undefined),
                orgLevelId: orgLevelId === "" ? null : (orgLevelId !== undefined ? orgLevelId : undefined),
            }
        });

        let manager = null;
        if (dept.managerId) {
            manager = await prisma.employee.findUnique({
                where: { id: dept.managerId },
                select: { id: true, firstName: true, lastName: true, email: true, photo: true }
            });
        }

        res.json({ success: true, data: { ...dept, manager } });
    } catch (error: any) {
        console.error("updateDepartment error:", error);
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, error: 'Département introuvable' });
        }
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour' });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const id = req.params.id as string;

        const dept = await prisma.department.findFirst({
            where: { id, tenantId },
            include: {
                _count: { select: { employees: true } }
            }
        });

        if (!dept) {
            return res.status(404).json({ success: false, error: 'Département introuvable' });
        }

        if (dept._count.employees > 0) {
            return res.status(400).json({ success: false, error: 'Impossible de supprimer un département contenant des employés' });
        }

        await prisma.department.delete({ where: { id } });

        res.json({ success: true, message: 'Département supprimé avec succès' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
    }
};
