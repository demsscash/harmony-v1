import { Router } from 'express';
import {
    getAllowances,
    getAllowanceById,
    createAllowance,
    updateAllowance,
    deleteAllowance,
    assignToGrade,
    removeFromGrade
} from '../controllers/allowance.controller';
import { validate } from '../middleware/validate';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { createAllowanceSchema, updateAllowanceSchema } from '@harmony/shared/schemas/allowance.schema';
import { tenantResolver } from '../middleware/tenant';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();

router.use(tenantResolver, authenticateToken);

router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getAllowances);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getAllowanceById);

router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), validate(createAllowanceSchema), createAllowance);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), validate(updateAllowanceSchema), updateAllowance);
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), deleteAllowance);

// Grade associations
const overrideSchema = z.object({ amountOverride: z.number().positive().optional() });
router.post('/assign/:gradeId/:allowanceId', requireRole([UserRole.ADMIN, UserRole.HR]), validate(overrideSchema), assignToGrade);
router.delete('/assign/:gradeId/:allowanceId', requireRole([UserRole.ADMIN, UserRole.HR]), removeFromGrade);

// ── Employee ↔ Prime assignment ─────────────────────────
router.post('/employee-assign', requireRole([UserRole.ADMIN, UserRole.HR]), async (req, res) => {
    try {
        const tenantId = req.tenant?.id!;
        const { employeeId, advantageId, customAmount, startDate } = req.body;
        if (!employeeId || !advantageId) {
            return res.status(400).json({ success: false, error: 'employeeId et advantageId requis' });
        }
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Vérifier que l'employé et la prime existent dans ce tenant
        const emp = await prisma.employee.findFirst({ where: { id: employeeId, tenantId } });
        if (!emp) return res.status(404).json({ success: false, error: 'Employé introuvable' });
        const adv = await prisma.advantage.findFirst({ where: { id: advantageId, tenantId } });
        if (!adv) return res.status(404).json({ success: false, error: 'Prime introuvable' });

        // Vérifier que la prime n'est pas déjà affectée
        const existing = await prisma.employeeAdvantage.findUnique({
            where: { employeeId_advantageId: { employeeId, advantageId } }
        });
        if (existing) return res.status(409).json({ success: false, error: 'Cette prime est déjà affectée à cet employé' });

        const assignment = await prisma.employeeAdvantage.create({
            data: {
                employeeId,
                advantageId,
                customAmount: customAmount ?? null,
                startDate: startDate ? new Date(startDate) : new Date(),
                isActive: true,
            },
            include: { advantage: true },
        });
        res.status(201).json({ success: true, data: assignment });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/employee-assign/:id', requireRole([UserRole.ADMIN, UserRole.HR]), async (req, res) => {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.employeeAdvantage.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Prime retirée' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
