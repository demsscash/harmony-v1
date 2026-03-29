import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdvanceService {
    static async getAll(tenantId: string, filters: { employeeId?: string; status?: string; month?: number; year?: number }) {
        const where: any = { tenantId };
        if (filters.employeeId) where.employeeId = filters.employeeId;
        if (filters.status) where.status = filters.status;
        if (filters.month && filters.year) {
            const startDate = new Date(filters.year, filters.month - 1, 1);
            const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
            where.requestDate = { gte: startDate, lte: endDate };
        }

        return prisma.salaryAdvance.findMany({
            where,
            orderBy: { requestDate: 'desc' },
            include: { employee: { select: { id: true, firstName: true, lastName: true, matricule: true, baseSalary: true } } },
        });
    }

    static async getById(id: string, tenantId: string) {
        return prisma.salaryAdvance.findFirst({
            where: { id, tenantId },
            include: { employee: { select: { id: true, firstName: true, lastName: true, matricule: true, baseSalary: true } } },
        });
    }

    static async create(tenantId: string, data: { employeeId: string; amount: number; reason?: string }) {
        const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, tenantId } });
        if (!employee) throw new Error('Employé introuvable');

        // Vérifier que le montant ne dépasse pas 50% du salaire de base
        const maxAllowed = Number(employee.baseSalary) * 0.5;
        if (data.amount > maxAllowed) {
            throw new Error(`Le montant ne peut pas dépasser 50% du salaire de base (${maxAllowed.toLocaleString()} MRU)`);
        }

        // Vérifier qu'il n'y a pas déjà un acompte en attente
        const pendingAdvance = await prisma.salaryAdvance.findFirst({
            where: { tenantId, employeeId: data.employeeId, status: 'PENDING' },
        });
        if (pendingAdvance) {
            throw new Error('Cet employé a déjà une demande d\'acompte en attente');
        }

        return prisma.salaryAdvance.create({
            data: {
                tenantId,
                employeeId: data.employeeId,
                amount: data.amount,
                reason: data.reason,
            },
            include: { employee: { select: { id: true, firstName: true, lastName: true, matricule: true } } },
        });
    }

    static async approve(id: string, tenantId: string, userId: string) {
        const advance = await prisma.salaryAdvance.findFirst({ where: { id, tenantId } });
        if (!advance) throw new Error('Acompte introuvable');
        if (advance.status !== 'PENDING') throw new Error('Seuls les acomptes en attente peuvent être approuvés');

        return prisma.salaryAdvance.update({
            where: { id },
            data: { status: 'APPROVED', reviewedBy: userId, reviewedAt: new Date() },
        });
    }

    static async reject(id: string, tenantId: string, userId: string, reason?: string) {
        const advance = await prisma.salaryAdvance.findFirst({ where: { id, tenantId } });
        if (!advance) throw new Error('Acompte introuvable');
        if (advance.status !== 'PENDING') throw new Error('Seuls les acomptes en attente peuvent être rejetés');

        return prisma.salaryAdvance.update({
            where: { id },
            data: { status: 'REJECTED', reviewedBy: userId, reviewedAt: new Date(), rejectionReason: reason },
        });
    }

    /**
     * Récupère les acomptes approuvés pour un employé, à déduire de la paie.
     */
    static async getApprovedForPayroll(tenantId: string, employeeId: string, month: number, year: number) {
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);
        return prisma.salaryAdvance.findMany({
            where: {
                tenantId,
                employeeId,
                status: 'APPROVED',
                requestDate: { lte: endOfMonth },
            },
        });
    }

    /**
     * Marquer les acomptes comme déduits après génération des bulletins.
     */
    static async markAsDeducted(advanceIds: string[], payslipId: string) {
        if (advanceIds.length === 0) return;
        await prisma.salaryAdvance.updateMany({
            where: { id: { in: advanceIds } },
            data: { status: 'DEDUCTED', deductedInPayslipId: payslipId },
        });
    }

    /**
     * Remettre les acomptes DEDUCTED en APPROVED (si on régénère les bulletins).
     */
    static async resetDeductedForPayroll(payrollId: string) {
        // Trouver les payslips de cette campagne
        const payslips = await prisma.payslip.findMany({ where: { payrollId }, select: { id: true } });
        const payslipIds = payslips.map(p => p.id);
        if (payslipIds.length === 0) return;

        await prisma.salaryAdvance.updateMany({
            where: { deductedInPayslipId: { in: payslipIds }, status: 'DEDUCTED' },
            data: { status: 'APPROVED', deductedInPayslipId: null },
        });
    }
}
