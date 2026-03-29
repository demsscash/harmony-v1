import { Request, Response, NextFunction } from 'express';
import { metricsStore } from '../services/metrics.service';

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const start = process.hrtime.bigint();

        res.on('finish', () => {
            try {
                const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
                metricsStore.record({
                    timestamp: Date.now(),
                    method: req.method,
                    path: req.route?.path || req.path,
                    statusCode: res.statusCode,
                    responseTimeMs: Math.round(durationMs * 100) / 100,
                    tenantId: (req as any).tenant?.id || null,
                });
            } catch (err) {
                console.error('Performance middleware (finish event) error:', err);
            }
        });

        next();
    } catch (err) {
        console.error('Performance middleware error:', err);
        next();
    }
};
