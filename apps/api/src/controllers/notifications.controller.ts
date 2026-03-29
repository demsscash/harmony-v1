import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../services/email.service';

const prisma = new PrismaClient();

export class NotificationsController {

    /**
     * GET /api/notifications/cron/expiring-contracts
     * Utilisé par n8n comme source de données (CRON journalier).
     * Renvoie la liste des tenants et leurs contrats expirant dans les 30 jours.
     */
    static async getExpiringContracts(req: Request, res: Response) {
        try {
            const now = new Date();
            const in30Days = new Date();
            in30Days.setDate(now.getDate() + 30);

            // Trouver tous les employés CDD/STAGE dont le contrat expire bientôt
            const employees = await prisma.employee.findMany({
                where: {
                    status: 'ACTIVE',
                    contractType: { in: ['CDD', 'STAGE', 'PRESTATION'] },
                    contractEndDate: {
                        gte: now,
                        lte: in30Days
                    }
                },
                include: {
                    tenant: {
                        include: { settings: true }
                    }
                }
            });

            // Grouper par tenant
            const byTenant: Record<string, any[]> = {};
            for (const emp of employees) {
                const key = emp.tenantId;
                if (!byTenant[key]) {
                    byTenant[key] = [];
                }
                const daysLeft = Math.ceil((emp.contractEndDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                byTenant[key].push({
                    name: `${emp.firstName} ${emp.lastName}`,
                    contractEnd: emp.contractEndDate,
                    daysLeft,
                    tenantId: emp.tenantId,
                    hrEmail: (emp as any).tenant?.settings?.smtpFromEmail || (emp as any).tenant?.email
                });
            }

            res.json({ success: true, data: byTenant, count: employees.length });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * POST /api/notifications/cron/send-contract-expiry
     * Déclenché par n8n pour envoyer les alertes email aux RHs par tenant.
     */
    static async sendContractExpiryAlerts(req: Request, res: Response) {
        try {
            const { data } = req.body; // data = { [tenantId]: [{name, contractEnd, daysLeft, hrEmail}] }

            if (!data) return res.status(400).json({ success: false, error: 'Payload invalide' });

            let sent = 0;
            const errors: string[] = [];

            for (const [tenantId, employees] of Object.entries<any[]>(data)) {
                try {
                    const hrEmails: Set<string> = new Set(
                        employees.filter(e => e.hrEmail).map((e: any) => e.hrEmail)
                    );

                    for (const hrEmail of hrEmails) {
                        await EmailService.sendContractExpiryAlert(tenantId, hrEmail, employees);
                        sent++;
                    }
                } catch (err: any) {
                    errors.push(`Tenant ${tenantId}: ${err.message}`);
                }
            }

            res.json({ success: true, sent, errors });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/notifications/cron/expiring-trials
     * Employés dont la période d'essai expire dans les 7 jours.
     */
    static async getExpiringTrials(req: Request, res: Response) {
        try {
            const now = new Date();
            const in7Days = new Date();
            in7Days.setDate(now.getDate() + 7);

            const employees = await prisma.employee.findMany({
                where: {
                    status: 'ACTIVE',
                    trialEndDate: {
                        gte: now,
                        lte: in7Days
                    }
                },
                include: { tenant: { include: { settings: true } } }
            });

            res.json({
                success: true,
                data: employees.map(emp => ({
                    name: `${emp.firstName} ${emp.lastName}`,
                    trialEndDate: emp.trialEndDate,
                    tenantId: emp.tenantId,
                    hrEmail: (emp as any).tenant?.settings?.smtpFromEmail || (emp as any).tenant?.email
                })),
                count: employees.length
            });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/notifications/cron/its-reminder
     * Retourne la liste des tenants qui doivent faire leur déclaration ITS.
     * Typiquement appelé le 10 de chaque mois.
     */
    static async getItsReminder(req: Request, res: Response) {
        try {
            const now = new Date();
            const tenants = await prisma.tenant.findMany({
                where: { isActive: true },
                include: { settings: true }
            });

            const reminders = tenants.map(t => ({
                tenantId: t.id,
                tenantName: t.name,
                hrEmail: t.settings?.smtpFromEmail || t.email,
                month: now.getMonth(), // Mois précédent à déclarer
                year: now.getFullYear()
            }));

            res.json({ success: true, data: reminders });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * GET /api/notifications/inbox
     * Retourne les alertes RH dérivées des données existantes (pas de table dédiée).
     */
    static async getInbox(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const role = req.user?.role;
            const today = new Date();
            const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
            const notifications: any[] = [];
            const order = { error: 0, warning: 1, info: 2 };

            // ── EMPLOYEE : notifications personnelles ─────────────────
            if (role === 'EMPLOYEE') {
                const employeeId = req.user?.employeeId;
                if (!employeeId) return res.json({ success: true, data: [], count: 0 });

                const [emp, myLeaves, myPayslips] = await Promise.all([
                    prisma.employee.findFirst({
                        where: { id: employeeId, tenantId },
                        select: { id: true, firstName: true, lastName: true, contractType: true, contractEndDate: true, trialEndDate: true },
                    }),
                    prisma.leave.findMany({
                        where: { employeeId, employee: { tenantId } },
                        include: { leaveType: { select: { name: true } } },
                        orderBy: { updatedAt: 'desc' },
                        take: 10,
                    }),
                    prisma.payslip.findMany({
                        where: { employeeId, employee: { tenantId } },
                        include: { payroll: true },
                        orderBy: { createdAt: 'desc' },
                        take: 3,
                    }),
                ]);

                // Contrat CDD personnel expirant
                if (emp?.contractType === 'CDD' && emp.contractEndDate) {
                    const diff = Math.ceil((new Date(emp.contractEndDate).getTime() - today.getTime()) / 86400000);
                    if (diff >= 0 && diff <= 30) {
                        notifications.push({
                            id: `cdd-me`,
                            type: diff <= 7 ? 'error' : 'warning',
                            category: 'contract',
                            title: `Votre contrat CDD expire ${diff === 0 ? "aujourd'hui" : `dans ${diff} jour${diff > 1 ? 's' : ''}`}`,
                            message: `Fin de contrat prévue le ${new Date(emp.contractEndDate).toLocaleDateString('fr-FR')}. Contactez votre RH.`,
                            href: '/employee/profile',
                            createdAt: new Date().toISOString(),
                        });
                    }
                }

                // Période d'essai personnelle
                if (emp?.trialEndDate) {
                    const diff = Math.ceil((new Date(emp.trialEndDate).getTime() - today.getTime()) / 86400000);
                    if (diff >= 0 && diff <= 15) {
                        notifications.push({
                            id: `trial-me`,
                            type: 'info',
                            category: 'trial',
                            title: `Votre période d'essai se termine dans ${diff} jour${diff > 1 ? 's' : ''}`,
                            message: `Fin de période d'essai le ${new Date(emp.trialEndDate).toLocaleDateString('fr-FR')}.`,
                            href: '/employee/profile',
                            createdAt: new Date().toISOString(),
                        });
                    }
                }

                // Statut de mes demandes de congé récentes
                myLeaves.forEach(leave => {
                    if (leave.status === 'APPROVED') {
                        notifications.push({
                            id: `leave-ok-${leave.id}`,
                            type: 'info',
                            category: 'leave',
                            title: 'Congé approuvé',
                            message: `${leave.leaveType?.name || 'Congé'} du ${new Date(leave.startDate).toLocaleDateString('fr-FR')} au ${new Date(leave.endDate).toLocaleDateString('fr-FR')} a été approuvé.`,
                            href: '/employee/leaves',
                            createdAt: leave.updatedAt.toISOString(),
                        });
                    } else if (leave.status === 'REJECTED') {
                        notifications.push({
                            id: `leave-ko-${leave.id}`,
                            type: 'error',
                            category: 'leave',
                            title: 'Congé refusé',
                            message: `${leave.leaveType?.name || 'Congé'} du ${new Date(leave.startDate).toLocaleDateString('fr-FR')} au ${new Date(leave.endDate).toLocaleDateString('fr-FR')} a été refusé.`,
                            href: '/employee/leaves',
                            createdAt: leave.updatedAt.toISOString(),
                        });
                    } else if (leave.status === 'PENDING') {
                        notifications.push({
                            id: `leave-pending-${leave.id}`,
                            type: 'warning',
                            category: 'leave',
                            title: 'Demande de congé en attente',
                            message: `${leave.leaveType?.name || 'Congé'} du ${new Date(leave.startDate).toLocaleDateString('fr-FR')} au ${new Date(leave.endDate).toLocaleDateString('fr-FR')} — en attente de validation.`,
                            href: '/employee/leaves',
                            createdAt: leave.createdAt.toISOString(),
                        });
                    }
                });

                // Nouveau bulletin disponible
                myPayslips.forEach(slip => {
                    if (slip.payroll.status === 'VALIDATED' || slip.payroll.status === 'CLOSED') {
                        notifications.push({
                            id: `slip-${slip.id}`,
                            type: 'info',
                            category: 'payroll',
                            title: 'Bulletin de paie disponible',
                            message: `Votre bulletin de ${MONTHS_FR[slip.payroll.month - 1]} ${slip.payroll.year} est prêt à télécharger.`,
                            href: '/employee/payslips',
                            createdAt: slip.createdAt.toISOString(),
                        });
                    }
                });

                notifications.sort((a, b) => (order[a.type as keyof typeof order] - order[b.type as keyof typeof order]) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                return res.json({ success: true, data: notifications, count: notifications.length });
            }

            // ── ADMIN / HR : alertes selon le rôle ─────────────────────
            const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN';

            const [employees, leaves, payrolls] = await Promise.all([
                // HR + ADMIN : contrats et périodes d'essai
                prisma.employee.findMany({
                    where: { tenantId, status: 'ACTIVE' },
                    select: { id: true, firstName: true, lastName: true, contractType: true, contractEndDate: true, trialEndDate: true },
                }),
                // HR + ADMIN : congés en attente
                prisma.leave.findMany({
                    where: { employee: { tenantId }, status: 'PENDING' },
                    include: { employee: { select: { firstName: true, lastName: true } }, leaveType: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                }),
                // ADMIN uniquement : paie en brouillon
                isAdminRole ? prisma.payroll.findMany({
                    where: { tenantId, status: 'DRAFT' },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                }) : Promise.resolve([]),
            ]);

            // Contrats CDD expirant (HR + ADMIN)
            employees.forEach(emp => {
                if (emp.contractType === 'CDD' && emp.contractEndDate) {
                    const diff = Math.ceil((new Date(emp.contractEndDate).getTime() - today.getTime()) / 86400000);
                    if (diff >= 0 && diff <= 30) {
                        notifications.push({
                            id: `cdd-${emp.id}`,
                            type: diff <= 7 ? 'error' : 'warning',
                            category: 'contract',
                            title: `CDD expirant ${diff === 0 ? "aujourd'hui" : `dans ${diff} jour${diff > 1 ? 's' : ''}`}`,
                            message: `${emp.firstName} ${emp.lastName} — fin de contrat le ${new Date(emp.contractEndDate).toLocaleDateString('fr-FR')}`,
                            href: `/dashboard/employees/${emp.id}`,
                            createdAt: new Date().toISOString(),
                        });
                    }
                }
                if (emp.trialEndDate) {
                    const diff = Math.ceil((new Date(emp.trialEndDate).getTime() - today.getTime()) / 86400000);
                    if (diff >= 0 && diff <= 15) {
                        notifications.push({
                            id: `trial-${emp.id}`,
                            type: 'info',
                            category: 'trial',
                            title: `Période d'essai se terminant dans ${diff} jour${diff > 1 ? 's' : ''}`,
                            message: `${emp.firstName} ${emp.lastName} — fin de période d'essai le ${new Date(emp.trialEndDate).toLocaleDateString('fr-FR')}`,
                            href: `/dashboard/employees/${emp.id}`,
                            createdAt: new Date().toISOString(),
                        });
                    }
                }
            });

            // Congés en attente (HR + ADMIN)
            leaves.forEach(leave => {
                notifications.push({
                    id: `leave-${leave.id}`,
                    type: 'warning',
                    category: 'leave',
                    title: 'Demande de congé en attente',
                    message: `${leave.employee.firstName} ${leave.employee.lastName} — ${leave.leaveType?.name || 'Congé'} du ${new Date(leave.startDate).toLocaleDateString('fr-FR')} au ${new Date(leave.endDate).toLocaleDateString('fr-FR')}`,
                    href: `/dashboard/leaves`,
                    createdAt: leave.createdAt.toISOString(),
                });
            });

            // Paie en brouillon (ADMIN uniquement)
            payrolls.forEach(p => {
                notifications.push({
                    id: `payroll-${p.id}`,
                    type: 'info',
                    category: 'payroll',
                    title: 'Campagne de paie en brouillon',
                    message: `Paie ${MONTHS_FR[p.month - 1]} ${p.year} — en attente de validation`,
                    href: `/dashboard/payroll/${p.id}`,
                    createdAt: p.createdAt.toISOString(),
                });
            });

            notifications.sort((a, b) => (order[a.type as keyof typeof order] - order[b.type as keyof typeof order]) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            res.json({ success: true, data: notifications, count: notifications.length });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * POST /api/notifications/test-smtp
     * Permet aux admins de tester leur configuration SMTP.
     */
    static async testSmtp(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const { testEmail } = req.body;

            if (!testEmail) return res.status(400).json({ success: false, error: 'Email de test requis' });

            await EmailService.sendMail(tenantId, {
                to: testEmail,
                subject: '✅ Test SMTP Harmony',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px;">
                        <h2 style="color:#059669;">Configuration SMTP Opérationnelle ✅</h2>
                        <p>Si vous recevez cet email, votre configuration SMTP est correctement paramétrée dans Harmony.</p>
                        <hr/>
                        <p style="color:#94a3b8;font-size:12px;">Test envoyé le ${new Date().toLocaleString('fr-FR')}.</p>
                    </div>
                `
            });

            res.json({ success: true, message: 'Email de test envoyé avec succès !' });
        } catch (error: any) {
            res.status(400).json({ success: false, error: `Échec SMTP : ${error.message}` });
        }
    }
    /**
     * GET /api/notifications/cron/unused-leave-alert
     * Employés avec plus de 10 jours de congés non utilisés (alerte de fin de période).
     */
    static async getUnusedLeaveAlert(req: Request, res: Response) {
        try {
            // Employés dont le solde de congés annuels est >= 10 jours
            const employees = await prisma.employee.findMany({
                where: { status: 'ACTIVE' },
                include: {
                    leaves: {
                        where: {
                            status: 'APPROVED',
                            startDate: { gte: new Date(new Date().getFullYear(), 0, 1) } // depuis le 1er janv
                        }
                    },
                    tenant: { include: { settings: true } }
                }
            });

            const alerts = employees
                .map(emp => ({
                    name: `${emp.firstName} ${emp.lastName}`,
                    email: emp.email,
                    tenantId: emp.tenantId,
                    hrEmail: (emp as any).tenant?.settings?.smtpFromEmail || (emp as any).tenant?.email,
                    leaveDaysTaken: (emp as any).leaves.reduce((acc: number, l: any) => {
                        const days = Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        return acc + days;
                    }, 0)
                }))
                .filter(e => e.leaveDaysTaken === 0); // employés n'ayant pris AUCUN congé

            res.json({ success: true, data: alerts, count: alerts.length });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * POST /api/notifications/send-payslips
     * Envoie les bulletins de paie par email à tous les employés d'une campagne.
     */
    static async sendPayslipEmails(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const { payrollId } = req.body;

            if (!payrollId) return res.status(400).json({ success: false, error: 'payrollId requis' });

            const payroll = await prisma.payroll.findFirst({
                where: { id: payrollId, tenantId },
                include: {
                    payslips: {
                        include: { employee: true }
                    }
                }
            });

            if (!payroll) return res.status(404).json({ success: false, error: 'Campagne introuvable' });

            let sent = 0;
            let skipped = 0;
            const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

            for (const ps of payroll.payslips) {
                const emp = ps.employee;
                if (!emp.email) { skipped++; continue; }

                try {
                    await EmailService.sendMail(tenantId, {
                        to: emp.email,
                        subject: `💰 Votre bulletin de paie — ${MONTHS_FR[payroll.month - 1]} ${payroll.year}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9fafb; padding: 24px; border-radius: 8px;">
                                <h2 style="color: #1e293b;">Bulletin de paie — ${MONTHS_FR[payroll.month - 1]} ${payroll.year}</h2>
                                <p>Bonjour <strong>${emp.firstName} ${emp.lastName}</strong>,</p>
                                <p>Votre bulletin de paie pour le mois de <strong>${MONTHS_FR[payroll.month - 1]} ${payroll.year}</strong> est disponible.</p>
                                <div style="background:#f0fdf4;border-radius:6px;padding:16px;margin:16px 0;border-left:4px solid #059669;">
                                    <p style="margin:0;"><strong>Salaire Brut :</strong> ${Number(ps.grossSalary).toLocaleString('fr-FR')} MRU</p>
                                    <p style="margin:8px 0 0;"><strong>Retenues :</strong> ${(Number(ps.cnssEmployee) + Number(ps.itsAmount)).toLocaleString('fr-FR')} MRU</p>
                                    <p style="margin:8px 0 0;font-size:16px;"><strong style="color:#059669;">Net à Payer : ${Number(ps.netSalary).toLocaleString('fr-FR')} MRU</strong></p>
                                </div>
                                <p style="color:#64748b;font-size:13px;">Connectez-vous au portail RH pour télécharger votre bulletin complet.</p>
                                <hr/>
                                <p style="color:#94a3b8;font-size:12px;">Ce message est envoyé automatiquement par Harmony.</p>
                            </div>
                        `
                    });
                    sent++;
                } catch { skipped++; }
            }

            res.json({ success: true, sent, skipped, message: `${sent} bulletins envoyés par email.` });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * POST /api/notifications/welcome
     * Envois l'email de bienvenue à un employé lors de son onboarding.
     * Appelé par le contrôleur employé lors de la création d'un compte.
     */
    static async sendWelcome(req: Request, res: Response) {
        try {
            const tenantId = req.tenant?.id!;
            const { employeeEmail, employeeName, loginEmail, temporaryPassword } = req.body;

            await EmailService.sendWelcomeEmail(tenantId, employeeEmail, employeeName, loginEmail, temporaryPassword);
            res.json({ success: true, message: 'Email de bienvenue envoyé' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
