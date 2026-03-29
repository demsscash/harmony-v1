"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaveType_controller_1 = require("../controllers/leaveType.controller");
const leave_controller_1 = require("../controllers/leave.controller");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const leave_schema_1 = require("@harmony/shared/schemas/leave.schema");
const tenant_1 = require("../middleware/tenant");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(tenant_1.tenantResolver, auth_1.authenticateToken);
// ==========================================
// TYPES DE CONGÉS
// ==========================================
// Seul Admin et RH peuvent gérer les types de congés
router.get('/types', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), leaveType_controller_1.getLeaveTypes);
router.get('/types/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), leaveType_controller_1.getLeaveTypeById);
router.post('/types', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), (0, validate_1.validate)(leave_schema_1.createLeaveTypeSchema), leaveType_controller_1.createLeaveType);
router.put('/types/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), (0, validate_1.validate)(leave_schema_1.updateLeaveTypeSchema), leaveType_controller_1.updateLeaveType);
router.delete('/types/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), leaveType_controller_1.deleteLeaveType);
// ==========================================
// DEMANDES DE CONGÉS
// ==========================================
// Tout le monde peut voir les congés (filtré par le service selon les droits, cf. TODO future refacto)
// Pour l'instant, disons que HR et Admin voient tout. Employé voit uniquement si req.user.employeeId === filters.employeeId (géré dans le service)
router.get('/', leave_controller_1.getLeaves);
router.get('/:id', leave_controller_1.getLeaveById);
// Soumettre une demande (l'employé lui-même, ou le RH pour lui)
router.post('/', (0, validate_1.validate)(leave_schema_1.createLeaveSchema), leave_controller_1.createLeave);
// Employé modifie ou annule sa demande (si Pending)
router.put('/:id', (0, validate_1.validate)(leave_schema_1.updateLeaveSchema), leave_controller_1.updateLeave);
router.patch('/:id/cancel', leave_controller_1.cancelLeave);
// Workflow de validation (Manager, HR ou Admin uniquement)
router.patch('/:id/process', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), (0, validate_1.validate)(leave_schema_1.processLeaveSchema), leave_controller_1.processLeaveRequest);
exports.default = router;
