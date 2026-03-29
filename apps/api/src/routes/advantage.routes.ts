import { Router } from 'express';
import {
    getAdvantages,
    getAdvantageById,
    createAdvantage,
    updateAdvantage,
    deleteAdvantage
} from '../controllers/advantage.controller';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createAdvantageSchema, updateAdvantageSchema } from '@harmony/shared/schemas/advantage.schema';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(tenantResolver, authenticateToken);

router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getAdvantages);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getAdvantageById);

router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), validate(createAdvantageSchema), createAdvantage);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), validate(updateAdvantageSchema), updateAdvantage);
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), deleteAdvantage);

export default router;
