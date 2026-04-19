import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { auditLog } from '../middleware/audit';
import { UserRole } from '@prisma/client';
import {
    getSignatures, getSignatureById,
    createSignatureRequest, requestDocument,
    employeeSign, adminSign, validateAndSign,
    rejectSignature, cancelSignature,
    downloadSignedPdf, downloadRawPdf,
} from '../controllers/signature.controller';

const router = Router();
router.use(tenantResolver, authenticateToken);

// ── List & Detail ────────────────────────────────────────
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getSignatures);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getSignatureById);

// ── PDF downloads ────────────────────────────────────────
router.get('/:id/pdf', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), downloadRawPdf);
router.get('/:id/signed-pdf', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), downloadSignedPdf);

// ── Admin creates signature request ──────────────────────
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CREATE_SIGNATURE_REQUEST', resource: 'SignatureRequest' }), createSignatureRequest);

// ── Employee requests a document ─────────────────────────
router.post('/request-document', requireRole([UserRole.EMPLOYEE]), auditLog({ action: 'REQUEST_DOCUMENT', resource: 'SignatureRequest' }), requestDocument);

// ── Employee signs ───────────────────────────────────────
router.post('/:id/employee-sign', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), auditLog({ action: 'EMPLOYEE_SIGN', resource: 'SignatureRequest' }), employeeSign);

// ── Admin signs (DUAL or both at once) ───────────────────
router.post('/:id/admin-sign', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'ADMIN_SIGN', resource: 'SignatureRequest' }), adminSign);

// ── Admin validates + signs employee request ─────────────
router.post('/:id/validate', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'VALIDATE_SIGNATURE', resource: 'SignatureRequest' }), validateAndSign);

// ── Reject ───────────────────────────────────────────────
router.post('/:id/reject', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'REJECT_SIGNATURE', resource: 'SignatureRequest' }), rejectSignature);

// ── Cancel ───────────────────────────────────────────────
router.post('/:id/cancel', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CANCEL_SIGNATURE', resource: 'SignatureRequest' }), cancelSignature);

export default router;
