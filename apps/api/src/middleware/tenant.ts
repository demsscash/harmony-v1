import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const tenantResolver = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let subdomain: string | null = null;

        // 1. Priority: explicit header sent by frontend (works on localhost + production)
        const tenantHeader = req.headers['x-tenant-subdomain'] as string;
        if (tenantHeader && tenantHeader.trim()) {
            subdomain = tenantHeader.trim();
        }

        // 2. Query param fallback — used for window.open PDF links (no headers possible)
        if (!subdomain && req.query.tenant) {
            subdomain = String(req.query.tenant).trim();
        }

        // 3. Fallback: parse from Host header (production multi-domain setup)
        if (!subdomain) {
            const host = req.headers.host || '';
            const parts = host.split('.');
            if (!host.includes('localhost') && !host.startsWith('127') && parts.length >= 2) {
                subdomain = parts[0];
            }
        }

        if (!subdomain) {
            res.status(400).json({ success: false, error: 'Tenant subdomain not provided. Use X-Tenant-Subdomain header.' });
            return;
        }

        const tenant = await prisma.tenant.findUnique({ where: { subdomain } });

        if (!tenant) {
            res.status(404).json({ success: false, error: `Tenant "${subdomain}" not found` });
            return;
        }

        if (!tenant.isActive) {
            res.status(403).json({ success: false, error: 'Tenant account is suspended' });
            return;
        }

        req.tenant = tenant;
        next();
    } catch (error) {
        console.error('Tenant resolution error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error during tenant resolution' });
    }
};
