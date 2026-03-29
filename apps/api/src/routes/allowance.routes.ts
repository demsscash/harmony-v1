import { Router } from 'express';
import {
    getAllowances,
    getAllowanceById,
    createAllowance,
    updateAllowance,
    deleteAllowance,
    assignToGrade,
    removeFromGrade
} from '../controllers/allowance.controller';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createAllowanceSchema, updateAllowanceSchema } from '@harmony/shared/schemas/allowance.schema';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();

router.use(tenantResolver, authenticateToken);

router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getAllowances);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getAllowanceById);

router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), validate(createAllowanceSchema), createAllowance);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), validate(updateAllowanceSchema), updateAllowance);
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), deleteAllowance);

// Grade associations
const overrideSchema = z.object({ amountOverride: z.number().positive().optional() });
router.post('/assign/:gradeId/:allowanceId', requireRole([UserRole.ADMIN, UserRole.HR]), validate(overrideSchema), assignToGrade);
router.delete('/assign/:gradeId/:allowanceId', requireRole([UserRole.ADMIN, UserRole.HR]), removeFromGrade);

export default router;
