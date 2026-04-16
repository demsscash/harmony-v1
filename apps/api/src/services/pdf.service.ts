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

        const fmtAmount = (n: number) => Number(n).toLocaleString('fr-FR').replace(/\s/g, ' ');

        const tableRow = (label: string, amount: number, currency: string, isDeduction = false) => {
            doc.rect(col1, y, W, 18).fill(y % 36 === 0 ? '#f1f5f9' : '#ffffff').stroke('#e2e8f0');
            doc.fillColor('#334155').font('Helvetica').fontSize(9).text(label, col1 + 8, y + 4);
            doc.fillColor(isDeduction ? '#dc2626' : '#1e293b').font('Helvetica-Bold').fontSize(9)
                .text(`${isDeduction ? '- ' : ''}${fmtAmount(amount)} ${currency}`, col2, y + 4, { width: 190, align: 'right' });
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

        tableHeader('RETENUES SALARIALES');
        tableRow('CNSS', Number(payslip.cnssEmployee), currency, true);
        tableRow('CNAM', Number(payslip.cnamEmployee), currency, true);
        tableRow('ITS', Number(payslip.itsAmount), currency, true);
        if (Number(payslip.attendanceDeductions) > 0) {
            tableRow('Absences', Number(payslip.attendanceDeductions), currency, true);
        }
        if (Number(payslip.advanceDeductions) > 0) {
            tableRow('Acompte sur salaire', Number(payslip.advanceDeductions), currency, true);
        }
        const deducDetails = payslip.deductionsDetail ? JSON.parse(payslip.deductionsDetail as string) : [];
        for (const ded of deducDetails) {
            if (ded.type === 'SANCTION') {
                tableRow(`  ${ded.name}`, ded.amount, currency, true);
            }
        }
        y += 8;

        // ── Charges patronales (info) ────────────────────────────
        tableHeader('CHARGES PATRONALES (non déduites du net)');
        tableRow('CNSS employeur', Number(payslip.cnssEmployer), currency);
        if (Number(payslip.mdtAmount) > 0) {
            tableRow('MDT', Number(payslip.mdtAmount), currency);
        }
        const totalEmployerCharges = Number(payslip.cnssEmployer) + Number(payslip.mdtAmount);
        tableRow('Total charges patronales', totalEmployerCharges, currency);
        y += 8;

        // ── Net à payer ──────────────────────────────────────────
        doc.rect(col1, y, W, 30).fill('#1e40af');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12)
            .text('NET À PAYER', col1 + 8, y + 8);
        doc.fontSize(14)
            .text(`${fmtAmount(Number(payslip.netSalary))} ${currency}`, col2, y + 7, { width: 190, align: 'right' });
        y += 40;

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
        const photoBuffer = getLogoBuffer(employee.photo);

        return new Promise((resolve, reject) => {
            const W = 243;
            const H = 390;
            const doc = new PDFDocument({ size: [W, H], margin: 0 });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pad = 18;
            const contentW = W - pad * 2;

            // ── Card border ───────────────────────────────────────────────
            doc.rect(0, 0, W, H).fill('#ffffff');
            doc.rect(0, 0, W, 4).fill('#1e3a5f');

            // ── Header: logo + company ────────────────────────────────────
            let hy = 14;
            if (badgeLogoBuffer) {
                try {
                    doc.image(badgeLogoBuffer, pad, hy, { height: 24, fit: [24, 24] });
                    doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(12)
                        .text((badgeTenant?.name || 'HARMONY').toUpperCase(), pad + 30, hy + 2);
                    doc.fillColor('#64748b').font('Helvetica').fontSize(6.5)
                        .text("CARTE PROFESSIONNELLE", pad + 30, hy + 16);
                } catch {
                    doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(12)
                        .text((badgeTenant?.name || 'HARMONY').toUpperCase(), pad, hy + 2);
                    doc.fillColor('#64748b').font('Helvetica').fontSize(6.5)
                        .text("CARTE PROFESSIONNELLE", pad, hy + 16);
                }
            } else {
                doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(12)
                    .text((badgeTenant?.name || 'HARMONY').toUpperCase(), pad, hy + 2);
                doc.fillColor('#64748b').font('Helvetica').fontSize(6.5)
                    .text("CARTE PROFESSIONNELLE", pad, hy + 16);
            }

            // ── Thin line separator ───────────────────────────────────────
            hy = 46;
            doc.moveTo(pad, hy).lineTo(W - pad, hy).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

            // ── Photo (rounded rectangle) ─────────────────────────────────
            const photoSize = 80;
            const photoX = (W - photoSize) / 2;
            const photoY = 56;

            if (photoBuffer) {
                try {
                    // Rounded clip for the photo
                    doc.save();
                    doc.roundedRect(photoX, photoY, photoSize, photoSize, 6).clip();
                    doc.image(photoBuffer, photoX, photoY, { width: photoSize, height: photoSize });
                    doc.restore();
                    // Border around the photo
                    doc.roundedRect(photoX, photoY, photoSize, photoSize, 6).strokeColor('#cbd5e1').lineWidth(1).stroke();
                } catch {
                    // Fallback: initials in rounded rect
                    doc.roundedRect(photoX, photoY, photoSize, photoSize, 6).fill('#f1f5f9');
                    doc.roundedRect(photoX, photoY, photoSize, photoSize, 6).strokeColor('#cbd5e1').lineWidth(1).stroke();
                    const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
                    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(28)
                        .text(initials, photoX, photoY + 26, { width: photoSize, align: 'center' });
                }
            } else {
                doc.roundedRect(photoX, photoY, photoSize, photoSize, 6).fill('#f1f5f9');
                doc.roundedRect(photoX, photoY, photoSize, photoSize, 6).strokeColor('#cbd5e1').lineWidth(1).stroke();
                const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
                doc.fillColor('#475569').font('Helvetica-Bold').fontSize(28)
                    .text(initials, photoX, photoY + 26, { width: photoSize, align: 'center' });
            }

            // ── Name ──────────────────────────────────────────────────────
            let y = photoY + photoSize + 12;
            const fullName = `${employee.firstName} ${employee.lastName}`;
            doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14)
                .text(fullName, pad, y, { align: 'center', width: contentW });
            y += 18;

            // ── Position ──────────────────────────────────────────────────
            doc.fillColor('#475569').font('Helvetica').fontSize(9)
                .text(employee.position, pad, y, { align: 'center', width: contentW });
            y += 14;

            // ── Department & Level ────────────────────────────────────────
            const subParts: string[] = [];
            if (employee.department) subParts.push(employee.department.name);
            if (employee.department?.type) subParts.push(employee.department.type);
            if (subParts.length > 0) {
                doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5)
                    .text(subParts.join('  ·  '), pad, y, { align: 'center', width: contentW });
                y += 12;
            }

            // ── Separator ─────────────────────────────────────────────────
            y += 6;
            doc.moveTo(pad, y).lineTo(W - pad, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
            y += 12;

            // ── Info rows ─────────────────────────────────────────────────
            const infoItems = [
                { label: 'MATRICULE', value: employee.matricule || '—' },
                { label: 'CONTRAT', value: employee.contractType },
                { label: "DATE D'EMBAUCHE", value: new Date(employee.hireDate).toLocaleDateString('fr-FR') },
            ];

            for (const item of infoItems) {
                // Label on left, value on right
                doc.fillColor('#94a3b8').font('Helvetica').fontSize(6.5)
                    .text(item.label, pad, y + 1);
                doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9)
                    .text(item.value, pad, y, { align: 'right', width: contentW });
                y += 18;
            }

            // ── Bottom accent bar + footer ────────────────────────────────
            doc.rect(0, H - 28, W, 28).fill('#f8fafc');
            doc.rect(0, H - 28, W, 0.5).fill('#e2e8f0');
            doc.rect(0, H - 4, W, 4).fill('#1e3a5f');

            doc.fillColor('#94a3b8').font('Helvetica').fontSize(5.5)
                .text(`${badgeTenant?.name || 'Harmony'}  ·  Accès Autorisé  ·  Strictement Personnel`, 0, H - 20, { align: 'center', width: W });

            doc.end();
        });
    }

    static async generateEmployeeContract(employeeId: string, tenantId: string): Promise<Buffer> {
        const employee = await prisma.employee.findFirst({
            where: { id: employeeId, tenantId },
            include: {
                department: true,
                grade: true,
                manager: { select: { firstName: true, lastName: true, position: true } },
            }
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
            const salaryFmt = Number(employee.baseSalary).toLocaleString('fr-FR').replace(/\s/g, ' ');

            // Add logo if available
            const contractLogoBuffer = getLogoBuffer(tenant?.logo);
            if (contractLogoBuffer) {
                try { doc.image(contractLogoBuffer, (595 - 60) / 2, 50, { height: 60, fit: [60, 60] }); doc.moveDown(4); } catch { /* skip */ }
            }

            if (templateContent) {
                // ── Custom template path ───────────────────────────────
                const genderPrefix = employee.gender === 'MALE' ? 'M.' : employee.gender === 'FEMALE' ? 'Mme' : 'M./Mme';
                const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

                // Build all replacement variables
                const customVars: Record<string, string> = {
                    EMPLOYEE_NAME: fullName,
                    GENDER_PREFIX: genderPrefix,
                    POSITION: employee.position,
                    DEPARTMENT: employee.department?.name || '',
                    START_DATE: startDate,
                    CONTRACT_TYPE: employee.contractType,
                    SALARY: salaryFmt,
                    CURRENCY: employee.currency || 'MRU',
                    MATRICULE: employee.matricule || '',
                    CIN: employee.cin || '',
                    DOB: employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('fr-FR') : '',
                    PHONE: employee.phone || '',
                    EMAIL: employee.email || '',
                    ADDRESS: employee.address || '',
                    GRADE: employee.grade?.name || '',
                    ORG_LEVEL: employee.department?.type || '',
                    MANAGER: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '',
                    MANAGER_POSITION: employee.manager?.position || '',
                    END_DATE: employee.contractEndDate ? new Date(employee.contractEndDate).toLocaleDateString('fr-FR') : '',
                    TRIAL_END: employee.trialEndDate ? new Date(employee.trialEndDate).toLocaleDateString('fr-FR') : '',
                    COMPANY_NAME: tenantName,
                    TODAY: today,
                };

                let customText = templateContent;

                // Normalize curly quotes to straight braces (copy-paste issue)
                customText = customText.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
                customText = customText.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
                customText = customText.replace(/\uFF5B/g, '{').replace(/\uFF5D/g, '}');

                for (const [key, value] of Object.entries(customVars)) {
                    customText = customText.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
                }

                // Remove lines that still have unreplaced empty variables
                customText = customText.replace(/^.*\{\{[A-Z_]+\}\}.*$\n?/gm, '');
                customText = customText.replace(/\n{3,}/g, '\n\n');

                // Header
                doc.font('Helvetica-Bold').fontSize(16).text(tenantName, { align: 'center' });
                doc.moveDown(0.5);
                doc.font('Helvetica').fontSize(10).text('Département des Ressources Humaines', { align: 'center' });
                doc.moveDown(2);

                // Title
                const title = `CONTRAT DE TRAVAIL ${employee.contractType.toUpperCase()}`;
                doc.font('Helvetica-Bold').fontSize(14).text(title, { align: 'center', underline: true });
                doc.moveDown(2);

                // Body
                doc.font('Helvetica').fontSize(11).lineGap(4);
                doc.text(customText);
                doc.moveDown(2);

                // Signatures
                doc.font('Helvetica').fontSize(10);
                doc.text(`Fait en deux exemplaires originaux, le ${today}`, { align: 'right' });
                doc.moveDown(3);

                const signatureY = doc.y;
                doc.font('Helvetica-Bold').text("L'Employeur", 50, signatureY);
                doc.text("L'Employé", 400, signatureY);
            } else {
                // ── Legal template path (Mauritanian labor law) ────────
                const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                const genderLabel = employee.gender === 'MALE' ? 'M.' : employee.gender === 'FEMALE' ? 'Mme' : 'M./Mme';
                const dobFormatted = employee.dateOfBirth ? `Né(e) le ${new Date(employee.dateOfBirth).toLocaleDateString('fr-FR')}` : '';
                const vars: Record<string, string> = {
                    COMPANY_NAME: tenantName,
                    EMPLOYEE_NAME: fullName,
                    GENDER_PREFIX: genderLabel,
                    POSITION: employee.position,
                    DEPARTMENT_LINE: employee.department ? ` au sein du département ${employee.department.name}` : '',
                    GRADE_LINE: employee.grade ? `Grade : ${employee.grade.name}` : '',
                    ORG_LEVEL_LINE: employee.department?.type ? `Type d'unité : ${employee.department.type}` : '',
                    MANAGER_LINE: employee.manager ? `Supérieur hiérarchique : ${employee.manager.firstName} ${employee.manager.lastName} (${employee.manager.position})` : '',
                    CIN_LINE: employee.cin ? `CIN / NNI : ${employee.cin}` : '',
                    DOB_LINE: dobFormatted,
                    ADDRESS_LINE: employee.address ? `Adresse : ${employee.address}` : '',
                    PHONE_LINE: employee.phone ? `Téléphone : ${employee.phone}` : '',
                    EMAIL_LINE: employee.email ? `Email : ${employee.email}` : '',
                    START_DATE: startDate,
                    END_DATE: employee.contractEndDate ? new Date(employee.contractEndDate).toLocaleDateString('fr-FR') : '—',
                    TRIAL_END: employee.trialEndDate ? new Date(employee.trialEndDate).toLocaleDateString('fr-FR') : '',
                    DURATION: employee.contractEndDate ? calculateDuration(new Date(employee.hireDate), new Date(employee.contractEndDate)) : '—',
                    SALARY: salaryFmt,
                    CURRENCY: employee.currency || 'MRU',
                    CITY: tenant?.address?.split(',')[0]?.trim() || 'Nouakchott',
                    TODAY: today,
                    CDD_REASON: 'Accroissement temporaire d\'activité',
                    MATRICULE: employee.matricule || '',
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
