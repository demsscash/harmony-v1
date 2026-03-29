import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { CreateUserInput, UpdateUserInput } from '@harmony/shared/schemas/user.schema';

const prisma = new PrismaClient();

export class UserService {
    static async getAll(tenantId: string) {
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

    static async getById(id: string, tenantId: string) {
        return prisma.user.findFirst({
            where: { id, tenantId },
            include: { employee: true }
        });
    }

    static async create(tenantId: string, data: CreateUserInput) {
        const existing = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email: data.email } }
        });

        if (existing) {
            throw new Error('Un utilisateur avec cet email existe déjà');
        }

        const passwordHash = await bcrypt.hash(data.password, 12);

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

    static async update(id: string, tenantId: string, data: UpdateUserInput) {
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

        const updateData: any = { ...data };

        // Hash new password if provided
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 12);
            delete updateData.password;
        }

        return prisma.user.update({
            where: { id },
            data: updateData
        });
    }

    static async delete(id: string, tenantId: string) {
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
