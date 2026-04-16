import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

// ── Codes ────────────────────────────────────────────────
export const getAttendanceCodes = async (req: Request, res: Response) => {
    try {
        const codes = await AttendanceService.getCodes(req.tenant?.id!);
        res.json({ success: true, data: codes });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const createAttendanceCode = async (req: Request, res: Response) => {
    try {
        const code = await AttendanceService.createCode(req.tenant?.id!, req.body);
        res.status(201).json({ success: true, data: code });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const updateAttendanceCode = async (req: Request, res: Response) => {
    try {
        const code = await AttendanceService.updateCode(String(req.params.id), req.tenant?.id!, req.body);
        res.json({ success: true, data: code });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const deleteAttendanceCode = async (req: Request, res: Response) => {
    try {
        await AttendanceService.deleteCode(String(req.params.id), req.tenant?.id!);
        res.json({ success: true, message: 'Code supprimé' });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

// ── Entries ──────────────────────────────────────────────
export const getAttendanceEntries = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, employeeId, departmentId } = req.query;
        if (!startDate || !endDate) {
            res.status(400).json({ success: false, error: 'startDate et endDate requis' });
            return;
        }
        const entries = await AttendanceService.getEntries(req.tenant?.id!, {
            startDate: String(startDate),
            endDate: String(endDate),
            employeeId: employeeId ? String(employeeId) : undefined,
            departmentId: departmentId ? String(departmentId) : undefined,
        });
        res.json({ success: true, data: entries });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const upsertAttendanceEntry = async (req: Request, res: Response) => {
    try {
        const entry = await AttendanceService.upsertEntry(req.tenant?.id!, {
            ...req.body,
            recordedBy: req.user?.userId,
        });
        res.json({ success: true, data: entry });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const bulkUpsertAttendance = async (req: Request, res: Response) => {
    try {
        const { entries } = req.body;
        if (!entries || !Array.isArray(entries)) {
            res.status(400).json({ success: false, error: 'entries array requis' });
            return;
        }
        const results = await AttendanceService.bulkUpsert(
            req.tenant?.id!,
            entries.map((e: any) => ({ ...e, recordedBy: req.user?.userId })),
        );
        const successCount = results.filter(r => r.success).length;
        res.json({ success: true, data: results, message: `${successCount}/${entries.length} enregistré(s)` });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};

export const fillDefaultAttendance = async (req: Request, res: Response) => {
    try {
        const { dates, departmentId } = req.body;
        if (!dates || !Array.isArray(dates)) {
            res.status(400).json({ success: false, error: 'dates array requis' });
            return;
        }
        const result = await AttendanceService.fillDefault(req.tenant?.id!, dates, departmentId, req.user?.userId);
        res.json({ success: true, data: result });
    } catch (error: any) { res.status(400).json({ success: false, error: error.message }); }
};

export const getAttendanceSummary = async (req: Request, res: Response) => {
    try {
        const { employeeId, month, year } = req.query;
        if (!employeeId || !month || !year) {
            res.status(400).json({ success: false, error: 'employeeId, month, year requis' });
            return;
        }
        const summary = await AttendanceService.getMonthlySummary(req.tenant?.id!, String(employeeId), Number(month), Number(year));
        res.json({ success: true, data: summary });
    } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
};
