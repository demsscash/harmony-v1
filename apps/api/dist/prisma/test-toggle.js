"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- TEST TENANT TOGGLE START ---');
    // 1. Fetch current tenants
    const tenants = await prisma.tenant.findMany();
    console.log('[1] Current Tenants:');
    tenants.forEach(t => console.log(`  - ${t.name} (ID: ${t.id}, isActive: ${t.isActive})`));
    if (tenants.length === 0) {
        console.log('No tenants found. Seeding first.');
        return;
    }
    const targetTenant = tenants[0];
    const newStatus = !targetTenant.isActive;
    // 2. Perform Toggle
    console.log(`\n[2] Toggling status for ${targetTenant.name} to ${newStatus}...`);
    const updatedTenant = await prisma.tenant.update({
        where: { id: targetTenant.id },
        data: { isActive: newStatus }
    });
    console.log(`  -> Success! New status: ${updatedTenant.isActive}`);
    // 3. Revert Toggle
    console.log(`\n[3] Reverting status to ${targetTenant.isActive}...`);
    await prisma.tenant.update({
        where: { id: targetTenant.id },
        data: { isActive: targetTenant.isActive }
    });
    console.log('--- TEST FINISHED ---');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
