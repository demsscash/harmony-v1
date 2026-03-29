'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
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
    Receipt, Plus, Send, Check, X, Banknote, Trash2,
    Loader2, ChevronDown, Layers, Clock, CheckCircle2, CreditCard,
} from 'lucide-react';
import api from '@/lib/api';

const CATEGORIES = ['TRANSPORT', 'MEALS', 'ACCOMMODATION', 'SUPPLIES', 'COMMUNICATION', 'TRAINING', 'OTHER'] as const;

const STATUS_DOT: Record<string, string> = {
    DRAFT: 'bg-slate-400',
    SUBMITTED: 'bg-amber-500',
    APPROVED: 'bg-emerald-500',
    REJECTED: 'bg-red-500',
    REIMBURSED: 'bg-blue-500',
};

const STATUS_BADGE: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    REIMBURSED: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function ExpensesPage() {
    const t = useTranslations('expenses');
    const tc = useTranslations('common');
    const { user } = useAuthStore();

    const [reports, setReports] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Form state
    const [formEmployeeId, setFormEmployeeId] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formItems, setFormItems] = useState<{ category: string; description: string; amount: string; date: string }[]>([
        { category: 'TRANSPORT', description: '', amount: '', date: '' },
    ]);
    const [saving, setSaving] = useState(false);

    // Reject dialog
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR';

    const fetchReports = async () => {
        try {
            const params: any = {};
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/expenses', { params });
            setReports(res.data?.data || []);
        } catch { /* silent */ }
    };

    const fetchEmployees = async () => {
        if (!isAdminOrHR) return;
        try {
            const res = await api.get('/employees');
            setEmployees(res.data?.data || []);
        } catch { /* silent */ }
    };

    useEffect(() => {
        Promise.all([fetchReports(), fetchEmployees()]).then(() => setLoading(false));
    }, []);

    useEffect(() => { fetchReports(); }, [statusFilter]);

    const handleSubmitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle) return;
        setSaving(true);
        try {
            await api.post('/expenses', {
                employeeId: isAdminOrHR ? formEmployeeId : undefined,
                title: formTitle,
                items: formItems.filter(i => i.description && i.amount && i.date).map(i => ({
                    category: i.category,
                    description: i.description,
                    amount: parseFloat(i.amount),
                    date: i.date,
                })),
            });
            toast.success(tc('save'));
            setShowForm(false);
            setFormTitle('');
            setFormEmployeeId('');
            setFormItems([{ category: 'TRANSPORT', description: '', amount: '', date: '' }]);
            fetchReports();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitReport = async (id: string) => {
        try {
            await api.patch(`/expenses/${id}/submit`);
            toast.success(t('submitted'));
            fetchReports();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.patch(`/expenses/${id}/approve`);
            toast.success(t('approved'));
            fetchReports();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        try {
            await api.patch(`/expenses/${rejectId}/reject`, { reason: rejectReason });
            toast.success(t('rejected'));
            setRejectId(null);
            setRejectReason('');
            fetchReports();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleReimburse = async (id: string) => {
        try {
            await api.patch(`/expenses/${id}/reimburse`);
            toast.success(t('reimbursed'));
            fetchReports();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/expenses/${id}`);
            toast.success(tc('delete'));
            fetchReports();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const addFormItem = () => {
        setFormItems([...formItems, { category: 'TRANSPORT', description: '', amount: '', date: '' }]);
    };

    const updateFormItem = (idx: number, field: string, value: string) => {
        const updated = [...formItems];
        (updated[idx] as any)[field] = value;
        setFormItems(updated);
    };

    const removeFormItem = (idx: number) => {
        setFormItems(formItems.filter((_, i) => i !== idx));
    };

    const categoryLabel = (cat: string) => {
        const map: Record<string, string> = {
            TRANSPORT: t('transport'), MEALS: t('meals'), ACCOMMODATION: t('accommodation'),
            SUPPLIES: t('supplies'), COMMUNICATION: t('communication'), TRAINING: t('training'), OTHER: t('other'),
        };
        return map[cat] || cat;
    };

    const statusLabel = (status: string) => {
        const map: Record<string, string> = {
            DRAFT: t('draft'), SUBMITTED: t('submitted'), APPROVED: t('approved'),
            REJECTED: t('rejected'), REIMBURSED: t('reimbursed'),
        };
        return map[status] || status;
    };

    const totalPending = reports.filter(r => r.status === 'SUBMITTED').reduce((s, r) => s + Number(r.totalAmount), 0);
    const totalApproved = reports.filter(r => r.status === 'APPROVED').reduce((s, r) => s + Number(r.totalAmount), 0);
    const totalReimbursed = reports.filter(r => r.status === 'REIMBURSED').length;

    // ─── KPI cards ──────────────────────────────────────
    const kpis = [
        { label: t('title'), value: reports.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Layers },
        { label: t('totalPending'), value: `${totalPending.toLocaleString()} MRU`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
        { label: t('totalApproved'), value: `${totalApproved.toLocaleString()} MRU`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
        { label: t('reimbursed'), value: totalReimbursed, color: 'text-blue-600', bg: 'bg-sky-50', border: 'border-sky-200', icon: CreditCard },
    ];

    // ─── DataTable columns ──────────────────────────────
    const columns: Column<any>[] = [
        {
            key: 'title',
            header: t('reportTitle'),
            accessor: (row) => row.title || '',
            sortable: true,
            render: (row) => (
                <div>
                    <span className="font-semibold text-slate-800">{row.title}</span>
                    {row.items?.length > 0 && (
                        <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                            {row.items[0].description}{row.items.length > 1 ? ` +${row.items.length - 1}` : ''}
                        </p>
                    )}
                </div>
            ),
        },
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
                    <span className="text-slate-700 text-sm">
                        {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '\u2014'}
                    </span>
                </div>
            ),
        },
        {
            key: 'items',
            header: t('items'),
            accessor: (row) => row.items?.length || 0,
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            render: (row) => (
                <span className="text-slate-600 text-sm">{row.items?.length || 0}</span>
            ),
        },
        {
            key: 'amount',
            header: t('amount'),
            accessor: (row) => Number(row.totalAmount),
            sortable: true,
            className: 'text-right',
            headerClassName: 'text-right',
            render: (row) => (
                <span className="font-bold text-slate-800">{Number(row.totalAmount).toLocaleString()} MRU</span>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            accessor: (row) => row.status,
            sortable: true,
            className: 'text-center',
            headerClassName: 'text-center',
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[row.status] || ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_DOT[row.status] || ''}`} />
                    {statusLabel(row.status)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: tc('actions'),
            className: 'text-right',
            headerClassName: 'text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {row.status === 'DRAFT' && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSubmitReport(row.id); }}
                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                                aria-label={t('submit')}
                            >
                                <Send className="h-4 w-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                aria-label={tc('delete')}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </>
                    )}
                    {row.status === 'SUBMITTED' && isAdminOrHR && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleApprove(row.id); }}
                                className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                                aria-label={t('approve')}
                            >
                                <Check className="h-4 w-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setRejectId(row.id); }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                aria-label={t('reject')}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </>
                    )}
                    {row.status === 'APPROVED' && isAdminOrHR && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleReimburse(row.id); }}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                            aria-label={t('reimburse')}
                        >
                            <Banknote className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    // ─── Export columns ─────────────────────────────────
    const exportColumns: ExportColumn[] = [
        { header: t('reportTitle'), accessor: (row) => row.title || '' },
        { header: t('employee'), accessor: (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '' },
        { header: t('items'), accessor: (row) => row.items?.length || 0 },
        { header: t('amount'), accessor: (row) => Number(row.totalAmount) },
        { header: t('status'), accessor: (row) => statusLabel(row.status) },
    ];

    // ─── Expanded report details ────────────────────────
    const expandedReport = expandedId ? reports.find(r => r.id === expandedId) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Receipt className="h-7 w-7 text-blue-600" />
                        {t('title')}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">{t('subtitle')}</p>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                data={reports}
                columns={columns}
                rowKey={(row) => row.id}
                searchable
                searchPlaceholder={t('reportTitle')}
                searchFields={[
                    (row) => row.title || '',
                    (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '',
                ]}
                loading={loading}
                rowClassName={(row) => `group cursor-pointer ${expandedId === row.id ? 'bg-blue-50/50' : ''}`}
                onRowClick={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
                emptyState={
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-300">
                            <Receipt className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{t('noExpenses')}</h3>
                        <p className="text-slate-500 max-w-sm mt-1 mb-6">{t('subtitle')}</p>
                        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-2">
                            <Plus className="h-4 w-4" /> {t('createExpense')}
                        </Button>
                    </div>
                }
                headerExtra={
                    <>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none shadow-sm"
                        >
                            <option value="">{tc('all')}</option>
                            <option value="DRAFT">{t('draft')}</option>
                            <option value="SUBMITTED">{t('submitted')}</option>
                            <option value="APPROVED">{t('approved')}</option>
                            <option value="REJECTED">{t('rejected')}</option>
                            <option value="REIMBURSED">{t('reimbursed')}</option>
                        </select>
                        <ExportButtons
                            data={reports}
                            columns={exportColumns}
                            filename="notes_de_frais"
                        />
                        <Button onClick={() => setShowForm(true)} className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg gap-2">
                            <Plus className="h-4 w-4" /> {t('createExpense')}
                        </Button>
                    </>
                }
                texts={{
                    showing: 'Affichage',
                    of: 'sur',
                    rows: 'lignes',
                    noResults: t('noExpenses'),
                }}
            />

            {/* Expanded row detail card */}
            {expandedReport && expandedReport.items?.length > 0 && (
                <Card className="border border-blue-200/60 shadow-sm bg-blue-50/30">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-800">
                                {expandedReport.title} — {t('items')} ({expandedReport.items.length})
                            </h3>
                            <button
                                onClick={() => setExpandedId(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {expandedReport.items.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-4 bg-white rounded-lg px-4 py-2.5 border border-slate-200/60 text-sm">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold min-w-[90px] justify-center">
                                        {categoryLabel(item.category)}
                                    </span>
                                    <span className="flex-1 text-slate-700">{item.description}</span>
                                    <span className="text-slate-400 text-xs">{new Date(item.date).toLocaleDateString('fr')}</span>
                                    <span className="font-bold text-slate-800 min-w-[80px] text-right">{Number(item.amount).toLocaleString()} MRU</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('createExpense')}</DialogTitle>
                        <DialogDescription>{t('subtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {isAdminOrHR && (
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
                                                    {emp.firstName} {emp.lastName}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">{t('reportTitle')}</Label>
                                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Déplacement Nouakchott" required />
                            </div>
                        </div>

                        {/* Dynamic line items */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold">{t('items')}</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addFormItem} className="gap-1.5 h-8 text-xs">
                                    <Plus className="h-3.5 w-3.5" /> {t('addItem')}
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                {formItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 border border-slate-200/60">
                                        <div className="relative min-w-[120px]">
                                            <select
                                                value={item.category}
                                                onChange={e => updateFormItem(idx, 'category', e.target.value)}
                                                className="w-full h-9 appearance-none rounded-md border border-slate-200 bg-white px-2 pr-7 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                        </div>
                                        <Input
                                            className="flex-1 h-9 text-sm"
                                            placeholder={t('description')}
                                            value={item.description}
                                            onChange={e => updateFormItem(idx, 'description', e.target.value)}
                                        />
                                        <Input
                                            className="w-24 h-9 text-sm"
                                            type="number"
                                            min="1"
                                            step="1"
                                            placeholder="MRU"
                                            value={item.amount}
                                            onChange={e => updateFormItem(idx, 'amount', e.target.value)}
                                        />
                                        <Input
                                            className="w-36 h-9 text-sm"
                                            type="date"
                                            value={item.date}
                                            onChange={e => updateFormItem(idx, 'date', e.target.value)}
                                        />
                                        {formItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeFormItem(idx)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                aria-label={tc('delete')}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
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

            {/* Reject Dialog */}
            <Dialog open={!!rejectId} onOpenChange={(open) => { if (!open) { setRejectId(null); setRejectReason(''); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('reject')}</DialogTitle>
                        <DialogDescription>{t('rejectionReason')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('rejectionReason')}</Label>
                            <Input
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder={t('rejectionReason')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(''); }}>
                            {tc('cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleReject}>
                            {t('reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
