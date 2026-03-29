import { Request, Response } from 'express';
import { AllowanceService } from '../services/allowance.service';

export const getAllowances = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const allowances = await AllowanceService.getAll(tenantId);
        res.json({ success: true, data: allowances });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllowanceById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const allowance = await AllowanceService.getById(req.params.id as string, tenantId);

        if (!allowance) {
            res.status(404).json({ success: false, error: 'Avantage non trouvé' });
            return;
        }

        res.json({ success: true, data: allowance });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createAllowance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const allowance = await AllowanceService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: allowance });
    } catch (error: any) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateAllowance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const allowance = await AllowanceService.update(req.params.id as string, tenantId, req.body);
        res.json({ success: true, data: allowance });
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

export const deleteAllowance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await AllowanceService.delete(req.params.id as string, tenantId);
        res.json({ success: true, message: 'Avantage supprimé avec succès' });
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

export const assignToGrade = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { gradeId, allowanceId } = req.params;
        const { amountOverride } = req.body;

        const assignment = await AllowanceService.assignToGrade(gradeId as string, allowanceId as string, tenantId, amountOverride);
        res.json({ success: true, data: assignment });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const removeFromGrade = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { gradeId, allowanceId } = req.params;

        await AllowanceService.removeFromGrade(gradeId as string, allowanceId as string, tenantId);
        res.json({ success: true, message: 'Avantage retiré du grade avec succès' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
}
