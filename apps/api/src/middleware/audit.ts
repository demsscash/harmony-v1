import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditOptions {
    action: string;
    resource: string;
    getResourceId?: (req: Request) => string | undefined;
    getDetails?: (req: Request) => any;
}

export const auditLog = (options: AuditOptions) => {
    return (req: Request, res: Response, next: NextFunction) => {
        res.on('finish', async () => {
            try {
                await prisma.auditLog.create({
                    data: {
                        tenantId: (req as any).tenant?.id || (req as any).user?.tenantId || null,
                        userId: (req as any).user?.userId || null,
                        action: options.action,
                        resource: options.resource,
                        resourceId: options.getResourceId?.(req) || (req.params?.id as string) || null,
                        details: options.getDetails?.(req) || null,
                        ip: req.ip || String(req.headers['x-forwarded-for'] || '') || null,
                        userAgent: req.headers['user-agent'] || null,
                        statusCode: res.statusCode,
                        method: req.method,
                        path: req.originalUrl,
                    },
                });
            } catch (err) {
                console.error('Audit log write failed:', err);
            }
        });
        next();
    };
};
