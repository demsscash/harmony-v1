import { Router } from 'express';
import { getHolidays, createHoliday, updateHoliday, deleteHoliday, seedDefaults } from '../controllers/holiday.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(tenantResolver, authenticateToken);

router.get('/', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getHolidays);
router.post('/seed-defaults', requireRole([UserRole.ADMIN, UserRole.HR]), seedDefaults);
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), createHoliday);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), updateHoliday);
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), deleteHoliday);

export default router;
