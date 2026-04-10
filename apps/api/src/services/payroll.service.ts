import { PrismaClient, Payroll, Payslip } from '@prisma/client';
import { CreatePayrollInput, UpdatePayrollStatusInput } from '@harmony/shared/schemas/payroll.schema';
import { AttendanceService } from './attendance.service';
import { OvertimeService } from './overtime.service';
import { AdvanceService } from './advance.service';
import { SanctionService } from './sanction.service';

const DEFAULT_ITS_BRACKETS = [
    { min: 0, max: 9000, rate: 0 },
    { min: 9000, max: 21000, rate: 0.15 },
    { min: 21000, max: 50000, rate: 0.25 },
    { min: 50000, max: null, rate: 0.40 },
];

const prisma = new PrismaClient();

export class PayrollService {
    /**
     * Lister les campagnes de paie
     */
    static async getAll(tenantId: string) {
        const campaigns = await prisma.payroll.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                payslips: {
                    select: {
                        grossSalary: true,
                        netSalary: true
                    }
                }
            }
        });

        return campaigns.map(c => ({
            id: c.id,
            month: c.month,
            year: c.year,
            status: c.status,
            createdAt: c.createdAt,
            employeeCount: c.payslips.length,
            grossSalary: c.payslips.reduce((sum, p) => sum + Number(p.grossSalary), 0),
            netSalary: c.payslips.reduce((sum, p) => sum + Number(p.netSalary), 0)
        }));
    }

    static async getById(id: string, tenantId: string): Promise<Payroll | null> {
        return prisma.payroll.findFirst({
            where: { id, tenantId },
            include: {
                payslips: {
                    include: { employee: { select: { id: true, firstName: true, lastName: true, matricule: true } } }
                }
            }
        });
    }

    /**
     * Initialise une nouvelle campagne de paie (BROUILLON)
     */
    static async create(tenantId: string, data: CreatePayrollInput): Promise<Payroll> {
        const existingPayroll = await prisma.payroll.findFirst({
            where: { month: data.month, year: data.year, tenantId }
        });

        if (existingPayroll) {
            throw new Error(`Une campagne de paie existe déjà pour la période ${data.month}/${data.year}`);
        }

        return prisma.payroll.create({
            data: {
                ...data,
                tenantId
            }
        });
    }

    /**
     * Modifier une campagne de paie (mois/année) — uniquement DRAFT
     */
    static async update(id: string, tenantId: string, data: { month?: number; year?: number }) {
        const payroll = await prisma.payroll.findFirst({ where: { id, tenantId } });
        if (!payroll) throw new Error('Campagne de paie introuvable');
        if (payroll.status !== 'DRAFT') throw new Error('Impossible de modifier une campagne non brouillon');

        const month = data.month ?? payroll.month;
        const year = data.year ?? payroll.year;

        // Vérifier qu'il n'y a pas de doublon
        if (month !== payroll.month || year !== payroll.year) {
            const existing = await prisma.payroll.findFirst({
                where: { tenantId, month, year, id: { not: id } },
            });
            if (existing) throw new Error(`Une campagne existe déjà pour ${month}/${year}`);
        }

        // Supprimer les bulletins existants avant de régénérer
        await prisma.payslip.deleteMany({ where: { payrollId: id } });

        // Reset advances that were deducted
        await AdvanceService.resetDeductedForPayroll(id);

        return prisma.payroll.update({
            where: { id },
            data: { month, year },
        });
    }

    /**
     * Mettre à jour le statut (Validation, etc.)
     */
    static async updateStatus(id: string, tenantId: string, userId: string, data: UpdatePayrollStatusInput): Promise<Payroll> {
        const payroll = await prisma.payroll.findFirst({ where: { id, tenantId } });

        if (!payroll) throw new Error("Campagne de paie introuvable");
        if (payroll.status === 'CLOSED') throw new Error("Impossible de modifier une campagne clôturée");

        const updateData: any = { status: data.status };

        if (data.status === 'VALIDATED') {
            updateData.processedBy = userId;
            updateData.processedAt = new Date();
        }

        return prisma.payroll.update({
            where: { id },
            data: updateData
        });
    }

    /**
     * Moteur de calcul simplifié (BRUT -> COTISATIONS MAURITANIE -> NET)
     */
    /**
     * Calcul ITS progressif à partir de paliers configurables
     */
    private static calculateITS(taxableBasis: number, brackets: any[]): number {
        let its = 0;
        let remaining = taxableBasis;

        const sorted = [...brackets].sort((a, b) => a.min - b.min);
        for (const bracket of sorted) {
            if (remaining <= bracket.min) break;
            const upper = bracket.max ?? Infinity;
            const taxableInBracket = Math.min(remaining, upper) - bracket.min;
            if (taxableInBracket > 0) {
                its += taxableInBracket * bracket.rate;
            }
        }
        return its;
    }

    /**
     * Moteur de calcul (BRUT -> COTISATIONS -> NET)
     * Intègre : avantages, heures supp, CNSS/ITS configurables, pointage, acomptes
     */
    static async generatePayslips(payrollId: string, tenantId: string): Promise<{ count: number }> {
        const payroll = await prisma.payroll.findFirst({ where: { id: payrollId, tenantId } });
        if (!payroll) throw new Error("Campagne de paie introuvable");
        if (payroll.status !== 'DRAFT') throw new Error("La génération n'est possible qu'en statut BROUILLON");

        // Remettre les acomptes DEDUCTED en APPROVED avant de nettoyer
        await AdvanceService.resetDeductedForPayroll(payrollId);

        // Nettoyer les anciens bulletins de ce brouillon
        await prisma.payslip.deleteMany({ where: { payrollId } });

        // Charger la config fiscale du tenant (ou défaut Mauritanie)
        const taxConfig = await prisma.taxConfig.findUnique({ where: { tenantId } });
        const cnssEmployeeRate = Number(taxConfig?.cnssEmployeeRate ?? 0.01);
        const cnssEmployerRate = Number(taxConfig?.cnssEmployerRate ?? 0.13);
        const cnssCeiling = Number(taxConfig?.cnssCeiling ?? 70000);
        const itsBrackets = (taxConfig?.itsBrackets as any[]) ?? DEFAULT_ITS_BRACKETS;

        // Récupérer les employés actifs
        const activeEmployees = await prisma.employee.findMany({
            where: { tenantId, status: 'ACTIVE' },
            include: {
                advantages: {
                    where: { isActive: true },
                    include: { advantage: true }
                },
                grade: {
                    include: { advantages: { include: { advantage: true } } }
                }
            }
        });

        const recordsToInsert: any[] = [];
        const advancesByEmployee = new Map<string, { ids: string[]; total: number }>();

        for (const employee of activeEmployees) {
            const baseSalary = Number(employee.baseSalary);

            // ── Avantages (grade + individuels, dédoublonnés) ──
            let totalAdvantagesAmount = 0;
            const advantagesDetail: any[] = [];
            const advantageMap = new Map<string, { name: string; amount: number; isTaxable: boolean }>();

            if (employee.grade?.advantages) {
                for (const ga of employee.grade.advantages) {
                    const amount = ga.customAmount
                        ? Number(ga.customAmount)
                        : (ga.advantage.isPercentage && ga.advantage.amount
                            ? baseSalary * (Number(ga.advantage.amount) / 100)
                            : Number(ga.advantage.amount || 0));
                    advantageMap.set(ga.advantageId, { name: ga.advantage.name, amount, isTaxable: ga.advantage.isTaxable });
                }
            }
            for (const ea of employee.advantages) {
                const amount = ea.customAmount
                    ? Number(ea.customAmount)
                    : (ea.advantage.isPercentage && ea.advantage.amount
                        ? baseSalary * (Number(ea.advantage.amount) / 100)
                        : Number(ea.advantage.amount || 0));
                advantageMap.set(ea.advantageId, { name: ea.advantage.name, amount, isTaxable: ea.advantage.isTaxable });
            }
            for (const adv of advantageMap.values()) {
                totalAdvantagesAmount += adv.amount;
                advantagesDetail.push(adv);
            }

            // ── Heures supplémentaires ──
            const overtimePay = await OvertimeService.getMonthlyOvertimePay(tenantId, employee.id, payroll.month, payroll.year);

            // ── Brut ──
            const grossSalary = baseSalary + totalAdvantagesAmount + overtimePay;

            // ── CNSS (taux configurables) ──
            const cnssBasis = Math.min(grossSalary, cnssCeiling);
            const cnssEmployeeAmount = cnssBasis * cnssEmployeeRate;
            const cnssEmployerAmount = cnssBasis * cnssEmployerRate;

            // ── ITS (paliers configurables) ──
            const taxableBasis = grossSalary - cnssEmployeeAmount;
            const itsAmount = this.calculateITS(taxableBasis, itsBrackets);

            // ── Déductions pointage ──
            const attendanceDeductions = await AttendanceService.getMonthlyDeductions(
                tenantId, employee.id, payroll.month, payroll.year
            );

            // ── Acomptes approuvés ──
            const approvedAdvances = await AdvanceService.getApprovedForPayroll(tenantId, employee.id, payroll.month, payroll.year);
            const totalAdvanceDeduction = approvedAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
            if (approvedAdvances.length > 0) {
                advancesByEmployee.set(employee.id, {
                    ids: approvedAdvances.map(a => a.id),
                    total: totalAdvanceDeduction,
                });
            }

            // ── Sanctions (déductions sur primes / retenues) ──
            const activeSanctions = await SanctionService.getActiveForPayroll(tenantId, employee.id, payroll.month, payroll.year);
            const totalSanctionDeduction = activeSanctions.reduce((sum, s) => sum + Number(s.deductionAmount), 0);

            // ── Net ──
            const netSalary = grossSalary - cnssEmployeeAmount - itsAmount - attendanceDeductions - totalAdvanceDeduction - totalSanctionDeduction;

            // ── Détail déductions ──
            const deductionsDetailArr: any[] = [];
            if (attendanceDeductions > 0) {
                deductionsDetailArr.push({ name: 'Retards/Absences', amount: attendanceDeductions, type: 'ATTENDANCE' });
            }
            if (totalAdvanceDeduction > 0) {
                deductionsDetailArr.push({ name: 'Acompte sur salaire', amount: totalAdvanceDeduction, type: 'ADVANCE' });
            }
            for (const s of activeSanctions) {
                const label = s.advantage?.name ? `Sanction — ${s.advantage.name}` : 'Sanction — Retenue';
                deductionsDetailArr.push({ name: label, amount: Number(s.deductionAmount), type: 'SANCTION' });
            }
            if (overtimePay > 0) {
                advantagesDetail.push({ name: 'Heures supplémentaires', amount: overtimePay, isTaxable: true });
            }

            recordsToInsert.push({
                payrollId,
                employeeId: employee.id,
                baseSalary,
                totalAdvantages: totalAdvantagesAmount,
                overtimePay,
                grossSalary,
                cnssEmployee: cnssEmployeeAmount,
                cnssEmployer: cnssEmployerAmount,
                itsAmount,
                attendanceDeductions,
                advanceDeductions: totalAdvanceDeduction,
                otherDeductions: totalSanctionDeduction,
                netSalary,
                advantagesDetail: JSON.stringify(advantagesDetail),
                deductionsDetail: deductionsDetailArr.length > 0 ? JSON.stringify(deductionsDetailArr) : undefined,
            });
        }

        // Bulk insert des bulletins
        if (recordsToInsert.length > 0) {
            await prisma.payslip.createMany({ data: recordsToInsert });

            // Marquer les acomptes comme déduits (lier au payslip)
            if (advancesByEmployee.size > 0) {
                const createdPayslips = await prisma.payslip.findMany({
                    where: { payrollId },
                    select: { id: true, employeeId: true },
                });
                for (const ps of createdPayslips) {
                    const advData = advancesByEmployee.get(ps.employeeId);
                    if (advData) {
                        await AdvanceService.markAsDeducted(advData.ids, ps.id);
                    }
                }
            }
        }

        return { count: recordsToInsert.length };
    }

    static async delete(id: string, tenantId: string): Promise<void> {
        const payroll = await prisma.payroll.findFirst({
            where: { id, tenantId }
        });

        if (!payroll) {
            throw new Error('Campagne de paie introuvable');
        }

        if (payroll.status !== 'DRAFT') {
            throw new Error('Impossible de supprimer une campagne non brouillon');
        }

        // Cascade is handled if configured in Prisma, otherwise manual delete:
        await prisma.payslip.deleteMany({ where: { payrollId: id } });
        await prisma.payroll.delete({ where: { id } });
    }
}
