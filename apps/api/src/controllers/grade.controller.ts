import { Request, Response } from 'express';
import { GradeService } from '../services/grade.service';

export const getGrades = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const grades = await GradeService.getAll(tenantId);
        res.json({ success: true, data: grades });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getGradeById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const grade = await GradeService.getById(req.params.id as string, tenantId);

        if (!grade) {
            res.status(404).json({ success: false, error: 'Grade non trouvé' });
            return;
        }

        res.json({ success: true, data: grade });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createGrade = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const grade = await GradeService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: grade });
    } catch (error: any) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateGrade = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const grade = await GradeService.update(req.params.id as string, tenantId, req.body);
        res.json({ success: true, data: grade });
    } catch (error: any) {
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

export const deleteGrade = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await GradeService.delete(req.params.id as string, tenantId);
        res.json({ success: true, message: 'Grade supprimé avec succès' });
    } catch (error: any) {
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
