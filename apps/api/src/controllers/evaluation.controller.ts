import { Request, Response } from 'express';
import { EvaluationService } from '../services/evaluation.service';

export class EvaluationController {
    // ─── CAMPAIGNS ────────────────────────────────────────

    static async getCampaigns(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const campaigns = await EvaluationService.getCampaigns(tenantId);
            res.json({ success: true, data: campaigns });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async getCampaignById(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const id = req.params.id as string;
            const campaign = await EvaluationService.getCampaignById(tenantId, id);
            if (!campaign) return res.status(404).json({ success: false, error: 'Campagne non trouvée' });
            res.json({ success: true, data: campaign });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async createCampaign(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const campaign = await EvaluationService.createCampaign(tenantId, req.body);
            res.status(201).json({ success: true, data: campaign });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async updateCampaign(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const id = req.params.id as string;
            const campaign = await EvaluationService.updateCampaign(tenantId, id, req.body);
            res.json({ success: true, data: campaign });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async launchCampaign(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const id = req.params.id as string;
            const { employeeIds } = req.body;
            if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
                res.status(400).json({ success: false, error: 'employeeIds requis' });
                return;
            }
            const result = await EvaluationService.launchCampaign(tenantId, id, employeeIds);
            res.json({ success: true, data: result });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async closeCampaign(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const id = req.params.id as string;
            const campaign = await EvaluationService.closeCampaign(tenantId, id);
            res.json({ success: true, data: campaign });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async deleteCampaign(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const id = req.params.id as string;
            await EvaluationService.deleteCampaign(tenantId, id);
            res.json({ success: true, data: { message: 'Campagne supprimée' } });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getCampaignStats(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const id = req.params.id as string;
            const stats = await EvaluationService.getCampaignStats(tenantId, id);
            res.json({ success: true, data: stats });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    // ─── EVALUATIONS ──────────────────────────────────────

    static async getEvaluations(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const evaluations = await EvaluationService.getEvaluations(tenantId, {
                campaignId: req.query.campaignId as string | undefined,
                employeeId: req.query.employeeId as string | undefined,
                status: req.query.status as string | undefined,
            });
            res.json({ success: true, data: evaluations });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async getEvaluationById(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const id = req.params.id as string;
            const evaluation = await EvaluationService.getEvaluationById(tenantId, id);
            if (!evaluation) return res.status(404).json({ success: false, error: 'Évaluation non trouvée' });
            res.json({ success: true, data: evaluation });
        } catch (err: any) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    static async submitEvaluation(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const id = req.params.id as string;
            const evaluation = await EvaluationService.submitEvaluation(tenantId, id, req.body);
            res.json({ success: true, data: evaluation });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }
}
