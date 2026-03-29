"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const user_schema_1 = require("@harmony/shared/schemas/user.schema");
const tenant_1 = require("../middleware/tenant");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Toutes les routes utilisateur nécessitent la résolution du tenant et l'authentification
router.use(tenant_1.tenantResolver, auth_1.authenticateToken);
// Seuls les admins et HR peuvent voir et gérer les utilisateurs complets
router.get('/', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), user_controller_1.getUsers);
router.get('/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.HR]), user_controller_1.getUserById);
// Seul un Admin peut créer, modifier ou supprimer un utilisateur système
router.post('/', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN]), (0, validate_1.validate)(user_schema_1.createUserSchema), user_controller_1.createUser);
router.put('/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN]), (0, validate_1.validate)(user_schema_1.updateUserSchema), user_controller_1.updateUser);
router.delete('/:id', (0, rbac_1.requireRole)([client_1.UserRole.ADMIN]), user_controller_1.deleteUser);
exports.default = router;
