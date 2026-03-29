"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromGrade = exports.assignToGrade = exports.deleteAllowance = exports.updateAllowance = exports.createAllowance = exports.getAllowanceById = exports.getAllowances = void 0;
const allowance_service_1 = require("../services/allowance.service");
const getAllowances = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const allowances = await allowance_service_1.AllowanceService.getAll(tenantId);
        res.json({ success: true, data: allowances });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getAllowances = getAllowances;
const getAllowanceById = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const allowance = await allowance_service_1.AllowanceService.getById(req.params.id, tenantId);
        if (!allowance) {
            res.status(404).json({ success: false, error: 'Avantage non trouvé' });
            return;
        }
        res.json({ success: true, data: allowance });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getAllowanceById = getAllowanceById;
const createAllowance = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const allowance = await allowance_service_1.AllowanceService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: allowance });
    }
    catch (error) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createAllowance = createAllowance;
const updateAllowance = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const allowance = await allowance_service_1.AllowanceService.update(req.params.id, tenantId, req.body);
        res.json({ success: true, data: allowance });
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
exports.updateAllowance = updateAllowance;
const deleteAllowance = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        await allowance_service_1.AllowanceService.delete(req.params.id, tenantId);
        res.json({ success: true, message: 'Avantage supprimé avec succès' });
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
exports.deleteAllowance = deleteAllowance;
const assignToGrade = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const { gradeId, allowanceId } = req.params;
        const { amountOverride } = req.body;
        const assignment = await allowance_service_1.AllowanceService.assignToGrade(gradeId, allowanceId, tenantId, amountOverride);
        res.json({ success: true, data: assignment });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.assignToGrade = assignToGrade;
const removeFromGrade = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const { gradeId, allowanceId } = req.params;
        await allowance_service_1.AllowanceService.removeFromGrade(gradeId, allowanceId, tenantId);
        res.json({ success: true, message: 'Avantage retiré du grade avec succès' });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.removeFromGrade = removeFromGrade;
