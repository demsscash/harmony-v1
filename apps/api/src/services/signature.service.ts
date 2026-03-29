import { PrismaClient, SignatureStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { generateAttestationPdf, generateLeaveRequestPdf } from './pdf.service';
import { PdfService } from './pdf.service';

const prisma = new PrismaClient();

export class SignatureService {
    // Create a signature request (HR/Admin creates for employee)
    static async createRequest(data: {
        tenantId: string;
        employeeId: string;
        documentType: string;
        title: string;
        description?: string;
        requestedBy: string;
        expiresAt?: Date;
    }) {
        // Verify employee belongs to tenant
        const employee = await prisma.employee.findFirst({
            where: { id: data.employeeId, tenantId: data.tenantId }
        });
        if (!employee) throw new Error('Employé introuvable');

        return prisma.signatureRequest.create({
            data: {
                tenantId: data.tenantId,
                employeeId: data.employeeId,
                documentType: data.documentType as any,
                title: data.title,
                description: data.description,
                requestedBy: data.requestedBy,
                expiresAt: data.expiresAt,
            },
            include: { employee: true },
        });
    }

    // Get all signature requests for a tenant
    static async getAll(tenantId: string, filters?: { status?: string; employeeId?: string }) {
        const where: any = { tenantId };
        if (filters?.status) where.status = filters.status;
        if (filters?.employeeId) where.employeeId = filters.employeeId;

        return prisma.signatureRequest.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, position: true, matricule: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Get signature requests for a specific employee (for employee portal)
    static async getForEmployee(employeeId: string, tenantId: string) {
        return prisma.signatureRequest.findMany({
            where: { employeeId, tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Get a single signature request by ID
    static async getById(id: string, tenantId: string) {
        const request = await prisma.signatureRequest.findFirst({
            where: { id, tenantId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, position: true, matricule: true, department: true } },
            },
        });
        if (!request) throw new Error('Demande de signature introuvable');
        return request;
    }

    // Employee signs a document
    static async sign(id: string, tenantId: string, employeeId: string, signatureData: string) {
        const request = await prisma.signatureRequest.findFirst({
            where: { id, tenantId, employeeId },
        });

        if (!request) throw new Error('Demande de signature introuvable');
        if (request.status !== 'PENDING') throw new Error('Cette demande a déjà été traitée');
        if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
            throw new Error('Cette demande de signature a expiré');
        }

        return prisma.signatureRequest.update({
            where: { id },
            data: {
                status: 'SIGNED',
                signatureData,
                signedAt: new Date(),
            },
            include: { employee: true },
        });
    }

    // Cancel a signature request
    static async cancel(id: string, tenantId: string) {
        const request = await prisma.signatureRequest.findFirst({
            where: { id, tenantId },
        });
        if (!request) throw new Error('Demande de signature introuvable');
        if (request.status === 'SIGNED') throw new Error('Impossible d\'annuler une signature déjà effectuée');

        return prisma.signatureRequest.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }

    // Send reminder (update reminderSentAt)
    static async sendReminder(id: string, tenantId: string) {
        const request = await prisma.signatureRequest.findFirst({
            where: { id, tenantId, status: 'PENDING' },
        });
        if (!request) throw new Error('Demande de signature introuvable ou déjà traitée');

        return prisma.signatureRequest.update({
            where: { id },
            data: { reminderSentAt: new Date() },
        });
    }

    // Generate the unsigned PDF for a signature request
    static async generateDocument(id: string, tenantId: string): Promise<Buffer> {
        const request = await prisma.signatureRequest.findFirst({
            where: { id, tenantId },
            include: { employee: { include: { department: true } } },
        });
        if (!request) throw new Error('Demande de signature introuvable');

        const employee = request.employee;

        switch (request.documentType) {
            case 'CONTRACT':
                return PdfService.generateEmployeeContract(employee.id, tenantId);
            case 'ATTESTATION':
                return generateAttestationPdf(employee.id, tenantId);
            case 'BADGE':
                return PdfService.generateEmployeeBadge(employee.id, tenantId);
            default:
                // Generic document with title + description
                return this.generateGenericDocument(request, employee, tenantId);
        }
    }

    // Generate generic document for OTHER/PAYSLIP/JUSTIFICATION types
    private static async generateGenericDocument(request: any, employee: any, tenantId: string): Promise<Buffer> {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 60 });
            const chunks: Buffer[] = [];
            doc.on('data', (c: Buffer) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const W = 595 - 120;
            const L = 60;

            // Header
            doc.rect(0, 0, 595, 70).fill('#1e293b');
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15)
                .text((tenant?.name || 'HARMONY').toUpperCase(), L, 18, { width: W });
            doc.fillColor('#94a3b8').font('Helvetica').fontSize(8.5)
                .text('Document officiel', L, 40, { width: W });

            let y = 90;

            // Title
            doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(16)
                .text(request.title.toUpperCase(), L, y, { width: W, align: 'center' });
            y += 32;
            doc.moveTo(L, y).lineTo(L + W, y).strokeColor('#1e40af').lineWidth(2).stroke();
            y += 20;

            // Employee info
            doc.fillColor('#1e293b').font('Helvetica').fontSize(11);
            doc.text(`Employé : ${employee.firstName} ${employee.lastName}`, L, y);
            y += 18;
            doc.text(`Matricule : ${employee.matricule || '—'}`, L, y);
            y += 18;
            doc.text(`Poste : ${employee.position || '—'}`, L, y);
            y += 30;

            // Description
            if (request.description) {
                doc.fillColor('#334155').font('Helvetica').fontSize(11).lineGap(4);
                doc.text(request.description, L, y, { width: W });
            }

            // Signature placeholder
            y = 650;
            doc.moveTo(L, y).lineTo(L + W, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
            y += 16;
            doc.fillColor('#64748b').font('Helvetica').fontSize(9)
                .text('Signature de l\'employé :', L, y);
            y += 12;
            doc.rect(L, y, 200, 80).stroke('#e2e8f0');
            doc.fillColor('#cbd5e1').font('Helvetica').fontSize(8)
                .text('(signature numérique)', L + 50, y + 35);

            // Footer
            doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5)
                .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} — ${tenant?.name || ''}`, L, 800, { width: W, align: 'center' });

            doc.end();
        });
    }

    // Generate signed PDF with the signature image embedded
    static async generateSignedPdf(id: string, tenantId: string): Promise<Buffer> {
        const request = await prisma.signatureRequest.findFirst({
            where: { id, tenantId, status: 'SIGNED' },
            include: { employee: { include: { department: true } } },
        });
        if (!request) throw new Error('Document signé introuvable');
        if (!request.signatureData) throw new Error('Aucune signature trouvée');

        // Get the base document
        const basePdf = await this.generateDocument(id, tenantId);

        // Now create a new PDF that includes the signature overlay
        return this.embedSignatureInPdf(request, tenantId);
    }

    // Build PDF with signature embedded
    private static async embedSignatureInPdf(request: any, tenantId: string): Promise<Buffer> {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const employee = request.employee;
        const signatureBase64 = request.signatureData.split(',')[1];
        const signatureBuffer = Buffer.from(signatureBase64, 'base64');

        // Helper for tenant logo
        let logoBuffer: Buffer | null = null;
        if (tenant?.logo?.startsWith('data:image/')) {
            try {
                logoBuffer = Buffer.from(tenant.logo.split(',')[1], 'base64');
            } catch { /* skip */ }
        }

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 60 });
            const chunks: Buffer[] = [];
            doc.on('data', (c: Buffer) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const W = 595 - 120;
            const L = 60;

            // Header
            doc.rect(0, 0, 595, 70).fill('#1e293b');
            let hdrX = L;
            if (logoBuffer) {
                try { doc.image(logoBuffer, L, 10, { height: 45, fit: [45, 45] }); hdrX = L + 55; } catch { /* skip */ }
            }
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15)
                .text((tenant?.name || 'HARMONY').toUpperCase(), hdrX, 18, { width: W - (hdrX - L) });
            doc.fillColor('#94a3b8').font('Helvetica').fontSize(8.5)
                .text('Document officiel — SIGNÉ', hdrX, 40, { width: W - (hdrX - L) });

            // Signed badge
            doc.fillColor('#10b981').font('Helvetica-Bold').fontSize(9)
                .text('✓ SIGNÉ', L, 40, { width: W, align: 'right' });

            let y = 90;

            // Title
            doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(16)
                .text(request.title.toUpperCase(), L, y, { width: W, align: 'center' });
            y += 32;
            doc.moveTo(L, y).lineTo(L + W, y).strokeColor('#1e40af').lineWidth(2).stroke();
            y += 20;

            // Employee info
            doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
                .text('INFORMATIONS DE L\'EMPLOYÉ', L, y);
            y += 16;
            doc.rect(L, y, W, 70).fill('#f8fafc').stroke('#e2e8f0');
            doc.fillColor('#64748b').font('Helvetica').fontSize(9);
            doc.text(`Nom & Prénom :`, L + 12, y + 10).font('Helvetica-Bold').fillColor('#1e293b')
                .text(`${employee.firstName} ${employee.lastName}`, L + 100, y + 10);
            doc.fillColor('#64748b').font('Helvetica')
                .text(`Matricule :`, L + 12, y + 26).font('Helvetica-Bold').fillColor('#1e293b')
                .text(employee.matricule || '—', L + 100, y + 26);
            doc.fillColor('#64748b').font('Helvetica')
                .text(`Poste :`, L + 12, y + 42).font('Helvetica-Bold').fillColor('#1e293b')
                .text(employee.position || '—', L + 100, y + 42);
            if (employee.department) {
                doc.fillColor('#64748b').font('Helvetica')
                    .text(`Département :`, L + 12, y + 58).font('Helvetica-Bold').fillColor('#1e293b')
                    .text(employee.department.name, L + 100, y + 58);
            }
            y += 86;

            // Document type + details
            const docTypeLabels: Record<string, string> = {
                CONTRACT: 'Contrat de travail', ATTESTATION: 'Attestation de travail',
                PAYSLIP: 'Bulletin de paie', BADGE: 'Badge employé', OTHER: 'Autre document',
                JUSTIFICATION: 'Justificatif',
            };
            doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
                .text('DÉTAILS DU DOCUMENT', L, y);
            y += 16;
            doc.fillColor('#64748b').font('Helvetica').fontSize(9)
                .text(`Type : ${docTypeLabels[request.documentType] || request.documentType}`, L, y);
            y += 16;
            doc.text(`Date de demande : ${new Date(request.requestedAt).toLocaleDateString('fr-FR')}`, L, y);
            y += 16;
            doc.text(`Date de signature : ${new Date(request.signedAt).toLocaleDateString('fr-FR')}`, L, y);
            y += 20;

            if (request.description) {
                doc.fillColor('#334155').font('Helvetica').fontSize(10).lineGap(4)
                    .text(request.description, L, y, { width: W });
                y += 40;
            }

            // Signature section
            y = Math.max(y + 20, 560);
            doc.moveTo(L, y).lineTo(L + W, y).strokeColor('#1e40af').lineWidth(1).stroke();
            y += 16;

            doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
                .text('SIGNATURE NUMÉRIQUE', L, y);
            y += 20;

            // Embed the actual signature image
            try {
                doc.image(signatureBuffer, L, y, { width: 200, height: 80 });
            } catch {
                doc.fillColor('#ef4444').font('Helvetica').fontSize(9)
                    .text('[Erreur de chargement de la signature]', L, y);
            }

            // Signature metadata
            doc.fillColor('#64748b').font('Helvetica').fontSize(8)
                .text(`Signé par : ${employee.firstName} ${employee.lastName}`, L + 220, y + 10);
            doc.text(`Le : ${new Date(request.signedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, L + 220, y + 24);
            doc.text(`Réf : ${request.id.slice(0, 8).toUpperCase()}`, L + 220, y + 38);

            y += 100;

            // Footer
            doc.fillColor('#94a3b8').font('Helvetica').fontSize(7.5)
                .text(`Document signé électroniquement — ${tenant?.name || ''} — Réf. ${request.id.slice(0, 8).toUpperCase()} — ${new Date().toISOString()}`, L, 800, { width: W, align: 'center' });

            doc.end();
        });
    }

    // Get stats for dashboard
    static async getStats(tenantId: string) {
        const [total, pending, signed, expired] = await Promise.all([
            prisma.signatureRequest.count({ where: { tenantId } }),
            prisma.signatureRequest.count({ where: { tenantId, status: 'PENDING' } }),
            prisma.signatureRequest.count({ where: { tenantId, status: 'SIGNED' } }),
            prisma.signatureRequest.count({ where: { tenantId, status: 'EXPIRED' } }),
        ]);
        return { total, pending, signed, expired };
    }
}
