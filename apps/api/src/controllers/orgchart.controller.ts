import { Request, Response } from 'express';
import { OrgChartService } from '../services/orgchart.service';

export const getUnitsChart = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const data = await OrgChartService.getUnitsTree(tenantId);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getEmployeesChart = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const data = await OrgChartService.getEmployeesTree(tenantId);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
