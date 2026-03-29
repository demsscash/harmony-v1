import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';
import { getDashboardStats, getPayrollHistory, getTurnover } from '../controllers/reports.controller';

const router = Router();

router.use(tenantResolver, authenticateToken, requireRole([UserRole.ADMIN, UserRole.HR]));

router.get('/dashboard', getDashboardStats);
router.get('/payroll-history', getPayrollHistory);
router.get('/turnover', getTurnover);

export default router;
