import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import { getContractTemplate } from './contract-templates';

const prisma = new PrismaClient();

// Helper: convert data URL logo to Buffer for PDFKit
function getLogoBuffer(logo: string | null | undefined): Buffer | null {
    if (!logo || !logo.startsWith('data:image/')) return null;
    try {
        const base64Data = logo.split(',')[1];
        if (!base64Data) return null;
        return Buffer.from(base64Data, 'base64');
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────────────────
// PAYSLIP PDF
// ─────────────────────────────────────────────────────────
export async function generatePayslipPdf(payslipId: string, tenantId: string): Promise<Buffer> {
    const payslip = await prisma.payslip.findFirst({
        where: { id: payslipId },
        include: {
            employee: { include: { department: true } },
            payroll: true,
        },
    });

    if (!payslip) throw new Error('Bulletin introuvable');
    // Security: verify tenant
    if (payslip.employee.tenantId !== tenantId) throw new Error('Accès refusé');

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    // Cumuls annuels : tous les bulletins du même employé pour la même année, jusqu'au mois courant
    const ytdPayslips = await prisma.payslip.findMany({
        where: {
            employeeId: payslip.employeeId,
            payroll: { year: payslip.payroll.year, month: { lte: payslip.payroll.month } },
        },
        include: { payroll: true },
    });
    const ytd = ytdPayslips.reduce((acc, p) => ({
        gross: acc.gross + Number(p.grossSalary),
        cnss: acc.cnss + Number(p.cnssEmployee),
        its: acc.its + Number(p.itsAmount),
        net: acc.net + Number(p.netSalary),
    }), { gross: 0, cnss: 0, its: 0, net: 0 });

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const emp = payslip.employee;
        const payroll = payslip.payroll;
        const W = 595 - 100; // usable width

        const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        const period = `${MONTHS_FR[payroll.month - 1]} ${payroll.year}`;

        // ── Header ──────────────────────────────────────────────
        doc.rect(0, 0, 595, 80).fill('#1e293b');
        const logoBuffer = getLogoBuffer(tenant?.logo);
        let headerTextX = 50;
        if (logoBuffer) {
            try { doc.image(logoBuffer, 50, 12, { height: 50, fit: [50, 50] }); headerTextX = 110; } catch { /* skip logo */ }
        }
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16)
            .text(tenant?.name || 'Harmony', headerTextX, 20, { width: W - (headerTextX - 50) });
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(9)
            .text('Bulletin de Paie', headerTextX, 42, { width: W - (headerTextX - 50) });
        doc.fillColor('#60a5fa').font('Helvetica-Bold').fontSize(11)
            .text(period, 50, 57, { width: W, align: 'right' });

        let y = 100;

        // ── Employee Info ────────────────────────────────────────
        doc.roundedRect(50, y, W, 60, 6).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11)
            .text(`${emp.firstName} ${emp.lastName}`, 65, y + 10);
        doc.fillColor('#64748b').font('Helvetica').fontSize(9)
            .text(`${emp.position}${emp.department ? '  •  ' + emp.department.name : ''}`, 65, y + 26);
        doc.text(`Matricule : ${emp.matricule}   •   Contrat : ${emp.contractType}   •   Embauché le : ${new Date(emp.hireDate).toLocaleDateString('fr-FR')}`, 65, y + 40);
        y += 76;

        // ── Salary Table ─────────────────────────────────────────
        const col1 = 50, col2 = 350, col3 = 450;

        const tableHeader = (label: string) => {
            doc.rect(col1, y, W, 20).fill('#1e40af');
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9)
                .text(label, col1 + 8, y + 5);
            y += 20;
        };

        const tableRow = (label: string, amount: number, currency: string, isDeduction = false) => {
            doc.rect(col1, y, W, 18).fill(y % 36 === 0 ? '#f1f5f9' : '#ffffff').stroke('#e2e8f0');
            doc.fillColor('#334155').font('Helvetica').fontSize(9).text(label, col1 + 8, y + 4);
            doc.fillColor(isDeduction ? '#dc2626' : '#1e293b').font('Helvetica-Bold').fontSize(9)
                .text(`${isDeduction ? '- ' : ''}${Number(amount).toLocaleString('fr-FR')} ${currency}`, col2, y + 4, { width: 190, align: 'right' });
            y += 18;
        };

        const currency = emp.currency || 'MRU';

        tableHeader('ÉLÉMENTS DE RÉMUNÉRATION');
        tableRow('Salaire de base', Number(payslip.baseSalary), currency);
        if (Number(payslip.totalAdvantages) > 0) {
            const advDetails = payslip.advantagesDetail ? JSON.parse(payslip.advantagesDetail as string) : [];
            for (const adv of advDetails) {
                tableRow(`  ${adv.name}`, adv.amount, currency);
            }
        }
        y += 4;

        tableHeader('COTISATIONS & DÉDUCTIONS');
        tableRow('CNSS (part salariale 1%)', Number(payslip.cnssEmployee), currency, true);
        tableRow('ITS (Impôt sur salaire)', Number(payslip.itsAmount), currency, true);
        if (Number(payslip.otherDeductions) > 0) {
            tableRow('Autres retenues', Number(payslip.otherDeductions), currency, true);
        }
        y += 8;

        // ── Net à payer ──────────────────────────────────────────
        doc.rect(col1, y, W, 30).fill('#1e40af');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12)
            .text('NET À PAYER', col1 + 8, y + 8);
        doc.fontSize(14)
            .text(`${Number(payslip.netSalary).toLocaleString('fr-FR')} ${currency}`, col2, y + 7, { width: 190, align: 'right' });
        y += 40;

        // ── Employer contributions (info) ────────────────────────
        if (Number(payslip.cnssEmployer) > 0) {
            doc.fillColor('#94a3b8').font('Helvetica').fontSize(8)
                .text(`Cotisations patronales CNSS (13%) : ${Number(payslip.cnssEmployer).toLocaleString('fr-FR')} ${currency} (non déduit du salaire — charge employeur)`, col1, y + 6, { width: W });
            y += 20;
        }

        // ── Cumuls annuels ───────────────────────────────────────
        y += 12;
        doc.rect(col1, y, W, 18).fill('#0f172a');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8)
            .text(`CUMULS ${payslip.payroll.year} (Janvier → ${MONTHS_FR[payslip.payroll.month - 1]})`, col1 + 8, y + 4);
        y += 18;

        const ytdRow = (label: string, amount: number, isDeduction = false) => {
            doc.rect(col1, y, W, 16).fill('#f8fafc').stroke('#e2e8f0');
            doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(label, col1 + 8, y + 3);
            doc.fillColor(isDeduction ? '#dc2626' : '#0f172a').font('Helvetica-Bold').fontSize(8)
                .text(`${Number(amount).toLocaleString('fr-FR')} ${currency}`, col2, y + 3, { width: 190, align: 'right' });
            y += 16;
        };
        ytdRow('Brut cumulé', ytd.gross);
        ytdRow('CNSS cumulée', ytd.cnss, true);
        ytdRow('ITS cumulé', ytd.its, true);
        ytdRow('Net cumulé', ytd.net);
        y += 8;

        // ── Footer ───────────────────────────────────────────────
        y += 20;
        doc.moveTo(col1, y).lineTo(col1 + W, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        y += 8;
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5)
            .text(`Bulletin de paie généré le ${new Date().toLocaleDateString('fr-FR')} — Document officiel confidentiel — ${tenant?.name || ''}`, col1, y, { width: W, align: 'center' });

        doc.end();
    });
}

