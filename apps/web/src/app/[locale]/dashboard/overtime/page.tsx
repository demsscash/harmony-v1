'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, type Column } from '@/components/DataTable';
import { ExportButtons, type ExportColumn } from '@/components/ExportButtons';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    Timer, Plus, Trash2, Clock, Loader2, ChevronDown,
    Layers, Zap, AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';

const TIER_OPTIONS = [
    { value: 'TIER_1', label: 'tier1', defaultRate: 1.25 },
    { value: 'TIER_2', label: 'tier2', defaultRate: 1.50 },
    { value: 'TIER_3', label: 'tier3', defaultRate: 2.00 },
];

export default function OvertimePage() {
    const t = useTranslations('overtime');
    const tc = useTranslations('common');

    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Filters
    const now = new Date();
    const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(now.getFullYear());

    // Form state
    const [formEmployeeId, setFormEmployeeId] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formHours, setFormHours] = useState('');
    const [formTier, setFormTier] = useState('TIER_1');
    const [formReason, setFormReason] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchRecords = async () => {
        try {
            const res = await api.get('/overtime', { params: { month: filterMonth, year: filterYear } });
            setRecords(res.data?.data || []);
        } catch { /* silent */ }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data?.data || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        Promise.all([fetchRecords(), fetchEmployees()]).then(() => setLoading(false));
    }, []);

    useEffect(() => { fetchRecords(); }, [filterMonth, filterYear]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formEmployeeId || !formDate || !formHours) return;
        setSaving(true);
        try {
            await api.post('/overtime', {
                employeeId: formEmployeeId,
                date: formDate,
                hours: parseFloat(formHours),
                tier: formTier,
                reason: formReason || undefined,
            });
            toast.success(tc('save'));
            setShowForm(false);
            setFormEmployeeId('');
            setFormDate('');
            setFormHours('');
            setFormTier('TIER_1');
            setFormReason('');
            fetchRecords();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDelete'))) return;
        try {
            await api.delete(`/overtime/${id}`);
            toast.success(tc('delete'));
            fetchRecords();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const totalHours = records.reduce((sum, r) => sum + Number(r.hours), 0);

    const tierLabel = (tier: string) => {
        const opt = TIER_OPTIONS.find(o => o.value === tier);
        return opt ? t(opt.label) : tier;
    };

    const tier1Count = records.filter(r => r.tier === 'TIER_1').length;
    const tier2Count = records.filter(r => r.tier === 'TIER_2').length;
    const tier3Count = records.filter(r => r.tier === 'TIER_3').length;

    // ─── KPI cards ──────────────────────────────────────
    const kpis = [
        { label: t('title'), value: records.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Layers },
        { label: t('totalHours'), value: `${totalHours.toFixed(1)}h`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
        { label: t('tier1'), value: tier1Count, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', icon: Zap },
        { label: t('tier2'), value: tier2Count, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Zap },
        { label: t('tier3'), value: tier3Count, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
    ];

    // ─── DataTable columns ──────────────────────────────
    const columns: Column<any>[] = [
        {
            key: 'employee',
            header: t('employee'),
            accessor: (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '',
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                        {row.employee?.firstName?.[0]}{row.employee?.lastName?.[0]}
                    </div>
                    <span className="font-semibold text-slate-800">
                        {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '\u2014'}
                    </span>
                </div>
            ),
        },
        {
            key: 'date',
            header: t('date'),
            accessor: (row) => row.date,
            sortable: true,
            render: (row) => (
                <span className="text-slate-600 text-sm">
                    {new Date(row.date).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'hours',
            header: t('hours'),
            accessor: (row) => Number(row.hours),
            sortable: true,
            render: (row) => (
                <span className="font-semibold text-slate-800">{Number(row.hours).toFixed(1)}h</span>
            ),
        },
        {
            key: 'tier',
            header: t('tier'),
            accessor: (row) => row.tier,
            sortable: true,
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                    row.tier === 'TIER_1' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    row.tier === 'TIER_2' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-red-100 text-red-700 border-red-200'
                }`}>
                    {tierLabel(row.tier)}
                </span>
            ),
        },
        {
            key: 'rate',
            header: t('rate'),
            accessor: (row) => Number(row.rate),
            sortable: true,
            render: (row) => (
                <span className="text-slate-600 font-medium">x{Number(row.rate).toFixed(2)}</span>
            ),
        },
        {
            key: 'reason',
            header: t('reason'),
            accessor: (row) => row.reason || '',
            render: (row) => (
                <span className="text-slate-500 max-w-[200px] truncate block">{row.reason || '\u2014'}</span>
            ),
        },
        {
            key: 'actions',
            header: tc('actions'),
            className: 'text-right',
            headerClassName: 'text-right',
            render: (row) => (
                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label={tc('delete')}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    // ─── Export columns ─────────────────────────────────
    const exportColumns: ExportColumn[] = [
        { header: t('employee'), accessor: (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '' },
        { header: t('date'), accessor: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
        { header: t('hours'), accessor: (row) => Number(row.hours).toFixed(1) },
        { header: t('tier'), accessor: (row) => tierLabel(row.tier) },
        { header: t('rate'), accessor: (row) => `x${Number(row.rate).toFixed(2)}` },
        { header: t('reason'), accessor: (row) => row.reason || '' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Timer className="h-7 w-7 text-blue-600" />
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">{t('subtitle')}</p>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {kpis.map(kpi => {
                    const Icon = kpi.icon;
                    return (
                        <Card key={kpi.label} className={`border ${kpi.border} ${kpi.bg} shadow-sm`}>
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                                    <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
                                </div>
                                <div className={`text-3xl font-black ${kpi.color}`}>
                                    {loading ? '\u2026' : kpi.value}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* DataTable */}
            <DataTable
                data={records}
                columns={columns}
                rowKey={(row) => row.id}
                searchable
                searchPlaceholder={t('employee')}
                searchFields={[
                    (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '',
                    (row) => row.reason || '',
                ]}
                loading={loading}
                rowClassName="group"
                emptyState={
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-300">
                            <Timer className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{t('noRecords')}</h3>
                        <p className="text-slate-500 max-w-sm mt-1 mb-6">{t('subtitle')}</p>
                        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-2">
                            <Plus className="h-4 w-4" /> {t('addOvertime')}
                        </Button>
                    </div>
                }
                headerExtra={
                    <>
                        <select
                            value={filterMonth}
                            onChange={e => setFilterMonth(Number(e.target.value))}
                            className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none shadow-sm"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2024, i, 1).toLocaleString('fr', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <Input
                            type="number"
                            value={filterYear}
                            onChange={e => setFilterYear(Number(e.target.value))}
                            className="w-24 h-9"
                        />
                        <ExportButtons
                            data={records}
                            columns={exportColumns}
                            filename="heures_supplementaires"
                        />
                        <Button onClick={() => setShowForm(true)} className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg gap-2">
                            <Plus className="h-4 w-4" /> {t('addOvertime')}
                        </Button>
                    </>
                }
                texts={{
                    showing: tc('showing'),
                    of: tc('of'),
                    rows: tc('rows'),
                    noResults: t('noRecords'),
                }}
            />

            {/* Create Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('addOvertime')}</DialogTitle>
                        <DialogDescription>{t('subtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        {/* Employee selector */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('employee')}</Label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full h-10 appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={formEmployeeId}
                                    onChange={e => setFormEmployeeId(e.target.value)}
                                >
                                    <option value="" disabled>{t('selectEmployee')}</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} ({emp.matricule})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('date')}</Label>
                            <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required />
                        </div>

                        {/* Hours */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('hours')}</Label>
                            <Input type="number" step="0.25" min="0.25" max="24" value={formHours} onChange={e => setFormHours(e.target.value)} required />
                        </div>

                        {/* Tier */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('tier')}</Label>
                            <div className="relative">
                                <select
                                    className="w-full h-10 appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={formTier}
                                    onChange={e => setFormTier(e.target.value)}
                                >
                                    {TIER_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{t(opt.label)} (x{opt.defaultRate})</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Reason */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('reason')}</Label>
                            <Input value={formReason} onChange={e => setFormReason(e.target.value)} placeholder={t('reason')} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                {tc('cancel')}
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                {tc('save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
