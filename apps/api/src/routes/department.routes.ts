import { Router } from 'express';
import {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} from '../controllers/department.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(tenantResolver, authenticateToken);
// Removed the global requireRole middleware to apply it per route

router.get('/', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getDepartments);
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), createDepartment);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), updateDepartment);
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), deleteDepartment);

export default router;