// ─────────────────────────────────────────────────────────
// FICHE DE DEMANDE DE CONGÉ PDF
// ─────────────────────────────────────────────────────────
export async function generateLeaveRequestPdf(leaveId: string, tenantId: string): Promise<Buffer> {
    const leave = await prisma.leave.findFirst({
        where: { id: leaveId },
        include: {
            employee: { include: { department: true } },
            leaveType: true,
        },
    });

    if (!leave) throw new Error('Demande de congé introuvable');
    if (leave.employee.tenantId !== tenantId) throw new Error('Accès refusé');

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 60 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const emp = leave.employee;
        const W = 595 - 120; // usable width
        const L = 60; // left margin

        // ── Bandeau supérieur ────────────────────────────────────
        doc.rect(0, 0, 595, 70).fill('#1e293b');
        const leaveLogoBuffer = getLogoBuffer(tenant?.logo);
        let leaveTxtX = L;
        if (leaveLogoBuffer) {
            try { doc.image(leaveLogoBuffer, L, 10, { height: 45, fit: [45, 45] }); leaveTxtX = L + 55; } catch { /* skip */ }
        }
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15)
            .text((tenant?.name || 'HARMONY ERP').toUpperCase(), leaveTxtX, 18, { width: W - (leaveTxtX - L) });
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(8.5)
            .text('DEMANDE DE CONGÉ — Document officiel', leaveTxtX, 40, { width: W - (leaveTxtX - L) });

        // Numéro de référence
        doc.fillColor('#60a5fa').font('Helvetica-Bold').fontSize(8.5)
            .text(`Réf : ${leave.id.slice(0, 8).toUpperCase()}`, L, 40, { width: W, align: 'right' });

        let y = 90;

        // ── Titre ────────────────────────────────────────────────
        doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(16)
            .text('FICHE DE DEMANDE DE CONGÉ', L, y, { width: W, align: 'center' });
        y += 32;
        doc.moveTo(L, y).lineTo(L + W, y).strokeColor('#1e40af').lineWidth(2).stroke();
        y += 16;

        // ── Informations employé ─────────────────────────────────
        doc.rect(L, y, W, 78).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9)
            .text('INFORMATIONS DE L\'EMPLOYÉ', L + 12, y + 10);

        const col2 = L + W / 2;
        doc.fillColor('#64748b').font('Helvetica').fontSize(9);
        doc.text(`Nom & Prénom :`, L + 12, y + 26).font('Helvetica-Bold').fillColor('#1e293b')
            .text(`${emp.firstName} ${emp.lastName}`, L + 100, y + 26);
        doc.fillColor('#64748b').font('Helvetica')
            .text(`Matricule :`, L + 12, y + 42).font('Helvetica-Bold').fillColor('#1e293b')
            .text(emp.matricule || '—', L + 100, y + 42);
        doc.fillColor('#64748b').font('Helvetica')
            .text(`Poste :`, col2, y + 26).font('Helvetica-Bold').fillColor('#1e293b')
            .text(emp.position || '—', col2 + 60, y + 26);
        doc.fillColor('#64748b').font('Helvetica')
            .text(`Département :`, col2, y + 42).font('Helvetica-Bold').fillColor('#1e293b')
            .text(emp.department?.name || '—', col2 + 80, y + 42);
        doc.fillColor('#64748b').font('Helvetica')
            .text(`Contrat :`, L + 12, y + 58).font('Helvetica-Bold').fillColor('#1e293b')
            .text(emp.contractType || '—', L + 100, y + 58);
        y += 96;

        // ── Détails du congé ─────────────────────────────────────
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
            .text('DÉTAILS DE LA DEMANDE', L, y);
        y += 16;

        const detailRow = (label: string, value: string, highlight = false) => {
            doc.rect(L, y, W, 22).fill(highlight ? '#eff6ff' : '#ffffff').stroke('#e2e8f0');
            doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(label, L + 10, y + 6);
            doc.fillColor(highlight ? '#1e40af' : '#1e293b').font('Helvetica-Bold').fontSize(9)
                .text(value, L + 180, y + 6, { width: W - 190 });
            y += 22;
        };

        const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        detailRow('Type de congé', leave.leaveType?.name || '—');
        detailRow('Date de début', fmtDate(new Date(leave.startDate)));
        detailRow('Date de fin', fmtDate(new Date(leave.endDate)));
        detailRow('Nombre de jours ouvrés', `${Number(leave.totalDays)} jour${Number(leave.totalDays) > 1 ? 's' : ''}`, true);
        detailRow('Motif', leave.reason || 'Non précisé');
        detailRow('Date de soumission', new Date(leave.createdAt).toLocaleDateString('fr-FR'));
        y += 6;

        // ── Statut actuel ────────────────────────────────────────
        const statusColors: Record<string, string> = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444', CANCELLED: '#94a3b8' };
        const statusLabels: Record<string, string> = { PENDING: 'En attente de validation', APPROVED: 'Approuvée', REJECTED: 'Refusée', CANCELLED: 'Annulée' };
        const statusColor = statusColors[leave.status] || '#94a3b8';
        doc.rect(L, y, W, 28).fill('#f8fafc').stroke('#e2e8f0');
        doc.fillColor('#64748b').font('Helvetica').fontSize(9).text('Statut :', L + 10, y + 9);
        doc.rect(L + 180, y + 6, 120, 16).fill(statusColor);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
            .text((statusLabels[leave.status] || leave.status).toUpperCase(), L + 182, y + 9, { width: 116, align: 'center' });
        if (leave.status === 'REJECTED' && leave.rejectionReason) {
            doc.fillColor('#ef4444').font('Helvetica').fontSize(8)
                .text(`Motif de refus : ${leave.rejectionReason}`, L + 310, y + 9, { width: W - 320 });
        }
        y += 44;

        // ── Zone signatures ──────────────────────────────────────
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9)
            .text('SIGNATURES', L, y);
        y += 12;

        const sigW = (W - 24) / 3;
        const sigBoxes = [
            { label: "Signature de l'employé", sublabel: `${emp.firstName} ${emp.lastName}` },
            { label: 'Visa RH', sublabel: 'Responsable des Ressources Humaines' },
            { label: 'Visa Direction', sublabel: 'Direction Générale' },
        ];
        sigBoxes.forEach((box, i) => {
            const x = L + i * (sigW + 12);
            doc.rect(x, y, sigW, 80).stroke('#e2e8f0');
            doc.fillColor('#64748b').font('Helvetica').fontSize(8)
                .text(box.label, x + 4, y + 6, { width: sigW - 8, align: 'center' });
            doc.fontSize(7).fillColor('#94a3b8')
                .text(box.sublabel, x + 4, y + 18, { width: sigW - 8, align: 'center' });
            doc.fillColor('#e2e8f0').font('Helvetica').fontSize(7)
                .text('Cachet & Signature', x + 4, y + 66, { width: sigW - 8, align: 'center' });
        });
        y += 96;

        // ── Footer ───────────────────────────────────────────────
        doc.moveTo(L, y).lineTo(L + W, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        y += 8;
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5)
            .text(
                `Document généré le ${new Date().toLocaleDateString('fr-FR')} par Harmony — ${tenant?.name || ''} — Réf. ${leave.id.slice(0, 8).toUpperCase()}`,
                L, y, { width: W, align: 'center' }
            );

        doc.end();
    });
}

