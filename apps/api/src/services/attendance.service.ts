import { PrismaClient, AttendanceStatus, DeductionMethod } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateAttendanceInput {
    employeeId: string;
    date: string; // YYYY-MM-DD
    clockIn?: string; // ISO datetime
    clockOut?: string; // ISO datetime
    note?: string;
}

interface TieredRule {
    maxMinutes: number;
    deductionFraction: number; // fraction of daily salary (0 = nothing, 0.25 = quarter day, 1 = full day)
}

export class AttendanceService {

    // ==========================================
    // CONFIG
    // ==========================================

    static async getConfig(tenantId: string) {
        return prisma.attendanceConfig.findUnique({ where: { tenantId } });
    }

    static async upsertConfig(tenantId: string, data: any) {
        return prisma.attendanceConfig.upsert({
            where: { tenantId },
            create: { tenantId, ...data },
            update: data,
        });
    }

    // ==========================================
    // EMPLOYEE SCHEDULE
    // ==========================================

    static async getSchedule(employeeId: string) {
        return prisma.employeeSchedule.findUnique({ where: { employeeId } });
    }

    static async upsertSchedule(employeeId: string, data: { startTime: string; endTime: string; customGraceMinutes?: number }) {
        return prisma.employeeSchedule.upsert({
            where: { employeeId },
            create: { employeeId, ...data },
            update: data,
        });
    }

    // ==========================================
    // ATTENDANCE CRUD
    // ==========================================

