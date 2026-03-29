"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveTypeService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class LeaveTypeService {
    static async getAll(tenantId) {
        return prisma.leaveType.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        });
    }
    static async getById(id, tenantId) {
        return prisma.leaveType.findFirst({
            where: { id, tenantId }
        });
    }
    static async create(tenantId, data) {
        const existingCode = await prisma.leaveType.findFirst({
            where: { code: data.code, tenantId }
        });
        if (existingCode) {
            throw new Error(`Un type de congé avec le code "${data.code}" existe déjà.`);
        }
        return prisma.leaveType.create({
            data: {
                ...data,
                tenantId
            }
        });
    }
    static async update(id, tenantId, data) {
        const leaveType = await this.getById(id, tenantId);
        if (!leaveType) {
            throw new Error('Type de congé introuvable');
        }
        if (data.code && data.code !== leaveType.code) {
            const existingCode = await prisma.leaveType.findFirst({
                where: { code: data.code, tenantId }
            });
            if (existingCode) {
                throw new Error(`Un type de congé avec le code "${data.code}" existe déjà.`);
            }
        }
        return prisma.leaveType.update({
            where: { id },
            data
        });
    }
    static async delete(id, tenantId) {
        const leaveType = await prisma.leaveType.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { leaves: true } } }
        });
        if (!leaveType) {
            throw new Error('Type de congé introuvable');
        }
        if (leaveType._count.leaves > 0) {
            throw new Error('Impossible de supprimer ce type de congé car il est utilisé par des demandes existantes.');
        }
        await prisma.leaveType.delete({ where: { id } });
    }
}
exports.LeaveTypeService = LeaveTypeService;
