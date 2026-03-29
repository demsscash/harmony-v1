import { PrismaClient, ExpenseCategory } from '@prisma/client';

const prisma = new PrismaClient();

export class ExpenseService {
    static async getAll(tenantId: string, filters: { employeeId?: string; status?: string }) {
        const where: any = { tenantId };
        if (filters.employeeId) where.employeeId = filters.employeeId;
        if (filters.status) where.status = filters.status;

        return prisma.expenseReport.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } },
                items: true,
            },
        });
    }

    static async getById(id: string, tenantId: string) {
        return prisma.expenseReport.findFirst({
            where: { id, tenantId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } },
                items: { orderBy: { date: 'asc' } },
            },
        });
    }

    static async create(tenantId: string, data: {
        employeeId: string;
        title: string;
        items: { category: ExpenseCategory; description: string; amount: number; date: string; receiptUrl?: string }[];
    }) {
        const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, tenantId } });
        if (!employee) throw new Error('Employé introuvable');

        const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);

        return prisma.expenseReport.create({
            data: {
                tenantId,
                employeeId: data.employeeId,
                title: data.title,
                totalAmount,
                items: {
                    create: data.items.map(item => ({
                        category: item.category,
                        description: item.description,
                        amount: item.amount,
                        date: new Date(item.date),
                        receiptUrl: item.receiptUrl,
                    })),
                },
            },
            include: { items: true },
        });
    }

    static async addItem(reportId: string, tenantId: string, item: { category: ExpenseCategory; description: string; amount: number; date: string; receiptUrl?: string }) {
        const report = await prisma.expenseReport.findFirst({ where: { id: reportId, tenantId } });
        if (!report) throw new Error('Note de frais introuvable');
        if (report.status !== 'DRAFT') throw new Error('Impossible de modifier une note soumise');

        const created = await prisma.expenseItem.create({
            data: {
                expenseReportId: reportId,
                category: item.category,
                description: item.description,
                amount: item.amount,
                date: new Date(item.date),
                receiptUrl: item.receiptUrl,
            },
        });

        // Update total
        await this.recalculateTotal(reportId);
        return created;
    }

    static async removeItem(itemId: string, tenantId: string) {
        const item = await prisma.expenseItem.findFirst({
            where: { id: itemId },
            include: { expenseReport: true },
        });
        if (!item || item.expenseReport.tenantId !== tenantId) throw new Error('Élément introuvable');
        if (item.expenseReport.status !== 'DRAFT') throw new Error('Impossible de modifier une note soumise');

        await prisma.expenseItem.delete({ where: { id: itemId } });
        await this.recalculateTotal(item.expenseReportId);
    }

    static async submit(id: string, tenantId: string) {
        const report = await prisma.expenseReport.findFirst({ where: { id, tenantId }, include: { items: true } });
        if (!report) throw new Error('Note de frais introuvable');
        if (report.status !== 'DRAFT') throw new Error('Cette note a déjà été soumise');
        if (report.items.length === 0) throw new Error('Ajoutez au moins un élément avant de soumettre');

        return prisma.expenseReport.update({
            where: { id },
            data: { status: 'SUBMITTED', submittedAt: new Date() },
        });
    }

    static async approve(id: string, tenantId: string, userId: string) {
        const report = await prisma.expenseReport.findFirst({ where: { id, tenantId } });
        if (!report) throw new Error('Note de frais introuvable');
        if (report.status !== 'SUBMITTED') throw new Error('Seules les notes soumises peuvent être approuvées');

        return prisma.expenseReport.update({
            where: { id },
            data: { status: 'APPROVED', reviewedBy: userId, reviewedAt: new Date() },
        });
    }

    static async reject(id: string, tenantId: string, userId: string, reason?: string) {
        const report = await prisma.expenseReport.findFirst({ where: { id, tenantId } });
        if (!report) throw new Error('Note de frais introuvable');
        if (report.status !== 'SUBMITTED') throw new Error('Seules les notes soumises peuvent être rejetées');

        return prisma.expenseReport.update({
            where: { id },
            data: { status: 'REJECTED', reviewedBy: userId, reviewedAt: new Date(), rejectionReason: reason },
        });
    }

    static async markReimbursed(id: string, tenantId: string) {
        const report = await prisma.expenseReport.findFirst({ where: { id, tenantId } });
        if (!report) throw new Error('Note de frais introuvable');
        if (report.status !== 'APPROVED') throw new Error('Seules les notes approuvées peuvent être marquées remboursées');

        return prisma.expenseReport.update({
            where: { id },
            data: { status: 'REIMBURSED' },
        });
    }

    static async delete(id: string, tenantId: string) {
        const report = await prisma.expenseReport.findFirst({ where: { id, tenantId } });
        if (!report) throw new Error('Note de frais introuvable');
        if (report.status !== 'DRAFT') throw new Error('Impossible de supprimer une note soumise');

        await prisma.expenseItem.deleteMany({ where: { expenseReportId: id } });
        await prisma.expenseReport.delete({ where: { id } });
    }

    private static async recalculateTotal(reportId: string) {
        const result = await prisma.expenseItem.aggregate({
            where: { expenseReportId: reportId },
            _sum: { amount: true },
        });
        await prisma.expenseReport.update({
            where: { id: reportId },
            data: { totalAmount: result._sum.amount || 0 },
        });
    }
}
