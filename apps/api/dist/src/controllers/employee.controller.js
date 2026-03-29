"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadEmployeeBadge = exports.updateEmployee = exports.createEmployee = exports.getEmployeeById = exports.getEmployees = void 0;
const employee_service_1 = require("../services/employee.service");
const pdf_service_1 = require("../services/pdf.service");
const getEmployees = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const employees = await employee_service_1.EmployeeService.getAll(tenantId);
        res.json({ success: true, data: employees });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getEmployees = getEmployees;
const getEmployeeById = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const employee = await employee_service_1.EmployeeService.getById(req.params.id, tenantId);
        if (!employee) {
            res.status(404).json({ success: false, error: 'Employé non trouvé' });
            return;
        }
        res.json({ success: true, data: employee });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getEmployeeById = getEmployeeById;
const createEmployee = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const userId = req.user?.userId;
        const employee = await employee_service_1.EmployeeService.create(tenantId, userId, req.body);
        res.status(201).json({ success: true, data: employee });
    }
    catch (error) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const userId = req.user?.userId;
        const employee = await employee_service_1.EmployeeService.update(req.params.id, tenantId, userId, req.body);
        res.json({ success: true, data: employee });
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
exports.updateEmployee = updateEmployee;
const downloadEmployeeBadge = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const pdfBuffer = await pdf_service_1.PdfService.generateEmployeeBadge(req.params.id, tenantId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="badge_${req.params.id}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        if (error.message === 'Employé introuvable') {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.downloadEmployeeBadge = downloadEmployeeBadge;
