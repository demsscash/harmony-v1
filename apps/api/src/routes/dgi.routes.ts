import { Router } from 'express';
import { DgiController } from '../controllers/dgi.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';

import { tenantResolver } from '../middleware/tenant';

const router = Router();

// Sécurisation globale des routes DGI
router.use(tenantResolver);
router.use(authenticateToken);
router.use(requireRole([UserRole.ADMIN, UserRole.HR]));

router.get('/its', DgiController.generateITS);
router.get('/das', DgiController.generateDAS);
router.get('/taxe-apprentissage', DgiController.generateTaxeApprentissage);

export default router;
