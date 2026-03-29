import { Request, Response } from 'express';
import { OvertimeService } from '../services/overtime.service';

export const getOvertimeConfig = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const config = await OvertimeService.getConfig(tenantId);
        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateOvertimeConfig = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { tiers } = req.body;
        if (!tiers || !Array.isArray(tiers)) {
            res.status(400).json({ success: false, error: 'Tiers requis (tableau)' });
            return;
        }
        const config = await OvertimeService.upsertConfig(tenantId, tiers);
        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getOvertimes = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { employeeId, month, year } = req.query;
        const records = await OvertimeService.getAll(tenantId, {
            employeeId: employeeId as string,
            month: month ? Number(month) : undefined,
            year: year ? Number(year) : undefined,
        });
        res.json({ success: true, data: records });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getOvertimeById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const record = await OvertimeService.getById(String(req.params.id), tenantId);
        if (!record) {
            res.status(404).json({ success: false, error: 'Enregistrement introuvable' });
            return;
        }
        res.json({ success: true, data: record });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createOvertime = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const record = await OvertimeService.create(tenantId, {
            ...req.body,
            recordedBy: req.user?.userId,
        });
        res.status(201).json({ success: true, data: record });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateOvertime = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const record = await OvertimeService.update(String(req.params.id), tenantId, req.body);
        res.json({ success: true, data: record });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteOvertime = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await OvertimeService.delete(String(req.params.id), tenantId);
        res.json({ success: true, message: 'Supprimé' });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};
