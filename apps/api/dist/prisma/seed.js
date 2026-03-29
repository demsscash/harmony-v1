"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Start seeding...');
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
    });
    console.log(`Created tenant: ${tenant.name}`);
    // Create Super Admin User
    const passwordHash = await bcrypt_1.default.hash('Admin@123', 12);
    const superAdmin = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: 'admin@harmony-erp.com',
            passwordHash,
            role: client_1.UserRole.SUPER_ADMIN,
            isActive: true,
        }
    });
    console.log(`Created super admin: ${superAdmin.email}`);
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
