import { PrismaClient, Grade } from '@prisma/client';
import { CreateGradeInput, UpdateGradeInput } from '@harmony/shared/schemas/grade.schema';

const prisma = new PrismaClient();

export class GradeService {
    static async getAll(tenantId: string): Promise<Grade[]> {
        return prisma.grade.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { employees: true } } }
        });
    }

    static async getById(id: string, tenantId: string): Promise<Grade | null> {
        return prisma.grade.findFirst({
            where: { id, tenantId },
            include: {
                advantages: {
                    include: { advantage: true }
                }
            }
        });
    }

    static async create(tenantId: string, data: CreateGradeInput): Promise<Grade> {
        const existingGrade = await prisma.grade.findFirst({
            where: { name: data.name, tenantId }
        });

        if (existingGrade) {
            throw new Error(`Un grade avec le nom "${data.name}" existe déjà.`);
        }

        return prisma.grade.create({
            data: {
                name: data.name,
                level: data.level,
                description: data.description,
                tenantId,
                advantages: data.advantages?.length ? {
                    create: data.advantages.map(adv => ({
                        advantageId: adv.advantageId,
                        customAmount: adv.customAmount !== undefined ? (adv.customAmount ? Number(adv.customAmount) : null) : null
                    }))
                } : undefined
            },
            include: { advantages: { include: { advantage: true } } }
        });
    }

    static async update(
        id: string,
        tenantId: string,
        data: UpdateGradeInput
    ): Promise<Grade> {
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

        // We use a transaction if advantages are provided, to clear the old ones and set the new ones
        if (data.advantages !== undefined) {
            return prisma.$transaction(async (tx) => {
                await tx.gradeAdvantage.deleteMany({
                    where: { gradeId: id }
                });

                return tx.grade.update({
                    where: { id },
                    data: {
                        name: data.name,
                        level: data.level,
                        description: data.description,
                        advantages: {
                            create: data.advantages!.map(adv => ({
                                advantageId: adv.advantageId,
                                customAmount: adv.customAmount !== undefined ? (adv.customAmount ? Number(adv.customAmount) : null) : null
                            }))
                        }
                    },
                    include: { advantages: { include: { advantage: true } } }
                });
            });
        }

        return prisma.grade.update({
            where: { id },
            data: {
                name: data.name,
                level: data.level,
                description: data.description,
            },
            include: { advantages: { include: { advantage: true } } }
        });
    }

    static async delete(id: string, tenantId: string): Promise<void> {
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
