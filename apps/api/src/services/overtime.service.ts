import { PrismaClient, OvertimeTier } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_TIERS = [
    { tier: 'TIER_1', label: 'Majoration 25%', rate: 1.25, maxHours: 8 },
    { tier: 'TIER_2', label: 'Majoration 50%', rate: 1.50, maxHours: 8 },
    { tier: 'TIER_3', label: 'Majoration 100%', rate: 2.00, maxHours: null },
];

export class OvertimeService {
    static async getConfig(tenantId: string) {
        const config = await prisma.overtimeConfig.findUnique({ where: { tenantId } });
        return config || { tenantId, tiers: DEFAULT_TIERS };
    }

    static async upsertConfig(tenantId: string, tiers: any[]) {
        return prisma.overtimeConfig.upsert({
            where: { tenantId },
            create: { tenantId, tiers },
            update: { tiers },
        });
    }

    static async getAll(tenantId: string, filters: { employeeId?: string; month?: number; year?: number }) {
        const where: any = { tenantId };
        if (filters.employeeId) where.employeeId = filters.employeeId;
        if (filters.month && filters.year) {
            const startDate = new Date(filters.year, filters.month - 1, 1);
            const endDate = new Date(filters.year, filters.month, 0);
            where.date = { gte: startDate, lte: endDate };
        }

        return prisma.overtime.findMany({
            where,
            orderBy: { date: 'desc' },
            include: { employee: { select: { id: true, firstName: true, lastName: true, matricule: true } } },
        });
    }

    static async getById(id: string, tenantId: string) {
        return prisma.overtime.findFirst({
            where: { id, tenantId },
            include: { employee: { select: { id: true, firstName: true, lastName: true, matricule: true } } },
        });
    }

    static async create(tenantId: string, data: { employeeId: string; date: string; hours: number; tier: OvertimeTier; reason?: string; recordedBy?: string }) {
        const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, tenantId } });
        if (!employee) throw new Error('Employé introuvable');

        // Lookup rate from config
        const config = await this.getConfig(tenantId);
        const tiers = config.tiers as any[];
        const tierConfig = tiers.find((t: any) => t.tier === data.tier);
        const rate = tierConfig?.rate ?? 1.25;

        return prisma.overtime.create({
            data: {
                tenantId,
                employeeId: data.employeeId,
                date: new Date(data.date),
                hours: data.hours,
                tier: data.tier,
                rate,
                reason: data.reason,
                recordedBy: data.recordedBy,
            },
        });
    }

    static async update(id: string, tenantId: string, data: { hours?: number; tier?: OvertimeTier; reason?: string }) {
        const record = await prisma.overtime.findFirst({ where: { id, tenantId } });
        if (!record) throw new Error('Enregistrement introuvable');

        const updateData: any = {};
        if (data.hours !== undefined) updateData.hours = data.hours;
        if (data.reason !== undefined) updateData.reason = data.reason;
        if (data.tier) {
            updateData.tier = data.tier;
            const config = await this.getConfig(tenantId);
            const tiers = config.tiers as any[];
            const tierConfig = tiers.find((t: any) => t.tier === data.tier);
            updateData.rate = tierConfig?.rate ?? 1.25;
        }

        return prisma.overtime.update({ where: { id }, data: updateData });
    }

    static async delete(id: string, tenantId: string) {
        const record = await prisma.overtime.findFirst({ where: { id, tenantId } });
        if (!record) throw new Error('Enregistrement introuvable');
        await prisma.overtime.delete({ where: { id } });
    }

    /**
     * Calcul du montant des heures supplémentaires pour un employé sur un mois donné.
     * Utilisé par le moteur de paie.
     */
    static async getMonthlyOvertimePay(tenantId: string, employeeId: string, month: number, year: number): Promise<number> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const records = await prisma.overtime.findMany({
            where: {
                tenantId,
                employeeId,
                date: { gte: startDate, lte: endDate },
            },
        });

        if (records.length === 0) return 0;

        const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
        if (!employee) return 0;

        const baseSalary = Number(employee.baseSalary);
        const hourlyRate = baseSalary / (22 * 8); // 22 jours ouvrés, 8h/jour

        let total = 0;
        for (const r of records) {
            total += Number(r.hours) * Number(r.rate) * hourlyRate;
        }

        return Math.round(total * 100) / 100;
    }
}
