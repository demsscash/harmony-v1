import { Router } from 'express';
import {
    getAllTenants,
    toggleTenantStatus,
    createTenant,
    deleteTenant,
    updateTenantPlan
} from '../controllers/tenant.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';
import { auditLog } from '../middleware/audit';

const router = Router();

// All tenant routes require authentication + SUPER_ADMIN role
router.use(authenticateToken);
router.use(requireRole([UserRole.SUPER_ADMIN]));

router.get('/', getAllTenants);
router.post('/', auditLog({ action: 'CREATE_TENANT', resource: 'Tenant' }), createTenant);
router.patch('/:id/status', auditLog({ action: 'TOGGLE_TENANT_STATUS', resource: 'Tenant' }), toggleTenantStatus);
router.patch('/:id/plan', auditLog({ action: 'UPDATE_TENANT_PLAN', resource: 'Tenant' }), updateTenantPlan);
router.delete('/:id', auditLog({ action: 'DELETE_TENANT', resource: 'Tenant' }), deleteTenant);

export default router;
