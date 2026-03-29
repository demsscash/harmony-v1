"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleTenantStatus = exports.getAllTenants = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all tenants (Super Admin only)
const getAllTenants = async (req, res) => {
    try {
        const user = req.user; // Assuming authMiddleware attaches user
        if (user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Accès refusé. Requis: SUPER_ADMIN' });
        }
        const tenants = await prisma.tenant.findMany({
            include: {
                _count: {
                    select: { users: true, employees: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tenants);
    }
    catch (error) {
        console.error('GetAllTenants error:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des instances' });
    }
};
exports.getAllTenants = getAllTenants;
// Toggle Tenant Status (Kill Switch)
const toggleTenantStatus = async (req, res) => {
    try {
        const user = req.user; // Assuming authMiddleware attaches user
        if (user?.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Accès refusé. Requis: SUPER_ADMIN' });
        }
        const id = req.params.id;
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'Le champ isActive doit être un booléen' });
        }
        const updatedTenant = await prisma.tenant.update({
            where: { id },
            data: { isActive },
        });
        res.json({ message: `Instance ${isActive ? 'activée' : 'suspendue'} avec succès`, tenant: updatedTenant });
    }
    catch (error) {
        console.error('ToggleTenantStatus error:', error);
        res.status(500).json({ error: "Erreur lors de la modification du statut de l'instance" });
    }
};
exports.toggleTenantStatus = toggleTenantStatus;
