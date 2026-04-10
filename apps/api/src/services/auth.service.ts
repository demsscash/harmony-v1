import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '1h';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const REFRESH_EXPIRES_IN = '30d';

export class AuthService {
    static async login(identifier: string, password: string, tenantId: string) {
        // Détecte si l'identifiant est un email ou un numéro de téléphone
        const isEmail = identifier.includes('@');

        let user;
        if (isEmail) {
            user = await prisma.user.findUnique({
                where: { tenantId_email: { tenantId, email: identifier } },
                include: { employee: { select: { firstName: true, lastName: true } } },
            });
        } else {
            user = await prisma.user.findUnique({
                where: { tenantId_phone: { tenantId, phone: identifier } },
                include: { employee: { select: { firstName: true, lastName: true } } },
            });
        }

        if (!user || !user.isActive) {
            throw new Error('Identifiants invalides');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        const payload = {
            userId: user.id,
            tenantId: user.tenantId,
            role: user.role,
            employeeId: user.employeeId,
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                refreshToken,
            },
        });

        return { user, accessToken, refreshToken };
    }

    // Super Admin login — no tenant context needed, verifies SUPER_ADMIN role
    static async superAdminLogin(identifier: string, password: string) {
        const isEmail = identifier.includes('@');

        const user = await prisma.user.findFirst({
            where: {
                ...(isEmail ? { email: identifier } : { phone: identifier }),
                role: 'SUPER_ADMIN',
                isActive: true,
            },
        });

        if (!user) {
            throw new Error('Identifiants invalides ou accès non autorisé');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Identifiants invalides');
        }

        const payload = {
            userId: user.id,
            tenantId: null,
            role: user.role,
            employeeId: user.employeeId,
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date(), refreshToken },
        });

        return { user, accessToken, refreshToken };
    }


    static async refreshToken(token: string) {
        try {
            const decoded = jwt.verify(token, REFRESH_SECRET) as any;
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

            const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            return { accessToken };
        } catch (e) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    static async logout(userId: string) {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }
}
