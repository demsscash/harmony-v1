'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { DataTable, type Column } from '@/components/DataTable';
import { ExportButtons, type ExportColumn } from '@/components/ExportButtons';
import { toast } from 'sonner';
import {
    Wallet,
    Plus,
    Check,
    X,
    Clock,
    CheckCircle2,
    XCircle,
    TrendingUp,
} from 'lucide-react';
import api from '@/lib/api';

const STATUS_DOT: Record<string, string> = {
    PENDING: 'bg-amber-500',
    APPROVED: 'bg-emerald-500',
    REJECTED: 'bg-red-500',
    DEDUCTED: 'bg-slate-400',
};

const STATUS_BADGE: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border border-red-200',
    DEDUCTED: 'bg-slate-50 text-slate-600 border border-slate-200',
};

export default function AdvancesPage() {
    const t = useTranslations('advances');
    const tc = useTranslations('common');
    const { user } = useAuthStore();

    const [advances, setAdvances] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');

    // Form state
    const [formEmployeeId, setFormEmployeeId] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formReason, setFormReason] = useState('');
    const [saving, setSaving] = useState(false);

    // Reject dialog
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR';

    const fetchAdvances = async () => {
        try {
            const params: any = {};
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/advances', { params });
            setAdvances(res.data?.data || []);
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
        Promise.all([fetchAdvances(), fetchEmployees()]).then(() => setLoading(false));
    }, []);

    useEffect(() => { fetchAdvances(); }, [statusFilter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formAmount || parseFloat(formAmount) <= 0) return;
        setSaving(true);
        try {
            await api.post('/advances', {
                employeeId: isAdminOrHR ? formEmployeeId : undefined,
                amount: parseFloat(formAmount),
                reason: formReason || undefined,
            });
            toast.success(tc('save'));
            setShowCreateDialog(false);
            setFormEmployeeId('');
            setFormAmount('');
            setFormReason('');
            fetchAdvances();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await api.patch(`/advances/${id}/approve`);
            toast.success(t('approved'));
            fetchAdvances();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        try {
            await api.patch(`/advances/${rejectId}/reject`, { reason: rejectReason });
            toast.success(t('rejected'));
            setRejectId(null);
            setRejectReason('');
            fetchAdvances();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const statusLabel = (status: string) => {
        const map: Record<string, string> = {
            PENDING: t('pending'),
            APPROVED: t('approved'),
            REJECTED: t('rejected'),
            DEDUCTED: t('deducted'),
        };
        return map[status] || status;
    };

    // KPI calculations
    const totalRequests = advances.length;
    const totalPending = advances.filter(a => a.status === 'PENDING').reduce((sum, a) => sum + Number(a.amount), 0);
    const totalApproved = advances.filter(a => a.status === 'APPROVED').reduce((sum, a) => sum + Number(a.amount), 0);
    const totalRejected = advances.filter(a => a.status === 'REJECTED').length;

    const kpis = [
        {
            label: t('totalRequests') || 'Total demandes',
            value: totalRequests,
            icon: TrendingUp,
            color: 'text-blue-600',
            border: 'border-blue-200',
            bg: 'bg-blue-50/40',
        },
        {
            label: t('pending'),
            value: `${totalPending.toLocaleString()} MRU`,
            icon: Clock,
            color: 'text-amber-600',
            border: 'border-amber-200',
            bg: 'bg-amber-50/40',
        },
        {
            label: t('approved'),
            value: `${totalApproved.toLocaleString()} MRU`,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            border: 'border-emerald-200',
            bg: 'bg-emerald-50/40',
        },
        {
            label: t('rejected'),
            value: totalRejected,
            icon: XCircle,
            color: 'text-red-600',
            border: 'border-red-200',
            bg: 'bg-red-50/40',
        },
    ];

    // DataTable columns
    const columns = useMemo<Column<any>[]>(() => {
        const cols: Column<any>[] = [
            {
                key: 'employee',
                header: t('employee'),
                accessor: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim(),
                render: (row) => {
                    const first = row.employee?.firstName || '';
                    const last = row.employee?.lastName || '';
                    const initials = `${first[0] || ''}${last[0] || ''}`.toUpperCase();
                    const email = row.employee?.email || '';
                    return (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{first} {last}</p>
                                {email && <p className="text-xs text-slate-400 truncate">{email}</p>}
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'amount',
                header: t('amount'),
                className: 'text-right',
                headerClassName: 'text-right',
                accessor: (row) => Number(row.amount),
                render: (row) => (
                    <span className="font-bold text-slate-900">
                        {Number(row.amount).toLocaleString()} <span className="text-xs font-medium text-slate-400">MRU</span>
                    </span>
                ),
            },
            {
                key: 'reason',
                header: t('reason'),
                accessor: (row) => row.reason || '',
                render: (row) => (
                    <span className="text-slate-500 max-w-[200px] truncate block">
                        {row.reason || '\u2014'}
                    </span>
                ),
            },
            {
                key: 'date',
                header: t('requestDate'),
                accessor: (row) => new Date(row.requestDate).getTime(),
                render: (row) => (
                    <span className="text-slate-600">
                        {new Date(row.requestDate).toLocaleDateString('fr-FR')}
                    </span>
                ),
            },
            {
                key: 'status',
                header: t('status'),
                className: 'text-center',
                headerClassName: 'text-center',
                accessor: (row) => row.status,
                render: (row) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[row.status] || ''}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${STATUS_DOT[row.status] || ''}`} />
                        {statusLabel(row.status)}
                    </span>
                ),
            },
        ];

        if (isAdminOrHR) {
            cols.push({
                key: 'actions',
                header: tc('actions'),
                className: 'text-center',
                headerClassName: 'text-center',
                render: (row) => row.status === 'PENDING' ? (
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(row.id); }}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            aria-label={t('approve')}
                        >
                            <Check className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setRejectId(row.id); }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label={t('reject')}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : null,
            });
        }

        return cols;
    }, [isAdminOrHR, t, tc]);

    // Export columns
    const exportColumns: ExportColumn[] = [
        { header: t('employee'), accessor: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim() },
        { header: t('amount'), accessor: (row) => Number(row.amount) },
        { header: t('reason'), accessor: (row) => row.reason || '' },
        { header: t('requestDate'), accessor: (row) => new Date(row.requestDate).toLocaleDateString('fr-FR') },
        { header: t('status'), accessor: (row) => statusLabel(row.status) },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500 font-medium mt-1">{t('subtitle')}</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.label} className={`border ${kpi.border} ${kpi.bg} shadow-sm`}>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                                <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
                            </div>
                            <div className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* DataTable */}
            <DataTable
                data={advances}
                columns={columns}
                rowKey={(row) => row.id}
                loading={loading}
                rowClassName="group"
                searchPlaceholder={tc('search') || 'Rechercher...'}
                searchFields={[
                    (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`,
                    (row) => row.reason || '',
                ]}
                emptyState={
                    <div className="flex flex-col items-center py-4">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-4">
                            <Wallet className="h-7 w-7 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{t('noAdvances')}</p>
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
                            <option value="PENDING">{t('pending')}</option>
                            <option value="APPROVED">{t('approved')}</option>
                            <option value="REJECTED">{t('rejected')}</option>
                            <option value="DEDUCTED">{t('deducted')}</option>
                        </select>
                        <ExportButtons
                            data={advances}
                            columns={exportColumns}
                            filename="avances"
                        />
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            {t('requestAdvance')}
                        </Button>
                    </>
                }
            />

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('requestAdvance')}</DialogTitle>
                        <DialogDescription>{t('subtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isAdminOrHR && (
                            <div className="space-y-1.5">
                                <Label>{t('employee')}</Label>
                                <select
                                    value={formEmployeeId}
                                    onChange={e => setFormEmployeeId(e.target.value)}
                                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm"
                                    required
                                >
                                    <option value="">{t('selectEmployee')}</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label>{t('amount')} (MRU)</Label>
                            <Input type="number" min="1" step="1" value={formAmount} onChange={e => setFormAmount(e.target.value)} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('reason')}</Label>
                            <Input value={formReason} onChange={e => setFormReason(e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>{tc('cancel')}</Button>
                            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {saving ? tc('loading') : tc('save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={!!rejectId} onOpenChange={(open) => { if (!open) { setRejectId(null); setRejectReason(''); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('reject')}</DialogTitle>
                        <DialogDescription>{t('rejectionReason')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label>{t('rejectionReason')}</Label>
                        <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(''); }}>{tc('cancel')}</Button>
                        <Button variant="destructive" onClick={handleReject}>{t('reject')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
