import { Request, Response } from 'express';
import { PrismaClient, OrgUnitType } from '@prisma/client';

const prisma = new PrismaClient();

// Hierarchy rules: DIRECTION → DEPARTMENT → SERVICE
const TYPE_RANK: Record<string, number> = { DIRECTION: 1, DEPARTMENT: 2, SERVICE: 3 };

function validateHierarchy(type: OrgUnitType, parentType: OrgUnitType | null): string | null {
    if (type === 'DIRECTION') {
        if (parentType) return 'Une Direction ne peut pas avoir de parent';
        return null;
    }
    if (type === 'DEPARTMENT') {
        if (!parentType) return 'Un Département doit être rattaché à une Direction';
        if (parentType !== 'DIRECTION') return 'Un Département doit être rattaché à une Direction';
        return null;
    }
    if (type === 'SERVICE') {
        if (!parentType) return 'Un Service doit être rattaché à un Département';
        if (parentType !== 'DEPARTMENT') return 'Un Service doit être rattaché à un Département';
        return null;
    }
    return null;
}

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        const departmentsRaw = await prisma.department.findMany({
            where: { tenantId },
            include: {
                _count: { select: { employees: true, children: true } },
                parent: { select: { id: true, name: true, type: true } },
            },
            orderBy: [{ type: 'asc' }, { name: 'asc' }],
        });

        // Manually fetch managers
        const managerIds = departmentsRaw.map(d => d.managerId).filter(id => id !== null) as string[];
        const managers = await prisma.employee.findMany({
            where: { id: { in: managerIds } },
            select: { id: true, firstName: true, lastName: true, email: true, photo: true, position: true },
        });

        const departments = departmentsRaw.map(d => ({
            ...d,
            manager: managers.find(m => m.id === d.managerId) || null,
        }));

        res.json({ success: true, data: departments });
    } catch (error: any) {
        console.error('getDepartments error:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des unités' });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { name, description, type, managerId, parentId } = req.body;

        if (!name || !type) {
            return res.status(400).json({ success: false, error: 'Nom et type requis' });
        }

        if (!['DIRECTION', 'DEPARTMENT', 'SERVICE'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Type invalide' });
        }

        // Validate parent hierarchy
        let parentType: OrgUnitType | null = null;
        if (parentId) {
            const parent = await prisma.department.findFirst({ where: { id: parentId, tenantId } });
            if (!parent) return res.status(400).json({ success: false, error: 'Unité parente introuvable' });
            parentType = parent.type;
        }

        const validationError = validateHierarchy(type as OrgUnitType, parentType);
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        const existing = await prisma.department.findFirst({ where: { tenantId, name } });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Une unité avec ce nom existe déjà' });
        }

        const dept = await prisma.department.create({
            data: {
                tenantId,
                name,
                description,
                type: type as OrgUnitType,
                managerId: managerId || null,
                parentId: parentId || null,
            },
        });

        let manager = null;
        if (dept.managerId) {
            manager = await prisma.employee.findUnique({
                where: { id: dept.managerId },
                select: { id: true, firstName: true, lastName: true, email: true, photo: true, position: true },
            });
        }

        res.status(201).json({ success: true, data: { ...dept, manager } });
    } catch (error: any) {
        console.error('createDepartment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const id = req.params.id as string;
        const { name, description, type, managerId, parentId } = req.body;

        const existingDept = await prisma.department.findFirst({ where: { id, tenantId } });
        if (!existingDept) {
            return res.status(404).json({ success: false, error: 'Unité introuvable' });
        }

        if (name && name !== existingDept.name) {
            const dup = await prisma.department.findFirst({ where: { tenantId, name, id: { not: id } } });
            if (dup) return res.status(409).json({ success: false, error: 'Une unité avec ce nom existe déjà' });
        }

        // Validate hierarchy if type or parent change
        const newType = (type as OrgUnitType) || existingDept.type;
        const newParentId = parentId !== undefined ? parentId : existingDept.parentId;

        let parentType: OrgUnitType | null = null;
        if (newParentId) {
            if (newParentId === id) {
                return res.status(400).json({ success: false, error: 'Une unité ne peut pas être son propre parent' });
            }
            const parent = await prisma.department.findFirst({ where: { id: newParentId, tenantId } });
            if (!parent) return res.status(400).json({ success: false, error: 'Unité parente introuvable' });
            parentType = parent.type;
        }

        const validationError = validateHierarchy(newType, parentType);
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        const dept = await prisma.department.update({
            where: { id },
            data: {
                name,
                description,
                type: type as OrgUnitType,
                managerId: managerId === '' ? null : managerId,
                parentId: parentId === '' ? null : (parentId !== undefined ? parentId : undefined),
            },
        });

        let manager = null;
        if (dept.managerId) {
            manager = await prisma.employee.findUnique({
                where: { id: dept.managerId },
                select: { id: true, firstName: true, lastName: true, email: true, photo: true, position: true },
            });
        }

        res.json({ success: true, data: { ...dept, manager } });
    } catch (error: any) {
        console.error('updateDepartment error:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour' });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const id = req.params.id as string;

        const dept = await prisma.department.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { employees: true, children: true } } },
        });

        if (!dept) return res.status(404).json({ success: false, error: 'Unité introuvable' });
        if (dept._count.employees > 0) {
            return res.status(400).json({ success: false, error: 'Impossible de supprimer une unité contenant des employés' });
        }
        if (dept._count.children > 0) {
            return res.status(400).json({ success: false, error: 'Impossible de supprimer une unité contenant des sous-unités' });
        }

        await prisma.department.delete({ where: { id } });
        res.json({ success: true, message: 'Unité supprimée avec succès' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Erreur lors de la suppression' });
    }
};
