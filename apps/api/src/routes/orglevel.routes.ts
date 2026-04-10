import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { UserRole } from '@prisma/client';
import {
    getOrgLevels,
    getOrgLevelById,
    createOrgLevel,
    updateOrgLevel,
    deleteOrgLevel,
    getOrgChart,
} from '../controllers/orglevel.controller';

const router = Router();

router.use(tenantResolver, authenticateToken);

// Org chart — accessible à tous les rôles authentifiés
router.get('/chart', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getOrgChart);

// CRUD niveaux hiérarchiques — ADMIN seulement
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getOrgLevels);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getOrgLevelById);
router.post('/', requireRole([UserRole.ADMIN]), auditLog({ action: 'CREATE_ORG_LEVEL', resource: 'OrgLevel' }), createOrgLevel);
router.put('/:id', requireRole([UserRole.ADMIN]), auditLog({ action: 'UPDATE_ORG_LEVEL', resource: 'OrgLevel' }), updateOrgLevel);
router.delete('/:id', requireRole([UserRole.ADMIN]), auditLog({ action: 'DELETE_ORG_LEVEL', resource: 'OrgLevel' }), deleteOrgLevel);

export default router;
