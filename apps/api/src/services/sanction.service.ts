import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SanctionService {
    static async getAll(tenantId: string, filters: { employeeId?: string; status?: string; type?: string }) {
        const where: any = { tenantId };
        if (filters.employeeId) where.employeeId = filters.employeeId;
        if (filters.status) where.status = filters.status;
        if (filters.type) where.type = filters.type;

        return prisma.sanction.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } },
                advantage: { select: { id: true, name: true, type: true } },
            },
        });
    }

    static async getById(id: string, tenantId: string) {
        return prisma.sanction.findFirst({
            where: { id, tenantId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } },
                advantage: { select: { id: true, name: true, type: true } },
            },
        });
    }

    static async create(tenantId: string, userId: string, data: {
        employeeId: string;
        type: string;
        reason: string;
        comment?: string;
        date: string | Date;
        advantageId?: string | null;
        deductionAmount: number;
    }) {
        const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, tenantId } });
        if (!employee) throw new Error('Employé introuvable');

        // Si une prime est ciblée, vérifier qu'elle existe
        if (data.advantageId) {
            const advantage = await prisma.advantage.findFirst({ where: { id: data.advantageId, tenantId } });
            if (!advantage) throw new Error('Avantage/Prime introuvable');
        }

        const sanction = await prisma.sanction.create({
            data: {
                tenantId,
                employeeId: data.employeeId,
                type: data.type as any,
                reason: data.reason,
                comment: data.comment,
                date: new Date(data.date),
                advantageId: data.advantageId || null,
                deductionAmount: data.deductionAmount,
                issuedBy: userId,
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } },
                advantage: { select: { id: true, name: true, type: true } },
            },
        });

        // Ajouter à la timeline de l'employé
        await prisma.employeeTimeline.create({
            data: {
                employeeId: data.employeeId,
                event: 'SANCTION',
                description: `Sanction: ${data.type} — ${data.reason}`,
                newValue: `${data.deductionAmount} MRU`,
                performedBy: userId,
            },
        });

        return sanction;
    }

    static async update(id: string, tenantId: string, data: {
        type?: string;
        reason?: string;
        comment?: string;
        date?: string | Date;
        advantageId?: string | null;
        deductionAmount?: number;
    }) {
        const sanction = await prisma.sanction.findFirst({ where: { id, tenantId } });
        if (!sanction) throw new Error('Sanction introuvable');

        const updateData: any = {};
        if (data.type) updateData.type = data.type;
        if (data.reason) updateData.reason = data.reason;
        if (data.comment !== undefined) updateData.comment = data.comment;
        if (data.date) updateData.date = new Date(data.date);
        if (data.advantageId !== undefined) updateData.advantageId = data.advantageId || null;
        if (data.deductionAmount !== undefined) updateData.deductionAmount = data.deductionAmount;

        return prisma.sanction.update({
            where: { id },
            data: updateData,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } },
                advantage: { select: { id: true, name: true, type: true } },
            },
        });
    }

    static async archive(id: string, tenantId: string) {
        const sanction = await prisma.sanction.findFirst({ where: { id, tenantId } });
        if (!sanction) throw new Error('Sanction introuvable');

        return prisma.sanction.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });
    }

    static async delete(id: string, tenantId: string) {
        const sanction = await prisma.sanction.findFirst({ where: { id, tenantId } });
        if (!sanction) throw new Error('Sanction introuvable');

        return prisma.sanction.delete({ where: { id } });
    }

    /**
     * Récupérer les sanctions actives d'un employé pour un mois donné (pour la paie).
     */
    static async getActiveForPayroll(tenantId: string, employeeId: string, month: number, year: number) {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        return prisma.sanction.findMany({
            where: {
                tenantId,
                employeeId,
                status: 'ACTIVE',
                type: { in: ['DEDUCTION_PRIME', 'RETENUE_SALAIRE'] },
                date: { gte: startOfMonth, lte: endOfMonth },
            },
            include: {
                advantage: { select: { name: true } },
            },
        });
    }
}
