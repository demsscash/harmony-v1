import { Router } from 'express';
import {
    createSignatureRequest,
    getSignatureRequests,
    getSignatureRequestById,
    getMySignatureRequests,
    signDocument,
    cancelSignatureRequest,
    sendSignatureReminder,
    getSignatureStats,
    previewDocument,
    downloadSignedPdf,
} from '../controllers/signature.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { tenantResolver } from '../middleware/tenant';
import { auditLog } from '../middleware/audit';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(tenantResolver, authenticateToken);

// Employee endpoints (must be before /:id to avoid route conflict)
router.get('/my/pending', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getMySignatureRequests);

// Admin/HR endpoints
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getSignatureRequests);
router.get('/stats', requireRole([UserRole.ADMIN, UserRole.HR]), getSignatureStats);
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CREATE_SIGNATURE_REQUEST', resource: 'SignatureRequest' }), createSignatureRequest);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getSignatureRequestById);
router.get('/:id/pdf', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), previewDocument);
router.get('/:id/signed-pdf', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), downloadSignedPdf);
router.patch('/:id/cancel', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CANCEL_SIGNATURE', resource: 'SignatureRequest' }), cancelSignatureRequest);
router.post('/:id/reminder', requireRole([UserRole.ADMIN, UserRole.HR]), sendSignatureReminder);
router.post('/:id/sign', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), auditLog({ action: 'SIGN_DOCUMENT', resource: 'SignatureRequest' }), signDocument);

export default router;
