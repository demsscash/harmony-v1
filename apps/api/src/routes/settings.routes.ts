import { Router } from 'express';
import { getSettings, updateSettings, previewContract, getTaxConfig, updateTaxConfig, uploadLogo, deleteLogo, getTenantInfo } from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth';
import { tenantResolver } from '../middleware/tenant';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

const router = Router();

// All settings routes need tenant context and authentication
router.use(tenantResolver);
router.use(authenticateToken);

// Tenant info (all authenticated users - needed for logo in navbar)
router.get('/tenant', getTenantInfo);

// Everything below requires ADMIN or HR role
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getSettings);
router.put('/', requireRole([UserRole.ADMIN, UserRole.HR]), updateSettings);
router.post('/preview-contract', requireRole([UserRole.ADMIN, UserRole.HR]), previewContract);

// Logo management (ADMIN only)
router.patch('/logo', requireRole([UserRole.ADMIN]), uploadLogo);
router.delete('/logo', requireRole([UserRole.ADMIN]), deleteLogo);

// Tax config
router.get('/tax-config', requireRole([UserRole.ADMIN, UserRole.HR]), getTaxConfig);
router.put('/tax-config', requireRole([UserRole.ADMIN]), updateTaxConfig);

export default router;
