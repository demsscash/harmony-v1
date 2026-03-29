import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export const requireRole = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'User is not authenticated' });
            return;
        }

        // SUPER_ADMIN has access to everything
        if (req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, error: 'Insufficient permissions' });
            return;
        }

        next();
    };
};