// ─────────────────────────────────────────────────────────
// ATTESTATION DE TRAVAIL PDF
// ─────────────────────────────────────────────────────────
export async function generateAttestationPdf(employeeId: string, tenantId: string): Promise<Buffer> {
    const employee = await prisma.employee.findFirst({
        where: { id: employeeId, tenantId },
        include: { department: true },
    });

    if (!employee) throw new Error('Employé introuvable');

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 70 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const W = 595 - 140;
        const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const hireDate = new Date(employee.hireDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        // ── Header ──────────────────────────────────────────────
        const attestLogoBuffer = getLogoBuffer(tenant?.logo);
        if (attestLogoBuffer) {
            try { doc.image(attestLogoBuffer, (595 - 60) / 2, 70, { height: 60, fit: [60, 60] }); doc.moveDown(4); } catch { /* skip */ }
        }
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e293b')
            .text((tenant?.name || 'HARMONY ERP').toUpperCase(), { align: 'center' });
        if (tenant?.address) {
            doc.font('Helvetica').fontSize(9).fillColor('#64748b')
                .text(tenant.address, { align: 'center' });
        }
        if (tenant?.phone) {
            doc.fontSize(9).text(`Tél : ${tenant.phone}`, { align: 'center' });
        }

        doc.moveDown(1.5);
        doc.moveTo(70, doc.y).lineTo(70 + W, doc.y).strokeColor('#1e40af').lineWidth(2).stroke();
        doc.moveDown(1.5);

        // ── Title ────────────────────────────────────────────────
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#1e40af')
            .text('ATTESTATION DE TRAVAIL', { align: 'center', underline: false });
        doc.moveDown(2);

        // ── Body ─────────────────────────────────────────────────
        doc.font('Helvetica').fontSize(11).fillColor('#1e293b').lineGap(6);

        const fullName = `${employee.firstName} ${employee.lastName}`.toUpperCase();
        const contractLabel = employee.contractType === 'CDI' ? 'contrat à durée indéterminée (CDI)' :
            employee.contractType === 'CDD' ? 'contrat à durée déterminée (CDD)' :
                employee.contractType === 'STAGE' ? 'convention de stage' : employee.contractType;

        doc.text(`Nous soussignés, ${tenant?.name || 'la direction'}, attestons par la présente que :`);
        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(13).fillColor('#1e40af')
            .text(`M./Mme ${fullName}`, { align: 'center' });
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(11).fillColor('#1e293b');
        doc.text(`est bien employé(e) au sein de notre organisation en qualité de :`);
        doc.moveDown(0.5);

        doc.font('Helvetica-Bold').text(`${employee.position.toUpperCase()}${employee.department ? ` — ${employee.department.name}` : ''}`, { align: 'center' });
        doc.moveDown(1);

        doc.font('Helvetica').text(`et ce, dans le cadre d'un ${contractLabel}, depuis le ${hireDate}.`);
        doc.moveDown(1);

        doc.text(`Le matricule de l'intéressé(e) est : `);
        doc.font('Helvetica-Bold').text(employee.matricule, { continued: false });
        doc.moveDown(1.5);

        doc.font('Helvetica')
            .text(`La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`);
        doc.moveDown(3);

        // ── Signature ────────────────────────────────────────────
        doc.text(`Fait à ${tenant?.address?.split(',')[0] || 'Nouakchott'}, le ${today}`, { align: 'right' });
        doc.moveDown(3);
        doc.font('Helvetica-Bold').text('La Direction des Ressources Humaines', { align: 'right' });
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(9).fillColor('#94a3b8')
            .text('Signature et cachet', { align: 'right' });

        // ── Footer ───────────────────────────────────────────────
        doc.fontSize(7).fillColor('#cbd5e1')
            .text(`Document généré électroniquement par Harmony — ${new Date().toISOString()}`, 70, 800, { width: W, align: 'center' });

        doc.end();
    });
}

