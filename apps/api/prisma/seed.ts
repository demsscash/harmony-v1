import { PrismaClient, UserRole, ContractType, EmployeeStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create default tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Harmony Enterprise',
      subdomain: 'demo',
      email: 'contact@harmony-erp.com',
      isActive: true,
      settings: {
        create: {
          fiscalYearStart: 1,
          workDaysPerWeek: 5,
        }
      }
    }
  })

  console.log(`Created tenant: ${tenant.name}`)

  // Create Super Admin User
  const passwordHash = await bcrypt.hash('Admin@123', 12)
  const superAdmin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@harmony-erp.com',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    }
  })

  console.log(`Created super admin: ${superAdmin.email}`)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
