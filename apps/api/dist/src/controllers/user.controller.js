"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const user_service_1 = require("../services/user.service");
const getUsers = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const users = await user_service_1.UserService.getAll(tenantId);
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const user = await user_service_1.UserService.getById(req.params.id, tenantId);
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const user = await user_service_1.UserService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: user });
    }
    catch (error) {
        // Handling duplicate email or other specific constraint errors
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const user = await user_service_1.UserService.update(req.params.id, tenantId, req.body);
        res.json({ success: true, data: user });
    }
    catch (error) {
        if (error.message.includes('non trouvé')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        if (error.message.includes('déjà pris')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        await user_service_1.UserService.delete(req.params.id, tenantId);
        res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        if (error.message.includes('non trouvé')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.deleteUser = deleteUser;
