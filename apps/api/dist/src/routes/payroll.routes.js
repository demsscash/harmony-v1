"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payroll_controller_1 = require("../controllers/payroll.controller");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const payroll_schema_1 = require("@harmony/shared/schemas/payroll.schema");
const tenant_1 = require("../middleware/tenant");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(tenant_1.tenantResolver, auth_1.authenticateToken);
// Accès limités aux Admins et RH
router.get('/', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), payroll_controller_1.getPayrolls);
router.get('/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), payroll_controller_1.getPayrollById);
// Opérations de gestion de paie
router.post('/', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), (0, validate_1.validate)(payroll_schema_1.createPayrollSchema), payroll_controller_1.createPayroll);
router.put('/:id/status', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), (0, validate_1.validate)(payroll_schema_1.updatePayrollStatusSchema), payroll_controller_1.updatePayrollStatus);
router.delete('/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), payroll_controller_1.deletePayroll);
// ==========================================
// MOTEUR DE CALCUL
// ==========================================
// Déclenche le calcul des fiches de paies basées sur le mois de la campagne
router.post('/:id/generate', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), payroll_controller_1.generatePayslips);
exports.default = router;
