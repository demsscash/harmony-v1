import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { globalSearch } from '../controllers/search.controller';

const router = Router();

// SUPER_ADMIN doesn't need tenant context, others do
// We make tenant optional by handling it in the controller
router.get('/', authenticateToken, (req, res, next) => {
    if (req.user?.role === 'SUPER_ADMIN') return next();
    tenantResolver(req, res, next);
}, globalSearch);

export default router;
