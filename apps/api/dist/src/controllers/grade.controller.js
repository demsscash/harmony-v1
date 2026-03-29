"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGrade = exports.updateGrade = exports.createGrade = exports.getGradeById = exports.getGrades = void 0;
const grade_service_1 = require("../services/grade.service");
const getGrades = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const grades = await grade_service_1.GradeService.getAll(tenantId);
        res.json({ success: true, data: grades });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getGrades = getGrades;
const getGradeById = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const grade = await grade_service_1.GradeService.getById(req.params.id, tenantId);
        if (!grade) {
            res.status(404).json({ success: false, error: 'Grade non trouvé' });
            return;
        }
        res.json({ success: true, data: grade });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getGradeById = getGradeById;
const createGrade = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const grade = await grade_service_1.GradeService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: grade });
    }
    catch (error) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createGrade = createGrade;
const updateGrade = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        const grade = await grade_service_1.GradeService.update(req.params.id, tenantId, req.body);
        res.json({ success: true, data: grade });
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
exports.updateGrade = updateGrade;
const deleteGrade = async (req, res) => {
    try {
        const tenantId = req.tenant?.id;
        await grade_service_1.GradeService.delete(req.params.id, tenantId);
        res.json({ success: true, message: 'Grade supprimé avec succès' });
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
exports.deleteGrade = deleteGrade;
