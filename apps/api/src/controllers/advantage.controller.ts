import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Récupérer tous les avantages (tenant scoped)
export const getAdvantages = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const advantages = await prisma.advantage.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: { grades: true, employees: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({ success: true, data: advantages });
    } catch (error: any) {
        console.error('GetAdvantages error:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des avantages' });
    }
};

// Récupérer un avantage
export const getAdvantageById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const tenantId = req.tenant?.id;

        const advantage = await prisma.advantage.findFirst({
            where: { id, tenantId },
            include: { grades: true }
        });

        if (!advantage) {
            return res.status(404).json({ success: false, error: 'Avantage introuvable' });
        }

        res.json({ success: true, data: advantage });
    } catch (error: any) {
        console.error('GetAdvantageById error:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération de l\'avantage' });
    }
};

// Créer un avantage
export const createAdvantage = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const { name, type, amount, isPercentage, isTaxable, description } = req.body;

        const existing = await prisma.advantage.findUnique({
            where: { tenantId_name: { tenantId, name } }
        });

        if (existing) {
            return res.status(409).json({ success: false, error: 'Un avantage avec ce nom existe déjà' });
        }

        const advantage = await prisma.advantage.create({
            data: {
                tenantId,
                name,
                type,
                amount: amount ? Number(amount) : null,
                isPercentage: Boolean(isPercentage),
                isTaxable: Boolean(isTaxable),
                description
            }
        });

        res.status(201).json({ success: true, data: advantage });
    } catch (error: any) {
        console.error('CreateAdvantage error:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la création de l\'avantage' });
    }
};

// Modifier un avantage
export const updateAdvantage = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const { name, type, amount, isPercentage, isTaxable, description } = req.body;

        if (name) {
            const existing = await prisma.advantage.findFirst({
                where: {
                    tenantId,
                    name,
                    id: { not: id }
                }
            });

            if (existing) {
                return res.status(409).json({ success: false, error: 'Un avantage avec ce nom existe déjà' });
            }
        }

        const existing_advantage = await prisma.advantage.findFirst({
            where: { id, tenantId }
        });

        if (!existing_advantage) {
            return res.status(404).json({ success: false, error: 'Avantage introuvable' });
        }

        const updated = await prisma.advantage.update({
            where: { id },
            data: {
                name,
                type,
                amount: amount !== undefined ? (amount ? Number(amount) : null) : undefined,
                isPercentage: isPercentage !== undefined ? Boolean(isPercentage) : undefined,
                isTaxable: isTaxable !== undefined ? Boolean(isTaxable) : undefined,
                description
            }
        });

        res.json({ success: true, data: updated });
    } catch (error: any) {
        console.error('UpdateAdvantage error:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la modification de l\'avantage' });
    }
};

// Supprimer un avantage
export const deleteAdvantage = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const advantage = await prisma.advantage.findFirst({
            where: { id, tenantId }
        });

        if (!advantage) {
            return res.status(404).json({ success: false, error: 'Avantage introuvable' });
        }

        await prisma.advantage.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Avantage supprimé avec succès' });
    } catch (error: any) {
        console.error('DeleteAdvantage error:', error);
        res.status(500).json({ success: false, error: 'Impossible de supprimer cet avantage, il est peut-être lié à un grade ou employé' });
    }
};
