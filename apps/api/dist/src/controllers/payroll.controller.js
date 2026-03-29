"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayroll = exports.generatePayslips = exports.updatePayrollStatus = exports.createPayroll = exports.getPayrollById = exports.getPayrolls = void 0;
const payroll_service_1 = require("../services/payroll.service");
const getPayrolls = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const payrolls = await payroll_service_1.PayrollService.getAll(tenantId);
        res.json({ success: true, data: payrolls });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getPayrolls = getPayrolls;
const getPayrollById = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const payroll = await payroll_service_1.PayrollService.getById(req.params.id, tenantId);
        if (!payroll) {
            res.status(404).json({ success: false, error: 'Campagne de paie non trouvée' });
            return;
        }
        res.json({ success: true, data: payroll });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getPayrollById = getPayrollById;
const createPayroll = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const payroll = await payroll_service_1.PayrollService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: payroll });
    }
    catch (error) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createPayroll = createPayroll;
const updatePayrollStatus = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const userId = req.user?.userId;
        const payroll = await payroll_service_1.PayrollService.updateStatus(req.params.id, tenantId, userId, req.body);
        res.json({ success: true, data: payroll });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.updatePayrollStatus = updatePayrollStatus;
const generatePayslips = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const result = await payroll_service_1.PayrollService.generatePayslips(req.params.id, tenantId);
        res.json({ success: true, data: result, message: `Génération de ${result.count} bulletins réussie.` });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.generatePayslips = generatePayslips;
const deletePayroll = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        await payroll_service_1.PayrollService.delete(req.params.id, tenantId);
        res.json({ success: true, message: 'Campagne de paie supprimée avec succès' });
    }
    catch (error) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.deletePayroll = deletePayroll;
