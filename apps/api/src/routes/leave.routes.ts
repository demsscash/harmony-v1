import { Router, Request, Response } from 'express';
import {
    getLeaveTypes,
    getLeaveTypeById,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType
} from '../controllers/leaveType.controller';
import {
    getLeaves,
    getLeaveById,
    createLeave,
    updateLeave,
    cancelLeave,
    processLeaveRequest
} from '../controllers/leave.controller';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
    createLeaveTypeSchema,
    updateLeaveTypeSchema,
    createLeaveSchema,
    updateLeaveSchema,
    processLeaveSchema
} from '@harmony/shared/schemas/leave.schema';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';
import { auditLog } from '../middleware/audit';
import { generateLeaveRequestPdf } from '../services/pdf.service';
import { LeaveService } from '../services/leave.service';

const router = Router();

router.use(tenantResolver, authenticateToken);

// ==========================================
// SOLDES DE CONGÉS
// ==========================================
router.get('/balances/all', requireRole([UserRole.ADMIN, UserRole.HR]), async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
        const data = await LeaveService.getAllBalances(tenantId, year);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/balances/:employeeId', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), async (req: Request, res: Response) => {
    try {
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
        const balances = await LeaveService.getBalances(String(req.params.employeeId), year);
        res.json({ success: true, data: balances });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/balances/initialize', requireRole([UserRole.ADMIN, UserRole.HR]), async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { employeeId, year } = req.body;
        if (!employeeId) {
            res.status(400).json({ success: false, error: 'employeeId requis' });
            return;
        }
        const balances = await LeaveService.initializeBalances(employeeId, tenantId, year || new Date().getFullYear());
        res.json({ success: true, data: balances });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// TYPES DE CONGÉS
// ==========================================
// --- CONFIGURATION DES TYPES DE CONGÉS ---
router.get('/types', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getLeaveTypes);
router.get('/types/:id', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getLeaveTypeById);
router.post('/types', requireRole([UserRole.ADMIN, UserRole.HR]), validate(createLeaveTypeSchema), createLeaveType);
router.put('/types/:id', requireRole([UserRole.ADMIN, UserRole.HR]), validate(updateLeaveTypeSchema), updateLeaveType);
router.delete('/types/:id', requireRole([UserRole.ADMIN, UserRole.HR]), deleteLeaveType);

// ==========================================
// DEMANDES DE CONGÉS
// ==========================================
// Tout le monde peut voir les congés (filtré par le service selon les droits, cf. TODO future refacto)
// Pour l'instant, disons que HR et Admin voient tout. Employé voit uniquement si req.user.employeeId === filters.employeeId (géré dans le service)
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getLeaves);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), getLeaveById);

// Soumettre une demande (l'employé lui-même, ou le RH pour lui)
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), auditLog({ action: 'CREATE_LEAVE', resource: 'Leave' }), validate(createLeaveSchema), createLeave);

// Employé modifie ou annule sa demande (si Pending)
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), auditLog({ action: 'UPDATE_LEAVE', resource: 'Leave' }), validate(updateLeaveSchema), updateLeave);
router.patch('/:id/cancel', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), auditLog({ action: 'CANCEL_LEAVE', resource: 'Leave' }), cancelLeave);

// Workflow de validation (Manager, HR ou Admin uniquement)
router.patch('/:id/process', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'PROCESS_LEAVE', resource: 'Leave' }), validate(processLeaveSchema), processLeaveRequest);

// PDF fiche de demande de congé
router.get('/:id/pdf', requireRole([UserRole.ADMIN, UserRole.HR, UserRole.EMPLOYEE]), async (req: Request, res: Response) => {
    try {
        const buffer = await generateLeaveRequestPdf(String(req.params.id), (req as any).tenant?.id!);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="demande_conge_${req.params.id}.pdf"`);
        res.send(buffer);
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
