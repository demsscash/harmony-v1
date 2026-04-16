'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Search, Users, CheckSquare } from 'lucide-react';

function getWeekDates(date: Date): Date[] {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(monday);
        dt.setDate(monday.getDate() + i);
        return dt;
    });
}

function getMonthDates(year: number, month: number): Date[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => new Date(year, month - 1, i + 1));
}

function fmt(d: Date) { return d.toISOString().split('T')[0]; }
function fmtShort(d: Date) { return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }); }
function fmtDay(d: Date) { return d.toLocaleDateString('fr-FR', { weekday: 'narrow', day: 'numeric' }); }

export default function AttendancePage() {
    const t = useTranslations('attendance');

    const [view, setView] = useState<'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [codes, setCodes] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [entries, setEntries] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(true);
    const [deptFilter, setDeptFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState<string | null>(null);
    const [fillingDefault, setFillingDefault] = useState(false);

    const dates = useMemo(() => {
        if (view === 'week') return getWeekDates(currentDate);
        return getMonthDates(currentDate.getFullYear(), currentDate.getMonth() + 1);
    }, [view, currentDate]);

    const startDate = fmt(dates[0]);
    const endDate = fmt(dates[dates.length - 1]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [codesRes, empRes, deptRes, entriesRes] = await Promise.all([
                api.get('/attendance/codes'),
                api.get('/employees'),
                api.get('/departments'),
                api.get('/attendance/entries', { params: { startDate, endDate } }),
            ]);
            setCodes(codesRes.data?.data || []);
            setEmployees(empRes.data?.data || []);
            setDepartments(deptRes.data?.data || []);
            const map = new Map<string, any>();
            for (const e of (entriesRes.data?.data || [])) {
                map.set(`${e.employeeId}-${fmt(new Date(e.date))}`, e);
            }
            setEntries(map);
        } catch { toast.error('Erreur de chargement'); }
        setLoading(false);
    }, [startDate, endDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const defaultCode = useMemo(() => codes.find(c => c.isDefault) || codes[0], [codes]);

    const filteredEmployees = useMemo(() => {
        return employees
            .filter(e => e.status === 'ACTIVE')
            .filter(e => deptFilter === 'all' || e.departmentId === deptFilter)
            .filter(e => !search || `${e.firstName} ${e.lastName} ${e.matricule}`.toLowerCase().includes(search.toLowerCase()));
    }, [employees, deptFilter, search]);

    const getCode = (empId: string, date: Date) => {
        const entry = entries.get(`${empId}-${fmt(date)}`);
        return entry ? codes.find(c => c.id === entry.attendanceCodeId) : null;
    };

    const handleCellClick = async (empId: string, date: Date) => {
        const currentCode = getCode(empId, date);
        const currentIdx = currentCode ? codes.findIndex(c => c.id === currentCode.id) : -1;
        const nextCode = codes[(currentIdx + 1) % codes.length];
        const key = `${empId}-${fmt(date)}`;
        setSaving(key);
        try {
            const res = await api.post('/attendance/entries', { employeeId: empId, date: fmt(date), attendanceCodeId: nextCode.id });
            setEntries(prev => { const next = new Map(prev); next.set(key, res.data.data); return next; });
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
        setSaving(null);
    };

    const handleFillAll = async () => {
        if (!defaultCode) return;
        setFillingDefault(true);
        try {
            await api.post('/attendance/entries/fill-default', { dates: dates.map(fmt), departmentId: deptFilter !== 'all' ? deptFilter : undefined });
            toast.success(t('bulkSaved'));
            fetchData();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
        setFillingDefault(false);
    };

    const handleFillColumn = async (date: Date) => {
        if (!defaultCode) return;
        const entriesToSave = filteredEmployees
            .filter(emp => !entries.has(`${emp.id}-${fmt(date)}`))
            .map(emp => ({ employeeId: emp.id, date: fmt(date), attendanceCodeId: defaultCode.id }));
        if (entriesToSave.length === 0) return;
        try {
            await api.post('/attendance/entries/bulk', { entries: entriesToSave });
            toast.success(t('bulkSaved'));
            fetchData();
        } catch { toast.error('Erreur'); }
    };

    const handleFillRow = async (empId: string) => {
        if (!defaultCode) return;
        const entriesToSave = dates
            .filter(d => !entries.has(`${empId}-${fmt(d)}`))
            .map(d => ({ employeeId: empId, date: fmt(d), attendanceCodeId: defaultCode.id }));
        if (entriesToSave.length === 0) return;
        try {
            await api.post('/attendance/entries/bulk', { entries: entriesToSave });
            toast.success(t('saved'));
            fetchData();
        } catch { toast.error('Erreur'); }
    };

    const navigatePrev = () => {
        const d = new Date(currentDate);
        if (view === 'week') d.setDate(d.getDate() - 7); else d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };
    const navigateNext = () => {
        const d = new Date(currentDate);
        if (view === 'week') d.setDate(d.getDate() + 7); else d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const periodLabel = view === 'week'
        ? `${dates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${dates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : dates[0].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    if (loading) return <div className="flex justify-center items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/60 p-4 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" /> {t('title')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{t('weekView')}</button>
                        <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{t('monthView')}</button>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleFillAll} disabled={fillingDefault} className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                        {fillingDefault ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckSquare className="h-3.5 w-3.5" />}
                        {t('fillAllT')}
                    </Button>
                </div>
            </div>

            {/* Navigation + Filters */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <button onClick={navigatePrev} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft className="h-4 w-4" /></button>
                    <span className="text-sm font-semibold text-slate-800 min-w-[200px] text-center">{periodLabel}</span>
                    <button onClick={navigateNext} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight className="h-4 w-4" /></button>
                </div>
                <div className="flex items-center gap-2">
                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="h-8 px-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700">
                        <option value="all">{t('allDepts')}</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                        <input className="bg-transparent outline-none text-xs text-slate-700 w-32" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 flex-wrap">
                {codes.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border" style={{ backgroundColor: c.color + '15', borderColor: c.color + '40', color: c.color }}>
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                        {c.code} — {c.label}
                        {c.deductsSalary && <span className="text-red-500 ml-0.5">$</span>}
                    </span>
                ))}
            </div>

            {/* Grid */}
            <div className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-500 min-w-[180px] border-r border-slate-200">
                                    {t('employee')}
                                </th>
                                {dates.map(d => {
                                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                    return (
                                        <th key={fmt(d)} className={`px-1 py-2 text-center font-semibold min-w-[40px] cursor-pointer hover:bg-blue-50 transition-colors ${isWeekend ? 'bg-slate-100 text-slate-400' : 'text-slate-600'}`} onClick={() => handleFillColumn(d)} title={t('fillColumnT')}>
                                            {view === 'week' ? fmtShort(d) : fmtDay(d)}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredEmployees.length === 0 ? (
                                <tr><td colSpan={dates.length + 1} className="px-4 py-12 text-center text-slate-400"><Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />{t('noEmployees')}</td></tr>
                            ) : filteredEmployees.map(emp => (
                                <tr key={emp.id} className="hover:bg-slate-50/50">
                                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5 border-r border-slate-100 cursor-pointer hover:bg-emerald-50 transition-colors" onClick={() => handleFillRow(emp.id)} title={t('fillRowT')}>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                                                {emp.firstName?.[0]}{emp.lastName?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 truncate text-[11px]">{emp.firstName} {emp.lastName}</p>
                                                <p className="text-[9px] text-slate-400 truncate">{emp.matricule}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {dates.map(d => {
                                        const code = getCode(emp.id, d);
                                        const key = `${emp.id}-${fmt(d)}`;
                                        const isSaving = saving === key;
                                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                        return (
                                            <td key={fmt(d)} className={`px-0.5 py-1 text-center cursor-pointer transition-all ${isWeekend ? 'bg-slate-50' : ''} hover:ring-2 hover:ring-blue-300 hover:ring-inset`} onClick={() => handleCellClick(emp.id, d)}>
                                                {isSaving ? (
                                                    <div className="h-6 w-full flex items-center justify-center"><div className="h-3 w-3 border border-slate-300 border-t-blue-500 rounded-full animate-spin" /></div>
                                                ) : code ? (
                                                    <span className="inline-flex items-center justify-center h-6 w-full rounded text-[10px] font-bold" style={{ backgroundColor: code.color + '20', color: code.color }}>{code.code}</span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center h-6 w-full text-slate-300 text-[10px]">—</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-xs text-slate-500 text-right">
                {filteredEmployees.length} {t('employee')}(s) · {dates.length} {t('totalDays')}
            </div>
        </div>
    );
}
