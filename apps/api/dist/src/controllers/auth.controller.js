"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant context missing' });
            return;
        }
        const result = await auth_service_1.AuthService.login(email, password, tenantId);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        res.json({
            success: true,
            data: {
                accessToken: result.accessToken,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    role: result.user.role,
                }
            }
        });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ success: false, error: 'No refresh token provided' });
            return;
        }
        const result = await auth_service_1.AuthService.refreshToken(refreshToken);
        res.json({ success: true, data: { accessToken: result.accessToken } });
    }
    catch (error) {
        res.status(403).json({ success: false, error: error.message });
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    try {
        if (req.user?.userId) {
            await auth_service_1.AuthService.logout(req.user.userId);
        }
        res.clearCookie('refreshToken');
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Logout failed' });
    }
};
exports.logout = logout;
