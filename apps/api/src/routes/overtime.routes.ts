import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { UserRole } from '@prisma/client';
import {
    getOvertimeConfig,
    updateOvertimeConfig,
    getOvertimes,
    getOvertimeById,
    createOvertime,
    updateOvertime,
    deleteOvertime,
} from '../controllers/overtime.controller';

const router = Router();

router.use(tenantResolver, authenticateToken);

// Config
router.get('/config', requireRole([UserRole.ADMIN, UserRole.HR]), getOvertimeConfig);
router.put('/config', requireRole([UserRole.ADMIN]), auditLog({ action: 'UPDATE_OVERTIME_CONFIG', resource: 'OvertimeConfig' }), updateOvertimeConfig);

// CRUD
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getOvertimes);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getOvertimeById);
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CREATE_OVERTIME', resource: 'Overtime' }), createOvertime);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'UPDATE_OVERTIME', resource: 'Overtime' }), updateOvertime);
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'DELETE_OVERTIME', resource: 'Overtime' }), deleteOvertime);

export default router;
