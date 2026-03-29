import { Router } from 'express';
import { getHealth, getMetrics, getAuditLogs, getTenantsHealth } from '../controllers/monitoring.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateToken);
router.use(requireRole([UserRole.SUPER_ADMIN]));

router.get('/health', getHealth);
router.get('/metrics', getMetrics);
router.get('/audit-logs', getAuditLogs);
router.get('/tenants-health', getTenantsHealth);

export default router;
