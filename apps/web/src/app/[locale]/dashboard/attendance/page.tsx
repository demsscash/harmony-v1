'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Clock, Loader2, Download, AlertTriangle, Save,
    CheckCircle2, XCircle, ArrowDownRight, ChevronLeft, ChevronRight, BarChart3, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TablePagination, paginate } from '@/components/TablePagination';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    PRESENT: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2, label: 'Présent' },
    LATE: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock, label: 'En retard' },
    ABSENT: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle, label: 'Absent' },
    EARLY_DEPARTURE: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: ArrowDownRight, label: 'Départ anticipé' },
    LATE_AND_EARLY: { color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: AlertTriangle, label: 'Retard + Départ' },
};

type RowDraft = {
    employeeId: string;
    clockIn: string;
    clockOut: string;
    note: string;
    existingId?: string; // if already saved
    dirty: boolean;
    saving: boolean;
    status?: string;
    lateMinutes?: number;
    earlyDepartureMinutes?: number;
    deductionAmount?: number;
};

export default function AttendancePage() {
    const t = useTranslations('attendance');
    const tc = useTranslations('common');

    const today = new Date().toISOString().slice(0, 10);
    const [selectedDate, setSelectedDate] = React.useState(today);
    const [employees, setEmployees] = React.useState<any[]>([]);
    const [departments, setDepartments] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [rows, setRows] = React.useState<RowDraft[]>([]);

    // Filters
    const [filterDepartment, setFilterDepartment] = React.useState('');
    const [searchText, setSearchText] = React.useState('');

    // Summary
    const [showSummary, setShowSummary] = React.useState(false);
    const [summary, setSummary] = React.useState<any[]>([]);
    const [summaryLoading, setSummaryLoading] = React.useState(false);

    // Bulk saving state
    const [bulkSaving, setBulkSaving] = React.useState(false);

    // Pagination
    const [page, setPage] = React.useState(1);
    const PAGE_SIZE = 20;

    // Load employees + existing attendance for selected date
    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const dateObj = new Date(selectedDate);
            const month = dateObj.getMonth() + 1;
            const year = dateObj.getFullYear();

            const [empRes, deptRes, attRes] = await Promise.all([
                api.get('/employees'),
                api.get('/departments'),
                api.get('/attendance', { params: { month, year } }),
            ]);

            const emps: any[] = (empRes.data?.data || []).filter((e: any) => e.status === 'ACTIVE');
            setEmployees(emps);
            setDepartments(deptRes.data?.data || []);

            // Map existing attendance for the selected date
            const dayAttendances: any[] = (attRes.data?.data || []).filter((a: any) => {
                const aDate = new Date(a.date).toISOString().slice(0, 10);
                return aDate === selectedDate;
            });

            const attMap = new Map<string, any>();
            dayAttendances.forEach(a => attMap.set(a.employeeId, a));

            // Build rows: one per active employee
            const newRows: RowDraft[] = emps.map(emp => {
                const existing = attMap.get(emp.id);
                if (existing) {
                    return {
                        employeeId: emp.id,
                        clockIn: existing.clockIn ? new Date(existing.clockIn).toTimeString().slice(0, 5) : '',
                        clockOut: existing.clockOut ? new Date(existing.clockOut).toTimeString().slice(0, 5) : '',
                        note: existing.note || '',
                        existingId: existing.id,
                        dirty: false,
                        saving: false,
                        status: existing.status,
                        lateMinutes: existing.lateMinutes,
                        earlyDepartureMinutes: existing.earlyDepartureMinutes,
                        deductionAmount: Number(existing.deductionAmount),
                    };
                }
                return {
                    employeeId: emp.id,
                    clockIn: '',
                    clockOut: '',
                    note: '',
                    dirty: false,
                    saving: false,
                };
            });

            setRows(newRows);
        } catch { /* silent */ } finally { setLoading(false); }
    }, [selectedDate]);

    React.useEffect(() => { fetchData(); }, [fetchData]);

    const updateRow = (employeeId: string, field: keyof RowDraft, value: string) => {
        setRows(prev => prev.map(r =>
            r.employeeId === employeeId ? { ...r, [field]: value, dirty: true } : r
        ));
    };

    // Save a single row
    const saveRow = async (row: RowDraft) => {
        if (!row.clockIn && !row.clockOut && !row.existingId) return; // nothing to save

        setRows(prev => prev.map(r => r.employeeId === row.employeeId ? { ...r, saving: true } : r));

        try {
            const clockIn = row.clockIn ? `${selectedDate}T${row.clockIn}:00` : undefined;
            const clockOut = row.clockOut ? `${selectedDate}T${row.clockOut}:00` : undefined;

            let res;
            if (row.existingId) {
                res = await api.put(`/attendance/${row.existingId}`, { clockIn, clockOut, note: row.note });
            } else {
                res = await api.post('/attendance', { employeeId: row.employeeId, date: selectedDate, clockIn, clockOut, note: row.note });
            }

            const saved = res.data?.data;
            setRows(prev => prev.map(r => r.employeeId === row.employeeId ? {
                ...r,
                existingId: saved?.id || r.existingId,
                dirty: false,
                saving: false,
                status: saved?.status,
                lateMinutes: saved?.lateMinutes,
                earlyDepartureMinutes: saved?.earlyDepartureMinutes,
                deductionAmount: Number(saved?.deductionAmount || 0),
            } : r));
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('error'));
            setRows(prev => prev.map(r => r.employeeId === row.employeeId ? { ...r, saving: false } : r));
        }
    };

    // Save all dirty rows
    const saveAll = async () => {
        const dirtyRows = rows.filter(r => r.dirty && (r.clockIn || r.clockOut || r.existingId));
        if (dirtyRows.length === 0) {
            toast.info('Aucune modification à enregistrer');
            return;
        }
        setBulkSaving(true);
        let saved = 0;
        for (const row of dirtyRows) {
            try {
                await saveRow(row);
                saved++;
            } catch { /* individual errors handled in saveRow */ }
        }
        setBulkSaving(false);
        toast.success(`${saved} pointage(s) enregistré(s)`);
    };

    // Mark absent (no clockIn/clockOut, create record)
    const markAbsent = async (employeeId: string) => {
        const row = rows.find(r => r.employeeId === employeeId);
        if (!row) return;

        setRows(prev => prev.map(r => r.employeeId === employeeId ? { ...r, saving: true } : r));
        try {
            let res;
            if (row.existingId) {
                res = await api.put(`/attendance/${row.existingId}`, { clockIn: null, clockOut: null, note: row.note || 'Absent' });
            } else {
                res = await api.post('/attendance', { employeeId, date: selectedDate, note: 'Absent' });
            }
            const saved = res.data?.data;
            setRows(prev => prev.map(r => r.employeeId === employeeId ? {
                ...r,
                clockIn: '',
                clockOut: '',
                existingId: saved?.id,
                dirty: false,
                saving: false,
                status: saved?.status,
                lateMinutes: 0,
                earlyDepartureMinutes: 0,
                deductionAmount: Number(saved?.deductionAmount || 0),
            } : r));
        } catch (e: any) {
            toast.error(e.response?.data?.error || t('error'));
            setRows(prev => prev.map(r => r.employeeId === employeeId ? { ...r, saving: false } : r));
        }
    };

    // Date navigation
    const changeDate = (delta: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + delta);
        setSelectedDate(d.toISOString().slice(0, 10));
    };

    const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Summary
    const fetchSummary = async () => {
        setSummaryLoading(true);
        const d = new Date(selectedDate);
        try {
            const res = await api.get('/attendance/summary', { params: { month: d.getMonth() + 1, year: d.getFullYear() } });
            setSummary(res.data?.data || []);
            setShowSummary(true);
        } catch { toast.error(t('error')); } finally { setSummaryLoading(false); }
    };

    // CSV export
    const exportCsv = () => {
        const headers = ['Employé', 'Matricule', 'Département', 'Arrivée', 'Départ', 'Statut', 'Retard (min)', 'Déduction'];
        const csvRows = rows.filter(r => r.existingId).map(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            return [
                `${emp?.firstName} ${emp?.lastName}`,
                emp?.matricule,
                emp?.department?.name || '',
                r.clockIn || '-',
                r.clockOut || '-',
                r.status || '-',
                r.lateMinutes || 0,
                (r.deductionAmount || 0).toFixed(2),
            ];
        });
        const csv = [headers, ...csvRows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pointage_${selectedDate}.csv`;
        link.click();
    };

    // Reset page when filters change
    React.useEffect(() => { setPage(1); }, [searchText, filterDepartment, selectedDate]);

    // Filter employees
    const empMap = new Map(employees.map(e => [e.id, e]));
    const filteredRows = rows.filter(r => {
        const emp = empMap.get(r.employeeId);
        if (!emp) return false;
        if (filterDepartment && emp.departmentId !== filterDepartment) return false;
        if (searchText) {
            const search = searchText.toLowerCase();
            const name = `${emp.firstName} ${emp.lastName} ${emp.matricule}`.toLowerCase();
            if (!name.includes(search)) return false;
        }
        return true;
    });

    // Stats for the day
    const dayStats = rows.reduce((acc, r) => {
        if (r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'EARLY_DEPARTURE' || r.status === 'LATE_AND_EARLY') acc.present++;
        if (r.status === 'LATE' || r.status === 'LATE_AND_EARLY') acc.late++;
        if (r.status === 'ABSENT') acc.absent++;
        if (!r.existingId && !r.status) acc.notRecorded++;
        acc.totalDeductions += (r.deductionAmount || 0);
        return acc;
    }, { present: 0, late: 0, absent: 0, notRecorded: 0, totalDeductions: 0 });

    const dirtyCount = rows.filter(r => r.dirty && (r.clockIn || r.clockOut || r.existingId)).length;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500 font-medium mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={fetchSummary} disabled={summaryLoading}>
                        <BarChart3 className="h-4 w-4 mr-1" />
                        {t('summary')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCsv}>
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                    </Button>
                </div>
            </div>

            {/* Day stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: 'Présents', value: dayStats.present, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                    { label: 'En retard', value: dayStats.late, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                    { label: 'Absents', value: dayStats.absent, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                    { label: 'Non saisis', value: dayStats.notRecorded, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
                    { label: 'Déductions', value: `${dayStats.totalDeductions.toLocaleString('fr-FR')} MRU`, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center shadow-sm`}>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Date selector + Filters + Save All */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="pt-4 pb-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date picker */}
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => changeDate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="w-auto text-sm font-semibold"
                            />
                            <button onClick={() => changeDate(1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                        <span className="text-sm text-slate-500 capitalize hidden sm:inline">{dateLabel}</span>

                        <div className="flex-1" />

                        {/* Search */}
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                placeholder="Rechercher..."
                                className="text-sm border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-white w-44"
                            />
                        </div>

                        {/* Department filter */}
                        <select
                            value={filterDepartment}
                            onChange={e => setFilterDepartment(e.target.value)}
                            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                        >
                            <option value="">{t('allDepartments')}</option>
                            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>

                        {/* Save All button */}
                        <Button
                            size="sm"
                            onClick={saveAll}
                            disabled={bulkSaving || dirtyCount === 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {bulkSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                            Enregistrer tout {dirtyCount > 0 && `(${dirtyCount})`}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Modal */}
            {showSummary && (
                <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-600" />{t('summary')}</CardTitle>
                                <CardDescription>{t('summarySubtitle')}</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowSummary(false)}>{tc('close')}</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 overflow-x-auto">
                        {summary.length === 0 ? (
                            <p className="text-sm text-slate-500 py-6 text-center">{t('noRecords')}</p>
                        ) : (
                            <table className="w-full text-sm">
                                <caption className="sr-only">{t('monthlySummary')}</caption>
                                <thead>
                                    <tr className="border-b text-left text-slate-500">
                                        <th scope="col" className="pb-2 font-medium">{t('employee')}</th>
                                        <th scope="col" className="pb-2 font-medium text-center">{t('daysPresent')}</th>
                                        <th scope="col" className="pb-2 font-medium text-center">{t('daysLate')}</th>
                                        <th scope="col" className="pb-2 font-medium text-center">{t('daysAbsent')}</th>
                                        <th scope="col" className="pb-2 font-medium text-center">{t('earlyDepartures')}</th>
                                        <th scope="col" className="pb-2 font-medium text-center">{t('totalLateMin')}</th>
                                        <th scope="col" className="pb-2 font-medium text-right">{t('totalDeductions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.map((s: any) => (
                                        <tr key={s.employee.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-2.5 font-medium text-slate-900">{s.employee.firstName} {s.employee.lastName}</td>
                                            <td className="py-2.5 text-center text-emerald-600 font-semibold">{s.present}</td>
                                            <td className="py-2.5 text-center text-amber-600 font-semibold">{s.late}</td>
                                            <td className="py-2.5 text-center text-red-600 font-semibold">{s.absent}</td>
                                            <td className="py-2.5 text-center text-orange-600 font-semibold">{s.earlyDeparture}</td>
                                            <td className="py-2.5 text-center text-slate-600">{s.totalLateMinutes} min</td>
                                            <td className="py-2.5 text-right font-bold text-red-600">{Number(s.totalDeductions).toLocaleString('fr-FR')} MRU</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Attendance Sheet — inline entry for all employees */}
            <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="pt-0 px-0 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-16">
                            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">Aucun employé trouvé</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <caption className="sr-only">{t('title')} — {selectedDate}</caption>
                            <thead className="bg-slate-50 sticky top-0">
                                <tr className="border-b text-left text-slate-500">
                                    <th scope="col" className="py-3 px-4 font-semibold w-[220px]">{t('employee')}</th>
                                    <th scope="col" className="py-3 px-2 font-semibold w-[110px] text-center">{t('clockIn')}</th>
                                    <th scope="col" className="py-3 px-2 font-semibold w-[110px] text-center">{t('clockOut')}</th>
                                    <th scope="col" className="py-3 px-2 font-semibold w-[120px] text-center">{t('status')}</th>
                                    <th scope="col" className="py-3 px-2 font-semibold w-[80px] text-center">Retard</th>
                                    <th scope="col" className="py-3 px-2 font-semibold w-[100px] text-right">{t('deduction')}</th>
                                    <th scope="col" className="py-3 px-2 font-semibold w-[100px] text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginate(filteredRows, page, PAGE_SIZE).map((row) => {
                                    const emp = empMap.get(row.employeeId);
                                    if (!emp) return null;
                                    const cfg = row.status ? STATUS_CONFIG[row.status] : null;
                                    const Icon = cfg?.icon;

                                    return (
                                        <tr
                                            key={row.employeeId}
                                            className={`border-b border-slate-100 transition-colors ${row.dirty ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'} ${row.saving ? 'opacity-60' : ''}`}
                                        >
                                            {/* Employee info */}
                                            <td className="py-2 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 border border-slate-200">
                                                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 text-sm truncate">{emp.firstName} {emp.lastName}</p>
                                                        <p className="text-[11px] text-slate-400 truncate">{emp.matricule} {emp.department?.name ? `• ${emp.department.name}` : ''}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Clock In */}
                                            <td className="py-2 px-2">
                                                <input
                                                    type="time"
                                                    value={row.clockIn}
                                                    onChange={e => updateRow(row.employeeId, 'clockIn', e.target.value)}
                                                    disabled={row.saving}
                                                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-center bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                                                />
                                            </td>

                                            {/* Clock Out */}
                                            <td className="py-2 px-2">
                                                <input
                                                    type="time"
                                                    value={row.clockOut}
                                                    onChange={e => updateRow(row.employeeId, 'clockOut', e.target.value)}
                                                    disabled={row.saving}
                                                    className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-center bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
                                                />
                                            </td>

                                            {/* Status badge */}
                                            <td className="py-2 px-2 text-center">
                                                {cfg && Icon ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color}`}>
                                                        <Icon className="h-3 w-3" />
                                                        {cfg.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Late minutes */}
                                            <td className="py-2 px-2 text-center">
                                                {(row.lateMinutes || 0) > 0 ? (
                                                    <span className="text-amber-600 font-semibold text-xs">{row.lateMinutes} min</span>
                                                ) : (row.earlyDepartureMinutes || 0) > 0 ? (
                                                    <span className="text-orange-600 font-semibold text-xs">↑{row.earlyDepartureMinutes}</span>
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Deduction */}
                                            <td className="py-2 px-2 text-right">
                                                {(row.deductionAmount || 0) > 0 ? (
                                                    <span className="text-red-600 font-semibold text-xs">{row.deductionAmount!.toLocaleString('fr-FR')} MRU</span>
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-2 px-2 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {/* Save individual */}
                                                    {row.dirty && (
                                                        <button
                                                            onClick={() => saveRow(row)}
                                                            disabled={row.saving}
                                                            className="p-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                            title="Enregistrer"
                                                        >
                                                            {row.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                        </button>
                                                    )}
                                                    {/* Mark absent */}
                                                    {!row.existingId && !row.clockIn && (
                                                        <button
                                                            onClick={() => markAbsent(row.employeeId)}
                                                            disabled={row.saving}
                                                            className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                            title="Marquer absent"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    <TablePagination page={page} totalItems={filteredRows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
                </CardContent>
            </Card>
        </motion.div>
    );
}
