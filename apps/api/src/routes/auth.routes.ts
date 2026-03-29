import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, refresh, logout, superAdminLogin, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();

// Rate limiting: 10 login attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting: 3 forgot-password per 15 minutes per IP
const forgotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { success: false, error: 'Trop de demandes. Réessayez dans 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', authLimiter, tenantResolver, auditLog({ action: 'LOGIN', resource: 'Auth' }), login);
router.post('/super-login', authLimiter, auditLog({ action: 'SUPER_ADMIN_LOGIN', resource: 'Auth' }), superAdminLogin);
router.post('/refresh', refresh);
router.post('/logout', authenticateToken, auditLog({ action: 'LOGOUT', resource: 'Auth' }), logout);
router.post('/forgot-password', forgotLimiter, tenantResolver, auditLog({ action: 'FORGOT_PASSWORD', resource: 'Auth' }), forgotPassword);
router.post('/reset-password', authLimiter, auditLog({ action: 'RESET_PASSWORD', resource: 'Auth' }), resetPassword);

export default router;

