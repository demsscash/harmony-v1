import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SignatureService } from '../services/signature.service';

const prisma = new PrismaClient();

async function resolveEmployeeId(user: any): Promise<string | null> {
    if (user.employeeId) return user.employeeId;
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { employeeId: true } });
    return dbUser?.employeeId || null;
}

export const createSignatureRequest = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { employeeId, documentType, title, description, expiresAt } = req.body;

        if (!employeeId || !title) {
            return res.status(400).json({ success: false, error: 'employeeId et title sont requis' });
        }

        const request = await SignatureService.createRequest({
            tenantId,
            employeeId,
            documentType: documentType || 'CONTRACT',
            title,
            description,
            requestedBy: (req as any).user.userId,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        });

        res.status(201).json({ success: true, data: request });
    } catch (err: any) {
        res.status(400).json({ success: false, error: err.message });
    }
};

export const getSignatureRequests = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { status, employeeId } = req.query;
        const requests = await SignatureService.getAll(tenantId, {
            status: status as string,
            employeeId: employeeId as string,
        });
        res.json({ success: true, data: requests });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const getSignatureRequestById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const request = await SignatureService.getById(String(req.params.id), tenantId);
        res.json({ success: true, data: request });
    } catch (err: any) {
        const status = err.message.includes('introuvable') ? 404 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
};

export const getMySignatureRequests = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const user = (req as any).user;
        const employeeId = await resolveEmployeeId(user);

        // ADMIN/HR see all requests for the tenant
        if (!employeeId && (user.role === 'ADMIN' || user.role === 'HR')) {
            const requests = await SignatureService.getAll(tenantId);
            return res.json({ success: true, data: requests });
        }

        if (!employeeId) {
            return res.status(400).json({ success: false, error: 'Aucun employé lié à ce compte' });
        }
        const requests = await SignatureService.getForEmployee(employeeId, tenantId);
        res.json({ success: true, data: requests });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const signDocument = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const user = (req as any).user;
        const { signatureData } = req.body;

        if (!signatureData) {
            return res.status(400).json({ success: false, error: 'Signature requise' });
        }

        // For ADMIN/HR: use the employeeId from the signature request itself
        // For EMPLOYEE: resolve from JWT/DB
        let employeeId = await resolveEmployeeId(user);
        if (!employeeId && (user.role === 'ADMIN' || user.role === 'HR')) {
            const request = await prisma.signatureRequest.findFirst({
                where: { id: String(req.params.id), tenantId },
                select: { employeeId: true },
            });
            if (!request) {
                return res.status(404).json({ success: false, error: 'Demande introuvable' });
            }
            employeeId = request.employeeId;
        }

        if (!employeeId) {
            return res.status(400).json({ success: false, error: 'Aucun employé lié à ce compte' });
        }

        const result = await SignatureService.sign(String(req.params.id), tenantId, employeeId, signatureData);
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(400).json({ success: false, error: err.message });
    }
};

export const cancelSignatureRequest = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const result = await SignatureService.cancel(String(req.params.id), tenantId);
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(400).json({ success: false, error: err.message });
    }
};

export const sendSignatureReminder = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const result = await SignatureService.sendReminder(String(req.params.id), tenantId);
        res.json({ success: true, data: result });
    } catch (err: any) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// Preview the unsigned document PDF
export const previewDocument = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const pdfBuffer = await SignatureService.generateDocument(String(req.params.id), tenantId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        res.send(pdfBuffer);
    } catch (err: any) {
        const status = err.message.includes('introuvable') ? 404 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
};

// Download the signed PDF with signature embedded
export const downloadSignedPdf = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const pdfBuffer = await SignatureService.generateSignedPdf(String(req.params.id), tenantId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="document_signe.pdf"');
        res.send(pdfBuffer);
    } catch (err: any) {
        const status = err.message.includes('introuvable') ? 404 : 500;
        res.status(status).json({ success: false, error: err.message });
    }
};

export const getSignatureStats = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const stats = await SignatureService.getStats(tenantId);
        res.json({ success: true, data: stats });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
};
