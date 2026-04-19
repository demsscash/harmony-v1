'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DataTable, type Column } from '@/components/DataTable';
import { PenTool, Plus, Loader2, FileText, CheckCircle2, Clock, XCircle, Eye } from 'lucide-react';
import Link from 'next/link';

const STATUS_BADGE: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    AWAITING_ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
    AWAITING_VALIDATION: 'bg-purple-50 text-purple-700 border-purple-200',
    SIGNED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    CANCELLED: 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function SignaturesPage() {
    const t = useTranslations('signatures');
    const tc = useTranslations('common');

    const [requests, setRequests] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        employeeId: '',
        title: '',
        description: '',
        documentType: 'CONTRACT',
        signatureMode: 'EMPLOYEE_ONLY',
        expiresAt: '',
    });

    const fetchData = async () => {
        try {
            const params: any = {};
            if (statusFilter) params.status = statusFilter;
            const [sigRes, empRes] = await Promise.all([
                api.get('/signatures', { params }),
                api.get('/employees'),
            ]);
            setRequests(sigRes.data?.data || []);
            setEmployees(empRes.data?.data || []);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        api.get('/signatures', { params: statusFilter ? { status: statusFilter } : {} })
            .then(res => setRequests(res.data?.data || [])).catch(() => {});
    }, [statusFilter]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.employeeId || !form.title) return;
        setSaving(true);
        try {
            await api.post('/signatures', {
                ...form,
                expiresAt: form.expiresAt || undefined,
            });
            toast.success(t('createSuccess'));
            setShowCreate(false);
            setForm({ employeeId: '', title: '', description: '', documentType: 'CONTRACT', signatureMode: 'EMPLOYEE_ONLY', expiresAt: '' });
            fetchData();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
        finally { setSaving(false); }
    };

    // KPIs
    const total = requests.length;
    const pending = requests.filter(r => ['PENDING', 'AWAITING_ADMIN'].includes(r.status)).length;
    const awaitingValidation = requests.filter(r => r.status === 'AWAITING_VALIDATION').length;
    const signed = requests.filter(r => r.status === 'SIGNED').length;

    const columns: Column<any>[] = [
        {
            key: 'employee',
            header: t('employee'),
            accessor: (r) => `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`,
            render: (r) => (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {r.employee?.firstName?.[0]}{r.employee?.lastName?.[0]}
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">{r.employee?.firstName} {r.employee?.lastName}</span>
                </div>
            ),
        },
        {
            key: 'title',
            header: t('docTitle'),
            accessor: (r) => r.title,
            render: (r) => (
                <div>
                    <p className="font-medium text-slate-800 text-sm">{r.title}</p>
                    <p className="text-xs text-slate-400">{t(`docTypes.${r.documentType}`)}</p>
                </div>
            ),
        },
        {
            key: 'mode',
            header: t('signatureMode'),
            render: (r) => {
                const labels: Record<string, string> = { EMPLOYEE_ONLY: t('modeEmployeeOnly'), ADMIN_ONLY: t('modeAdminOnly'), DUAL: t('modeDual') };
                return <span className="text-xs text-slate-600">{labels[r.signatureMode] || r.signatureMode}</span>;
            },
        },
        {
            key: 'initiatedBy',
            header: 'Initié par',
            render: (r) => (
                <span className={`text-xs font-semibold ${r.initiatedBy === 'EMPLOYEE' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {r.initiatedBy === 'EMPLOYEE' ? 'Employé' : 'Admin'}
                </span>
            ),
        },
        {
            key: 'status',
            header: tc('status'),
            accessor: (r) => r.status,
            render: (r) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[r.status] || ''}`}>
                    {t(`statuses.${r.status}`)}
                </span>
            ),
        },
        {
            key: 'date',
            header: tc('date'),
            accessor: (r) => new Date(r.requestedAt).getTime(),
            sortable: true,
            render: (r) => <span className="text-xs text-slate-500">{new Date(r.requestedAt).toLocaleDateString('fr-FR')}</span>,
        },
        {
            key: 'actions',
            header: tc('actions'),
            className: 'text-right',
            headerClassName: 'text-right',
            render: (r) => (
                <Link href={`/dashboard/signatures/${r.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-blue-600 hover:bg-blue-50 gap-1">
                        <Eye className="h-3.5 w-3.5" /> Détail
                    </Button>
                </Link>
            ),
        },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-5 rounded-2xl border border-slate-200/60 shadow-sm backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <PenTool className="h-6 w-6 text-indigo-600" /> {t('title')}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">{t('subtitle')}</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                    <Plus className="h-4 w-4" /> {t('createRequest')}
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: t('totalRequests'), value: total, icon: FileText, color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200' },
                    { label: t('pending'), value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                    { label: t('awaitingValidation'), value: awaitingValidation, icon: PenTool, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
                    { label: t('signed'), value: signed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                ].map(kpi => (
                    <Card key={kpi.label} className={`border ${kpi.border} ${kpi.bg} shadow-sm`}>
                        <CardContent className="pt-4 pb-4">
                            <div className="flex items-center gap-2 mb-1"><kpi.icon className={`h-4 w-4 ${kpi.color}`} /><span className="text-xs font-semibold text-slate-500">{kpi.label}</span></div>
                            <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <DataTable
                data={requests}
                columns={columns}
                rowKey={(r) => r.id}
                loading={loading}
                rowClassName="group"
                searchPlaceholder={tc('search')}
                searchFields={[(r) => `${r.employee?.firstName} ${r.employee?.lastName}`, (r) => r.title]}
                headerExtra={
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-700">
                        <option value="">{tc('all')}</option>
                        {['PENDING', 'AWAITING_ADMIN', 'AWAITING_VALIDATION', 'SIGNED', 'REJECTED', 'CANCELLED'].map(s => (
                            <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                        ))}
                    </select>
                }
                emptyState={
                    <div className="flex flex-col items-center py-8">
                        <PenTool className="h-10 w-10 text-slate-300 mb-3" />
                        <p className="font-medium text-slate-500">{t('noRequests')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('noRequestsDesc')}</p>
                    </div>
                }
            />

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{t('createRequest')}</DialogTitle>
                        <DialogDescription>{t('subtitle')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>{t('employee')} *</Label>
                            <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm" required>
                                <option value="">{t('selectEmployee')}</option>
                                {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('docTitle')} *</Label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Contrat de travail CDI" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>{t('docType')}</Label>
                                <select value={form.documentType} onChange={e => setForm({ ...form, documentType: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                                    <option value="CONTRACT">{t('docTypes.CONTRACT')}</option>
                                    <option value="ATTESTATION">{t('docTypes.ATTESTATION')}</option>
                                    <option value="OTHER">{t('docTypes.OTHER')}</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('signatureMode')}</Label>
                                <select value={form.signatureMode} onChange={e => setForm({ ...form, signatureMode: e.target.value })} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                                    <option value="EMPLOYEE_ONLY">{t('modeEmployeeOnly')}</option>
                                    <option value="DUAL">{t('modeDual')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('description')}</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t('expiresAt')}</Label>
                            <Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>{tc('cancel')}</Button>
                            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                {tc('create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
