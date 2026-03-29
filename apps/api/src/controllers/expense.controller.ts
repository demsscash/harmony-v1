import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const filters: any = {
            employeeId: req.query.employeeId as string,
            status: req.query.status as string,
        };
        if (req.user?.role === 'EMPLOYEE') {
            filters.employeeId = req.user.employeeId;
        }
        const reports = await ExpenseService.getAll(tenantId, filters);
        res.json({ success: true, data: reports });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getExpenseById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const report = await ExpenseService.getById(String(req.params.id), tenantId);
        if (!report) {
            res.status(404).json({ success: false, error: 'Note de frais introuvable' });
            return;
        }
        if (req.user?.role === 'EMPLOYEE' && report.employeeId !== req.user.employeeId) {
            res.status(403).json({ success: false, error: 'Accès non autorisé' });
            return;
        }
        res.json({ success: true, data: report });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        let { employeeId, title, items } = req.body;
        if (req.user?.role === 'EMPLOYEE') {
            employeeId = req.user.employeeId;
        }
        if (!title) {
            res.status(400).json({ success: false, error: 'Titre requis' });
            return;
        }
        const report = await ExpenseService.create(tenantId, { employeeId, title, items: items || [] });
        res.status(201).json({ success: true, data: report });
    } catch (error: any) {
        if (error.message.includes('introuvable')) {
            res.status(404).json({ success: false, error: error.message });
            return;
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const addExpenseItem = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const item = await ExpenseService.addItem(String(req.params.id), tenantId, req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error: any) {
        const status = error.message.includes('introuvable') ? 404 : error.message.includes('soumise') ? 400 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const removeExpenseItem = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await ExpenseService.removeItem(String(req.params.itemId), tenantId);
        res.json({ success: true, message: 'Supprimé' });
    } catch (error: any) {
        const status = error.message.includes('introuvable') ? 404 : error.message.includes('soumise') ? 400 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const submitExpense = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const report = await ExpenseService.submit(String(req.params.id), tenantId);
        res.json({ success: true, data: report });
    } catch (error: any) {
        const status = error.message.includes('introuvable') ? 404 : 400;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const approveExpense = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const report = await ExpenseService.approve(String(req.params.id), tenantId, req.user?.userId!);
        res.json({ success: true, data: report });
    } catch (error: any) {
        const status = error.message.includes('introuvable') ? 404 : 400;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const rejectExpense = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const { reason } = req.body;
        const report = await ExpenseService.reject(String(req.params.id), tenantId, req.user?.userId!, reason);
        res.json({ success: true, data: report });
    } catch (error: any) {
        const status = error.message.includes('introuvable') ? 404 : 400;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const reimburseExpense = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        const report = await ExpenseService.markReimbursed(String(req.params.id), tenantId);
        res.json({ success: true, data: report });
    } catch (error: any) {
        const status = error.message.includes('introuvable') ? 404 : 400;
        res.status(status).json({ success: false, error: error.message });
    }
};

export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id!;
        await ExpenseService.delete(String(req.params.id), tenantId);
        res.json({ success: true, message: 'Supprimé' });
    } catch (error: any) {
        const status = error.message.includes('introuvable') ? 404 : error.message.includes('soumise') ? 400 : 500;
        res.status(status).json({ success: false, error: error.message });
    }
};
