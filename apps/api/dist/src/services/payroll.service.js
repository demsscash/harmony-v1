"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PayrollService {
    /**
     * Lister les campagnes de paie
     */
    static async getAll(tenantId) {
        return prisma.payroll.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { payslips: true } }
            }
        });
    }
    static async getById(id, tenantId) {
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
    static async create(tenantId, data) {
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
     * Mettre à jour le statut (Validation, etc.)
     */
    static async updateStatus(id, tenantId, userId, data) {
        const payroll = await prisma.payroll.findFirst({ where: { id, tenantId } });
        if (!payroll)
            throw new Error("Campagne de paie introuvable");
        if (payroll.status === 'CLOSED')
            throw new Error("Impossible de modifier une campagne clôturée");
        const updateData = { status: data.status };
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
    static async generatePayslips(payrollId, tenantId) {
        const payroll = await prisma.payroll.findFirst({ where: { id: payrollId, tenantId } });
        if (!payroll)
            throw new Error("Campagne de paie introuvable");
        if (payroll.status !== 'DRAFT')
            throw new Error("La génération n'est possible qu'en statut BROUILLON");
        // Nettoyer les anciens bulletins de ce brouillon
        await prisma.payslip.deleteMany({ where: { payrollId } });
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
        const recordsToInsert = [];
        for (const employee of activeEmployees) {
            const baseSalary = Number(employee.baseSalary);
            let totalAdvantagesAmount = 0;
            const advantagesDetail = [];
            // 1. Avantages liés au grade
            if (employee.grade && employee.grade.advantages) {
                for (const ga of employee.grade.advantages) {
                    const amount = ga.customAmount
                        ? Number(ga.customAmount)
                        : (ga.advantage.isPercentage && ga.advantage.amount
                            ? baseSalary * (Number(ga.advantage.amount) / 100)
                            : Number(ga.advantage.amount || 0));
                    totalAdvantagesAmount += amount;
                    advantagesDetail.push({
                        name: ga.advantage.name,
                        amount,
                        isTaxable: ga.advantage.isTaxable
                    });
                }
            }
            // 2. Avantages individuels (Override ou ajouts)
            for (const ea of employee.advantages) {
                // Simplification : Dans une vraie app, on vérifierait les dates (startDate/endDate) par rapport au mois de paie
                const amount = ea.customAmount
                    ? Number(ea.customAmount)
                    : (ea.advantage.isPercentage && ea.advantage.amount
                        ? baseSalary * (Number(ea.advantage.amount) / 100)
                        : Number(ea.advantage.amount || 0));
                // TODO: Éviter les doublons avec le grade (ou les remplacer)
                totalAdvantagesAmount += amount;
                advantagesDetail.push({
                    name: ea.advantage.name,
                    amount,
                    isTaxable: ea.advantage.isTaxable
                });
            }
            const grossSalary = baseSalary + totalAdvantagesAmount;
            // ==============================
            // CALCUL SIMPLIFIÉ OUGUIYA MAURITANIEN
            // ==============================
            // CNSS (Exemple fictif, plafonné généralement à 7000 MRU pour la part salariale de 1%)
            // En Mauritanie : plafond de base mensuel = 70.000 MRU (Anciennement 700 000 MRO)
            const cnssBasis = Math.min(grossSalary, 70000);
            const cnssEmployeeAmount = cnssBasis * 0.01; // 1%
            const cnssEmployerAmount = cnssBasis * 0.13; // 13% patronal (14% parfois incluant CNAM, on reste basique)
            // ITS (Impôt sur les Traitements et Salaires) - Barème simplifié progressif MRU
            let itsAmount = 0;
            const taxableBasis = grossSalary - cnssEmployeeAmount; // Simplifié
            if (taxableBasis > 9000 && taxableBasis <= 21000) {
                itsAmount = (taxableBasis - 9000) * 0.15;
            }
            else if (taxableBasis > 21000 && taxableBasis <= 50000) {
                itsAmount = (12000 * 0.15) + ((taxableBasis - 21000) * 0.25);
            }
            else if (taxableBasis > 50000) {
                itsAmount = (12000 * 0.15) + (29000 * 0.25) + ((taxableBasis - 50000) * 0.40);
            }
            // Net
            const netSalary = grossSalary - cnssEmployeeAmount - itsAmount;
            recordsToInsert.push({
                payrollId,
                employeeId: employee.id,
                baseSalary,
                totalAdvantages: totalAdvantagesAmount,
                grossSalary,
                cnssEmployee: cnssEmployeeAmount,
                cnssEmployer: cnssEmployerAmount,
                itsAmount,
                otherDeductions: 0,
                netSalary,
                advantagesDetail: JSON.stringify(advantagesDetail),
            });
        }
        // Bulk insert
        if (recordsToInsert.length > 0) {
            await prisma.payslip.createMany({ data: recordsToInsert });
        }
        return { count: recordsToInsert.length };
    }
    static async delete(id, tenantId) {
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
exports.PayrollService = PayrollService;
