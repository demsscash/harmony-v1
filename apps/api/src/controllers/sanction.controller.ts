import { Request, Response } from 'express';
import { SanctionService } from '../services/sanction.service';

export const getSanctions = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { employeeId, status, type } = req.query;
        const sanctions = await SanctionService.getAll(tenantId, {
            employeeId: employeeId as string,
            status: status as string,
            type: type as string,
        });
        res.json({ success: true, data: sanctions });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getSanctionById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const sanction = await SanctionService.getById(String(req.params.id), tenantId);
        if (!sanction) {
            res.status(404).json({ success: false, error: 'Sanction introuvable' });
            return;
        }
        res.json({ success: true, data: sanction });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createSanction = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const userId = req.user?.userId!;
        const { employeeId, type, reason, comment, date, advantageId, deductionAmount } = req.body;

        if (!employeeId || !type || !reason || !date || deductionAmount === undefined) {
            res.status(400).json({ success: false, error: 'Champs obligatoires manquants' });
            return;
        }

        const sanction = await SanctionService.create(tenantId, userId, {
            employeeId, type, reason, comment, date, advantageId, deductionAmount,
        });
        res.status(201).json({ success: true, data: sanction });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateSanction = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const sanction = await SanctionService.update(String(req.params.id), tenantId, req.body);
        res.json({ success: true, data: sanction });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const archiveSanction = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const sanction = await SanctionService.archive(String(req.params.id), tenantId);
        res.json({ success: true, data: sanction });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteSanction = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await SanctionService.delete(String(req.params.id), tenantId);
        res.json({ success: true, message: 'Sanction supprimée' });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
