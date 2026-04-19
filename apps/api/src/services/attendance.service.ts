import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AttendanceService {
    // ── Codes CRUD ──────────────────────────────────────────

    static async getCodes(tenantId: string) {
        return prisma.attendanceCode.findMany({
            where: { tenantId },
            orderBy: { order: 'asc' },
        });
    }

    static async createCode(tenantId: string, data: { code: string; label: string; color?: string; deductsSalary?: boolean; order?: number }) {
        return prisma.attendanceCode.create({
            data: {
                tenantId,
                code: data.code.toUpperCase(),
                label: data.label,
                color: data.color || '#3b82f6',
                deductsSalary: data.deductsSalary ?? false,
                order: data.order ?? 0,
            },
        });
    }

    static async updateCode(id: string, tenantId: string, data: { code?: string; label?: string; color?: string; deductsSalary?: boolean; order?: number }) {
        const existing = await prisma.attendanceCode.findFirst({ where: { id, tenantId } });
        if (!existing) throw new Error('Code introuvable');
        return prisma.attendanceCode.update({
            where: { id },
            data: { code: data.code?.toUpperCase(), label: data.label, color: data.color, deductsSalary: data.deductsSalary, order: data.order },
        });
    }

    static async deleteCode(id: string, tenantId: string) {
        const existing = await prisma.attendanceCode.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { attendances: true } } },
        });
        if (!existing) throw new Error('Code introuvable');
        if (existing.isDefault) throw new Error('Impossible de supprimer le code par défaut');
        if (existing._count.attendances > 0) throw new Error('Code utilisé dans des pointages existants');
        return prisma.attendanceCode.delete({ where: { id } });
    }

    // ── Attendance entries ───────────────────────────────────

    static async getEntries(tenantId: string, filters: { startDate: string; endDate: string; employeeId?: string; departmentId?: string }) {
        const where: any = {
            tenantId,
            date: { gte: new Date(filters.startDate), lte: new Date(filters.endDate) },
        };
        if (filters.employeeId) where.employeeId = filters.employeeId;
        if (filters.departmentId) where.employee = { departmentId: filters.departmentId };

        return prisma.attendance.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true, departmentId: true } },
                attendanceCode: { select: { id: true, code: true, label: true, color: true, deductsSalary: true } },
            },
            orderBy: [{ employee: { firstName: 'asc' } }, { date: 'asc' }],
        });
    }

    static async upsertEntry(tenantId: string, data: { employeeId: string; date: string; attendanceCodeId: string; note?: string; recordedBy?: string }) {
        const code = await prisma.attendanceCode.findFirst({ where: { id: data.attendanceCodeId, tenantId } });
        if (!code) throw new Error('Code de pointage invalide');

        return prisma.attendance.upsert({
            where: { tenantId_employeeId_date: { tenantId, employeeId: data.employeeId, date: new Date(data.date) } },
            create: { tenantId, employeeId: data.employeeId, date: new Date(data.date), attendanceCodeId: data.attendanceCodeId, note: data.note, recordedBy: data.recordedBy },
            update: { attendanceCodeId: data.attendanceCodeId, note: data.note, recordedBy: data.recordedBy },
            include: { attendanceCode: { select: { code: true, label: true, color: true, deductsSalary: true } } },
        });
    }

    static async bulkUpsert(tenantId: string, entries: Array<{ employeeId: string; date: string; attendanceCodeId: string; note?: string; recordedBy?: string }>) {
        const results = [];
        for (const entry of entries) {
            try {
                const result = await this.upsertEntry(tenantId, entry);
                results.push({ success: true, data: result });
            } catch (error: any) {
                results.push({ success: false, employeeId: entry.employeeId, date: entry.date, error: error.message });
            }
        }
        return results;
    }

    static async fillDefault(tenantId: string, dates: string[], departmentId?: string, recordedBy?: string) {
        const defaultCode = await prisma.attendanceCode.findFirst({ where: { tenantId, isDefault: true } });
        if (!defaultCode) throw new Error('Aucun code par défaut configuré');

        // Chercher le code JF (jour férié)
        const holidayCode = await prisma.attendanceCode.findFirst({ where: { tenantId, code: 'JF' } });

        // Charger les jours fériés du tenant pour les dates demandées
        const holidays = await prisma.holiday.findMany({
            where: { tenantId },
            select: { date: true, isRecurring: true },
        });

        // Construire un Set de dates fériées (format YYYY-MM-DD)
        const holidaySet = new Set<string>();
        for (const h of holidays) {
            const hDate = new Date(h.date);
            for (const dateStr of dates) {
                const d = new Date(dateStr);
                if (h.isRecurring) {
                    // Jour récurrent : comparer mois + jour uniquement
                    if (hDate.getMonth() === d.getMonth() && hDate.getDate() === d.getDate()) {
                        holidaySet.add(dateStr);
                    }
                } else {
                    // Date fixe exacte
                    if (hDate.toISOString().split('T')[0] === dateStr) {
                        holidaySet.add(dateStr);
                    }
                }
            }
        }

        const employeeFilter: any = { tenantId, status: 'ACTIVE' };
        if (departmentId) employeeFilter.departmentId = departmentId;
        const employees = await prisma.employee.findMany({ where: employeeFilter, select: { id: true } });

        let count = 0;
        for (const emp of employees) {
            for (const date of dates) {
                const existing = await prisma.attendance.findUnique({
                    where: { tenantId_employeeId_date: { tenantId, employeeId: emp.id, date: new Date(date) } },
                });
                if (!existing) {
                    // Jour férié → code JF, sinon → code par défaut (T)
                    const codeId = (holidaySet.has(date) && holidayCode) ? holidayCode.id : defaultCode.id;
                    await prisma.attendance.create({
                        data: { tenantId, employeeId: emp.id, date: new Date(date), attendanceCodeId: codeId, recordedBy },
                    });
                    count++;
                }
            }
        }
        return { filled: count };
    }

    // ── Payroll integration ─────────────────────────────────

    static async getDeductibleAbsences(tenantId: string, employeeId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const absences = await prisma.attendance.findMany({
            where: { tenantId, employeeId, date: { gte: startDate, lte: endDate }, attendanceCode: { deductsSalary: true } },
        });
        return absences.length;
    }

    static async getMonthlySummary(tenantId: string, employeeId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const entries = await prisma.attendance.findMany({
            where: { tenantId, employeeId, date: { gte: startDate, lte: endDate } },
            include: { attendanceCode: { select: { code: true, label: true, deductsSalary: true } } },
        });

        const summary: Record<string, { label: string; count: number; deducts: boolean }> = {};
        for (const e of entries) {
            const code = e.attendanceCode.code;
            if (!summary[code]) summary[code] = { label: e.attendanceCode.label, count: 0, deducts: e.attendanceCode.deductsSalary };
            summary[code].count++;
        }

        return { totalEntries: entries.length, daysInMonth: endDate.getDate(), breakdown: summary };
    }
}
