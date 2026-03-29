'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { ExportButtons, type ExportColumn } from '@/components/ExportButtons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    PenTool, Plus, Loader2, Clock, CheckCircle2, XCircle, AlertTriangle,
    Send, Eye, FileText, Ban, User, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Types ──────────────────────────────────────────────
interface SignatureRequest {
    id: string;
    title: string;
    description?: string;
    documentType: 'CONTRACT' | 'ATTESTATION' | 'PAYSLIP' | 'OTHER';
    status: 'PENDING' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
    signedAt?: string;
    expiresAt?: string;
    employee?: { id: string; firstName: string; lastName: string };
    requestedBy?: { email: string };
}

interface SignatureStats {
    total: number;
    pending: number;
    signed: number;
    expired: number;
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
}

const STATUS_CONFIG = {
    PENDING: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    SIGNED: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    EXPIRED: { color: 'bg-red-100 text-red-600 border-red-200', icon: AlertTriangle },
    CANCELLED: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle },
};

const DOC_TYPES = ['CONTRACT', 'ATTESTATION', 'PAYSLIP', 'OTHER'] as const;

export default function SignaturesPage() {
    const t = useTranslations('signatures');
    const tc = useTranslations('common');
    const router = useRouter();

    const [requests, setRequests] = useState<SignatureRequest[]>([]);
    const [stats, setStats] = useState<SignatureStats>({ total: 0, pending: 0, signed: 0, expired: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [form, setForm] = useState({
        employeeId: '',
        title: '',
        description: '',
        documentType: 'CONTRACT' as string,
        expiresAt: '',
    });

    // ─── Fetch data ─────────────────────────────────────
    const fetchRequests = async () => {
        try {
            const res = await api.get('/signatures');
            if (res.data.success) setRequests(res.data.data);
        } catch {
            toast.error(t('errorLoading'));
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/signatures/stats');
            if (res.data.success) setStats(res.data.data);
        } catch { /* silent */ }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            if (res.data.success) setEmployees(res.data.data);
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchRequests();
        fetchStats();
        fetchEmployees();
    }, []);

    // ─── Handlers ───────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error(t('titleRequired'));
            return;
        }
        setSubmitting(true);
        try {
            const payload: Record<string, string> = {
                employeeId: form.employeeId,
                title: form.title,
                documentType: form.documentType,
            };
            if (form.description.trim()) payload.description = form.description;
            if (form.expiresAt) payload.expiresAt = form.expiresAt;

            await api.post('/signatures', payload);
            toast.success(t('requestCreated'));
            setShowCreate(false);
            setForm({ employeeId: '', title: '', description: '', documentType: 'CONTRACT', expiresAt: '' });
            fetchRequests();
            fetchStats();
        } catch (err: any) {
            toast.error(err.response?.data?.error || tc('error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await api.patch(`/signatures/${id}/cancel`);
            toast.success(t('requestCancelled'));
            fetchRequests();
            fetchStats();
        } catch (err: any) {
            toast.error(err.response?.data?.error || tc('error'));
        }
    };

    const handleReminder = async (id: string) => {
        try {
            await api.post(`/signatures/${id}/reminder`);
            toast.success(t('reminderSent'));
        } catch (err: any) {
            toast.error(err.response?.data?.error || tc('error'));
        }
    };

    // ─── Helpers ────────────────────────────────────────
    const docTypeLabel = (type: string) => {
        const map: Record<string, string> = {
            CONTRACT: t('contract'),
            ATTESTATION: t('attestation'),
            PAYSLIP: t('payslip'),
            OTHER: t('other'),
        };
        return map[type] || type;
    };

    const statusLabel = (status: string) => {
        const map: Record<string, string> = {
            PENDING: t('pending'),
            SIGNED: t('signed'),
            EXPIRED: t('expired'),
            CANCELLED: t('cancelled'),
        };
        return map[status] || status;
    };

    const filteredRequests = statusFilter === 'all'
        ? requests
        : requests.filter(r => r.status === statusFilter);

    // ─── DataTable columns ──────────────────────────────
    const columns: Column<SignatureRequest>[] = [
        {
            key: 'employee',
            header: t('employee'),
            accessor: (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '',
            sortable: true,
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <span className="font-semibold text-slate-800">
                        {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '\u2014'}
                    </span>
                </div>
            ),
        },
        {
            key: 'title',
            header: t('documentTitle'),
            accessor: (row) => row.title,
            sortable: true,
            render: (row) => (
                <div>
                    <span className="font-medium text-slate-800">{row.title}</span>
                    {row.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{row.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'documentType',
            header: t('documentType'),
            accessor: (row) => row.documentType,
            sortable: true,
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <FileText className="h-3 w-3" />
                    {docTypeLabel(row.documentType)}
                </span>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            accessor: (row) => row.status,
            sortable: true,
            render: (row) => {
                const cfg = STATUS_CONFIG[row.status];
                const Icon = cfg.icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>
                        <Icon className="h-3 w-3" /> {statusLabel(row.status)}
                    </span>
                );
            },
        },
        {
            key: 'createdAt',
            header: t('requestedDate'),
            accessor: (row) => row.createdAt,
            sortable: true,
            render: (row) => (
                <span className="text-slate-600 text-xs">
                    {new Date(row.createdAt).toLocaleDateString('fr-FR')}
                </span>
            ),
        },
        {
            key: 'signedAt',
            header: t('signedDate'),
            accessor: (row) => row.signedAt || '',
            sortable: true,
            render: (row) => (
                <span className="text-slate-600 text-xs">
                    {row.signedAt ? new Date(row.signedAt).toLocaleDateString('fr-FR') : '\u2014'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: tc('actions'),
            className: 'text-right',
            headerClassName: 'text-right',
            render: (row) => (
                <div className="flex gap-1.5 justify-end">
                    <Link href={`/dashboard/signatures/${row.id}`}>
                        <button className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors" title={t('viewDetail')}>
                            <Eye className="h-4 w-4" />
                        </button>
                    </Link>
                    {row.status === 'PENDING' && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleReminder(row.id); }}
                                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                title={t('sendReminder')}
                            >
                                <Send className="h-4 w-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCancel(row.id); }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                                title={t('cancel')}
                            >
                                <Ban className="h-4 w-4" />
                            </button>
                        </>
                    )}
                </div>
            ),
        },
    ];

    // ─── Export columns ─────────────────────────────────
    const exportColumns: ExportColumn[] = [
        { header: t('employee'), accessor: (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '' },
        { header: t('documentTitle'), accessor: (row) => row.title },
        { header: t('documentType'), accessor: (row) => docTypeLabel(row.documentType) },
        { header: t('status'), accessor: (row) => statusLabel(row.status) },
        { header: t('requestedDate'), accessor: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
        { header: t('signedDate'), accessor: (row) => row.signedAt ? new Date(row.signedAt).toLocaleDateString('fr-FR') : '' },
    ];

    // ─── KPI cards ──────────────────────────────────────
    const kpis = [
        { label: t('total'), value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: FileText },
        { label: t('pendingCount'), value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
        { label: t('signedCount'), value: stats.signed, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
        { label: t('expiredCount'), value: stats.expired, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/40 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-blue-600" /> {t('title')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">{t('subtitle')}</p>
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
            <DataTable<SignatureRequest>
                data={filteredRequests}
                columns={columns}
                rowKey={(row) => row.id}
                searchable
                searchPlaceholder={t('searchPlaceholder')}
                searchFields={[
                    (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '',
                    (row) => row.title,
                ]}
                loading={loading}
                emptyState={
                    <div className="text-center text-slate-400">
                        <PenTool className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                        <p className="font-medium">{t('noRequests')}</p>
                        <p className="text-xs mt-1">{t('noRequestsDesc')}</p>
                    </div>
                }
                onRowClick={(row) => router.push(`/dashboard/signatures/${row.id}`)}
                headerExtra={
                    <>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="h-9 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none shadow-sm"
                        >
                            <option value="all">{tc('all')}</option>
                            <option value="PENDING">{t('pending')}</option>
                            <option value="SIGNED">{t('signed')}</option>
                            <option value="EXPIRED">{t('expired')}</option>
                            <option value="CANCELLED">{t('cancelled')}</option>
                        </select>
                        <ExportButtons
                            data={filteredRequests}
                            columns={exportColumns}
                            filename="signatures"
                        />
                        <Button onClick={() => setShowCreate(true)} className="h-9 bg-blue-600 hover:bg-blue-700 gap-2">
                            <Plus className="h-4 w-4" /> {t('newRequest')}
                        </Button>
                    </>
                }
                texts={{
                    search: tc('search'),
                    noResults: tc('noResults', { query: '' }),
                    showing: tc('showing'),
                    of: tc('of'),
                    rows: tc('rows'),
                    page: tc('page'),
                    to: tc('to'),
                }}
            />

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('createTitle')}</DialogTitle>
                        <DialogDescription>{t('createDesc')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 py-2">
                        {/* Employee selector */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('employee')}</Label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full h-10 appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.employeeId}
                                    onChange={e => setForm({ ...form, employeeId: e.target.value })}
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

                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('documentTitle')}</Label>
                            <Input
                                required
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder={t('documentTitle')}
                            />
                        </div>

                        {/* Document type */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('documentType')}</Label>
                            <div className="relative">
                                <select
                                    className="w-full h-10 appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={form.documentType}
                                    onChange={e => setForm({ ...form, documentType: e.target.value })}
                                >
                                    {DOC_TYPES.map(dt => (
                                        <option key={dt} value={dt}>{docTypeLabel(dt)}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('description')}</Label>
                            <Textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder={t('description')}
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        {/* Expiry date */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">{t('expiresAt')}</Label>
                            <Input
                                type="date"
                                value={form.expiresAt}
                                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                {tc('cancel')}
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                {tc('create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
