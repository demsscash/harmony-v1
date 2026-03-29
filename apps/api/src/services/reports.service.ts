import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ReportsService {
    /**
     * Tableau de bord RH — KPIs globaux
     */
    static async getDashboardStats(tenantId: string) {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const [
            totalEmployees,
            activeEmployees,
            departmentCounts,
            contractTypeCounts,
            recentHires,
            upcomingTrialEnds,
            upcomingContractEnds,
            pendingLeaves,
            monthlyAttendance,
            monthlyPayroll,
            pendingAdvances,
            pendingExpenses,
        ] = await Promise.all([
            // Total employees
            prisma.employee.count({ where: { tenantId } }),
            // Active employees
            prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } }),
            // By department
            prisma.employee.groupBy({
                by: ['departmentId'],
                where: { tenantId, status: 'ACTIVE' },
                _count: true,
            }),
            // By contract type
            prisma.employee.groupBy({
                by: ['contractType'],
                where: { tenantId, status: 'ACTIVE' },
                _count: true,
            }),
            // Recent hires (last 30 days)
            prisma.employee.count({
                where: {
                    tenantId,
                    hireDate: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
                },
            }),
            // Trial periods ending within 30 days
            prisma.employee.findMany({
                where: {
                    tenantId,
                    status: 'ACTIVE',
                    trialEndDate: {
                        gte: now,
                        lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    },
                },
                select: { id: true, firstName: true, lastName: true, trialEndDate: true },
            }),
            // CDD ending within 60 days
            prisma.employee.findMany({
                where: {
                    tenantId,
                    status: 'ACTIVE',
                    contractType: 'CDD',
                    contractEndDate: {
                        gte: now,
                        lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
                    },
                },
                select: { id: true, firstName: true, lastName: true, contractEndDate: true },
            }),
            // Pending leaves
            prisma.leave.count({ where: { employee: { tenantId }, status: 'PENDING' } }),
            // This month attendance stats
            prisma.attendance.groupBy({
                by: ['status'],
                where: {
                    tenantId,
                    date: {
                        gte: new Date(currentYear, currentMonth - 1, 1),
                        lte: new Date(currentYear, currentMonth, 0),
                    },
                },
                _count: true,
            }),
            // Latest payroll
            prisma.payroll.findFirst({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                include: {
                    payslips: {
                        select: { grossSalary: true, netSalary: true },
                    },
                },
            }),
            // Pending salary advances
            prisma.salaryAdvance.count({ where: { tenantId, status: 'PENDING' } }),
            // Pending expense reports
            prisma.expenseReport.count({ where: { tenantId, status: 'SUBMITTED' } }),
        ]);

        // Enrich department counts with names
        const departments = await prisma.department.findMany({
            where: { tenantId },
            select: { id: true, name: true },
        });
        const deptMap = new Map(departments.map(d => [d.id, d.name]));

        const departmentStats = departmentCounts.map(dc => ({
            department: deptMap.get(dc.departmentId || '') || 'Non affecté',
            count: dc._count,
        }));

        // Attendance stats for this month
        const attendanceStats: Record<string, number> = {};
        for (const a of monthlyAttendance) {
            attendanceStats[a.status] = a._count;
        }

        // Payroll totals
        let payrollTotals = null;
        if (monthlyPayroll) {
            payrollTotals = {
                month: monthlyPayroll.month,
                year: monthlyPayroll.year,
                status: monthlyPayroll.status,
                employeeCount: monthlyPayroll.payslips.length,
                totalGross: monthlyPayroll.payslips.reduce((s, p) => s + Number(p.grossSalary), 0),
                totalNet: monthlyPayroll.payslips.reduce((s, p) => s + Number(p.netSalary), 0),
            };
        }

        return {
            employees: {
                total: totalEmployees,
                active: activeEmployees,
                recentHires,
                byDepartment: departmentStats,
                byContractType: contractTypeCounts.map(ct => ({ type: ct.contractType, count: ct._count })),
            },
            alerts: {
                upcomingTrialEnds,
                upcomingContractEnds,
                pendingLeaves,
                pendingAdvances,
                pendingExpenses,
            },
            attendance: attendanceStats,
            payroll: payrollTotals,
        };
    }

    /**
     * Masse salariale mensuelle (historique sur N mois)
     */
    static async getPayrollHistory(tenantId: string, months: number = 12) {
        const payrolls = await prisma.payroll.findMany({
            where: { tenantId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: months,
            include: {
                payslips: {
                    select: { grossSalary: true, netSalary: true, cnssEmployee: true, cnssEmployer: true, itsAmount: true },
                },
            },
        });

        return payrolls.map(p => ({
            month: p.month,
            year: p.year,
            status: p.status,
            employeeCount: p.payslips.length,
            totalGross: p.payslips.reduce((s, ps) => s + Number(ps.grossSalary), 0),
            totalNet: p.payslips.reduce((s, ps) => s + Number(ps.netSalary), 0),
            totalCnssEmployee: p.payslips.reduce((s, ps) => s + Number(ps.cnssEmployee), 0),
            totalCnssEmployer: p.payslips.reduce((s, ps) => s + Number(ps.cnssEmployer), 0),
            totalIts: p.payslips.reduce((s, ps) => s + Number(ps.itsAmount), 0),
        })).reverse();
    }

    /**
     * Turnover (entrées/sorties par mois)
     */
    static async getTurnover(tenantId: string, year: number) {
        const employees = await prisma.employee.findMany({
            where: { tenantId },
            select: { hireDate: true, status: true, updatedAt: true },
        });

        const months = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            hires: 0,
            departures: 0,
        }));

        for (const emp of employees) {
            const hireDate = new Date(emp.hireDate);
            if (hireDate.getFullYear() === year) {
                months[hireDate.getMonth()].hires++;
            }
            if (emp.status === 'TERMINATED' || emp.status === 'INACTIVE') {
                const updDate = new Date(emp.updatedAt);
                if (updDate.getFullYear() === year) {
                    months[updDate.getMonth()].departures++;
                }
            }
        }

        return months;
    }
}
