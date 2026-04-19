import { Request, Response } from 'express';
import { SignatureService } from '../services/signature.service';

export const getSignatures = async (req: Request, res: Response) => {
    try {
        const { status, employeeId } = req.query;
        const data = await SignatureService.getAll(req.tenant?.id!, { status: status as string, employeeId: employeeId as string });
        res.json({ success: true, data });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const getSignatureById = async (req: Request, res: Response) => {
    try {
        const data = await SignatureService.getById(String(req.params.id), req.tenant?.id!);
        if (!data) { res.status(404).json({ success: false, error: 'Demande introuvable' }); return; }
        res.json({ success: true, data });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

// Admin creates a signature request (sends doc to employee)
export const createSignatureRequest = async (req: Request, res: Response) => {
    try {
        const data = await SignatureService.createFromAdmin(req.tenant?.id!, req.user?.userId!, req.body);
        res.status(201).json({ success: true, data });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

// Employee requests a document (attestation, etc.)
export const requestDocument = async (req: Request, res: Response) => {
    try {
        const employeeId = req.user?.employeeId;
        if (!employeeId) { res.status(403).json({ success: false, error: 'Accès réservé aux employés' }); return; }
        const data = await SignatureService.createFromEmployee(req.tenant?.id!, employeeId, req.user?.userId!, req.body);
        res.status(201).json({ success: true, data });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

// Employee signs
export const employeeSign = async (req: Request, res: Response) => {
    try {
        const employeeId = req.user?.employeeId;
        if (!employeeId) { res.status(403).json({ success: false, error: 'Accès réservé aux employés' }); return; }
        const { signatureData } = req.body;
        if (!signatureData) { res.status(400).json({ success: false, error: 'Signature requise' }); return; }
        const data = await SignatureService.employeeSign(String(req.params.id), req.tenant?.id!, employeeId, signatureData);
        res.json({ success: true, data });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

// Admin signs (DUAL after employee, or both at once)
export const adminSign = async (req: Request, res: Response) => {
    try {
        const { adminSignature, employeeSignature } = req.body;
        if (!adminSignature) { res.status(400).json({ success: false, error: 'Signature admin requise' }); return; }
        const data = await SignatureService.adminSign(String(req.params.id), req.tenant?.id!, req.user?.userId!, adminSignature, employeeSignature);
        res.json({ success: true, data });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

// Admin validates employee document request + signs
export const validateAndSign = async (req: Request, res: Response) => {
    try {
        const { adminSignature } = req.body;
        if (!adminSignature) { res.status(400).json({ success: false, error: 'Signature admin requise' }); return; }
        const data = await SignatureService.validateAndSign(String(req.params.id), req.tenant?.id!, req.user?.userId!, adminSignature);
        res.json({ success: true, data });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

// Reject
export const rejectSignature = async (req: Request, res: Response) => {
    try {
        const data = await SignatureService.reject(String(req.params.id), req.tenant?.id!, req.user?.userId!, req.body.reason);
        res.json({ success: true, data });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

// Cancel
export const cancelSignature = async (req: Request, res: Response) => {
    try {
        const data = await SignatureService.cancel(String(req.params.id), req.tenant?.id!);
        res.json({ success: true, data });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

// Download PDF (with embedded signatures)
export const downloadSignedPdf = async (req: Request, res: Response) => {
    try {
        const buffer = await SignatureService.getSignedPdf(String(req.params.id), req.tenant?.id!);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="document_${req.params.id}.pdf"`);
        res.send(buffer);
    } catch (error: any) {
        const status = error.message.includes('introuvable') ? 404 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
};

// Download raw PDF (unsigned, for preview)
export const downloadRawPdf = async (req: Request, res: Response) => {
    try {
        const reqData = await SignatureService.getById(String(req.params.id), req.tenant?.id!);
        if (!reqData) { res.status(404).json({ success: false, error: 'Demande introuvable' }); return; }
        if (!reqData.pdfData) { res.status(404).json({ success: false, error: 'Aucun PDF disponible' }); return; }
        const buffer = Buffer.from(reqData.pdfData, 'base64');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="preview_${req.params.id}.pdf"`);
        res.send(buffer);
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};
