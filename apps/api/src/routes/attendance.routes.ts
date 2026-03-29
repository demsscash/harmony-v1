import { Router } from 'express';
import {
    getAttendanceConfig,
    updateAttendanceConfig,
    getEmployeeSchedule,
    updateEmployeeSchedule,
    getAttendances,
    getAttendanceById,
    createAttendance,
    createBulkAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceSummary,
} from '../controllers/attendance.controller';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { tenantResolver } from '../middleware/tenant';
import { auditLog } from '../middleware/audit';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(tenantResolver, authenticateToken);

// Config pointage (ADMIN only)
router.get('/config', requireRole([UserRole.ADMIN, UserRole.HR]), getAttendanceConfig);
router.put('/config', requireRole([UserRole.ADMIN]), auditLog({ action: 'UPDATE_ATTENDANCE_CONFIG', resource: 'AttendanceConfig' }), updateAttendanceConfig);

// Résumé mensuel
router.get('/summary', requireRole([UserRole.ADMIN, UserRole.HR]), getAttendanceSummary);

// Horaire employé
router.get('/schedule/:employeeId', requireRole([UserRole.ADMIN, UserRole.HR]), getEmployeeSchedule);
router.put('/schedule/:employeeId', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'UPDATE_EMPLOYEE_SCHEDULE', resource: 'EmployeeSchedule' }), updateEmployeeSchedule);

// CRUD Pointages
router.get('/', requireRole([UserRole.ADMIN, UserRole.HR]), getAttendances);
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), getAttendanceById);
router.post('/', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CREATE_ATTENDANCE', resource: 'Attendance' }), createAttendance);
router.post('/bulk', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'CREATE_BULK_ATTENDANCE', resource: 'Attendance' }), createBulkAttendance);
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'UPDATE_ATTENDANCE', resource: 'Attendance' }), updateAttendance);
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.HR]), auditLog({ action: 'DELETE_ATTENDANCE', resource: 'Attendance' }), deleteAttendance);

export default router;
