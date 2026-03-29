"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowanceService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AllowanceService {
    static async getAll(tenantId) {
        return prisma.advantage.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { grades: true } } }
        });
    }
    static async getById(id, tenantId) {
        return prisma.advantage.findFirst({
            where: { id, tenantId }
        });
    }
    static async create(tenantId, data) {
        const existingAllowance = await prisma.advantage.findFirst({
            where: { name: data.name, tenantId }
        });
        if (existingAllowance) {
            throw new Error(`Un avantage avec le nom "${data.name}" existe déjà.`);
        }
        return prisma.advantage.create({
            data: {
                name: data.name,
                type: data.type,
                amount: data.amount,
                isPercentage: !!data.percentage,
                isTaxable: data.isTaxable !== undefined ? data.isTaxable : true,
                tenantId,
            }
        });
    }
    static async update(id, tenantId, data) {
        const allowance = await this.getById(id, tenantId);
        if (!allowance) {
            throw new Error('Avantage introuvable');
        }
        if (data.name && data.name !== allowance.name) {
            const existingAllowance = await prisma.advantage.findFirst({
                where: { name: data.name, tenantId }
            });
            if (existingAllowance) {
                throw new Error(`Un avantage avec le nom "${data.name}" existe déjà.`);
            }
        }
        return prisma.advantage.update({
            where: { id },
            data: {
                name: data.name,
                type: data.type,
                amount: data.amount,
                isPercentage: data.percentage ? true : undefined,
                isTaxable: data.isTaxable,
            }
        });
    }
    static async delete(id, tenantId) {
        const allowance = await prisma.advantage.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { grades: true } } }
        });
        if (!allowance) {
            throw new Error('Avantage introuvable');
        }
        if (allowance._count.grades > 0) {
            throw new Error('Impossible de supprimer cet avantage car il est rattaché à des grades.');
        }
        await prisma.advantage.delete({ where: { id } });
    }
    /**
     * Associe un avantage à un grade
     */
    static async assignToGrade(gradeId, advantageId, tenantId, customAmount) {
        const grade = await prisma.grade.findFirst({ where: { id: gradeId, tenantId } });
        const advantage = await prisma.advantage.findFirst({ where: { id: advantageId, tenantId } });
        if (!grade || !advantage)
            throw new Error("Grade ou Avantage introuvable");
        // Upsert logic for GradeAdvantage
        const existingLink = await prisma.gradeAdvantage.findUnique({
            where: { gradeId_advantageId: { gradeId, advantageId } }
        });
        if (existingLink) {
            return prisma.gradeAdvantage.update({
                where: { gradeId_advantageId: { gradeId, advantageId } },
                data: { customAmount }
            });
        }
        return prisma.gradeAdvantage.create({
            data: {
                gradeId,
                advantageId,
                customAmount
            }
        });
    }
    /**
     * Retire un avantage d'un grade
     */
    static async removeFromGrade(gradeId, advantageId, tenantId) {
        const link = await prisma.gradeAdvantage.findFirst({
            where: { gradeId, advantageId }
        });
        if (!link) {
            throw new Error("Cette association n'existe pas");
        }
        return prisma.gradeAdvantage.delete({
            where: { gradeId_advantageId: { gradeId, advantageId } }
        });
    }
}
exports.AllowanceService = AllowanceService;
