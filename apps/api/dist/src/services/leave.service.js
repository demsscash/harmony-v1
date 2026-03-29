"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class LeaveService {
    /**
     * Lister les congés (filtrable par employé et statut)
     */
    static async getAll(tenantId, filters) {
        const whereClause = { employee: { tenantId } };
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
    static async getById(id, tenantId) {
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
    static async create(tenantId, data) {
        // Vérifications préliminaires
        const employee = await prisma.employee.findFirst({ where: { id: data.employeeId, tenantId } });
        if (!employee)
            throw new Error("Employé introuvable");
        const leaveType = await prisma.leaveType.findFirst({ where: { id: data.leaveTypeId, tenantId } });
        if (!leaveType)
            throw new Error("Type de congé introuvable");
        if (leaveType.requiresJustification && !data.justificationUrl) {
            throw new Error("Un justificatif est obligatoire pour ce type de congé");
        }
        // TODO: Calcul complexe des soldes (LeaveBalance) à ajouter
        return prisma.leave.create({
            data: {
                employeeId: data.employeeId,
                leaveTypeId: data.leaveTypeId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                totalDays: data.totalDays,
                reason: data.reason,
                justificationUrl: data.justificationUrl,
                status: 'PENDING'
            }
        });
    }
    /**
     * L'employé modifie sa demande (uniquement si PENDING)
     */
    static async update(id, tenantId, employeeId, data) {
        const leave = await prisma.leave.findFirst({ where: { id, employeeId, employee: { tenantId } } });
        if (!leave)
            throw new Error("Demande de congé introuvable");
        if (leave.status !== 'PENDING')
            throw new Error("Impossible de modifier une demande déjà traitée");
        const updateData = { ...data };
        if (data.startDate)
            updateData.startDate = new Date(data.startDate);
        if (data.endDate)
            updateData.endDate = new Date(data.endDate);
        return prisma.leave.update({
            where: { id },
            data: updateData
        });
    }
    /**
     * L'employé annule sa demande (uniquement si PENDING)
     */
    static async cancel(id, tenantId, employeeId) {
        const leave = await prisma.leave.findFirst({ where: { id, employeeId, employee: { tenantId } } });
        if (!leave)
            throw new Error("Demande de congé introuvable");
        if (leave.status !== 'PENDING')
            throw new Error("Impossible d'annuler une demande déjà traitée");
        return prisma.leave.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }
    /**
     * Un manager ou RH traite la demande
     */
    static async processLeave(id, tenantId, reviewedByUserId, data) {
        const leave = await prisma.leave.findFirst({ where: { id, employee: { tenantId } } });
        if (!leave)
            throw new Error("Demande de congé introuvable");
        if (leave.status !== 'PENDING')
            throw new Error(`Cette demande a déjà été traitée (${leave.status})`);
        // TODO: Si APPROUVÉ, mettre à jour le solde `LeaveBalance`
        return prisma.leave.update({
            where: { id },
            data: {
                status: data.status,
                rejectionReason: data.rejectionReason,
                reviewedBy: reviewedByUserId,
                reviewedAt: new Date()
            }
        });
    }
}
exports.LeaveService = LeaveService;
