"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class GradeService {
    static async getAll(tenantId) {
        return prisma.grade.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { employees: true } } }
        });
    }
    static async getById(id, tenantId) {
        return prisma.grade.findFirst({
            where: { id, tenantId },
            include: {
                advantages: {
                    include: { advantage: true }
                }
            }
        });
    }
    static async create(tenantId, data) {
        const existingGrade = await prisma.grade.findFirst({
            where: { name: data.name, tenantId }
        });
        if (existingGrade) {
            throw new Error(`Un grade avec le nom "${data.name}" existe déjà.`);
        }
        return prisma.grade.create({
            data: {
                name: data.name,
                level: 1, // Default Level
                description: data.description,
                tenantId,
            }
        });
    }
    static async update(id, tenantId, data) {
        const grade = await this.getById(id, tenantId);
        if (!grade) {
            throw new Error('Grade introuvable');
        }
        if (data.name && data.name !== grade.name) {
            const existingGrade = await prisma.grade.findFirst({
                where: { name: data.name, tenantId }
            });
            if (existingGrade) {
                throw new Error(`Un grade avec le nom "${data.name}" existe déjà.`);
            }
        }
        return prisma.grade.update({
            where: { id },
            data
        });
    }
    static async delete(id, tenantId) {
        const grade = await prisma.grade.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { employees: true } } }
        });
        if (!grade) {
            throw new Error('Grade introuvable');
        }
        if (grade._count.employees > 0) {
            throw new Error('Impossible de supprimer ce grade car des employés y sont rattachés.');
        }
        await prisma.grade.delete({ where: { id } });
    }
}
exports.GradeService = GradeService;
