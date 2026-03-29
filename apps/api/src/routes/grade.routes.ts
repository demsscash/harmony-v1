import { Router } from 'express';
import {
    getGrades,
    getGradeById,
    createGrade,
    updateGrade,
    deleteGrade
} from '../controllers/grade.controller';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createGradeSchema, updateGradeSchema } from '@harmony/shared/schemas/grade.schema';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(tenantResolver, authenticateToken);

router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getGrades);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getGradeById);

router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), validate(createGradeSchema), createGrade);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), validate(updateGradeSchema), updateGrade);
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), deleteGrade);

export default router;
