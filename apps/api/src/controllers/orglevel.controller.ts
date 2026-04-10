import { Request, Response } from 'express';
import { OrgLevelService } from '../services/orglevel.service';

export const getOrgLevels = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const levels = await OrgLevelService.getAll(tenantId);
        res.json({ success: true, data: levels });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getOrgLevelById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const level = await OrgLevelService.getById(String(req.params.id), tenantId);
        if (!level) {
            res.status(404).json({ success: false, error: 'Niveau introuvable' });
            return;
        }
        res.json({ success: true, data: level });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createOrgLevel = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { name, rank, description } = req.body;
        if (!name || rank === undefined) {
            res.status(400).json({ success: false, error: 'Nom et rang requis' });
            return;
        }
        const level = await OrgLevelService.create(tenantId, { name, rank: Number(rank), description });
        res.status(201).json({ success: true, data: level });
    } catch (error: any) {
        if (error.message.includes('déjà utilisé')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateOrgLevel = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { name, rank, description } = req.body;
        const level = await OrgLevelService.update(String(req.params.id), tenantId, {
            name, rank: rank !== undefined ? Number(rank) : undefined, description,
        });
        res.json({ success: true, data: level });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        if (error.message.includes('déjà utilisé')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteOrgLevel = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await OrgLevelService.delete(String(req.params.id), tenantId);
        res.json({ success: true, message: 'Niveau supprimé' });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        if (error.message.includes('Impossible')) {
            res.status(400).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getOrgChart = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const chart = await OrgLevelService.getOrgChart(tenantId);
        res.json({ success: true, data: chart });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
