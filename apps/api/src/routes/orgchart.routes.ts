import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';
import { getUnitsChart, getEmployeesChart } from '../controllers/orgchart.controller';

const router = Router();

router.use(tenantResolver, authenticateToken);

router.get('/units', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getUnitsChart);
router.get('/employees', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getEmployeesChart);

export default router;
