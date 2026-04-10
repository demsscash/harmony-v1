import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { UserRole } from '@prisma/client';
import {
    getSanctions,
    getSanctionById,
    createSanction,
    updateSanction,
    archiveSanction,
    deleteSanction,
} from '../controllers/sanction.controller';

const router = Router();

router.use(tenantResolver, authenticateToken);

router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getSanctions);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getSanctionById);
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CREATE_SANCTION', resource: 'Sanction' }), createSanction);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'UPDATE_SANCTION', resource: 'Sanction' }), updateSanction);
router.patch('/:id/archive', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'ARCHIVE_SANCTION', resource: 'Sanction' }), archiveSanction);
router.delete('/:id', requireRole([UserRole.ADMIN]), auditLog({ action: 'DELETE_SANCTION', resource: 'Sanction' }), deleteSanction);

export default router;
