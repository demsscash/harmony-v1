import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Jours fériés mauritaniens par défaut
const MAURITANIAN_DEFAULTS = [
    { name: "Nouvel An", month: 1, day: 1 },
    { name: "Fête du Travail", month: 5, day: 1 },
    { name: "Journée de l'Afrique", month: 5, day: 25 },
    { name: "Anniversaire de l'Armée", month: 7, day: 10 },
    { name: "Fête de l'Indépendance", month: 11, day: 28 },
    { name: "Retrait des forces coloniales", month: 12, day: 12 },
];

export const getHolidays = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const holidays = await prisma.holiday.findMany({
            where: { tenantId },
            orderBy: { date: 'asc' },
        });
        res.json({ success: true, data: holidays });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const createHoliday = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { name, date, isRecurring } = req.body;

        if (!name || !date) {
            res.status(400).json({ success: false, error: 'Nom et date requis' });
            return;
        }

        const holiday = await prisma.holiday.create({
            data: {
                tenantId,
                name,
                date: new Date(date),
                isRecurring: isRecurring ?? true,
            },
        });
        res.status(201).json({ success: true, data: holiday });
    } catch (err: any) {
        if (err.code === 'P2002') {
            res.status(409).json({ success: false, error: 'Un jour férié existe déjà à cette date' });
            return;
        }
        res.status(500).json({ success: false, error: err.message });
    }
};

export const updateHoliday = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const id = String(req.params.id);
        const { name, date, isRecurring } = req.body;

        const existing = await prisma.holiday.findFirst({ where: { id, tenantId } });
        if (!existing) {
            res.status(404).json({ success: false, error: 'Jour férié introuvable' });
            return;
        }

        const holiday = await prisma.holiday.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(date !== undefined && { date: new Date(date) }),
                ...(isRecurring !== undefined && { isRecurring }),
            },
        });
        res.json({ success: true, data: holiday });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const deleteHoliday = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const id = String(req.params.id);

        const existing = await prisma.holiday.findFirst({ where: { id, tenantId } });
        if (!existing) {
            res.status(404).json({ success: false, error: 'Jour férié introuvable' });
            return;
        }

        await prisma.holiday.delete({ where: { id } });
        res.json({ success: true, message: 'Jour férié supprimé' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const seedDefaults = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const year = new Date().getFullYear();
        let created = 0;

        for (const h of MAURITANIAN_DEFAULTS) {
            const date = new Date(year, h.month - 1, h.day);
            try {
                await prisma.holiday.create({
                    data: { tenantId, name: h.name, date, isRecurring: true },
                });
                created++;
            } catch {
                // Skip duplicates
            }
        }

        res.json({ success: true, message: `${created} jour(s) férié(s) ajouté(s)` });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};
