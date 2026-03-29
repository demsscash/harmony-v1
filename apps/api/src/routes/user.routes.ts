import { Router } from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updatePermissions
} from '../controllers/user.controller';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createUserSchema, updateUserSchema } from '@harmony/shared/schemas/user.schema';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';

const router = Router();

// Toutes les routes utilisateur nécessitent la résolution du tenant et l'authentification
router.use(tenantResolver, authenticateToken);

// Seuls les admins et HR peuvent voir et gérer les utilisateurs complets
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getUsers);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getUserById);

// HR peut créer uniquement des comptes EMPLOYEE, Admin peut tout faire
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), validate(createUserSchema), createUser);
// Seul un Admin peut modifier ou supprimer un utilisateur
router.put('/:id', requireRole([UserRole.ADMIN]), validate(updateUserSchema), updateUser);
router.put('/:id/permissions', requireRole([UserRole.ADMIN]), updatePermissions);
router.delete('/:id', requireRole([UserRole.ADMIN]), deleteUser);

export default router;
