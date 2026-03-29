import { Request, Response } from 'express';
import { MonitoringService } from '../services/monitoring.service';

export const getHealth = async (req: Request, res: Response) => {
    try {
        const health = await MonitoringService.getHealthCheck();
        res.json({ success: true, data: health });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getMetrics = async (req: Request, res: Response) => {
    try {
        const metrics = MonitoringService.getMetrics();
        res.json({ success: true, data: metrics });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const { tenantId, userId, action, from, to, page, limit } = req.query;
        const result = await MonitoringService.getAuditLogs({
            tenantId: tenantId as string,
            userId: userId as string,
            action: action as string,
            from: from as string,
            to: to as string,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 20,
        });
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getTenantsHealth = async (req: Request, res: Response) => {
    try {
        const data = await MonitoringService.getTenantsHealth();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
