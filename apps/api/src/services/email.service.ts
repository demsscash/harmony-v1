import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SendMailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    /**
     * Crée un transporteur Nodemailer pour un tenant donné.
     * Priorité : paramètres SMTP du tenant > variables d'environnement globales.
     */
    private static async getTransporter(tenantId: string) {
        const settings = await prisma.tenantSettings.findUnique({
            where: { tenantId }
        });

        const host = settings?.smtpHost || process.env.SMTP_HOST;
        const port = settings?.smtpPort || Number(process.env.SMTP_PORT || 587);
        const user = settings?.smtpUser || process.env.SMTP_USER;
        const pass = settings?.smtpPassword || process.env.SMTP_PASS;

        if (!host || !user || !pass) {
            throw new Error(
                'Configuration SMTP manquante. Veuillez configurer les paramètres SMTP dans les réglages du tenant ou dans les variables d\'environnement.'
            );
        }

        return nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass }
        });
    }

    /**
     * Envoie un email au nom d'un tenant.
     */
    static async sendMail(tenantId: string, options: SendMailOptions): Promise<void> {
        const transporter = await EmailService.getTransporter(tenantId);
        const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } });
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

        const fromEmail = settings?.smtpFromEmail || process.env.SMTP_FROM_EMAIL || 'noreply@harmony-rh.com';
        const fromName = settings?.smtpFromName || tenant?.name || 'Harmony';

        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        });
    }

    // ==========================================
    // TEMPLATES D'EMAILS PRÉFABRIQUÉS
    // ==========================================

    /** Notifie un employé lors de la validation de sa demande de congé */
    static async sendLeaveApprovalNotification(tenantId: string, employeeEmail: string, employeeName: string, type: string, startDate: Date, endDate: Date) {
        if (!employeeEmail) return;

        const fmt = (d: Date) => new Date(d).toLocaleDateString('fr-FR');

        await EmailService.sendMail(tenantId, {
            to: employeeEmail,
            subject: `✅ Votre demande de congé a été approuvée`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9fafb; padding: 24px; border-radius: 8px;">
                    <h2 style="color: #059669;">Demande de congé approuvée ✅</h2>
                    <p>Bonjour <strong>${employeeName}</strong>,</p>
                    <p>Votre demande de congé de type <strong>${type}</strong> du <strong>${fmt(startDate)}</strong> au <strong>${fmt(endDate)}</strong> a été <span style="color:#059669;font-weight:bold;">approuvée</span>.</p>
                    <p>Bonne vacances !</p>
                    <hr/>
                    <p style="color:#94a3b8;font-size:12px;">Ce message est envoyé automatiquement par Harmony. Ne pas répondre.</p>
                </div>
            `
        });
    }

    /** Notifie un employé lors du refus de sa demande de congé */
    static async sendLeaveRejectionNotification(tenantId: string, employeeEmail: string, employeeName: string, type: string, reason?: string) {
        if (!employeeEmail) return;

        await EmailService.sendMail(tenantId, {
            to: employeeEmail,
            subject: `❌ Votre demande de congé a été refusée`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9fafb; padding: 24px; border-radius: 8px;">
                    <h2 style="color: #dc2626;">Demande de congé refusée ❌</h2>
                    <p>Bonjour <strong>${employeeName}</strong>,</p>
                    <p>Votre demande de congé de type <strong>${type}</strong> a malheureusement été <span style="color:#dc2626;font-weight:bold;">refusée</span>.</p>
                    ${reason ? `<p><strong>Motif :</strong> ${reason}</p>` : ''}
                    <p>Pour plus d'informations, contactez votre responsable RH.</p>
                    <hr/>
                    <p style="color:#94a3b8;font-size:12px;">Ce message est envoyé automatiquement par Harmony. Ne pas répondre.</p>
                </div>
            `
        });
    }

    /** Email de bienvenue lors de la création d'un compte employé */
    static async sendWelcomeEmail(tenantId: string, employeeEmail: string, employeeName: string, loginEmail: string, temporaryPassword: string) {
        await EmailService.sendMail(tenantId, {
            to: employeeEmail,
            subject: `🎉 Bienvenue sur le portail RH de votre entreprise`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9fafb; padding: 24px; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Bienvenue dans l'équipe ! 🎉</h2>
                    <p>Bonjour <strong>${employeeName}</strong>,</p>
                    <p>Votre compte sur le portail employé Harmony a été créé. Voici vos identifiants de connexion :</p>
                    <div style="background:#eff6ff;border-radius:6px;padding:16px;margin:16px 0;">
                        <p style="margin:0;"><strong>Email :</strong> ${loginEmail}</p>
                        <p style="margin:8px 0 0;"><strong>Mot de passe temporaire :</strong> ${temporaryPassword}</p>
                    </div>
                    <p style="color:#ef4444;">⚠️ Veuillez changer votre mot de passe dès votre première connexion.</p>
                    <hr/>
                    <p style="color:#94a3b8;font-size:12px;">Ce message est envoyé automatiquement par Harmony. Ne pas répondre.</p>
                </div>
            `
        });
    }

    /** Rappel de fin de contrat pour les RH */
    static async sendContractExpiryAlert(tenantId: string, hrEmail: string, employees: { name: string; contractEnd: Date; daysLeft: number }[]) {
        if (!hrEmail || employees.length === 0) return;

        const rows = employees.map(e =>
            `<tr>
                <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${e.name}</td>
                <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${new Date(e.contractEnd).toLocaleDateString('fr-FR')}</td>
                <td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#ef4444;font-weight:bold;">${e.daysLeft} jours</td>
            </tr>`
        ).join('');

        await EmailService.sendMail(tenantId, {
            to: hrEmail,
            subject: `⚠️ Rappel : ${employees.length} contrat(s) expirant bientôt`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                    <h2 style="color:#f59e0b;">⚠️ Contrats arrivant à expiration</h2>
                    <p>Les contrats suivants expirent dans moins de 30 jours :</p>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                        <thead><tr>
                            <th style="text-align:left;padding:8px;background:#f8fafc;">Employé</th>
                            <th style="text-align:left;padding:8px;background:#f8fafc;">Fin de contrat</th>
                            <th style="text-align:left;padding:8px;background:#f8fafc;">Jours restants</th>
                        </tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <p style="margin-top:16px;">Veuillez prendre les mesures nécessaires (renouvellement ou fin de contrat).</p>
                    <hr/>
                    <p style="color:#94a3b8;font-size:12px;">Harmony — Message automatique.</p>
                </div>
            `
        });
    }
}
