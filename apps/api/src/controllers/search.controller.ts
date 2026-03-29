import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const globalSearch = async (req: Request, res: Response) => {
    try {
        const q = String(req.query.q || '').trim();
        if (!q || q.length < 2) {
            res.json({ success: true, data: { employees: [], leaves: [], users: [] } });
            return;
        }

        const role = req.user?.role;
        const tenantId = req.tenant?.id;

        // SUPER_ADMIN: search tenants
        if (role === 'SUPER_ADMIN') {
            const tenants = await prisma.tenant.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { subdomain: { contains: q, mode: 'insensitive' } },
                        { email: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, name: true, subdomain: true, isActive: true },
                take: 10,
            });
            res.json({ success: true, data: { tenants } });
            return;
        }

        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant context missing' });
            return;
        }

        // EMPLOYEE: search only their own leaves and documents
        if (role === 'EMPLOYEE') {
            const employeeId = req.user?.employeeId;
            if (!employeeId) {
                res.json({ success: true, data: { leaves: [] } });
                return;
            }

            const leaves = await prisma.leave.findMany({
                where: {
                    employeeId,
                    OR: [
                        { reason: { contains: q, mode: 'insensitive' } },
                        { leaveType: { name: { contains: q, mode: 'insensitive' } } },
                    ],
                },
                include: { leaveType: { select: { name: true } } },
                take: 5,
                orderBy: { createdAt: 'desc' },
            });

            res.json({ success: true, data: { leaves } });
            return;
        }

        // ADMIN / HR: search employees + leaves
        const employees = await prisma.employee.findMany({
            where: {
                tenantId,
                OR: [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { matricule: { contains: q, mode: 'insensitive' } },
                    { position: { contains: q, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true, firstName: true, lastName: true, matricule: true,
                position: true, photo: true,
                department: { select: { name: true } },
            },
            take: 8,
        });

        const leaves = await prisma.leave.findMany({
            where: {
                employee: { tenantId },
                OR: [
                    { employee: { firstName: { contains: q, mode: 'insensitive' } } },
                    { employee: { lastName: { contains: q, mode: 'insensitive' } } },
                    { leaveType: { name: { contains: q, mode: 'insensitive' } } },
                ],
            },
            include: {
                employee: { select: { firstName: true, lastName: true } },
                leaveType: { select: { name: true } },
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { employees, leaves } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
