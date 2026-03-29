"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processLeaveRequest = exports.cancelLeave = exports.updateLeave = exports.createLeave = exports.getLeaveById = exports.getLeaves = void 0;
const leave_service_1 = require("../services/leave.service");
const getLeaves = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const { employeeId, status } = req.query;
        const filters = {
            employeeId: employeeId,
            status: status
        };
        const leaves = await leave_service_1.LeaveService.getAll(tenantId, filters);
        res.json({ success: true, data: leaves });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getLeaves = getLeaves;
const getLeaveById = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const leave = await leave_service_1.LeaveService.getById(req.params.id, tenantId);
        if (!leave) {
            res.status(404).json({ success: false, error: 'Demande de congé non trouvée' });
            return;
        }
        res.json({ success: true, data: leave });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getLeaveById = getLeaveById;
const createLeave = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        // L'employé connecté peut ne pas être l'admin, on devrait potentiellement 
        // valider que {employeeId} lui appartient, mais on laisse ici ouvert 
        // pour un HR qui va formuler la requête.
        const leave = await leave_service_1.LeaveService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: leave });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.createLeave = createLeave;
const updateLeave = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const { employeeId } = req.body; // Transmis par le token / body ?
        // Pour simplifier l'exemple on suppose que le middleware auth injecte req.user.employeeId
        // On passera le req.user.employeeId si pertinent
        const currentEmployeeId = req.user?.employeeId;
        if (!currentEmployeeId) {
            res.status(401).json({ success: false, error: "Vous devez être un employé pour modifier" });
            return;
        }
        const leave = await leave_service_1.LeaveService.update(req.params.id, tenantId, currentEmployeeId, req.body);
        res.json({ success: true, data: leave });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.updateLeave = updateLeave;
const cancelLeave = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const currentEmployeeId = req.user?.employeeId;
        if (!currentEmployeeId) {
            res.status(401).json({ success: false, error: "Vous devez être un employé pour annuler" });
            return;
        }
        const leave = await leave_service_1.LeaveService.cancel(req.params.id, tenantId, currentEmployeeId);
        res.json({ success: true, data: leave, message: 'Demande annulée avec succès' });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.cancelLeave = cancelLeave;
const processLeaveRequest = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const reviewerId = req.user?.userId;
        const leave = await leave_service_1.LeaveService.processLeave(req.params.id, tenantId, reviewerId, req.body);
        res.json({ success: true, data: leave });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
exports.processLeaveRequest = processLeaveRequest;
