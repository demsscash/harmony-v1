import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get tenant and its settings
export const getSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(400).json({ success: false, error: 'Tenant context missing' });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { settings: true },
        });

        if (!tenant) {
            return res.status(404).json({ success: false, error: 'Tenant not found' });
        }

        res.json({ success: true, data: tenant });
    } catch (error: any) {
        console.error('GetSettings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

// Update tenant and its settings
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(400).json({ success: false, error: 'Tenant context missing' });
        }

        const {
            name, address, phone, email, currency,
            leaveCarryOver, maxCarryOverDays,
            fiscalYearStart, workDaysPerWeek, weekStartDay,
            defaultLeaveDays,
            contractTemplate
        } = req.body;

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                name,
                address,
                phone,
                email,
                currency,
                leaveCarryOver,
                maxCarryOverDays: maxCarryOverDays ? parseInt(maxCarryOverDays, 10) : null,
                settings: {
                    upsert: {
                        create: {
                            fiscalYearStart: fiscalYearStart ? parseInt(fiscalYearStart, 10) : 1,
                            workDaysPerWeek: workDaysPerWeek ? parseInt(workDaysPerWeek, 10) : 5,
                            weekStartDay: weekStartDay ? parseInt(weekStartDay, 10) : 1,
                            defaultLeaveDays: defaultLeaveDays ? parseInt(defaultLeaveDays, 10) : 24,
                            contractTemplate: contractTemplate !== undefined ? contractTemplate : null,
                        },
                        update: {
                            fiscalYearStart: fiscalYearStart ? parseInt(fiscalYearStart, 10) : undefined,
                            workDaysPerWeek: workDaysPerWeek ? parseInt(workDaysPerWeek, 10) : undefined,
                            weekStartDay: weekStartDay ? parseInt(weekStartDay, 10) : undefined,
                            defaultLeaveDays: defaultLeaveDays ? parseInt(defaultLeaveDays, 10) : undefined,
                            contractTemplate: contractTemplate !== undefined ? contractTemplate : undefined,
                        }
                    }
                }
            },
            include: { settings: true }
        });

        res.json({ success: true, data: updatedTenant });
    } catch (error: any) {
        console.error('UpdateSettings error:', error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
};

// ==========================================
// TAX CONFIG (CNSS / ITS)
// ==========================================

const DEFAULT_ITS_BRACKETS = [
    { min: 0, max: 9000, rate: 0 },
    { min: 9000, max: 21000, rate: 0.15 },
    { min: 21000, max: 50000, rate: 0.25 },
    { min: 50000, max: null, rate: 0.40 },
];

export const getTaxConfig = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(400).json({ success: false, error: 'Tenant context missing' });
        }

        const config = await prisma.taxConfig.findUnique({ where: { tenantId } });
        res.json({
            success: true,
            data: config || {
                tenantId,
                cnssEmployeeRate: 0.01,
                cnssEmployerRate: 0.13,
                cnssCeiling: 70000,
                itsBrackets: DEFAULT_ITS_BRACKETS,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateTaxConfig = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(400).json({ success: false, error: 'Tenant context missing' });
        }

        const { cnssEmployeeRate, cnssEmployerRate, cnssCeiling, cnamEmployeeRate, cnamCeiling, mdtRate, itsBrackets } = req.body;

        const config = await prisma.taxConfig.upsert({
            where: { tenantId },
            create: {
                tenantId,
                cnssEmployeeRate: cnssEmployeeRate ?? 0.01,
                cnssEmployerRate: cnssEmployerRate ?? 0.13,
                cnssCeiling: cnssCeiling ?? 70000,
                cnamEmployeeRate: cnamEmployeeRate ?? 0,
                cnamCeiling: cnamCeiling ?? 70000,
                mdtRate: mdtRate ?? 0.0025,
                itsBrackets: itsBrackets ?? DEFAULT_ITS_BRACKETS,
            },
            update: {
                cnssEmployeeRate: cnssEmployeeRate ?? undefined,
                cnssEmployerRate: cnssEmployerRate ?? undefined,
                cnssCeiling: cnssCeiling ?? undefined,
                cnamEmployeeRate: cnamEmployeeRate ?? undefined,
                cnamCeiling: cnamCeiling ?? undefined,
                mdtRate: mdtRate ?? undefined,
                itsBrackets: itsBrackets ?? undefined,
            },
        });

        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// LOGO MANAGEMENT
// ==========================================

const MAX_LOGO_SIZE = 500 * 1024; // 500KB in characters (base64 string length)

export const uploadLogo = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(400).json({ success: false, error: 'Tenant context missing' });
        }

        const { logo } = req.body;

        if (!logo || typeof logo !== 'string') {
            return res.status(400).json({ success: false, error: 'Logo data URL is required' });
        }

        if (!logo.startsWith('data:image/')) {
            return res.status(400).json({ success: false, error: 'Invalid format: must be a data:image/* URL' });
        }

        if (logo.length > MAX_LOGO_SIZE) {
            return res.status(400).json({ success: false, error: 'Logo too large (max ~500KB)' });
        }

        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { logo },
            select: { id: true, logo: true },
        });

        res.json({ success: true, data: { logo: updatedTenant.logo } });
    } catch (error: any) {
        console.error('UploadLogo error:', error);
        res.status(500).json({ success: false, error: 'Failed to upload logo' });
    }
};

export const deleteLogo = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(400).json({ success: false, error: 'Tenant context missing' });
        }

        await prisma.tenant.update({
            where: { id: tenantId },
            data: { logo: null },
        });

        res.json({ success: true, data: { logo: null } });
    } catch (error: any) {
        console.error('DeleteLogo error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete logo' });
    }
};

export const getTenantInfo = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(400).json({ success: false, error: 'Tenant context missing' });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, subdomain: true, logo: true },
        });

        if (!tenant) {
            return res.status(404).json({ success: false, error: 'Tenant not found' });
        }

        res.json({ success: true, data: tenant });
    } catch (error: any) {
        console.error('GetTenantInfo error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tenant info' });
    }
};

// Preview Contract Template
export const previewContract = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) {
            return res.status(400).json({ success: false, error: 'Tenant context missing' });
        }

        const { contractTemplate } = req.body;

        const { PdfService } = await import('../services/pdf.service');
        const pdfBuffer = await PdfService.generatePreviewContract(contractTemplate || '', tenantId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="preview_contract.pdf"');
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('PreviewContract error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate contract preview' });
    }
};
