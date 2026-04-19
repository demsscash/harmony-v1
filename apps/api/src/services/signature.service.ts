import { PrismaClient, SignatureStatus, SignatureMode } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PdfService } from './pdf.service';
import { generateAttestationPdf } from './pdf.service';

const prisma = new PrismaClient();

export class SignatureService {
    // ── List ─────────────────────────────────────────────────
    static async getAll(tenantId: string, filters?: { status?: string; employeeId?: string }) {
        const where: any = { tenantId };
        if (filters?.status) where.status = filters.status;
        if (filters?.employeeId) where.employeeId = filters.employeeId;

        return prisma.signatureRequest.findMany({
            where,
            include: { employee: { select: { id: true, firstName: true, lastName: true, matricule: true, photo: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getById(id: string, tenantId: string) {
        return prisma.signatureRequest.findFirst({
            where: { id, tenantId },
            include: { employee: { select: { id: true, firstName: true, lastName: true, matricule: true, photo: true, position: true } } },
        });
    }

    // ── Workflow 1: Admin envoie un document à signer ────────
    static async createFromAdmin(tenantId: string, userId: string, data: {
        employeeId: string;
        title: string;
        description?: string;
        documentType: string;
        signatureMode: string;
        expiresAt?: string;
    }) {
        // Validate employee
        const emp = await prisma.employee.findFirst({ where: { id: data.employeeId, tenantId } });
        if (!emp) throw new Error('Employé introuvable');

        // Generate PDF based on document type
        let pdfBuffer: Buffer | null = null;
        if (data.documentType === 'CONTRACT') {
            pdfBuffer = await PdfService.generateEmployeeContract(data.employeeId, tenantId);
        } else if (data.documentType === 'ATTESTATION') {
            pdfBuffer = await generateAttestationPdf(data.employeeId, tenantId);
        }

        const pdfData = pdfBuffer ? pdfBuffer.toString('base64') : null;

        return prisma.signatureRequest.create({
            data: {
                tenantId,
                employeeId: data.employeeId,
                title: data.title,
                description: data.description,
                documentType: data.documentType as any,
                signatureMode: (data.signatureMode || 'EMPLOYEE_ONLY') as SignatureMode,
                pdfData,
                status: 'PENDING',
                initiatedBy: 'ADMIN',
                requestedBy: userId,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            },
            include: { employee: { select: { id: true, firstName: true, lastName: true } } },
        });
    }

    // ── Workflow 2: Employé demande un document ──────────────
    static async createFromEmployee(tenantId: string, employeeId: string, userId: string, data: {
        title: string;
        description?: string;
        documentType: string;
    }) {
        return prisma.signatureRequest.create({
            data: {
                tenantId,
                employeeId,
                title: data.title,
                description: data.description,
                documentType: data.documentType as any,
                signatureMode: 'ADMIN_ONLY',
                status: 'AWAITING_VALIDATION',
                initiatedBy: 'EMPLOYEE',
                requestedBy: userId,
            },
        });
    }

    // ── Admin valide une demande employé → génère + signe ────
    static async validateAndSign(id: string, tenantId: string, userId: string, adminSignature: string) {
        const req = await prisma.signatureRequest.findFirst({ where: { id, tenantId } });
        if (!req) throw new Error('Demande introuvable');
        if (req.status !== 'AWAITING_VALIDATION') throw new Error('Cette demande n\'est pas en attente de validation');

        // Generate the PDF
        let pdfBuffer: Buffer | null = null;
        if (req.documentType === 'ATTESTATION') {
            pdfBuffer = await generateAttestationPdf(req.employeeId, tenantId);
        } else if (req.documentType === 'CONTRACT') {
            pdfBuffer = await PdfService.generateEmployeeContract(req.employeeId, tenantId);
        }

        return prisma.signatureRequest.update({
            where: { id },
            data: {
                status: 'SIGNED',
                pdfData: pdfBuffer ? pdfBuffer.toString('base64') : null,
                adminSignature,
                validatedBy: userId,
                adminSignedAt: new Date(),
            },
        });
    }

    // ── Admin rejette une demande employé ─────────────────────
    static async reject(id: string, tenantId: string, userId: string, reason?: string) {
        const req = await prisma.signatureRequest.findFirst({ where: { id, tenantId } });
        if (!req) throw new Error('Demande introuvable');
        if (req.status !== 'AWAITING_VALIDATION' && req.status !== 'PENDING') throw new Error('Impossible de rejeter');

        return prisma.signatureRequest.update({
            where: { id },
            data: { status: 'REJECTED', validatedBy: userId, rejectionReason: reason },
        });
    }

    // ── Employé signe ────────────────────────────────────────
    static async employeeSign(id: string, tenantId: string, employeeId: string, signatureData: string) {
        const req = await prisma.signatureRequest.findFirst({ where: { id, tenantId } });
        if (!req) throw new Error('Demande introuvable');
        if (req.employeeId !== employeeId) throw new Error('Accès non autorisé');
        if (req.status !== 'PENDING') throw new Error('Ce document n\'est pas en attente de signature');
        if (req.expiresAt && new Date() > req.expiresAt) throw new Error('Ce document a expiré');

        const newStatus: SignatureStatus = req.signatureMode === 'DUAL' ? 'AWAITING_ADMIN' : 'SIGNED';

        return prisma.signatureRequest.update({
            where: { id },
            data: {
                employeeSignature: signatureData,
                employeeSignedAt: new Date(),
                status: newStatus,
            },
        });
    }

    // ── Admin signe (DUAL — après l'employé, ou en même temps) ─
    static async adminSign(id: string, tenantId: string, userId: string, adminSignature: string, employeeSignature?: string) {
        const req = await prisma.signatureRequest.findFirst({ where: { id, tenantId } });
        if (!req) throw new Error('Demande introuvable');

        // DUAL: admin signe après l'employé
        if (req.signatureMode === 'DUAL' && req.status === 'AWAITING_ADMIN') {
            return prisma.signatureRequest.update({
                where: { id },
                data: {
                    adminSignature,
                    adminSignedAt: new Date(),
                    validatedBy: userId,
                    status: 'SIGNED',
                },
            });
        }

        // DUAL: les deux signent en même temps (admin saisit les deux)
        if (req.signatureMode === 'DUAL' && req.status === 'PENDING' && employeeSignature) {
            return prisma.signatureRequest.update({
                where: { id },
                data: {
                    employeeSignature,
                    employeeSignedAt: new Date(),
                    adminSignature,
                    adminSignedAt: new Date(),
                    validatedBy: userId,
                    status: 'SIGNED',
                },
            });
        }

        // EMPLOYEE_ONLY: admin ne devrait pas signer
        throw new Error('Action non autorisée pour ce type de signature');
    }

    // ── Annuler ──────────────────────────────────────────────
    static async cancel(id: string, tenantId: string) {
        const req = await prisma.signatureRequest.findFirst({ where: { id, tenantId } });
        if (!req) throw new Error('Demande introuvable');
        if (req.status === 'SIGNED') throw new Error('Impossible d\'annuler un document signé');

        return prisma.signatureRequest.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }

    // ── Télécharger le PDF (avec signatures incrustées) ──────
    static async getSignedPdf(id: string, tenantId: string): Promise<Buffer> {
        const req = await prisma.signatureRequest.findFirst({
            where: { id, tenantId },
            include: { employee: { select: { firstName: true, lastName: true } } },
        });
        if (!req) throw new Error('Demande introuvable');
        if (!req.pdfData) throw new Error('Aucun PDF disponible');

        const pdfBuffer = Buffer.from(req.pdfData, 'base64');

        // If no signatures, return raw PDF
        if (!req.employeeSignature && !req.adminSignature) return pdfBuffer;

        // Embed signatures into a new PDF
        return this.embedSignatures(pdfBuffer, req);
    }

    private static embedSignatures(originalPdf: Buffer, req: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];
            doc.on('data', (c: Buffer) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.font('Helvetica-Bold').fontSize(12).text('DOCUMENT SIGNÉ', { align: 'center' });
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(10).text(req.title, { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(8).fillColor('#64748b').text(`Réf: ${req.id}`, { align: 'center' });
            doc.moveDown(1);

            // Document content placeholder
            doc.fillColor('#1e293b').font('Helvetica').fontSize(10);
            doc.text(`Document : ${req.title}`);
            doc.text(`Type : ${req.documentType}`);
            doc.text(`Employé : ${req.employee?.firstName} ${req.employee?.lastName}`);
            if (req.description) doc.text(`Description : ${req.description}`);
            doc.moveDown(2);

            doc.text('Ce document a été signé électroniquement par les parties ci-dessous.');
            doc.moveDown(2);

            // Signatures zone
            const sigY = doc.y;
            const pageW = 495;

            // Employee signature (left)
            if (req.employeeSignature) {
                doc.font('Helvetica-Bold').fontSize(9).text("L'Employé", 50, sigY);
                doc.font('Helvetica').fontSize(8).text(`${req.employee?.firstName} ${req.employee?.lastName}`, 50, sigY + 12);
                if (req.employeeSignedAt) doc.text(`Signé le ${new Date(req.employeeSignedAt).toLocaleDateString('fr-FR')}`, 50, sigY + 22);
                try {
                    const sigBuf = Buffer.from(req.employeeSignature.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                    doc.image(sigBuf, 50, sigY + 35, { width: 150, height: 60 });
                } catch { /* skip */ }
            }

            // Admin signature (right)
            if (req.adminSignature) {
                doc.font('Helvetica-Bold').fontSize(9).text("L'Employeur", 320, sigY);
                doc.font('Helvetica').fontSize(8).text('Direction / RH', 320, sigY + 12);
                if (req.adminSignedAt) doc.text(`Signé le ${new Date(req.adminSignedAt).toLocaleDateString('fr-FR')}`, 320, sigY + 22);
                try {
                    const sigBuf = Buffer.from(req.adminSignature.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                    doc.image(sigBuf, 320, sigY + 35, { width: 150, height: 60 });
                } catch { /* skip */ }
            }

            // Footer
            doc.fontSize(7).fillColor('#94a3b8')
                .text(`Document signé électroniquement — ${new Date().toLocaleDateString('fr-FR')} — Réf: ${req.id}`, 50, 780, { align: 'center', width: pageW });

            doc.end();
        });
    }
}
