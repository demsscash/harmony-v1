import { Router, Request, Response, NextFunction } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';

const router = Router();

// ==========================================
// MIDDLEWARE CLEF API pour les CRON n8n
// Routes CRON accessibles uniquement avec X-Cron-Secret
// ==========================================
const cronAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const secret = req.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET || 'harmony-cron-secret-change-me';

    if (secret !== expectedSecret) {
        return res.status(401).json({ success: false, error: 'CRON secret invalide' });
    }
    next();
};

// ==========================================
// ROUTES CRON (pour n8n polling)
// ==========================================
router.get('/cron/expiring-contracts', cronAuthMiddleware, NotificationsController.getExpiringContracts);
router.get('/cron/expiring-trials', cronAuthMiddleware, NotificationsController.getExpiringTrials);
router.get('/cron/its-reminder', cronAuthMiddleware, NotificationsController.getItsReminder);
router.get('/cron/unused-leave-alert', cronAuthMiddleware, NotificationsController.getUnusedLeaveAlert);
router.post('/cron/send-contract-expiry', cronAuthMiddleware, NotificationsController.sendContractExpiryAlerts);

// ==========================================
// ROUTES ADMIN (authentifiées par l'app)
// ==========================================
router.get('/inbox', tenantResolver, authenticateToken, requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), NotificationsController.getInbox);
router.post('/test-smtp', tenantResolver, authenticateToken, requireRole([UserRole.ADMIN]), NotificationsController.testSmtp);
router.post('/send-payslips', tenantResolver, authenticateToken, requireRole([UserRole.ADMIN, UserRole.HR]), NotificationsController.sendPayslipEmails);
router.post('/welcome', tenantResolver, authenticateToken, requireRole([UserRole.ADMIN, UserRole.HR]), NotificationsController.sendWelcome);

export default router;