export class PdfService {
    static async generateEmployeeBadge(employeeId: string, tenantId: string): Promise<Buffer> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, tenantId },
            include: { department: true }
        });

        if (!employee) {
            throw new Error('Employé introuvable');
        }

        const badgeTenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const badgeLogoBuffer = getLogoBuffer(badgeTenant?.logo);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: [226, 340], // ~6cm x 9cm badge in points (1pt = 0.353mm)
                margin: 0,
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const W = 226;
            const H = 340;

            // ── Header background ──────────────────────────────────────────
            doc.rect(0, 0, W, 70).fill('#2563eb');
            if (badgeLogoBuffer) {
                try { doc.image(badgeLogoBuffer, W / 2 - 15, 6, { height: 30, fit: [30, 30] }); } catch { /* skip */ }
            }

            // Company name
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(13)
                .text(badgeTenant?.name || 'HARMONY ERP', 0, badgeLogoBuffer ? 38 : 14, { align: 'center', width: W });

            if (!badgeLogoBuffer) {
                doc.fillColor('#bfdbfe')
                    .font('Helvetica')
                    .fontSize(7)
                    .text('Système de Gestion RH', 0, 32, { align: 'center', width: W });
            }

            // ── Avatar circle ──────────────────────────────────────────────
            const cx = W / 2;
            const cy = 70;
            const r = 36;
            doc.circle(cx, cy, r + 3).fill('#ffffff'); // white border
            doc.circle(cx, cy, r).fill('#e0e7ff');     // light blue bg

            // Initials
            const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
            doc.fillColor('#2563eb')
                .font('Helvetica-Bold')
                .fontSize(22)
                .text(initials, cx - 18, cy - 14, { width: 36, align: 'center' });

            // ── Name & Position ────────────────────────────────────────────
            const name = `${employee.firstName} ${employee.lastName}`;
            doc.fillColor('#1e293b')
                .font('Helvetica-Bold')
                .fontSize(13)
                .text(name, 16, 118, { align: 'center', width: W - 32 });

            doc.fillColor('#64748b')
                .font('Helvetica')
                .fontSize(9)
                .text(employee.position.toUpperCase(), 16, 136, { align: 'center', width: W - 32 });

            if (employee.department) {
                doc.fillColor('#94a3b8')
                    .fontSize(8)
                    .text(employee.department.name, 16, 152, { align: 'center', width: W - 32 });
            }

            // ── Divider ────────────────────────────────────────────────────
            doc.moveTo(24, 170).lineTo(W - 24, 170).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

            // ── Info rows ─────────────────────────────────────────────────
            const infoY = 180;
            const labelColor = '#94a3b8';
            const valueColor = '#1e293b';

            const rows = [
                { label: 'Matricule', value: employee.matricule || '—' },
                { label: 'Contrat', value: employee.contractType },
                { label: 'Embauché le', value: new Date(employee.hireDate).toLocaleDateString('fr-FR') },
            ];

            rows.forEach((row, i) => {
                const y = infoY + i * 26;
                doc.fillColor(labelColor).font('Helvetica').fontSize(7).text(row.label, 24, y);
                doc.fillColor(valueColor).font('Helvetica-Bold').fontSize(9).text(row.value, 24, y + 9);
            });

            // ── QR-code placeholder ────────────────────────────────────────
            const qrY = infoY + rows.length * 26 + 8;
            doc.roundedRect(W / 2 - 28, qrY, 56, 56, 4).fillAndStroke('#f8fafc', '#e2e8f0');
            doc.fillColor('#94a3b8').font('Helvetica').fontSize(6)
                .text('QR Code', W / 2 - 28, qrY + 24, { width: 56, align: 'center' });

            // ── Footer ─────────────────────────────────────────────────────
            doc.rect(0, H - 36, W, 36).fill('#f8fafc');
            doc.moveTo(0, H - 36).lineTo(W, H - 36).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
            doc.fillColor('#94a3b8').font('Helvetica').fontSize(6.5)
                .text('Accès Autorisé • Strictement Personnel', 0, H - 23, { align: 'center', width: W });

            doc.end();
        });
    }

    static async generateEmployeeContract(employeeId: string, tenantId: string): Promise<Buffer> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, tenantId },
            include: { department: true }
        });

        if (!employee) {
            throw new Error('Employé introuvable');
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { settings: true }
        });

        return this.buildContractPdf(employee, tenant, tenant?.settings?.contractTemplate);
    }

    static async generatePreviewContract(templateText: string, tenantId: string): Promise<Buffer> {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        // Create a dummy employee for the preview
        const dummyEmployee: any = {
            firstName: 'Jean',
            lastName: 'Dupont',
            cin: '1234567890',
            address: '123 Rue de la Forêt',
            position: 'Développeur Fullstack',
            contractType: 'CDI',
            baseSalary: 55000,
            currency: tenant?.currency || 'MRU',
            hireDate: new Date(),
            department: { name: 'Pôle Technique' }
        };

        return this.buildContractPdf(dummyEmployee, tenant, templateText);
    }

    private static buildContractPdf(employee: any, tenant: any, templateContent?: string | null): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const tenantName = tenant?.name || 'HARMONY ERP';
            const fullName = `${employee.firstName} ${employee.lastName}`;
            const startDate = new Date(employee.hireDate).toLocaleDateString('fr-FR');
            const salaryFmt = Number(employee.baseSalary).toLocaleString('fr-FR');

            // Add logo if available
            const contractLogoBuffer = getLogoBuffer(tenant?.logo);
            if (contractLogoBuffer) {
                try { doc.image(contractLogoBuffer, (595 - 60) / 2, 50, { height: 60, fit: [60, 60] }); doc.moveDown(4); } catch { /* skip */ }
            }

            if (templateContent) {
                // ── Custom template path ───────────────────────────────
                const title = `CONTRAT DE TRAVAIL ${employee.contractType.toUpperCase()}`;

                // Header
                doc.font('Helvetica-Bold').fontSize(16).text(tenantName, { align: 'center' });
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(10).text('Département des Ressources Humaines', { align: 'center' });
                doc.moveDown(2);

                // Title
                doc.font('Helvetica-Bold').fontSize(14).text(title, { align: 'center', underline: true });
                doc.moveDown(2);

                // Body
                doc.font('Helvetica').fontSize(11).lineGap(4);

                doc.text('Entre les soussignés :');
                doc.moveDown(1);
                doc.font('Helvetica-Bold').text(`${tenantName} (L'Employeur)`);
                doc.font('Helvetica').text('Représenté par la Direction Générale.');
                doc.moveDown(1);
                doc.text('Et');
                doc.moveDown(1);

                doc.font('Helvetica-Bold').text(`${fullName} (L'Employé)`);
                if (employee.cin) doc.font('Helvetica').text(`CIN / NNI : ${employee.cin}`);
                if (employee.address) doc.text(`Adresse : ${employee.address}`);

                doc.moveDown(2);
                doc.font('Helvetica-Bold').text('Il a été convenu ce qui suit :');
                doc.moveDown(1);

                let customText = templateContent;

                // Replace Variables
                customText = customText.replace(/{{EMPLOYEE_NAME}}/g, fullName);
                customText = customText.replace(/{{POSITION}}/g, employee.position);
                customText = customText.replace(/{{DEPARTMENT}}/g, employee.department ? employee.department.name : '');
                customText = customText.replace(/{{START_DATE}}/g, startDate);
                customText = customText.replace(/{{CONTRACT_TYPE}}/g, employee.contractType);
                customText = customText.replace(/{{SALARY}}/g, salaryFmt);
                customText = customText.replace(/{{CURRENCY}}/g, employee.currency || 'MRU');

                doc.font('Helvetica').text(customText);
                doc.moveDown(2);

                // Signatures
                doc.font('Helvetica').fontSize(10);
                doc.text(`Fait en deux exemplaires originaux, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
                doc.moveDown(3);

                const signatureY = doc.y;
                doc.font('Helvetica-Bold').text("L'Employeur", 50, signatureY);
                doc.text("L'Employé", 400, signatureY);
            } else {
                // ── Legal template path (Mauritanian labor law) ────────
                const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                const vars: Record<string, string> = {
                    COMPANY_NAME: tenantName,
                    EMPLOYEE_NAME: fullName,
                    POSITION: employee.position,
                    DEPARTMENT_LINE: employee.department ? ` au sein du département ${employee.department.name}` : '',
                    CIN_LINE: employee.cin ? `CIN / NNI : ${employee.cin}` : '',
                    ADDRESS_LINE: employee.address ? `Adresse : ${employee.address}` : '',
                    START_DATE: startDate,
                    END_DATE: employee.contractEndDate ? new Date(employee.contractEndDate).toLocaleDateString('fr-FR') : '—',
                    DURATION: employee.contractEndDate ? calculateDuration(new Date(employee.hireDate), new Date(employee.contractEndDate)) : '—',
                    SALARY: salaryFmt,
                    CURRENCY: employee.currency || 'MRU',
                    CITY: tenant?.address?.split(',')[0]?.trim() || 'Nouakchott',
                    TODAY: today,
                    CDD_REASON: 'Accroissement temporaire d\'activité',
                };

                const template = getContractTemplate(employee.contractType, vars);

                // Header
                doc.font('Helvetica-Bold').fontSize(16).text(tenantName, { align: 'center' });
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(10).text('Département des Ressources Humaines', { align: 'center' });
                doc.moveDown(2);

                // Title (from template)
                doc.font('Helvetica-Bold').fontSize(14).text(template.title, { align: 'center', underline: true });
                doc.moveDown(2);

                // Render preamble
                doc.font('Helvetica').fontSize(10).lineGap(3);
                doc.text(template.preamble);
                doc.moveDown(1.5);

                // Render each article
                for (const article of template.articles) {
                    doc.font('Helvetica-Bold').fontSize(11).text(article.title);
                    doc.moveDown(0.3);
                    doc.font('Helvetica').fontSize(10).text(article.content);
                    doc.moveDown(1);
                }

                doc.moveDown(1);

                // Closing text from template
                doc.font('Helvetica').fontSize(10).text(template.closing);
                doc.moveDown(3);

                // Signatures
                const signatureY = doc.y;
                doc.font('Helvetica-Bold').text("L'Employeur", 50, signatureY);
                doc.text("L'Employé", 400, signatureY);
            }

            // Footer
            doc.fontSize(8).text('Page 1/1 - Document généré électroniquement', 50, 800, { align: 'center' });

            doc.end();
        });
    }
}

function calculateDuration(start: Date, end: Date): string {
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months >= 12) {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return remainingMonths > 0 ? `${years} an(s) et ${remainingMonths} mois` : `${years} an(s)`;
    }
    return `${months} mois`;
}
