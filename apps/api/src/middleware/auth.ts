import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];

    // Format is "Bearer <token>"
    // Also accept ?token= query param for window.open() PDF links (browser can't set headers)
    const token = (authHeader && authHeader.split(' ')[1]) ||
        (req.query.token ? String(req.query.token) : null);

    if (!token) {
        res.status(401).json({ success: false, error: 'Access token is missing' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            // Return 401 (not 403) so the Axios interceptor can trigger the refresh flow
            res.status(401).json({ success: false, error: 'Invalid or expired token' });
            return;
        }

        req.user = decoded as any;

        // Cross-check with matched tenant if tenantResolver was called before
        if (req.tenant && req.user && req.user.tenantId !== req.tenant.id) {
            // SUPER_ADMIN is potentially global, but otherwise restrict
            if (req.user.role !== 'SUPER_ADMIN') {
                res.status(403).json({ success: false, error: 'Token does not match current tenant context' });
                return;
            }
        }

        next();
    });
};
