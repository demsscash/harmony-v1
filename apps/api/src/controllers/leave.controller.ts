import { Request, Response } from 'express';
import { LeaveService } from '../services/leave.service';
import { EmailService } from '../services/email.service';

export const getLeaves = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        let { employeeId, status } = req.query;

        // Security check for Employee Role
        if (req.user?.role === 'EMPLOYEE') {
            if (!req.user.employeeId) {
                return res.status(403).json({ success: false, error: "Compte employé mal configuré" });
            }
            // Force filtering by their own ID
            employeeId = req.user.employeeId;
        }

        const filters = {
            employeeId: employeeId as string,
            status: status as string
        };

        const leaves = await LeaveService.getAll(tenantId, filters);
        res.json({ success: true, data: leaves });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getLeaveById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const leave = await LeaveService.getById(req.params.id as string, tenantId);

        if (!leave) {
            return res.status(404).json({ success: false, error: 'Demande de congé non trouvée' });
        }

        if (req.user?.role === 'EMPLOYEE' && leave.employeeId !== req.user.employeeId) {
            return res.status(403).json({ success: false, error: 'Accès non autorisé à cette demande' });
        }

        res.json({ success: true, data: leave });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createLeave = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;

        // Security check for Employee Role
        if (req.user?.role === 'EMPLOYEE') {
            if (!req.user.employeeId) {
                return res.status(403).json({ success: false, error: "Compte employé mal configuré" });
            }
            // An employee can only request leave for themselves
            req.body.employeeId = req.user.employeeId;
        }

        const leave = await LeaveService.create(tenantId, req.body);
        res.status(201).json({ success: true, data: leave });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const updateLeave = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const currentEmployeeId = req.user?.employeeId;

        if (req.user?.role === 'EMPLOYEE') {
            if (!currentEmployeeId) {
                return res.status(401).json({ success: false, error: "Vous devez être un employé pour modifier" });
            }

            const existingLeave = await LeaveService.getById(req.params.id as string, tenantId);
            if (!existingLeave || existingLeave.employeeId !== currentEmployeeId) {
                return res.status(403).json({ success: false, error: "Modification non autorisée" });
            }
            // Enforce their own ID
            req.body.employeeId = currentEmployeeId;
        }

        const leave = await LeaveService.update(req.params.id as string, tenantId, currentEmployeeId || 'SYSTEM', req.body);
        res.json({ success: true, data: leave });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const cancelLeave = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const currentEmployeeId = req.user?.employeeId;

        if (req.user?.role === 'EMPLOYEE') {
            if (!currentEmployeeId) {
                return res.status(401).json({ success: false, error: "Vous devez être un employé pour annuler" });
            }
            const existingLeave = await LeaveService.getById(req.params.id as string, tenantId);
            if (!existingLeave || existingLeave.employeeId !== currentEmployeeId) {
                return res.status(403).json({ success: false, error: "Annulation non autorisée" });
            }
        }

        const leave = await LeaveService.cancel(req.params.id as string, tenantId, currentEmployeeId || 'SYSTEM');
        res.json({ success: true, data: leave, message: 'Demande annulée avec succès' });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const processLeaveRequest = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const reviewerId = req.user?.userId!;

        const leave = await LeaveService.processLeave(req.params.id as string, tenantId, reviewerId, req.body);

        // Envoyer une notification email à l'employé (silenced si SMTP non configuré)
        try {
            const employee = (leave as any).employee;
            if (employee?.email) {
                const employeeName = `${employee.firstName} ${employee.lastName}`;
                const leaveTypeName = (leave as any).leaveType?.name || 'Congé';
                if (leave.status === 'APPROVED') {
                    await EmailService.sendLeaveApprovalNotification(
                        tenantId, employee.email, employeeName, leaveTypeName, leave.startDate, leave.endDate
                    );
                } else if (leave.status === 'REJECTED') {
                    await EmailService.sendLeaveRejectionNotification(
                        tenantId, employee.email, employeeName, leaveTypeName, leave.rejectionReason || undefined
                    );
                }
            }
        } catch (emailError: any) {
            // Ne pas bloquer la réponse si l'envoi d'email échoue
            console.warn('Email notification skipped:', emailError.message);
        }

        res.json({ success: true, data: leave });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};
