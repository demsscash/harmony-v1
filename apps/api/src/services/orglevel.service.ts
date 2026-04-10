import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrgLevelService {
    static async getAll(tenantId: string) {
        return prisma.orgLevel.findMany({
            where: { tenantId },
            orderBy: { rank: 'asc' },
            include: {
                _count: { select: { employees: true } },
            },
        });
    }

    static async getById(id: string, tenantId: string) {
        return prisma.orgLevel.findFirst({
            where: { id, tenantId },
            include: {
                employees: { select: { id: true, firstName: true, lastName: true, position: true } },
            },
        });
    }

    static async create(tenantId: string, data: { name: string; rank: number; description?: string }) {
        return prisma.orgLevel.create({
            data: { tenantId, name: data.name, rank: data.rank, description: data.description },
        });
    }

    static async update(id: string, tenantId: string, data: { name?: string; rank?: number; description?: string }) {
        const level = await prisma.orgLevel.findFirst({ where: { id, tenantId } });
        if (!level) throw new Error('Niveau hiérarchique introuvable');

        return prisma.orgLevel.update({
            where: { id },
            data: { name: data.name, rank: data.rank, description: data.description },
        });
    }

    static async delete(id: string, tenantId: string) {
        const level = await prisma.orgLevel.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { employees: true } } },
        });
        if (!level) throw new Error('Niveau hiérarchique introuvable');
        if (level._count.employees > 0) {
            throw new Error(`Impossible de supprimer : ${level._count.employees} employé(s) affecté(s) à ce niveau`);
        }

        return prisma.orgLevel.delete({ where: { id } });
    }

    /**
     * Construire l'organigramme complet à partir des relations managerId
     */
    static async getOrgChart(tenantId: string) {
        const employees = await prisma.employee.findMany({
            where: { tenantId, status: 'ACTIVE' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                photo: true,
                managerId: true,
                departmentId: true,
                department: { select: { name: true } },
                orgLevel: { select: { id: true, name: true, rank: true } },
            },
            orderBy: [
                { orgLevel: { rank: 'asc' } },
                { firstName: 'asc' },
            ],
        });

        // Construire un arbre à partir des relations managerId
        const employeeMap = new Map(employees.map(e => [e.id, { ...e, children: [] as any[] }]));

        const roots: any[] = [];
        for (const emp of employeeMap.values()) {
            if (emp.managerId && employeeMap.has(emp.managerId)) {
                employeeMap.get(emp.managerId)!.children.push(emp);
            } else {
                roots.push(emp);
            }
        }

        return roots;
    }
}
