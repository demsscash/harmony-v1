import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const stats = await ReportsService.getDashboardStats(tenantId);
        res.json({ success: true, data: stats });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getPayrollHistory = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const months = req.query.months ? Number(req.query.months) : 12;
        const history = await ReportsService.getPayrollHistory(tenantId, months);
        res.json({ success: true, data: history });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getTurnover = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
        const turnover = await ReportsService.getTurnover(tenantId, year);
        res.json({ success: true, data: turnover });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
