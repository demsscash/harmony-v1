import { Request, Response } from 'express';
import { PayrollService } from '../services/payroll.service';

export const getPayrolls = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const payrolls = await PayrollService.getAll(tenantId);
        res.json({ success: true, data: payrolls });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getPayrollById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const payroll = await PayrollService.getById(req.params.id as string, tenantId);

        if (!payroll) {
            res.status(404).json({ success: false, error: 'Campagne de paie non trouvée' });
            return;
        }

        res.json({ success: true, data: payroll });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createPayroll = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const payroll = await PayrollService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: payroll });
    } catch (error: any) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updatePayroll = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { month, year } = req.body;
        const payroll = await PayrollService.update(String(req.params.id), tenantId, { month, year });
        res.json({ success: true, data: payroll });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        if (error.message.includes('existe déjà') || error.message.includes('non brouillon')) {
            res.status(400).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updatePayrollStatus = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const userId = req.user?.userId!;

        const payroll = await PayrollService.updateStatus(req.params.id as string, tenantId, userId, req.body);
        res.json({ success: true, data: payroll });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const generatePayslips = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const result = await PayrollService.generatePayslips(req.params.id as string, tenantId);
        res.json({ success: true, data: result, message: `Génération de ${result.count} bulletins réussie.` });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const deletePayroll = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await PayrollService.delete(req.params.id as string, tenantId);
        res.json({ success: true, message: 'Campagne de paie supprimée avec succès' });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(400).json({ success: false, error: error.message });
    }
};
