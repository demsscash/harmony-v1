"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantResolver = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const tenantResolver = async (req, res, next) => {
    try {
        const host = req.headers.host;
        if (!host) {
            res.status(400).json({ success: false, error: 'Host header is missing' });
            return;
        }
        // Usually domain structure is subdomain.harmony-rh.com
        // For local dev, maybe localhost:3001 or demo.localhost:3001
        const parts = host.split('.');
        // Simplification for local / dev: 
        // If it's just 'localhost:3001', we'll default to the 'demo' tenant or reject.
        let subdomain = parts[0];
        // If running strictly on localhost:3001
        if (subdomain.includes('localhost') || subdomain === '127') {
            subdomain = 'demo'; // fallback for dev
        }
        else {
            // In production (e.g., demo.harmony-rh.com)
            // subdomain is `parts[0]` which is 'demo'
            // Example demo.localhost:3001 -> parts[0] is 'demo'
            subdomain = parts[0];
        }
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain },
        });
        if (!tenant) {
            res.status(404).json({ success: false, error: 'Tenant not found' });
            return;
        }
        if (!tenant.isActive) {
            res.status(403).json({ success: false, error: 'Tenant account is inactive' });
            return;
        }
        req.tenant = tenant;
        next();
    }
    catch (error) {
        console.error('Tenant resolution error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error during tenant resolution' });
    }
};
exports.tenantResolver = tenantResolver;
