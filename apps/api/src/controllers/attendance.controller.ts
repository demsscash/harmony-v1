import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

// ==========================================
// CONFIG
// ==========================================

export const getAttendanceConfig = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const config = await AttendanceService.getConfig(tenantId);
        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateAttendanceConfig = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const { defaultStartTime, defaultEndTime, graceMinutes, deductionMethod, fixedDeductionAmount, tieredRules, earlyDepartureDeduction } = req.body;

        const config = await AttendanceService.upsertConfig(tenantId, {
            defaultStartTime,
            defaultEndTime,
            graceMinutes: graceMinutes !== undefined ? parseInt(graceMinutes, 10) : undefined,
            deductionMethod,
            fixedDeductionAmount: fixedDeductionAmount !== undefined ? parseFloat(fixedDeductionAmount) : undefined,
            tieredRules,
            earlyDepartureDeduction,
        });

        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// EMPLOYEE SCHEDULE
// ==========================================

export const getEmployeeSchedule = async (req: Request, res: Response) => {
    try {
        const schedule = await AttendanceService.getSchedule(String(req.params.employeeId));
        res.json({ success: true, data: schedule });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateEmployeeSchedule = async (req: Request, res: Response) => {
    try {
        const { startTime, endTime, customGraceMinutes } = req.body;
        const schedule = await AttendanceService.upsertSchedule(String(req.params.employeeId), {
            startTime,
            endTime,
            customGraceMinutes: customGraceMinutes !== undefined ? parseInt(customGraceMinutes, 10) : undefined,
        });
        res.json({ success: true, data: schedule });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// ATTENDANCE CRUD
// ==========================================

export const getAttendances = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const { month, year, employeeId, status, departmentId } = req.query;

        const data = await AttendanceService.getAll(tenantId, {
            month: month ? Number(month) : undefined,
            year: year ? Number(year) : undefined,
            employeeId: employeeId ? String(employeeId) : undefined,
            status: status ? (status as any) : undefined,
            departmentId: departmentId ? String(departmentId) : undefined,
        });

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getAttendanceById = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const data = await AttendanceService.getById(String(req.params.id), tenantId);
        if (!data) return res.status(404).json({ success: false, error: 'Pointage introuvable' });

        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createAttendance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const { employeeId, date, clockIn, clockOut, note } = req.body;
        if (!employeeId || !date) {
            return res.status(400).json({ success: false, error: 'employeeId et date sont requis' });
        }

        const data = await AttendanceService.create(tenantId, { employeeId, date, clockIn, clockOut, note }, req.user?.userId);
        res.status(201).json({ success: true, data });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, error: 'Un pointage existe déjà pour cet employé à cette date' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createBulkAttendance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const { entries } = req.body;
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ success: false, error: 'entries est requis (tableau non vide)' });
        }

        const results = await AttendanceService.createBulk(tenantId, entries, req.user?.userId);
        res.status(201).json({ success: true, data: results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateAttendance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const data = await AttendanceService.update(String(req.params.id), tenantId, req.body, req.user?.userId);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteAttendance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        await AttendanceService.delete(String(req.params.id), tenantId);
        res.json({ success: true, message: 'Pointage supprimé' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// SUMMARY
// ==========================================

export const getAttendanceSummary = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenant?.id;
        if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context missing' });

        const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

        const data = await AttendanceService.getSummary(tenantId, month, year);
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
