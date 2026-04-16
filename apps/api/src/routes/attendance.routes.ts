import { Router } from 'express';
import { tenantResolver } from '../middleware/tenant';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { UserRole } from '@prisma/client';
import {
    getAttendanceCodes, createAttendanceCode, updateAttendanceCode, deleteAttendanceCode,
    getAttendanceEntries, upsertAttendanceEntry, bulkUpsertAttendance, fillDefaultAttendance,
    getAttendanceSummary,
} from '../controllers/attendance.controller';

const router = Router();
router.use(tenantResolver, authenticateToken);

// ── Codes (configurable par tenant) ─────────────────────
router.get('/codes', requireRole([UserRole.ADMIN, UserRole.HR]), getAttendanceCodes);
router.post('/codes', requireRole([UserRole.ADMIN]), createAttendanceCode);
router.put('/codes/:id', requireRole([UserRole.ADMIN]), updateAttendanceCode);
router.delete('/codes/:id', requireRole([UserRole.ADMIN]), deleteAttendanceCode);

// ── Entries (saisie de pointage) ────────────────────────
router.get('/entries', requireRole([UserRole.ADMIN, UserRole.HR]), getAttendanceEntries);
router.post('/entries', requireRole([UserRole.ADMIN, UserRole.HR]), upsertAttendanceEntry);
router.post('/entries/bulk', requireRole([UserRole.ADMIN, UserRole.HR]), bulkUpsertAttendance);
router.post('/entries/fill-default', requireRole([UserRole.ADMIN, UserRole.HR]), fillDefaultAttendance);

// ── Summary ─────────────────────────────────────────────
router.get('/summary', requireRole([UserRole.ADMIN, UserRole.HR]), getAttendanceSummary);

export default router;