    static async getAll(tenantId: string, filters: { month?: number; year?: number; employeeId?: string; status?: AttendanceStatus; departmentId?: string }) {
        const where: any = { tenantId };

        if (filters.employeeId) where.employeeId = filters.employeeId;
        if (filters.status) where.status = filters.status;

        if (filters.month && filters.year) {
            const startDate = new Date(filters.year, filters.month - 1, 1);
            const endDate = new Date(filters.year, filters.month, 0); // last day of month
            where.date = { gte: startDate, lte: endDate };
        }

        if (filters.departmentId) {
            where.employee = { departmentId: filters.departmentId };
        }

        return prisma.attendance.findMany({
            where,
            orderBy: [{ date: 'desc' }, { employee: { lastName: 'asc' } }],
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, matricule: true, departmentId: true, baseSalary: true, department: { select: { name: true } } }
                }
            }
        });
    }

    static async getById(id: string, tenantId: string) {
        return prisma.attendance.findFirst({
            where: { id, tenantId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true, baseSalary: true } }
            }
        });
    }

    /**
     * Vérifie si une date est un jour férié pour ce tenant
     */
    static async isHoliday(tenantId: string, date: Date): Promise<boolean> {
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const holiday = await prisma.holiday.findFirst({
            where: {
                tenantId,
                date: dateOnly,
            },
        });
        if (holiday) return true;

        // Check recurring holidays (same month/day any year)
        const recurring = await prisma.holiday.findFirst({
            where: {
                tenantId,
                isRecurring: true,
            },
        });
        // More efficient: query all recurring and check month/day
        if (!recurring) return false;
        const allRecurring = await prisma.holiday.findMany({
            where: { tenantId, isRecurring: true },
        });
        return allRecurring.some(h => {
            const hDate = new Date(h.date);
            return hDate.getMonth() === date.getMonth() && hDate.getDate() === date.getDate();
        });
    }

    /**
     * Vérifie si un employé est en congé approuvé à cette date
     */
    static async isOnApprovedLeave(employeeId: string, date: Date): Promise<boolean> {
        const leave = await prisma.leave.findFirst({
            where: {
                employeeId,
                status: 'APPROVED',
                startDate: { lte: date },
                endDate: { gte: date },
            },
        });
        return !!leave;
    }

    static async create(tenantId: string, input: CreateAttendanceInput, recordedBy?: string) {
        const employee = await prisma.employee.findFirst({
            where: { id: input.employeeId, tenantId },
            include: { schedule: true }
        });
        if (!employee) throw new Error('Employé introuvable');

        const config = await this.getConfig(tenantId);
        const schedule = employee.schedule;

        const scheduledStart = schedule?.startTime || config?.defaultStartTime || '08:00';
        const scheduledEnd = schedule?.endTime || config?.defaultEndTime || '17:00';
        const graceMinutes = schedule?.customGraceMinutes ?? config?.graceMinutes ?? 10;

        const dateObj = new Date(input.date);

        // Cross-reference: skip if holiday or on approved leave
        const isHolidayDay = await this.isHoliday(tenantId, dateObj);
        if (isHolidayDay) {
            throw new Error('Cette date est un jour férié — pointage non requis');
        }
        const isOnLeave = await this.isOnApprovedLeave(input.employeeId, dateObj);
        if (isOnLeave) {
            throw new Error('Cet employé est en congé approuvé à cette date');
        }

        // Calculate status, late minutes, early departure
        const { status, lateMinutes, earlyDepartureMinutes } = this.calculateStatus(
            input.clockIn ? new Date(input.clockIn) : null,
            input.clockOut ? new Date(input.clockOut) : null,
            scheduledStart,
            scheduledEnd,
            graceMinutes,
            config?.earlyDepartureDeduction ?? true
        );

        // Calculate deduction
        const deductionAmount = await this.calculateDeduction(
            tenantId,
            Number(employee.baseSalary),
            status,
            lateMinutes,
            earlyDepartureMinutes
        );

        return prisma.attendance.create({
            data: {
                tenantId,
                employeeId: input.employeeId,
                date: dateObj,
                clockIn: input.clockIn ? new Date(input.clockIn) : null,
                clockOut: input.clockOut ? new Date(input.clockOut) : null,
                scheduledStart,
                scheduledEnd,
                status,
                lateMinutes,
                earlyDepartureMinutes,
                deductionAmount,
                note: input.note,
                recordedBy,
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } }
            }
        });
    }

    static async createBulk(tenantId: string, entries: CreateAttendanceInput[], recordedBy?: string) {
        const results = [];
        for (const entry of entries) {
            try {
                const record = await this.create(tenantId, entry, recordedBy);
                results.push({ success: true, data: record });
            } catch (err: any) {
                results.push({ success: false, employeeId: entry.employeeId, error: err.message });
            }
        }
        return results;
    }

    static async update(id: string, tenantId: string, input: Partial<CreateAttendanceInput>, recordedBy?: string) {
        const existing = await prisma.attendance.findFirst({
            where: { id, tenantId },
            include: { employee: { include: { schedule: true } } }
        });
        if (!existing) throw new Error('Pointage introuvable');

        const config = await this.getConfig(tenantId);
        const schedule = existing.employee.schedule;

        const scheduledStart = schedule?.startTime || config?.defaultStartTime || '08:00';
        const scheduledEnd = schedule?.endTime || config?.defaultEndTime || '17:00';
        const graceMinutes = schedule?.customGraceMinutes ?? config?.graceMinutes ?? 10;

        const clockIn = input.clockIn !== undefined ? (input.clockIn ? new Date(input.clockIn) : null) : existing.clockIn;
        const clockOut = input.clockOut !== undefined ? (input.clockOut ? new Date(input.clockOut) : null) : existing.clockOut;

        const { status, lateMinutes, earlyDepartureMinutes } = this.calculateStatus(
            clockIn,
            clockOut,
            scheduledStart,
            scheduledEnd,
            graceMinutes,
            config?.earlyDepartureDeduction ?? true
        );

        const deductionAmount = await this.calculateDeduction(
            tenantId,
            Number(existing.employee.baseSalary),
            status,
            lateMinutes,
            earlyDepartureMinutes
        );

        return prisma.attendance.update({
            where: { id },
            data: {
                clockIn,
                clockOut,
                scheduledStart,
                scheduledEnd,
                status,
                lateMinutes,
                earlyDepartureMinutes,
                deductionAmount,
                note: input.note !== undefined ? input.note : undefined,
                recordedBy,
            },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } }
            }
        });
    }

    static async delete(id: string, tenantId: string) {
        const existing = await prisma.attendance.findFirst({ where: { id, tenantId } });
        if (!existing) throw new Error('Pointage introuvable');
        return prisma.attendance.delete({ where: { id } });
    }

    // ==========================================
    // SUMMARY (monthly recap per employee)
    // ==========================================

    static async getSummary(tenantId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendances = await prisma.attendance.findMany({
            where: {
                tenantId,
                date: { gte: startDate, lte: endDate },
            },
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true, matricule: true, baseSalary: true, department: { select: { name: true } } }
                }
            }
        });

        // Group by employee
        const byEmployee: Record<string, any> = {};

        for (const a of attendances) {
            if (!byEmployee[a.employeeId]) {
                byEmployee[a.employeeId] = {
                    employee: a.employee,
                    present: 0,
                    late: 0,
                    absent: 0,
                    earlyDeparture: 0,
                    totalLateMinutes: 0,
                    totalEarlyMinutes: 0,
                    totalDeductions: 0,
                };
            }
            const s = byEmployee[a.employeeId];

            if (a.status === 'PRESENT') s.present++;
            if (a.status === 'LATE' || a.status === 'LATE_AND_EARLY') { s.late++; s.present++; }
            if (a.status === 'ABSENT') s.absent++;
            if (a.status === 'EARLY_DEPARTURE' || a.status === 'LATE_AND_EARLY') s.earlyDeparture++;
            if (a.status === 'EARLY_DEPARTURE') s.present++; // was present but left early

            s.totalLateMinutes += a.lateMinutes;
            s.totalEarlyMinutes += a.earlyDepartureMinutes;
            s.totalDeductions += Number(a.deductionAmount);
        }

        return Object.values(byEmployee);
    }

    // ==========================================
    // GET MONTHLY DEDUCTIONS FOR PAYROLL
    // ==========================================

    static async getMonthlyDeductions(tenantId: string, employeeId: string, month: number, year: number): Promise<number> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const result = await prisma.attendance.aggregate({
            where: {
                tenantId,
                employeeId,
                date: { gte: startDate, lte: endDate },
            },
            _sum: { deductionAmount: true },
        });

        return Number(result._sum.deductionAmount || 0);
    }

    // ==========================================
    // CALCULATION HELPERS
    // ==========================================

    private static calculateStatus(
        clockIn: Date | null,
        clockOut: Date | null,
        scheduledStart: string,
        scheduledEnd: string,
        graceMinutes: number,
        trackEarlyDeparture: boolean
    ): { status: AttendanceStatus; lateMinutes: number; earlyDepartureMinutes: number } {

        // No clock in at all = ABSENT
        if (!clockIn) {
            return { status: 'ABSENT', lateMinutes: 0, earlyDepartureMinutes: 0 };
        }

        // Parse scheduled times using the clock-in date as reference
        const [startH, startM] = scheduledStart.split(':').map(Number);
        const [endH, endM] = scheduledEnd.split(':').map(Number);

        const scheduledStartDate = new Date(clockIn);
        scheduledStartDate.setHours(startH, startM, 0, 0);

        // Calculate late minutes
        let lateMinutes = 0;
        const diffMs = clockIn.getTime() - scheduledStartDate.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);

        if (diffMinutes > graceMinutes) {
            lateMinutes = diffMinutes;
        }

        // Calculate early departure minutes
        let earlyDepartureMinutes = 0;
        if (clockOut && trackEarlyDeparture) {
            const scheduledEndDate = new Date(clockOut);
            scheduledEndDate.setHours(endH, endM, 0, 0);

            const earlyMs = scheduledEndDate.getTime() - clockOut.getTime();
            if (earlyMs > 0) {
                earlyDepartureMinutes = Math.floor(earlyMs / 60000);
            }
        }

        // Determine status
        let status: AttendanceStatus = 'PRESENT';
        if (lateMinutes > 0 && earlyDepartureMinutes > 0) {
            status = 'LATE_AND_EARLY';
        } else if (lateMinutes > 0) {
            status = 'LATE';
        } else if (earlyDepartureMinutes > 0) {
            status = 'EARLY_DEPARTURE';
        }

        return { status, lateMinutes, earlyDepartureMinutes };
    }

    private static async calculateDeduction(
        tenantId: string,
        baseSalary: number,
        status: AttendanceStatus,
        lateMinutes: number,
        earlyDepartureMinutes: number
    ): Promise<number> {

        const config = await this.getConfig(tenantId);
        if (!config) return 0;

        // For absence: full day salary deduction
        if (status === 'ABSENT') {
            // Assume 22 working days/month
            const dailySalary = baseSalary / 22;
            return Math.round(dailySalary * 100) / 100;
        }

        const totalMinutes = lateMinutes + earlyDepartureMinutes;
        if (totalMinutes === 0) return 0;

        const dailySalary = baseSalary / 22;
        const hourlySalary = dailySalary / 8; // 8 hours/day default

        switch (config.deductionMethod) {
            case 'PER_MINUTE': {
                const minuteRate = hourlySalary / 60;
                return Math.round(totalMinutes * minuteRate * 100) / 100;
            }

            case 'TIERED': {
                const rules = (config.tieredRules as TieredRule[] | null) || [];
                // Sort by maxMinutes ascending
                const sorted = [...rules].sort((a, b) => a.maxMinutes - b.maxMinutes);

                let fraction = 0;
                for (const rule of sorted) {
                    if (totalMinutes <= rule.maxMinutes) {
                        fraction = rule.deductionFraction;
                        break;
                    }
                    fraction = rule.deductionFraction; // use last one if over all thresholds
                }
                return Math.round(dailySalary * fraction * 100) / 100;
            }

            case 'FIXED': {
                return Number(config.fixedDeductionAmount || 0);
            }

            default:
                return 0;
        }
    }
}
