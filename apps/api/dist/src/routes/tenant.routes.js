"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenant_controller_1 = require("../controllers/tenant.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect all routes with auth middleware
router.use(auth_1.authenticateToken);
// List all instances
router.get('/', tenant_controller_1.getAllTenants);
// Toggle instance status
router.patch('/:id/status', tenant_controller_1.toggleTenantStatus);
exports.default = router;
