"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const employee_schema_1 = require("@harmony/shared/schemas/employee.schema");
const tenant_1 = require("../middleware/tenant");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(tenant_1.tenantResolver, auth_1.authenticateToken);
// Les rôles Admin et RH peuvent gérer les employés
// Un simple EMPLOYEE pourrait plus tard avoir une route '/me' pour voir son propre profil (à faire)
router.get('/', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), employee_controller_1.getEmployees);
router.get('/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), employee_controller_1.getEmployeeById);
router.post('/', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), (0, validate_1.validate)(employee_schema_1.createEmployeeSchema), employee_controller_1.createEmployee);
router.put('/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), (0, validate_1.validate)(employee_schema_1.updateEmployeeSchema), employee_controller_1.updateEmployee);
router.get('/:id/badge', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), employee_controller_1.downloadEmployeeBadge);
exports.default = router;
