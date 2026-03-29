"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLeaveType = exports.updateLeaveType = exports.createLeaveType = exports.getLeaveTypeById = exports.getLeaveTypes = void 0;
const leaveType_service_1 = require("../services/leaveType.service");
const getLeaveTypes = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const leaveTypes = await leaveType_service_1.LeaveTypeService.getAll(tenantId);
        res.json({ success: true, data: leaveTypes });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getLeaveTypes = getLeaveTypes;
const getLeaveTypeById = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const leaveType = await leaveType_service_1.LeaveTypeService.getById(req.params.id, tenantId);
        if (!leaveType) {
            res.status(404).json({ success: false, error: 'Type de congé non trouvé' });
            return;
        }
        res.json({ success: true, data: leaveType });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getLeaveTypeById = getLeaveTypeById;
const createLeaveType = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const leaveType = await leaveType_service_1.LeaveTypeService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: leaveType });
    }
    catch (error) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createLeaveType = createLeaveType;
const updateLeaveType = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const leaveType = await leaveType_service_1.LeaveTypeService.update(req.params.id, tenantId, req.body);
        res.json({ success: true, data: leaveType });
    }
    catch (error) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.updateLeaveType = updateLeaveType;
const deleteLeaveType = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        await leaveType_service_1.LeaveTypeService.delete(req.params.id, tenantId);
        res.json({ success: true, message: 'Type de congé supprimé avec succès' });
    }
    catch (error) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        if (error.message.includes('Impossible de supprimer')) {
            res.status(400).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.deleteLeaveType = deleteLeaveType;
