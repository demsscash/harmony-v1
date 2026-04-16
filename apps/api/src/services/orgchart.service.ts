import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrgChartService {
    /**
     * Vue par UNITÉS — arbre Direction → Département → Service
     * Chaque nœud porte son responsable (managerId)
     */
    static async getUnitsTree(tenantId: string) {
        const units = await prisma.department.findMany({
            where: { tenantId },
            orderBy: [{ type: 'asc' }, { name: 'asc' }],
            include: {
                _count: { select: { employees: true } },
            },
        });

        const managerIds = units.map(u => u.managerId).filter((id): id is string => !!id);
        const managers = await prisma.employee.findMany({
            where: { id: { in: managerIds } },
            select: { id: true, firstName: true, lastName: true, photo: true, position: true },
        });
        const managerMap = new Map(managers.map(m => [m.id, m]));

        const enriched = units.map(u => ({
            ...u,
            manager: u.managerId ? managerMap.get(u.managerId) || null : null,
            children: [] as any[],
        }));

        const map = new Map(enriched.map(u => [u.id, u]));
        const roots: any[] = [];
        for (const u of enriched) {
            if (u.parentId && map.has(u.parentId)) {
                map.get(u.parentId)!.children.push(u);
            } else {
                roots.push(u);
            }
        }
        return roots;
    }

    /**
     * Vue par EMPLOYÉS — arbre via managerId
     */
    static async getEmployeesTree(tenantId: string) {
        const employees = await prisma.employee.findMany({
            where: { tenantId, status: { not: 'TERMINATED' } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                photo: true,
                managerId: true,
                department: { select: { name: true, type: true } },
            },
            orderBy: [{ firstName: 'asc' }],
        });

        const map = new Map(employees.map(e => [e.id, { ...e, children: [] as any[] }]));
        const roots: any[] = [];
        for (const emp of map.values()) {
            if (emp.managerId && map.has(emp.managerId)) {
                map.get(emp.managerId)!.children.push(emp);
            } else {
                roots.push(emp);
            }
        }
        return roots;
    }
}
