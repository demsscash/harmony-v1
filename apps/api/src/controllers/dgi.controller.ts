import { Request, Response } from 'express';
import { DgiService } from '../services/dgi.service';

export class DgiController {
    static async generateITS(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const { month, year, gta } = req.query;

            if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant non spécifié' });
            if (!month || !year) return res.status(400).json({ success: false, error: 'Mois et année requis' });

            const isGTA = gta === 'true';
            const buffer = isGTA
                ? await DgiService.generateITS_GTA(tenantId, Number(month), Number(year))
                : await DgiService.generateITS(tenantId, Number(month), Number(year));

            const variant = isGTA ? '_GTA' : '';
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="Declaration_ITS${variant}_${month}_${year}.xlsx"`);
            // Pour l'envoi de fichier Excel, on envoie directement le buffer binaire
            res.send(buffer);
        } catch (error: any) {
            console.error('Erreur generateITS:', error);
            res.status(400).json({ success: false, error: error.message || 'Erreur lors de la génération ITS' });
        }
    }

    static async generateDAS(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const { year, gta } = req.query;

            if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant non spécifié' });
            if (!year) return res.status(400).json({ success: false, error: 'Année requise' });

            const isGTA = gta === 'true';
            const buffer = isGTA
                ? await DgiService.generateDAS_GTA(tenantId, Number(year))
                : await DgiService.generateDAS(tenantId, Number(year));

            const variant = isGTA ? '_GTA' : '';
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="Declaration_DAS${variant}_${year}.xlsx"`);
            res.send(buffer);
        } catch (error: any) {
            console.error('Erreur generateDAS:', error);
            res.status(400).json({ success: false, error: error.message || 'Erreur lors de la génération DAS' });
        }
    }

    static async generateTaxeApprentissage(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const { year } = req.query;

            if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant non spécifié' });
            if (!year) return res.status(400).json({ success: false, error: 'Année requise' });

            const buffer = await DgiService.generateTaxeApprentissage(tenantId, Number(year));

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="Declaration_Taxe_Apprentissage_${year}.xlsx"`);
            res.send(buffer);
        } catch (error: any) {
            console.error('Erreur generateDAS:', error);
            res.status(400).json({ success: false, error: error.message || 'Erreur lors de la génération DAS' });
        }
    }
}
