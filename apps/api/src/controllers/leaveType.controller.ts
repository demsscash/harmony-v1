import { Request, Response } from 'express';
import { LeaveTypeService } from '../services/leaveType.service';

export const getLeaveTypes = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const leaveTypes = await LeaveTypeService.getAll(tenantId);
        res.json({ success: true, data: leaveTypes });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getLeaveTypeById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const leaveType = await LeaveTypeService.getById(req.params.id as string, tenantId);

        if (!leaveType) {
            res.status(404).json({ success: false, error: 'Type de congé non trouvé' });
            return;
        }

        res.json({ success: true, data: leaveType });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createLeaveType = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const leaveType = await LeaveTypeService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: leaveType });
    } catch (error: any) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateLeaveType = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const leaveType = await LeaveTypeService.update(req.params.id as string, tenantId, req.body);
        res.json({ success: true, data: leaveType });
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

export const deleteLeaveType = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await LeaveTypeService.delete(req.params.id as string, tenantId);
        res.json({ success: true, message: 'Type de congé supprimé avec succès' });
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
