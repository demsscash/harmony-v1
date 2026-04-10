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
    AlertTriangle,
    Plus,
    Archive,
    Trash2,
    Edit,
    Banknote,
    ShieldAlert,
    CircleDot,
} from 'lucide-react';
import api from '@/lib/api';

const STATUS_BADGE: Record<string, string> = {
    ACTIVE: 'bg-red-50 text-red-700 border border-red-200',
    ARCHIVED: 'bg-slate-50 text-slate-600 border border-slate-200',
};

const TYPE_BADGE: Record<string, string> = {
    DEDUCTION_PRIME: 'bg-orange-50 text-orange-700 border border-orange-200',
    RETENUE_SALAIRE: 'bg-red-50 text-red-700 border border-red-200',
    AVERTISSEMENT: 'bg-amber-50 text-amber-700 border border-amber-200',
    MISE_A_PIED: 'bg-purple-50 text-purple-700 border border-purple-200',
};

export default function SanctionsPage() {
    const t = useTranslations('sanctions');
    const tc = useTranslations('common');

    const [sanctions, setSanctions] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [advantages, setAdvantages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Form state
    const [form, setForm] = useState({
        employeeId: '',
        type: '',
        reason: '',
        comment: '',
        date: new Date().toISOString().split('T')[0],
        advantageId: '',
        deductionAmount: '',
    });
    const [saving, setSaving] = useState(false);

    // Delete confirm
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const params: any = {};
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;
            const [sanctionsRes, employeesRes, advantagesRes] = await Promise.all([
                api.get('/sanctions', { params }),
                api.get('/employees'),
                api.get('/advantages'),
            ]);
            setSanctions(sanctionsRes.data?.data || []);
            setEmployees(employeesRes.data?.data || []);
            setAdvantages(advantagesRes.data?.data || []);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        const params: any = {};
        if (statusFilter) params.status = statusFilter;
        if (typeFilter) params.type = typeFilter;
        api.get('/sanctions', { params }).then(res => setSanctions(res.data?.data || [])).catch(() => {});
    }, [statusFilter, typeFilter]);

    const resetForm = () => {
        setForm({ employeeId: '', type: '', reason: '', comment: '', date: new Date().toISOString().split('T')[0], advantageId: '', deductionAmount: '' });
        setEditingId(null);
    };

    const openCreate = () => { resetForm(); setShowDialog(true); };

    const openEdit = (sanction: any) => {
        setForm({
            employeeId: sanction.employeeId,
            type: sanction.type,
            reason: sanction.reason,
            comment: sanction.comment || '',
            date: new Date(sanction.date).toISOString().split('T')[0],
            advantageId: sanction.advantageId || '',
            deductionAmount: String(Number(sanction.deductionAmount)),
        });
        setEditingId(sanction.id);
        setShowDialog(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.employeeId || !form.type || !form.reason || !form.date) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                deductionAmount: parseFloat(form.deductionAmount) || 0,
                advantageId: form.advantageId || null,
            };
            if (editingId) {
                await api.put(`/sanctions/${editingId}`, payload);
                toast.success(t('updateSuccess'));
            } else {
                await api.post('/sanctions', payload);
                toast.success(t('createSuccess'));
            }
            setShowDialog(false);
            resetForm();
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const handleArchive = async (id: string) => {
        try {
            await api.patch(`/sanctions/${id}/archive`);
            toast.success(t('archiveSuccess'));
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/sanctions/${deleteId}`);
            toast.success(t('deleteSuccess'));
            setDeleteId(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const typeLabel = (type: string) => t(`types.${type}`) || type;
    const statusLabel = (status: string) => t(`statuses.${status}`) || status;

    // Show advantage field only for DEDUCTION_PRIME
    const showAdvantageField = form.type === 'DEDUCTION_PRIME';
    // Financial types
    const isFinancialType = (type: string) => ['DEDUCTION_PRIME', 'RETENUE_SALAIRE'].includes(type);

    // KPIs
    const totalActive = sanctions.filter(s => s.status === 'ACTIVE').length;
    const totalDeductions = sanctions.filter(s => s.status === 'ACTIVE' && isFinancialType(s.type)).reduce((sum, s) => sum + Number(s.deductionAmount), 0);
    const totalArchived = sanctions.filter(s => s.status === 'ARCHIVED').length;

    const kpis = [
        { label: t('totalActive'), value: totalActive, icon: ShieldAlert, color: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50/40' },
        { label: t('totalAmount'), value: `${totalDeductions.toLocaleString()} MRU`, icon: Banknote, color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50/40' },
        { label: t('totalArchived'), value: totalArchived, icon: Archive, color: 'text-slate-600', border: 'border-slate-200', bg: 'bg-slate-50/40' },
    ];

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: 'employee',
            header: t('employee'),
            accessor: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim(),
            render: (row) => {
                const first = row.employee?.firstName || '';
                const last = row.employee?.lastName || '';
                const initials = `${first[0] || ''}${last[0] || ''}`.toUpperCase();
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{first} {last}</p>
                            <p className="text-xs text-slate-400 truncate">{row.employee?.matricule}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'type',
            header: t('type'),
            accessor: (row) => row.type,
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE[row.type] || ''}`}>
                    {typeLabel(row.type)}
                </span>
            ),
        },
        {
            key: 'reason',
            header: t('reason'),
            accessor: (row) => row.reason,
            render: (row) => (
                <div className="max-w-[250px]">
                    <p className="text-slate-700 text-sm truncate">{row.reason}</p>
                    {row.comment && <p className="text-xs text-slate-400 truncate mt-0.5">{row.comment}</p>}
                </div>
            ),
        },
        {
            key: 'deductionAmount',
            header: t('deductionAmount'),
            className: 'text-right',
            headerClassName: 'text-right',
            accessor: (row) => Number(row.deductionAmount),
            render: (row) => isFinancialType(row.type) && Number(row.deductionAmount) > 0 ? (
                <span className="font-bold text-red-600">
                    -{Number(row.deductionAmount).toLocaleString()} <span className="text-xs font-medium text-red-400">MRU</span>
                </span>
            ) : (
                <span className="text-xs text-slate-400">{t('noFinancialImpact')}</span>
            ),
        },
        {
            key: 'date',
            header: t('date'),
            accessor: (row) => new Date(row.date).getTime(),
            render: (row) => (
                <span className="text-slate-600 text-sm">{new Date(row.date).toLocaleDateString('fr-FR')}</span>
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
                    <CircleDot className="h-3 w-3 mr-1" />
                    {statusLabel(row.status)}
                </span>
            ),
        },
        {
            key: 'actions',
            header: tc('actions'),
            className: 'text-center',
            headerClassName: 'text-center',
            render: (row) => (
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {row.status === 'ACTIVE' && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title={tc('edit')}>
                                <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleArchive(row.id); }} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors" title={t('archiveSuccess')}>
                                <Archive className="h-4 w-4" />
                            </button>
                        </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={tc('delete')}>
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ], [t, tc]);

    const exportColumns: ExportColumn[] = [
        { header: t('employee'), accessor: (row) => `${row.employee?.firstName || ''} ${row.employee?.lastName || ''}`.trim() },
        { header: t('type'), accessor: (row) => typeLabel(row.type) },
        { header: t('reason'), accessor: (row) => row.reason },
        { header: t('deductionAmount'), accessor: (row) => Number(row.deductionAmount) },
        { header: t('date'), accessor: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                data={sanctions}
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
                            <AlertTriangle className="h-7 w-7 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">{t('noSanctions')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('noSanctionsDesc')}</p>
                    </div>
                }
                headerExtra={
                    <>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none shadow-sm">
                            <option value="">{tc('all')}</option>
                            <option value="ACTIVE">{t('statuses.ACTIVE')}</option>
                            <option value="ARCHIVED">{t('statuses.ARCHIVED')}</option>
                        </select>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none shadow-sm">
                            <option value="">{t('type')}</option>
                            <option value="DEDUCTION_PRIME">{t('types.DEDUCTION_PRIME')}</option>
                            <option value="RETENUE_SALAIRE">{t('types.RETENUE_SALAIRE')}</option>
                            <option value="AVERTISSEMENT">{t('types.AVERTISSEMENT')}</option>
                            <option value="MISE_A_PIED">{t('types.MISE_A_PIED')}</option>
                        </select>
                        <ExportButtons data={sanctions} columns={exportColumns} filename="sanctions" />
                        <Button onClick={openCreate} className="h-9 bg-red-600 hover:bg-red-700 text-white shadow-md">
                            <Plus className="h-4 w-4 mr-1.5" />
                            {t('addSanction')}
                        </Button>
                    </>
                }
            />

            {/* Create / Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { setShowDialog(false); resetForm(); } }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? t('editSanction') : t('addSanction')}</DialogTitle>
                        <DialogDescription>{t('subtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>{t('employee')} *</Label>
                            <select
                                value={form.employeeId}
                                onChange={e => setForm({ ...form, employeeId: e.target.value })}
                                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm"
                                required
                                disabled={!!editingId}
                            >
                                <option value="">{t('selectEmployee')}</option>
                                {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} — {emp.matricule}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{t('type')} *</Label>
                                <select
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value, advantageId: '', deductionAmount: e.target.value === 'AVERTISSEMENT' ? '0' : form.deductionAmount })}
                                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm"
                                    required
                                >
                                    <option value="">{t('selectType')}</option>
                                    <option value="DEDUCTION_PRIME">{t('types.DEDUCTION_PRIME')}</option>
                                    <option value="RETENUE_SALAIRE">{t('types.RETENUE_SALAIRE')}</option>
                                    <option value="AVERTISSEMENT">{t('types.AVERTISSEMENT')}</option>
                                    <option value="MISE_A_PIED">{t('types.MISE_A_PIED')}</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('date')} *</Label>
                                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                        </div>

                        {showAdvantageField && (
                            <div className="space-y-1.5">
                                <Label>{t('advantage')}</Label>
                                <select
                                    value={form.advantageId}
                                    onChange={e => setForm({ ...form, advantageId: e.target.value })}
                                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm"
                                >
                                    <option value="">{t('noAdvantage')}</option>
                                    {advantages.filter(a => a.type === 'PRIME').map(adv => (
                                        <option key={adv.id} value={adv.id}>{adv.name} — {Number(adv.amount).toLocaleString()} MRU</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {isFinancialType(form.type) && (
                            <div className="space-y-1.5">
                                <Label>{t('deductionAmount')} (MRU) *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.deductionAmount}
                                    onChange={e => setForm({ ...form, deductionAmount: e.target.value })}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>{t('reason')} *</Label>
                            <Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
                        </div>

                        <div className="space-y-1.5">
                            <Label>{t('comment')}</Label>
                            <textarea
                                value={form.comment}
                                onChange={e => setForm({ ...form, comment: e.target.value })}
                                placeholder={t('commentPlaceholder')}
                                className="w-full min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none shadow-sm resize-none"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>{tc('cancel')}</Button>
                            <Button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
                                {saving ? tc('loading') : editingId ? tc('save') : tc('create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{tc('delete')}</DialogTitle>
                        <DialogDescription>{t('deleteConfirm')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>{tc('cancel')}</Button>
                        <Button variant="destructive" onClick={handleDelete}>{tc('delete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
