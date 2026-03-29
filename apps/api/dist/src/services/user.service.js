"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
class UserService {
    static async getAll(tenantId) {
        return prisma.user.findMany({
            where: { tenantId },
            include: {
                employee: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    static async getById(id, tenantId) {
        return prisma.user.findFirst({
            where: { id, tenantId },
            include: { employee: true }
        });
    }
    static async create(tenantId, data) {
        const existing = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: data.email } }
        });
        if (existing) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, 12);
        return prisma.user.create({
            data: {
                tenantId,
                email: data.email,
                passwordHash,
                role: data.role,
                isActive: data.isActive ?? true,
                employeeId: data.employeeId,
            }
        });
    }
    static async update(id, tenantId, data) {
        const existingUser = await this.getById(id, tenantId);
        if (!existingUser) {
            throw new Error('Utilisateur non trouvé');
        }
        if (data.email && data.email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({
                where: { tenantId_email: { tenantId, email: data.email } }
            });
            if (emailTaken) {
                throw new Error('Cet email est déjà pris');
            }
        }
        const updateData = { ...data };
        // Hash new password if provided
        if (data.password) {
            updateData.passwordHash = await bcrypt_1.default.hash(data.password, 12);
            delete updateData.password;
        }
        return prisma.user.update({
            where: { id },
            data: updateData
        });
    }
    static async delete(id, tenantId) {
        const existingUser = await this.getById(id, tenantId);
        if (!existingUser) {
            throw new Error('Utilisateur non trouvé');
        }
        // In a real scenario we might prefer soft delete, but for now we follow strong delete
        await prisma.user.delete({
            where: { id }
        });
    }
}
exports.UserService = UserService;
