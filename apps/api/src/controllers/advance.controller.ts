import { Request, Response } from 'express';
import { AdvanceService } from '../services/advance.service';

export const getAdvances = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { employeeId, status, month, year } = req.query;

        // EMPLOYEE can only see their own
        const filters: any = {
            employeeId: employeeId as string,
            status: status as string,
            month: month ? Number(month) : undefined,
            year: year ? Number(year) : undefined,
        };

        if (req.user?.role === 'EMPLOYEE') {
            filters.employeeId = req.user.employeeId;
        }

        const advances = await AdvanceService.getAll(tenantId, filters);
        res.json({ success: true, data: advances });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAdvanceById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const advance = await AdvanceService.getById(String(req.params.id), tenantId);
        if (!advance) {
            res.status(404).json({ success: false, error: 'Acompte introuvable' });
            return;
        }

        // EMPLOYEE can only view their own
        if (req.user?.role === 'EMPLOYEE' && advance.employeeId !== req.user.employeeId) {
            res.status(403).json({ success: false, error: 'Accès non autorisé' });
            return;
        }

        res.json({ success: true, data: advance });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createAdvance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        let { employeeId, amount, reason } = req.body;

        // EMPLOYEE can only request for themselves
        if (req.user?.role === 'EMPLOYEE') {
            employeeId = req.user.employeeId;
        }

        if (!employeeId || !amount || amount <= 0) {
            res.status(400).json({ success: false, error: 'Employé et montant requis' });
            return;
        }

        const advance = await AdvanceService.create(tenantId, { employeeId, amount, reason });
        res.status(201).json({ success: true, data: advance });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        if (error.message.includes('dépasser') || error.message.includes('en attente')) {
            res.status(400).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const approveAdvance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const advance = await AdvanceService.approve(String(req.params.id), tenantId, req.user?.userId!);
        res.json({ success: true, data: advance });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(400).json({ success: false, error: error.message });
    }
};

export const rejectAdvance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { reason } = req.body;
        const advance = await AdvanceService.reject(String(req.params.id), tenantId, req.user?.userId!, reason);
        res.json({ success: true, data: advance });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(400).json({ success: false, error: error.message });
    }
};
