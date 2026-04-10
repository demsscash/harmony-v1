import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { PdfService } from '../services/pdf.service';
import { EmailService } from '../services/email.service';

export const getEmployees = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const employees = await EmployeeService.getAll(tenantId);
        res.json({ success: true, data: employees });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getEmployeeById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const requestedId = req.params.id as string;

        // EMPLOYEE role can only view their own profile
        if (req.user?.role === 'EMPLOYEE' && req.user?.employeeId !== requestedId) {
            res.status(403).json({ success: false, error: 'Accès non autorisé' });
            return;
        }

        const employee = await EmployeeService.getById(requestedId, tenantId);

        if (!employee) {
            res.status(404).json({ success: false, error: 'Employé non trouvé' });
            return;
        }

        res.json({ success: true, data: employee });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createEmployee = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const userId = req.user?.userId!;
        const employee = await EmployeeService.create(tenantId, userId, req.body);
        res.status(201).json({ success: true, data: employee });
    } catch (error: any) {
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateEmployee = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const userId = req.user?.userId!;
        const employee = await EmployeeService.update(req.params.id as string, tenantId, userId, req.body);
        res.json({ success: true, data: employee });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        if (error.message.includes('existe déjà')) {
            res.status(409).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const downloadEmployeeBadge = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const pdfBuffer = await PdfService.generateEmployeeBadge(req.params.id as string, tenantId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="badge_${req.params.id}.pdf"`);
        res.send(pdfBuffer);
    } catch (error: any) {
        if (error.message === 'Employé introuvable') {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const terminateEmployee = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const userId = req.user?.userId!;
        const { terminationDate, terminationReason, terminationNotes } = req.body;

        if (!terminationDate || !terminationReason) {
            res.status(400).json({ success: false, error: 'Date et motif de licenciement requis' });
            return;
        }

        const employee = await EmployeeService.terminate(
            String(req.params.id), tenantId, userId,
            { terminationDate, terminationReason, terminationNotes }
        );
        res.json({ success: true, data: employee });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(400).json({ success: false, error: error.message });
    }
};

export const reinstateEmployee = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const userId = req.user?.userId!;
        const employee = await EmployeeService.reinstate(String(req.params.id), tenantId, userId);
        res.json({ success: true, data: employee });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(400).json({ success: false, error: error.message });
    }
};

export const downloadEmployeeContract = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const pdfBuffer = await PdfService.generateEmployeeContract(req.params.id as string, tenantId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="contrat_${req.params.id}.pdf"`);
        res.send(pdfBuffer);
    } catch (error: any) {
        if (error.message === 'Employé introuvable') {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createEmployeeAccount = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }

        const user = await EmployeeService.createAccount(id as string, tenantId, password);

        // Envoyer l'email de bienvenue à l'employé (silencé si SMTP non configuré)
        try {
            const employee = await EmployeeService.getById(id as string, tenantId);
            if (employee?.email) {
                await EmailService.sendWelcomeEmail(
                    tenantId,
                    employee.email,
                    `${employee.firstName} ${employee.lastName}`,
                    user.email,
                    password
                );
            }
        } catch (emailErr: any) {
            console.warn('Welcome email skipped:', emailErr.message);
        }

        // Return without password hash
        const { passwordHash, ...safeUser } = user;
        res.status(201).json({ success: true, data: safeUser });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        if (error.message.includes('email configurée') || error.message.includes('déjà un compte') || error.message.includes('déjà utilisé')) {
            return res.status(400).json({ success: false, error: error.message });
        }
        console.error('Create account error:', error);
        res.status(500).json({ success: false, error: 'Une erreur est survenue lors de la création du compte' });
    }
};
