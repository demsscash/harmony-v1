import { PrismaClient, Leave } from '@prisma/client';
import { CreateLeaveInput, UpdateLeaveInput, ProcessLeaveInput } from '@harmony/shared/schemas/leave.schema';

const prisma = new PrismaClient();

/**
 * Récupère les jours fériés du tenant depuis la DB.
 * Pour les fériés récurrents, on génère les dates pour chaque année demandée.
 */
async function getTenantHolidays(tenantId: string, years: number[]): Promise<Set<string>> {
    const holidays = await prisma.holiday.findMany({ where: { tenantId } });
    const result = new Set<string>();

    for (const h of holidays) {
        const d = new Date(h.date);
        if (h.isRecurring) {
            // Appliquer le mois/jour à chaque année demandée
            for (const year of years) {
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                result.add(`${year}-${month}-${day}`);
            }
        } else {
            result.add(d.toISOString().slice(0, 10));
        }
    }

    return result;
}

/**
 * Calcule le nombre de jours ouvrés entre deux dates (weekends + jours fériés exclus).
 * Les deux bornes (startDate, endDate) sont incluses.
 */
export async function calculateWorkingDays(startDate: Date, endDate: Date, tenantId: string): Promise<number> {
    let count = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Collecter les années concernées
    const years = new Set<number>();
    const d = new Date(current);
    while (d <= end) { years.add(d.getFullYear()); d.setDate(d.getDate() + 1); }

    const allHolidays = await getTenantHolidays(tenantId, Array.from(years));

    const cursor = new Date(current);
    while (cursor <= end) {
        const day = cursor.getDay(); // 0=dim, 6=sam
        const dateStr = cursor.toISOString().slice(0, 10);
        if (day !== 0 && day !== 6 && !allHolidays.has(dateStr)) {
            count++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return Math.max(count, 1);
}

export class LeaveService {
    /**
     * Lister les congés (filtrable par employé et statut)
     */
    static async getAll(tenantId: string, filters?: { employeeId?: string, status?: string }): Promise<Leave[]> {
        const whereClause: any = { employee: { tenantId } };

        if (filters?.employeeId) {
            whereClause.employeeId = filters.employeeId;
        }

        if (filters?.status) {
            whereClause.status = filters.status;
        }

        return prisma.leave.findMany({
            where: whereClause,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } },
                leaveType: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async getById(id: string, tenantId: string): Promise<Leave | null> {
        return prisma.leave.findFirst({
            where: { id, employee: { tenantId } },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, matricule: true } },
                leaveType: true
            }
        });
    }

    /**
     * Créer une demande de congé (soumis par un employé ou RH)
     */
    static async create(tenantId: string, data: CreateLeaveInput): Promise<Leave> {
        // Vérifications préliminaires
        const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, tenantId } });
        if (!employee) throw new Error("Employé introuvable");

        const leaveType = await prisma.leaveType.findFirst({ where: { id: data.leaveTypeId, tenantId } });
        if (!leaveType) throw new Error("Type de congé introuvable");

        if (leaveType.requiresJustification && !data.justificationUrl) {
            throw new Error("Un justificatif est obligatoire pour ce type de congé");
        }

        // Vérifier le chevauchement avec des congés existants (PENDING ou APPROVED)
        const overlapping = await prisma.leave.findFirst({
            where: {
                employeeId: data.employeeId!,
                status: { in: ['PENDING', 'APPROVED'] },
                startDate: { lte: new Date(data.endDate) },
                endDate: { gte: new Date(data.startDate) },
            },
        });
        if (overlapping) {
            const start = overlapping.startDate.toLocaleDateString('fr-FR');
            const end = overlapping.endDate.toLocaleDateString('fr-FR');
            throw new Error(`Chevauchement détecté avec un congé existant du ${start} au ${end}`);
        }

        // Calculate totalDays — excludes weekends & tenant holidays
        let totalDays = data.totalDays;
        if (totalDays === undefined || totalDays === null) {
            totalDays = await calculateWorkingDays(new Date(data.startDate), new Date(data.endDate), tenantId);
        }

        // Vérifier le solde de congé
        const year = new Date(data.startDate).getFullYear();
        const balance = await prisma.leaveBalance.findUnique({
            where: {
                employeeId_leaveTypeCode_year: {
                    employeeId: data.employeeId!,
                    leaveTypeCode: leaveType.code,
                    year,
                },
            },
        });

        if (balance) {
            const remaining = Number(balance.remaining);
            if (totalDays > remaining) {
                throw new Error(`Solde insuffisant pour "${leaveType.name}". Restant : ${remaining} jour(s), demandé : ${totalDays} jour(s)`);
            }
        }

        return prisma.leave.create({
            data: {
                employeeId: data.employeeId!,
                leaveTypeId: data.leaveTypeId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                totalDays: totalDays,
                reason: data.reason,
                justificationUrl: data.justificationUrl,
                status: 'PENDING'
            }
        });
    }

    /**
     * L'employé modifie sa demande (uniquement si PENDING)
     */
    static async update(id: string, tenantId: string, employeeId: string, data: UpdateLeaveInput): Promise<Leave> {
        const leave = await prisma.leave.findFirst({ where: { id, employeeId, employee: { tenantId } } });

        if (!leave) throw new Error("Demande de congé introuvable");
        if (leave.status !== 'PENDING') throw new Error("Impossible de modifier une demande déjà traitée");

        const updateData: any = { ...data };
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);

        return prisma.leave.update({
            where: { id },
            data: updateData
        });
    }

    /**
     * L'employé annule sa demande (uniquement si PENDING)
     */
    static async cancel(id: string, tenantId: string, employeeId: string): Promise<Leave> {
        const leave = await prisma.leave.findFirst({ where: { id, employeeId, employee: { tenantId } } });

        if (!leave) throw new Error("Demande de congé introuvable");
        if (leave.status !== 'PENDING') throw new Error("Impossible d'annuler une demande déjà traitée");

        return prisma.leave.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }

    /**
     * Un manager ou RH traite la demande
     */
    static async processLeave(id: string, tenantId: string, reviewedByUserId: string, data: ProcessLeaveInput): Promise<Leave> {
        const leave = await prisma.leave.findFirst({
            where: { id, employee: { tenantId } },
            include: { leaveType: true },
        });

        if (!leave) throw new Error("Demande de congé introuvable");
        if (leave.status !== 'PENDING') throw new Error(`Cette demande a déjà été traitée (${leave.status})`);

        const updated = await prisma.leave.update({
            where: { id },
            data: {
                status: data.status as any,
                rejectionReason: data.rejectionReason,
                reviewedBy: reviewedByUserId,
                reviewedAt: new Date()
            }
        });

        // Si APPROUVÉ, mettre à jour le solde LeaveBalance
        if (data.status === 'APPROVED' && leave.leaveType) {
            const year = new Date(leave.startDate).getFullYear();
            const totalDays = Number(leave.totalDays);

            await prisma.leaveBalance.upsert({
                where: {
                    employeeId_leaveTypeCode_year: {
                        employeeId: leave.employeeId,
                        leaveTypeCode: leave.leaveType.code,
                        year,
                    },
                },
                create: {
                    employeeId: leave.employeeId,
                    leaveTypeCode: leave.leaveType.code,
                    year,
                    entitled: leave.leaveType.defaultDays,
                    taken: totalDays,
                    carriedOver: 0,
                    remaining: leave.leaveType.defaultDays - totalDays,
                },
                update: {
                    taken: { increment: totalDays },
                    remaining: { decrement: totalDays },
                },
            });
        }

        return updated;
    }

    /**
     * Initialiser les soldes de congé d'un employé pour une année
     */
    static async initializeBalances(employeeId: string, tenantId: string, year: number) {
        const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
        if (!employee) throw new Error("Employé introuvable");

        // Récupérer le nombre de jours de congé par défaut depuis les paramètres du tenant
        const tenantSettings = await prisma.tenantSettings.findUnique({ where: { tenantId } });
        const defaultLeaveDays = tenantSettings?.defaultLeaveDays ?? 24;

        const leaveTypes = await prisma.leaveType.findMany({ where: { tenantId } });

        // Idempotency check: if balances already exist for this employee+year, return them
        const existingBalances = await prisma.leaveBalance.findMany({
            where: { employeeId, year },
        });
        if (existingBalances.length >= leaveTypes.length) {
            return existingBalances;
        }

        // Build a set of existing balance keys for quick lookup
        const existingKeys = new Set(existingBalances.map(b => b.leaveTypeCode));
        const results = [...existingBalances];

        for (const lt of leaveTypes) {
            // Skip if balance already exists for this leave type
            if (existingKeys.has(lt.code)) continue;

            // Utiliser defaultLeaveDays du tenant pour le congé annuel (CA), sinon defaultDays du type
            const entitled = lt.code === 'CA' ? defaultLeaveDays : lt.defaultDays;
            const balance = await prisma.leaveBalance.upsert({
                where: {
                    employeeId_leaveTypeCode_year: {
                        employeeId,
                        leaveTypeCode: lt.code,
                        year,
                    },
                },
                create: {
                    employeeId,
                    leaveTypeCode: lt.code,
                    year,
                    entitled,
                    taken: 0,
                    carriedOver: 0,
                    remaining: entitled,
                },
                update: {}, // Ne pas écraser si existe déjà
            });
            results.push(balance);
        }

        return results;
    }

    /**
     * Récupérer les soldes d'un employé pour une année
     */
    /**
     * Récupérer les soldes de TOUS les employés d'un tenant pour une année
     */
    static async getAllBalances(tenantId: string, year: number) {
        const employees = await prisma.employee.findMany({
            where: { tenantId, status: 'ACTIVE' },
            select: { id: true, firstName: true, lastName: true, matricule: true },
            orderBy: { lastName: 'asc' },
        });

        const leaveTypes = await prisma.leaveType.findMany({ where: { tenantId } });
        const typeMap = new Map(leaveTypes.map(lt => [lt.code, lt]));

        const allBalances = await prisma.leaveBalance.findMany({
            where: {
                employeeId: { in: employees.map(e => e.id) },
                year,
            },
        });

        // Grouper par employé
        const balancesByEmployee = new Map<string, any[]>();
        for (const b of allBalances) {
            if (!balancesByEmployee.has(b.employeeId)) balancesByEmployee.set(b.employeeId, []);
            balancesByEmployee.get(b.employeeId)!.push({
                ...b,
                leaveTypeName: typeMap.get(b.leaveTypeCode)?.name || b.leaveTypeCode,
            });
        }

        return employees.map(emp => ({
            ...emp,
            balances: balancesByEmployee.get(emp.id) || [],
        }));
    }

    static async getBalances(employeeId: string, year: number) {
        const balances = await prisma.leaveBalance.findMany({
            where: { employeeId, year },
            orderBy: { leaveTypeCode: 'asc' },
        });

        // Enrichir avec le nom du type de congé
        const employee = await prisma.employee.findFirst({ where: { id: employeeId }, select: { tenantId: true } });
        if (!employee) return balances;

        const leaveTypes = await prisma.leaveType.findMany({ where: { tenantId: employee.tenantId } });
        const typeMap = new Map(leaveTypes.map(lt => [lt.code, lt]));

        return balances.map(b => ({
            ...b,
            leaveType: typeMap.get(b.leaveTypeCode) ? { name: typeMap.get(b.leaveTypeCode)!.name, code: b.leaveTypeCode } : null,
        }));
    }
}
