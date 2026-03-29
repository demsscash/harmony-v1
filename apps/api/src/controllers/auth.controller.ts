import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { getActivePermissions } from './user.controller';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
    try {
        const { email, phone, password } = req.body;
        const identifier = email || phone;
        const tenantId = req.tenant?.id;

        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant context missing' });
            return;
        }

        if (!identifier || !password) {
            res.status(400).json({ success: false, error: 'Email ou téléphone et mot de passe requis' });
            return;
        }

        const result = await AuthService.login(identifier, password, tenantId);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const activePerms = getActivePermissions(result.user.permissions);

        res.json({
            success: true,
            data: {
                accessToken: result.accessToken,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.employee?.firstName,
                    lastName: result.user.employee?.lastName,
                    role: result.user.role,
                    tenantId: result.user.tenantId,
                    tenantSubdomain: req.tenant?.subdomain,
                    employeeId: result.user.employeeId,
                    permissions: activePerms.map(p => p.key),
                }
            }
        });
    } catch (error: any) {
        res.status(401).json({ success: false, error: error.message });
    }
};

export const superAdminLogin = async (req: Request, res: Response) => {
    try {
        const { email, phone, password } = req.body;
        const identifier = email || phone;

        if (!identifier || !password) {
            res.status(400).json({ success: false, error: 'Email ou téléphone et mot de passe requis' });
            return;
        }

        const result = await AuthService.superAdminLogin(identifier, password);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            data: {
                accessToken: result.accessToken,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    role: result.user.role,
                },
            },
        });
    } catch (error: any) {
        res.status(401).json({ success: false, error: error.message });
    }
};


export const refresh = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ success: false, error: 'No refresh token provided' });
            return;
        }

        const result = await AuthService.refreshToken(refreshToken);
        res.json({ success: true, data: { accessToken: result.accessToken } });
    } catch (error: any) {
        res.status(403).json({ success: false, error: error.message });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        if (req.user?.userId) {
            await AuthService.logout(req.user.userId);
        }
        res.clearCookie('refreshToken');
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Logout failed' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    // On répond toujours succès pour ne pas divulguer si l'email existe
    const successResponse = () => res.json({
        success: true,
        message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
    });

    try {
        const { email, phone } = req.body;
        const tenantId = req.tenant?.id;

        if ((!email && !phone) || !tenantId) {
            return successResponse();
        }

        const user = await prisma.user.findFirst({
            where: {
                tenantId,
                isActive: true,
                ...(email ? { email } : { phone }),
            },
            include: { employee: true }
        });

        if (!user) return successResponse();

        // Génère un token sécurisé (32 octets hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

        // Hash le token avant stockage (si DB compromise, token inutilisable)
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: `reset:${hashedToken}:${resetExpiry.toISOString()}` }
        });

        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const resetUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        await EmailService.sendMail(tenantId, {
            to: email,
            subject: 'Réinitialisation de votre mot de passe — Harmony',
            html: `
                <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1e293b; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: white; font-size: 24px; margin: 0;">Harmony</h1>
                        <p style="color: #94a3b8; margin-top: 8px;">${tenant?.name || ''}</p>
                    </div>
                    <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #1e293b; font-size: 20px;">Réinitialisation du mot de passe</h2>
                        <p style="color: #475569;">Bonjour ${user.employee?.firstName || user.email},</p>
                        <p style="color: #475569;">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en créer un nouveau.</p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                Réinitialiser le mot de passe
                            </a>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
                    </div>
                </div>
            `
        }).catch(() => { /* Silence SMTP errors to avoid info leak */ });

        return successResponse();
    } catch {
        return successResponse();
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, email, password } = req.body;

        if (!token || !email || !password || password.length < 8) {
            res.status(400).json({ success: false, error: 'Données invalides' });
            return;
        }

        const user = await prisma.user.findFirst({
            where: { email, isActive: true },
        });

        if (!user || !user.refreshToken?.startsWith('reset:')) {
            res.status(400).json({ success: false, error: 'Lien invalide ou expiré' });
            return;
        }

        // Parse stored reset token: "reset:{token}:{expiry}"
        const parts = user.refreshToken.split(':');
        if (parts.length < 3) {
            res.status(400).json({ success: false, error: 'Lien invalide' });
            return;
        }

        const storedHash = parts[1];
        const expiry = new Date(parts.slice(2).join(':'));

        // Hash incoming token and compare with stored hash (timing-safe)
        const incomingHash = crypto.createHash('sha256').update(token).digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(incomingHash))) {
            res.status(400).json({ success: false, error: 'Token invalide' });
            return;
        }

        if (expiry < new Date()) {
            res.status(400).json({ success: false, error: 'Ce lien a expiré. Veuillez refaire la demande.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                refreshToken: null, // Invalidate reset token
            },
        });

        res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Erreur lors de la réinitialisation' });
    }
};
