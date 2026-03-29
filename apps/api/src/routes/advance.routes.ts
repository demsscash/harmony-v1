import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { UserRole } from '@prisma/client';
import {
    getAdvances,
    getAdvanceById,
    createAdvance,
    approveAdvance,
    rejectAdvance,
} from '../controllers/advance.controller';

const router = Router();

router.use(tenantResolver, authenticateToken);

// EMPLOYEE, HR, ADMIN can list (EMPLOYEE sees only own via controller logic)
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getAdvances);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getAdvanceById);

// EMPLOYEE can request, ADMIN/HR can create for any employee
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), auditLog({ action: 'CREATE_ADVANCE', resource: 'SalaryAdvance' }), createAdvance);

// Only ADMIN/HR can approve/reject
router.patch('/:id/approve', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'APPROVE_ADVANCE', resource: 'SalaryAdvance' }), approveAdvance);
router.patch('/:id/reject', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'REJECT_ADVANCE', resource: 'SalaryAdvance' }), rejectAdvance);

export default router;
