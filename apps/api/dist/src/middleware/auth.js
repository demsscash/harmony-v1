"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'harmony_super_secret_for_jwt_auth_123!';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('[Auth Middleware] Headers:', req.headers);
    console.log('[Auth Middleware] Authorization Header:', authHeader);
    // Format is "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];
    console.log('[Auth Middleware] Extracted Token:', token ? 'Exists' : 'Missing');
    if (!token) {
        res.status(401).json({ success: false, error: 'Access token is missing' });
        return;
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(403).json({ success: false, error: 'Invalid or expired token' });
            return;
        }
        req.user = decoded;
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
exports.authenticateToken = authenticateToken;
