"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'harmony_super_secret_for_jwt_auth_123!';
const JWT_EXPIRES_IN = '15m';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'harmony_refresh_secret_123!';
const REFRESH_EXPIRES_IN = '7d';
class AuthService {
    static async login(email, password, tenantId) {
        const user = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email } },
        });
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials or inactive user');
        }
        const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
            employeeId: user.employeeId,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                refreshToken,
            },
        });
        return { user, accessToken, refreshToken };
    }
    static async refreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user || user.refreshToken !== token || !user.isActive) {
                throw new Error('Invalid refresh token');
            }
            const payload = {
                userId: user.id,
                tenantId: user.tenantId,
                role: user.role,
                employeeId: user.employeeId,
            };
            const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            return { accessToken };
        }
        catch (e) {
            throw new Error('Invalid or expired refresh token');
        }
    }
    static async logout(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }
}
exports.AuthService = AuthService;
