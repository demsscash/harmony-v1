import { Router } from 'express';
import {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    downloadEmployeeBadge,
    downloadEmployeeContract,
    createEmployeeAccount,
    terminateEmployee,
    reinstateEmployee,
} from '../controllers/employee.controller';
import { generateAttestationPdf } from '../services/pdf.service';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createEmployeeSchema, updateEmployeeSchema } from '@harmony/shared/schemas/employee.schema';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';
import { employeeOnboardingRouter } from './onboarding.routes';
import { auditLog } from '../middleware/audit';
import { ExcelService } from '../services/excel.service';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.use(tenantResolver, authenticateToken);

// Les rôles Admin et RH peuvent gérer les employés
// Un simple EMPLOYEE pourrait plus tard avoir une route '/me' pour voir son propre profil (à faire)

router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getEmployees);

// ==========================================
// Excel Import / Export (static routes BEFORE /:id)
// ==========================================
router.get('/export', requireRole([UserRole.ADMIN, UserRole.HR]), async (req, res) => {
    try {
        const tenantId = req.tenant?.id!;
        const buffer = await ExcelService.exportEmployees(tenantId);
        const filename = `employees_${new Date().toISOString().slice(0, 10)}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/import-template', requireRole([UserRole.ADMIN, UserRole.HR]), async (req, res) => {
    try {
        const buffer = await ExcelService.generateImportTemplate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="template_import_employes.xlsx"');
        res.send(buffer);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/import', requireRole([UserRole.ADMIN, UserRole.HR]), upload.single('file'), async (req, res) => {
    try {
        const tenantId = req.tenant?.id!;
        if (!req.file) return res.status(400).json({ success: false, error: 'Fichier requis' });
        const results = await ExcelService.importEmployees(tenantId, req.file.buffer);
        const successCount = results.filter(r => r.success).length;
        res.json({ success: true, results, message: `${successCount}/${results.length} employé(s) importé(s).` });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// Dynamic :id routes
// ==========================================
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getEmployeeById);

router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CREATE_EMPLOYEE', resource: 'Employee' }), validate(createEmployeeSchema), createEmployee);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'UPDATE_EMPLOYEE', resource: 'Employee' }), validate(updateEmployeeSchema), updateEmployee);

router.get('/:id/badge', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), downloadEmployeeBadge);
router.get('/:id/contract', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), downloadEmployeeContract);
router.get('/:id/attestation', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), async (req, res) => {
    try {
        const tenantId = req.tenant?.id!;
        const buffer = await generateAttestationPdf(String(req.params.id), tenantId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="attestation_${req.params.id}.pdf"`);
        res.send(buffer);
    } catch (err: any) {
        const status = err.message.includes('introuvable') ? 404 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
});

router.post('/:id/create-account', requireRole([UserRole.ADMIN, UserRole.HR]), createEmployeeAccount);
router.post('/:id/terminate', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'TERMINATE_EMPLOYEE', resource: 'Employee' }), terminateEmployee);
router.post('/:id/reinstate', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'REINSTATE_EMPLOYEE', resource: 'Employee' }), reinstateEmployee);

// Onboarding nested routes
router.use('/:id/onboarding', employeeOnboardingRouter);

export default router;
