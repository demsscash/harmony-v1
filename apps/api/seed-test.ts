import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTest() {
    try {
        const tenant = await prisma.tenant.findUnique({ where: { subdomain: 'demo' } });
        if (!tenant) throw new Error("Tenant demo non trouvé");

        const dept = await prisma.department.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name: 'Technique' } },
            update: {},
            create: { tenantId: tenant.id, name: 'Technique', description: 'Équipe Tech' }
        });

        const grade = await prisma.grade.upsert({
            where: { id: 'test-grade-1' },
            update: {},
            create: { tenantId: tenant.id, name: 'Senior', level: 3, description: 'Senior Dev' }
        });

        console.log(`✅ Seed réussi : Dept ${dept.id}, Grade ${grade.id}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect()
    }
}

seedTest();
