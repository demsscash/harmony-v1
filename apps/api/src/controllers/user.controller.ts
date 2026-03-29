import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper : retourne uniquement les permissions non expirées
export function getActivePermissions(permissions: any): Array<{ key: string; expiresAt: string }> {
    if (!Array.isArray(permissions)) return [];
    const now = new Date();
    return permissions.filter((p: any) => p.key && new Date(p.expiresAt) > now);
}

export const getUsers = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const users = await UserService.getAll(tenantId);
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const user = await UserService.getById(req.params.id as string, tenantId);

        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }

        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;

        // HR ne peut créer que des comptes EMPLOYEE
        if (req.user?.role === 'HR' && req.body.role !== 'EMPLOYEE') {
            res.status(403).json({ success: false, error: 'Un RH ne peut créer que des comptes Employé' });
            return;
        }

        const user = await UserService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        // Handling duplicate email or other specific constraint errors
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const user = await UserService.update(req.params.id as string, tenantId, req.body);
        res.json({ success: true, data: user });
    } catch (error: any) {
        if (error.message.includes('non trouvé')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        if (error.message.includes('déjà pris')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await UserService.delete(req.params.id as string, tenantId);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
        if (error.message.includes('non trouvé')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// Permissions temporaires pour les HR
const VALID_PERMISSIONS = ['settings', 'payroll', 'users_full'];

export const updatePermissions = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const userId = req.params.id as string;
        const { permissions } = req.body;

        const targetUser = await prisma.user.findFirst({ where: { id: userId, tenantId } });
        if (!targetUser) {
            res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
            return;
        }

        if (targetUser.role !== 'HR') {
            res.status(400).json({ success: false, error: 'Les permissions temporaires ne s\'appliquent qu\'aux utilisateurs RH' });
            return;
        }

        // Validate permissions format: [{key, expiresAt}]
        if (!Array.isArray(permissions)) {
            res.status(400).json({ success: false, error: 'Format invalide' });
            return;
        }

        for (const p of permissions) {
            if (!VALID_PERMISSIONS.includes(p.key)) {
                res.status(400).json({ success: false, error: `Permission inconnue : ${p.key}` });
                return;
            }
            if (!p.expiresAt || isNaN(new Date(p.expiresAt).getTime())) {
                res.status(400).json({ success: false, error: 'Date d\'expiration invalide' });
                return;
            }
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { permissions },
        });

        res.json({ success: true, data: { permissions: updated.permissions } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
