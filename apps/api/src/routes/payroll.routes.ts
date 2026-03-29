import { Router } from 'express';
import {
    getPayrolls,
    getPayrollById,
    createPayroll,
    updatePayrollStatus,
    deletePayroll,
    generatePayslips
} from '../controllers/payroll.controller';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createPayrollSchema, updatePayrollStatusSchema } from '@harmony/shared/schemas/payroll.schema';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';
import { auditLog } from '../middleware/audit';
import { generatePayslipPdf } from '../services/pdf.service';

const router = Router();

router.use(tenantResolver, authenticateToken);

// ── Payslip PDF — must be BEFORE /:id to avoid conflict ──────────────
router.get('/payslips/:payslipId/pdf',
    requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]),
    async (req, res) => {
        try {
            const tenantId = req.tenant?.id!;
            const buffer = await generatePayslipPdf(String(req.params.payslipId), tenantId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="bulletin_${req.params.payslipId}.pdf"`);
            res.send(buffer);
        } catch (err: any) {
            const status = err.message.includes('introuvable') ? 404 : err.message.includes('refusé') ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }
);

// Alias: /:payslipId/pdf (called from employee detail page)
router.get('/:payslipId/pdf',
    requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]),
    async (req, res) => {
        try {
            const tenantId = req.tenant?.id!;
            const buffer = await generatePayslipPdf(String(req.params.payslipId), tenantId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="bulletin_${req.params.payslipId}.pdf"`);
            res.send(buffer);
        } catch (err: any) {
            const status = err.message.includes('introuvable') ? 404 : err.message.includes('refusé') ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }
);

// Accès limités aux Admins et RH
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getPayrolls);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getPayrollById);

// Opérations de gestion de paie
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CREATE_PAYROLL', resource: 'Payroll' }), validate(createPayrollSchema), createPayroll);
router.put('/:id/status', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'UPDATE_PAYROLL_STATUS', resource: 'Payroll' }), validate(updatePayrollStatusSchema), updatePayrollStatus);
// Alias pour le frontend qui appelle PATCH /:id/validate
router.patch('/:id/validate', requireRole([UserRole.ADMIN, UserRole.HR]), async (req, res, next) => {
    req.body = { ...req.body, status: 'VALIDATED' };
    return updatePayrollStatus(req, res);
});
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), deletePayroll);

// ==========================================
// MOTEUR DE CALCUL
// ==========================================
// Déclenche le calcul des fiches de paies basées sur le mois de la campagne
router.post('/:id/generate', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'GENERATE_PAYSLIPS', resource: 'Payroll' }), generatePayslips);

export default router;
